// O site chama esta função logo depois de gravar um agendamento, cancelamento ou remarcação.
// Ela lê o agendamento direto do banco (não confia no que o navegador mandou) e:
//  - avisa a Ana no Telegram
//  - cria / altera / apaga o evento na agenda da Ana (Google Agenda)
//  - manda e-mail (e Telegram, se ela ativou) para a cliente
//  - devolve o sinal no Pix quando o horário é cancelado
// Também liga o Telegram da Ana (tipo "conectar-telegram", só administradora).
// processarAviso() também é usada pelo webhook do Mercado Pago quando o sinal é pago.
import { randomBytes } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { linkGoogleAgenda, icsDe, linkTelegram, horaFim } from '../src/lib/lembretes.js'
import {
  SITE, db, lerDoc, quemChamou, todas, telegram, telegramApi, segredoWebhook,
  criarEvento, atualizarEvento, apagarEvento, email, modeloEmail, esc, dataBR, dataLonga, brl, primeiroNome,
} from './_lib/servidor.js'
import { devolver } from './_lib/mercadopago.js'
import { sinalPago, restanteNoDia } from '../src/lib/sinal.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const quem = await quemChamou(req)
  if (!quem) return res.status(401).json({ erro: 'Faça login.' })
  const { tipo, id } = req.body || {}

  if (tipo === 'conectar-telegram') {
    if (!quem.ehAdmin) return res.status(403).end()
    return res.json(await conectarTelegram(req))
  }
  if (tipo === 'teste') {
    if (!quem.ehAdmin) return res.status(403).end()
    return res.json(await testar(quem))
  }

  const ag = await lerDoc(`agendamentos/${id}`)
  if (!ag || !ag.clienteId) return res.status(404).end()
  if (!quem.ehAdmin && ag.clienteId !== quem.uid) return res.status(403).end()
  // remarcar só pelo painel
  if (tipo === 'alterado' && !quem.ehAdmin) return res.status(403).end()
  await processarAviso(tipo, id)
  res.json({ ok: true })
}

