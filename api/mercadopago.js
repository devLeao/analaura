// Avisos do Mercado Pago (webhook "Order (Mercado Pago)"), configurado no painel do Mercado Pago.
// Nunca confia no conteúdo do aviso: consulta a order direto na API antes de dar baixa.
//  - Sinal pago: confirma o horário (ou devolve o Pix, se o horário foi perdido ou cancelado)
//  - Multa paga: baixa as pendências e libera a cliente
// A assinatura (x-signature) é um HMAC-SHA256 de "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
// com a Assinatura secreta (MERCADOPAGO_WEBHOOK_SECRET). Fica registrada no log.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { db, lerDoc, telegram, esc, brl, dataBR } from './_lib/servidor.js'
import { lerOrder, estaPago, devolver } from './_lib/mercadopago.js'
import { processarAviso } from './avisos.js'
import { toMin } from '../src/lib/format.js'
import { aguardandoValido, aguardandoExpirado } from '../src/lib/sinal.js'

export function assinaturaValida(req) {
  const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET
  const partes = Object.fromEntries(
    String(req.headers['x-signature'] || '')
      .split(',')
      .map((p) => p.trim().split('='))
  )
  if (!segredo || !partes.ts || !partes.v1) return false
  const id = String(req.query['data.id'] || req.body?.data?.id || '').toLowerCase()
  let modelo = ''
  if (id) modelo += `id:${id};`
  if (req.headers['x-request-id']) modelo += `request-id:${req.headers['x-request-id']};`
  modelo += `ts:${partes.ts};`
  const esperado = createHmac('sha256', segredo).update(modelo).digest('hex')
  return esperado.length === partes.v1.length && timingSafeEqual(Buffer.from(esperado), Buffer.from(partes.v1))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('ok')
  const id = String(req.query['data.id'] || req.body?.data?.id || '')
  const valida = assinaturaValida(req)
  console.log('mercadopago', { tipo: req.body?.type || req.query.type, acao: req.body?.action, id, assinatura: valida ? 'ok' : 'inválida' })
  if (!id) return res.status(200).json({ recebido: true, assinatura: valida ? 'válida' : 'inválida' })

  try {
    const cobranca = await lerDoc(`cobrancas/${id}`)
    // Aviso de uma order que não foi criada pelo site (ex.: simulação do painel): só confirma o recebimento
    if (!cobranca || cobranca.status !== 'pendente') return res.status(200).json({ recebido: true, assinatura: valida ? 'válida' : 'inválida' })
    const order = await lerOrder(id)
    if (!estaPago(order)) return res.status(200).json({ recebido: true, pago: false })

    // Marca a cobrança como paga uma vez só (o Mercado Pago pode repetir o aviso)
    const primeira = await db().runTransaction(async (t) => {
      const ref = db().doc(`cobrancas/${id}`)
      const s = await t.get(ref)
      if (s.get('status') !== 'pendente') return false
      t.update(ref, { status: 'paga', pagaEm: new Date().toISOString() })
      return true
    })
    if (primeira) {
      if (cobranca.tipo === 'sinal') await sinalPago(id, cobranca)
      if (cobranca.tipo === 'multa') await multasPagas(id, cobranca)
    }
    res.status(200).json({ recebido: true, pago: true })
  } catch (e) {
    console.error(e)
    // 500 faz o Mercado Pago tentar de novo daqui a pouco
    res.status(500).json({ erro: 'falha ao processar' })
  }
}

/** Sinal pago: confirma o horário. Se ele não estiver mais disponível, devolve o Pix. */
async function sinalPago(orderId, cobranca) {
  const ref = db().doc(`agendamentos/${cobranca.agendamentoId}`)
  const ag = await lerDoc(`agendamentos/${cobranca.agendamentoId}`)
  const privado = await lerDoc('privado/telegram')
  const sinal = { pago: true, valor: cobranca.valor, orderId, pagoEm: new Date().toISOString() }

  let motivo = null
  if (!ag) motivo = 'agendamento não encontrado'
  else if (ag.status !== 'aguardando') motivo = ag.status === 'cancelado' ? 'a cliente desistiu do horário' : `status ${ag.status}`
  else if (aguardandoExpirado(ag) && (await conflito(ag))) motivo = 'o prazo acabou e o horário foi pego por outra cliente'

  if (motivo) {
    await devolver(orderId)
    if (ag) await ref.update({ sinal: { ...sinal, devolvidoEm: new Date().toISOString() } })
    await telegram(privado?.anaChatId, `↩️ Pix de sinal de ${brl(cobranca.valor)} devolvido automaticamente (${esc(motivo)}).`).catch(() => {})
    return
  }

  // Confirma: horário passa a "agendado" e o registro público do horário também
  const b = db().batch()
  b.update(ref, { status: 'agendado', sinal, expiraEm: null, pix: null })
  b.set(db().doc(`ocupados/${ag.id}`), { data: ag.data, hora: ag.hora, duracao: ag.duracao, status: 'agendado', diaInteiro: false })
  b.set(db().collection('notificacoes').doc(), {
    criadoEm: new Date().toISOString(), lida: false, tipo: 'agendamento',
    titulo: 'Novo agendamento pelo site (sinal pago)',
    texto: `${ag.clienteNome} · ${ag.servicoNomes} · ${dataBR(ag.data)} às ${ag.hora} · sinal ${brl(cobranca.valor)}`,
  })
  await b.commit()
  await processarAviso('novo', ag.id)
}

/** Outro horário ocupa o mesmo intervalo (depois que o prazo deste acabou)? */
async function conflito(ag) {
  const s = await db().collection('ocupados').where('data', '==', ag.data).get()
  const ini = toMin(ag.hora)
  const fim = ini + ag.duracao
  return s.docs.some((d) => {
    if (d.id === ag.id) return false
    const o = d.data()
    if (o.status === 'aguardando' && !aguardandoValido(o)) return false
    const a = o.diaInteiro ? 0 : toMin(o.hora)
    const b = o.diaInteiro ? 1440 : a + o.duracao
    return ini < b && fim > a
  })
}

/** Multas pagas no Pix: baixa todas e libera a cliente para agendar. */
async function multasPagas(orderId, cobranca) {
  const agora = new Date().toISOString()
  const b = db().batch()
  const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10) // data de Brasília, como o painel grava
  for (const pid of cobranca.pendenciaIds || []) b.update(db().doc(`pendencias/${pid}`), { status: 'paga', pagaEm: hoje, via: 'pix', orderId })
  const cliente = await lerDoc(`clientes/${cobranca.clienteId}`)
  b.set(db().collection('notificacoes').doc(), {
    criadoEm: agora, lida: false, tipo: 'pendencia_paga',
    titulo: 'Multa paga no Pix',
    texto: `${cliente?.nome || 'Cliente'} pagou ${brl(cobranca.valor)}. Agendamento liberado.`,
  })
  await b.commit()
  const privado = await lerDoc('privado/telegram')
  await telegram(privado?.anaChatId, `💸 <b>Multa paga</b>\n${esc(cliente?.nome || 'Cliente')} pagou ${brl(cobranca.valor)} no Pix. Ela já pode agendar de novo.`).catch(() => {})
}
