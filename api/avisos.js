// O site chama esta função logo depois de gravar um agendamento, cancelamento ou remarcação.
// Ela lê o agendamento direto do banco (não confia no que o navegador mandou) e:
//  - avisa a Ana no Telegram
//  - cria / altera / apaga o evento na agenda da Ana (Google Agenda)
//  - manda e-mail (e Telegram, se ela ativou) para a cliente
// Também liga o Telegram da Ana (tipo "conectar-telegram", só administradora).
import { randomBytes } from 'node:crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { linkGoogleAgenda, icsDe, linkTelegram, horaFim } from '../src/lib/lembretes.js'
import {
  SITE, db, lerDoc, quemChamou, todas, telegram, telegramApi, segredoWebhook,
  criarEvento, atualizarEvento, apagarEvento, email, modeloEmail, esc, dataBR, dataLonga, brl, primeiroNome,
} from './_lib/servidor.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const quem = await quemChamou(req)
  if (!quem) return res.status(401).json({ erro: 'Faça login.' })
  const { tipo, id } = req.body || {}

  if (tipo === 'conectar-telegram') {
    if (!quem.ehAdmin) return res.status(403).end()
    return res.json(await conectarTelegram(req))
  }

  const ref = db().doc(`agendamentos/${id}`)
  const ag = await lerDoc(`agendamentos/${id}`)
  if (!ag || !ag.clienteId) return res.status(404).end()
  if (!quem.ehAdmin && ag.clienteId !== quem.uid) return res.status(403).end()
  // remarcar só pelo painel
  if (tipo === 'alterado' && !quem.ehAdmin) return res.status(403).end()

  const [config, privado, cliente] = await Promise.all([lerDoc('config/estudio'), lerDoc('privado/telegram'), lerDoc(`clientes/${ag.clienteId}`)])
  const anaChat = privado?.anaChatId
  const emailCliente = cliente?.email || ag.clienteEmail
  const nome = primeiroNome(ag.clienteNome)
  const detalhes = [
    ['Serviço', ag.servicoNomes],
    ['Data', dataLonga(ag.data)],
    ['Horário', `${ag.hora} às ${horaFim(ag)}`],
    ['Valor (pago no dia)', brl(ag.total)],
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
    if (!(await marcar('novo'))) return res.json({ ok: true })
    await todas([
      criarEvento(ag, cliente).then((eventoId) => eventoId && ref.update({ eventoId })),
      ag.origem === 'site' &&
        telegram(anaChat, `📅 <b>Novo agendamento</b>\n\n<b>${esc(ag.clienteNome)}</b>\n${esc(ag.servicoNomes)}\n${dataLonga(ag.data)} · ${ag.hora} às ${horaFim(ag)}\n${brl(ag.total)}${whatsCliente}`),
      email(
        emailCliente,
        `Horário confirmado · ${dataBR(ag.data)} às ${ag.hora}`,
        modeloEmail({
          titulo: 'Horário confirmado!',
          texto: `Oi, ${esc(nome)}! Seu horário está reservado. Te espero no dia e hora abaixo.`,
          linhas: detalhes,
          botoes: [['Salvar no Google Agenda', linkGoogleAgenda(ag, config)], ['Lembrete no Telegram', linkTelegram(ag)]],
          rodape: `Precisa desmarcar? Cancele em "Meus horários" no site até ${config?.antecedenciaCancelHoras ?? 24}h antes. Faltas sem aviso geram multa.<br>No iPhone, toque no anexo "horario.ics" para salvar na agenda.`,
        }),
        [{ filename: 'horario.ics', content: icsDe(ag, config), contentType: 'text/calendar; charset=utf-8' }]
      ),
    ])
  } else if (tipo === 'cancelado' && ag.status === 'cancelado') {
    if (!(await marcar('cancelado'))) return res.json({ ok: true })
    const pelaCliente = ag.canceladoPor === 'cliente'
    await todas([
      ag.eventoId && apagarEvento(ag.eventoId).then(() => ref.update({ eventoId: FieldValue.delete() })),
      pelaCliente &&
        telegram(anaChat, `❌ <b>Cliente cancelou</b>\n\n<b>${esc(ag.clienteNome)}</b>\n${esc(ag.servicoNomes)}\n${dataLonga(ag.data)} às ${ag.hora}\n\nO horário já está livre no site.`),
      email(
        emailCliente,
        `Horário cancelado · ${dataBR(ag.data)} às ${ag.hora}`,
        modeloEmail({
          titulo: 'Horário cancelado',
          texto: pelaCliente
            ? `Oi, ${esc(nome)}! Seu cancelamento foi registrado. Quando quiser, é só agendar de novo pelo site.`
            : `Oi, ${esc(nome)}! A Ana precisou cancelar o seu horário. Ela vai falar com você, ou você pode escolher outro horário pelo site.`,
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
  res.json({ ok: true })
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