/** Avisos de um agendamento (novo, cancelado ou alterado), lendo tudo do banco. Cada aviso sai uma vez só. */
export async function processarAviso(tipo, id) {
  const ref = db().doc(`agendamentos/${id}`)
  const ag = await lerDoc(`agendamentos/${id}`)
  if (!ag?.clienteId) return

  const [config, privado, cliente] = await Promise.all([lerDoc('config/estudio'), lerDoc('privado/telegram'), lerDoc(`clientes/${ag.clienteId}`)])
  const anaChat = privado?.anaChatId
  const emailCliente = cliente?.email || ag.clienteEmail
  const nome = primeiroNome(ag.clienteNome)
  const sinal = sinalPago(ag)
  const detalhes = [
    ['Serviço', ag.servicoNomes],
    ['Data', dataLonga(ag.data)],
    ['Horário', `${ag.hora} às ${horaFim(ag)}`],
    ...(sinal ? [['Sinal pago (Pix)', brl(sinal)], ['Restante no dia', brl(restanteNoDia(ag))]] : [['Valor (pago no dia)', brl(ag.total)]]),
  ]
  const tel = (ag.clienteTelefone || cliente?.telefone || '').replace(/\D/g, '')
  const whatsCliente = tel ? `\n<a href="https://wa.me/55${tel}">WhatsApp da cliente</a>` : ''

  // Cada aviso sai uma vez só (a função pode ser chamada de novo sem duplicar)
  const marcar = (chave) =>
    db().runTransaction(async (t) => {
      const s = await t.get(ref)
      if (s.get(`avisos.${chave}`)) return false
      t.update(ref, { [`avisos.${chave}`]: new Date().toISOString() })
      return true
    })

  if (tipo === 'novo' && ag.status === 'agendado') {
    if (!(await marcar('novo'))) return
    await todas([
      criarEvento(ag, cliente).then((eventoId) => eventoId && ref.update({ eventoId })),
      telegram(cliente?.telegramChatId, `✅ <b>Horário confirmado!</b>

${dataLonga(ag.data)}, ${ag.hora} às ${horaFim(ag)}
${esc(ag.servicoNomes)}

Vou te lembrar na véspera.`),
      ag.origem === 'site' &&
        telegram(anaChat, `📅 <b>Novo agendamento</b>\n\n<b>${esc(ag.clienteNome)}</b>\n${esc(ag.servicoNomes)}\n${dataLonga(ag.data)} · ${ag.hora} às ${horaFim(ag)}\n${brl(ag.total)}${sinal ? ` · sinal de ${brl(sinal)} pago ✅` : ''}${whatsCliente}`),
      email(
        emailCliente,
        `Horário confirmado · ${dataBR(ag.data)} às ${ag.hora}`,
        modeloEmail({
          titulo: 'Horário confirmado!',
          texto: `Oi, ${esc(nome)}! Seu horário está reservado. Te espero no dia e hora abaixo.`,
          linhas: detalhes,
          botoes: [['Salvar no Google Agenda', linkGoogleAgenda(ag, config)], ['Lembrete no Telegram', linkTelegram(ag)]],
          rodape: `${sinal ? 'Precisa desmarcar? Cancele em "Meus horários" no site e o sinal volta para o seu Pix. Faltas sem aviso: o sinal fica com o estúdio e geram multa.' : `Precisa desmarcar? Cancele em "Meus horários" no site até ${config?.antecedenciaCancelHoras ?? 24}h antes. Faltas sem aviso geram multa.`}<br>No iPhone, toque no anexo "horario.ics" para salvar na agenda.`,
        }),
        [{ filename: 'horario.ics', content: icsDe(ag, config), contentType: 'text/calendar; charset=utf-8' }]
      ),
    ])
  } else if (tipo === 'cancelado' && ag.status === 'cancelado') {
    if (!(await marcar('cancelado'))) return
    const pelaCliente = ag.canceladoPor === 'cliente'
    const devolucao = await devolverSinal(ag, config, ref, anaChat)
    if (!ag.avisos?.novo) return // desistiu antes de pagar o sinal: nada a avisar
    const textoSinal = devolucao === 'devolvido' ? `<br><br>O sinal de <strong>${brl(ag.sinal.valor)}</strong> foi devolvido para o seu Pix (pode levar alguns minutos).` : devolucao === 'retido' ? '<br><br>Como o cancelamento foi em cima da hora, o sinal não é devolvido.' : ''
    await todas([
      ag.eventoId && apagarEvento(ag.eventoId).then(() => ref.update({ eventoId: FieldValue.delete() })),
      pelaCliente &&
        telegram(anaChat, `❌ <b>Cliente cancelou</b>\n\n<b>${esc(ag.clienteNome)}</b>\n${esc(ag.servicoNomes)}\n${dataLonga(ag.data)} às ${ag.hora}\n\nO horário já está livre no site.${devolucao === 'devolvido' ? `\nSinal de ${brl(ag.sinal.valor)} devolvido automaticamente.` : devolucao === 'retido' ? `\nSinal de ${brl(ag.sinal.valor)} retido (cancelou em cima da hora).` : ''}`),
      email(
        emailCliente,
        `Horário cancelado · ${dataBR(ag.data)} às ${ag.hora}`,
        modeloEmail({
          titulo: 'Horário cancelado',
          texto: pelaCliente
            ? `Oi, ${esc(nome)}! Seu cancelamento foi registrado. Quando quiser, é só agendar de novo pelo site.${textoSinal}`
            : `Oi, ${esc(nome)}! A Ana precisou cancelar o seu horário. Ela vai falar com você, ou você pode escolher outro horário pelo site.${textoSinal}`,
          linhas: detalhes.slice(0, 3),
          botoes: [['Agendar outro horário', `${SITE}/#agendar`]],
        })
      ),
      telegram(cliente?.telegramChatId, `❌ Seu horário de ${dataLonga(ag.data)} às ${ag.hora} foi cancelado.`),
    ])
  } else if (tipo === 'alterado' && ag.status === 'agendado') {
    await todas([
      ag.eventoId ? atualizarEvento(ag.eventoId, ag, cliente) : criarEvento(ag, cliente).then((eventoId) => eventoId && ref.update({ eventoId })),
      email(
        emailCliente,
        `Horário alterado · ${dataBR(ag.data)} às ${ag.hora}`,
        modeloEmail({
          titulo: 'Seu horário mudou',
          texto: `Oi, ${esc(nome)}! A Ana atualizou o seu horário. Confira como ficou:`,
          linhas: detalhes,
          botoes: [['Salvar no Google Agenda', linkGoogleAgenda(ag, config)]],
        }),
        [{ filename: 'horario.ics', content: icsDe(ag, config), contentType: 'text/calendar; charset=utf-8' }]
      ),
      telegram(cliente?.telegramChatId, `🔁 Seu horário mudou: <b>${dataLonga(ag.data)} às ${ag.hora}</b>\n${esc(ag.servicoNomes)}`),
    ])
  }
}

