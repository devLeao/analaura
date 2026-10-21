// Avisos do Mercado Pago (webhook "Order (Mercado Pago)").
// Por enquanto só confere a assinatura e responde. O sinal e a multa automáticos entram aqui depois.
// A assinatura vem no cabeçalho x-signature ("ts=...,v1=...") e é um HMAC-SHA256 de
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" com a Assinatura secreta (MERCADOPAGO_WEBHOOK_SECRET).
import { createHmac, timingSafeEqual } from 'node:crypto'

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
  // TEMPORÁRIO: confere se as chaves estão no Vercel (sem mostrar valores)
  if (req.method === 'GET' && req.query.conferir === '1') {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    const r = token ? await fetch('https://api.mercadopago.com/users/me', { headers: { Authorization: `Bearer ${token}` } }) : null
    return res.json({ accessToken: !token ? 'FALTA' : r.ok ? 'ok (aceito pelo Mercado Pago)' : `recusado (${r.status})`, webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET ? 'presente' : 'FALTA' })
  }
  if (req.method !== 'POST') return res.status(200).send('ok')
  const valida = assinaturaValida(req)
  console.log('mercadopago', { tipo: req.body?.type, acao: req.body?.action, id: req.body?.data?.id, assinatura: valida ? 'ok' : 'inválida' })
  res.status(200).json({ recebido: true, assinatura: valida ? 'válida' : 'inválida' })
}
