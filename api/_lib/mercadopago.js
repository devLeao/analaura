// Pix pelo Mercado Pago (API Orders): cria a cobrança, consulta e devolve.
// Credencial só no Vercel: MERCADOPAGO_ACCESS_TOKEN.
// Cada cobrança fica registrada em cobrancas/{orderId} (só o servidor lê), ligando o Pix ao agendamento ou às multas.
import { randomUUID } from 'node:crypto'
import { db } from './servidor.js'

const API = 'https://api.mercadopago.com/v1/orders'

async function chamar(metodo, caminho = '', corpo) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado no Vercel')
  const r = await fetch(`${API}${caminho}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(metodo === 'POST' ? { 'X-Idempotency-Key': randomUUID() } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const texto = await r.text()
  const json = texto ? JSON.parse(texto) : {}
  if (!r.ok) throw new Error(`Mercado Pago ${r.status}: ${texto.slice(0, 300)}`)
  return json
}

/**
 * Cria um Pix e registra a cobrança. O QR do Mercado Pago vale no mínimo 30 min;
 * quem decide até quando o horário fica segurado é o site (prazoSinalMin).
 */
export async function criarPix({ valor, email, referencia, cobranca }) {
  const v = Number(valor).toFixed(2)
  const order = await chamar('POST', '', {
    type: 'online',
    processing_mode: 'automatic',
    total_amount: v,
    external_reference: referencia.slice(0, 64),
    payer: { email },
    transactions: { payments: [{ amount: v, payment_method: { id: 'pix', type: 'bank_transfer' }, expiration_time: 'PT30M' }] },
  })
  const pag = order.transactions?.payments?.[0] || {}
  const pix = {
    orderId: order.id,
    valor: Number(v),
    copiaCola: pag.payment_method?.qr_code || '',
    link: pag.payment_method?.ticket_url || '',
    venceEm: new Date(Date.now() + 30 * 60e3).toISOString(),
  }
  await db().doc(`cobrancas/${order.id}`).set({ ...cobranca, valor: pix.valor, status: 'pendente', criadaEm: new Date().toISOString() })
  return pix
}

export const lerOrder = (id) => chamar('GET', `/${encodeURIComponent(id)}`)

export const estaPago = (order) => order?.status === 'processed' && order?.status_detail === 'accredited'

/** Devolve o Pix inteiro para quem pagou. */
export const devolver = (orderId) => chamar('POST', `/${encodeURIComponent(orderId)}/refund`)