/**
 * Devolve o sinal no Pix ao cancelar. A cliente sempre recebe de volta quando cancela com antecedência,
 * quando a Ana cancela, ou (se a Ana deixou ligado) mesmo em cima da hora. Falta não passa por aqui.
 */
async function devolverSinal(ag, config, ref, anaChat) {
  if (!ag.sinal?.pago || ag.sinal.devolvidoEm || !ag.sinal.orderId) return null
  const horasAte = (new Date(`${ag.data}T${ag.hora}:00-03:00`).getTime() - Date.now()) / 3600e3
  const devolve = ag.canceladoPor !== 'cliente' || horasAte >= (config?.antecedenciaCancelHoras ?? 24) || config?.devolverSinalTardio !== false
  if (!devolve) return 'retido'
  try {
    await devolver(ag.sinal.orderId)
    await ref.update({ 'sinal.devolvidoEm': new Date().toISOString() })
    return 'devolvido'
  } catch (e) {
    console.error(e)
    await telegram(anaChat, `⚠️ Não consegui devolver o sinal de ${brl(ag.sinal.valor)} de <b>${esc(ag.clienteNome)}</b> (${dataBR(ag.data)} às ${ag.hora}). Devolva pelo app do Mercado Pago.`).catch(() => {})
    return 'erro'
  }
}

/** Botão "Enviar teste" do painel: testa cada aviso e devolve o erro exato de cada um. */
export async function testar(quem) {
  const tentar = async (f) => {
    try {
      await f()
      return 'ok'
    } catch (e) {
      return String(e?.message || e).slice(0, 400)
    }
  }
  const privado = await lerDoc('privado/telegram')
  const amanha = new Date(Date.now() + 21 * 3600e3).toISOString().slice(0, 10)
  const falso = { data: amanha, hora: '12:00', duracao: 30, clienteNome: 'Teste do site', servicoNomes: 'Pode apagar', total: 0, origem: 'site' }
  return {
    telegram: await tentar(async () => {
      if (!process.env.TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN não configurado no Vercel')
      if (!privado?.anaChatId) throw new Error('Telegram ainda não conectado (botão Conectar meu Telegram)')
      await telegram(privado.anaChatId, '✅ Teste do site: os avisos do Telegram estão funcionando.')
    }),
    agenda: await tentar(async () => {
      const id = await criarEvento(falso)
      if (!id) throw new Error('A agenda não devolveu o evento')
      await apagarEvento(id)
    }),
    email: await tentar(async () => {
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) throw new Error('GMAIL_USER ou GMAIL_APP_PASSWORD não configurado no Vercel')
      await email(quem.email, 'Teste de e-mail do site', modeloEmail({ titulo: 'Teste de e-mail', texto: 'Se você está lendo isto, os e-mails do site estão funcionando.' }))
    }),
  }
}

/** Registra o endereço do bot e gera o link de uso único para a Ana ligar o Telegram dela. */
async function conectarTelegram(req) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return { erro: 'Token do Telegram não configurado no Vercel.' }
  const url = `https://${req.headers['x-forwarded-host'] || req.headers.host}/api/telegram`
  const r = await telegramApi('setWebhook', { url, secret_token: segredoWebhook(), allowed_updates: ['message'] })
  if (!r.ok) return { erro: `Telegram recusou: ${r.description}` }
  const codigo = randomBytes(12).toString('hex')
  await db().doc('privado/telegram').set({ codigo, codigoEm: new Date().toISOString() }, { merge: true })
  const bot = await telegramApi('getMe', {})
  return { link: `https://t.me/${bot.result?.username}?start=ana_${codigo}` }
}
