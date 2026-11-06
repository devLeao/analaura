// TEMPORÁRIO: situação da conta e das últimas cobranças no Mercado Pago, sem dados pessoais (protegido por chave). Apagar depois.
import { createHash } from 'node:crypto'
import { db } from './_lib/servidor.js'
import { lerOrder } from './_lib/mercadopago.js'

const mp = async (caminho) => {
  const r = await fetch('https://api.mercadopago.com' + caminho, { headers: { Authorization: 'Bearer ' + process.env.MERCADOPAGO_ACCESS_TOKEN } })
  return { http: r.status, json: await r.json().catch(() => null) }
}

export default async function handler(req, res) {
  if (createHash('sha256').update(String(req.query.chave || '')).digest('hex') !== '6711d25f91142313cb7afb1322f03696d83aa9cf41c3621b5ff18e6dd194f3c2') return res.status(404).end()
  const eu = await mp('/users/me')
  const u = eu.json || {}
  const conta = { http: eu.http, site_status: u.status?.site_status, sell: u.status?.sell, buy: u.status?.buy, billing: u.status?.billing, mercadopago_account_type: u.status?.mercadopago_account_type, confirmed_email: u.status?.confirmed_email, user_type: u.user_type, tags: u.tags }

  const snap = await db().collection('cobrancas').orderBy('criadaEm', 'desc').limit(15).get()
  const cobrancas = await Promise.all(snap.docs.map(async (d) => {
    const c = d.data()
    let o = {}
    try {
      const order = await lerOrder(d.id)
      const p = order.transactions?.payments?.[0] || {}
      o = { order: order.status + '/' + order.status_detail, pag: p.status + '/' + p.status_detail, pago: order.total_paid_amount }
    } catch (e) { o = { erro: String(e.message).slice(0, 160) } }
    return { em: c.criadaEm, tipo: c.tipo, valor: c.valor, site: c.status, ...o }
  }))

  const ps = await mp('/v1/payments/search?sort=date_created&criteria=desc&limit=20')
  const pagamentos = (ps.json?.results || []).map((p) => ({ em: p.date_created, valor: p.transaction_amount, meio: p.payment_method_id, tipo: p.payment_type_id, status: p.status, detalhe: p.status_detail }))
  res.json({ agora: new Date().toISOString(), conta, cobrancas, pagamentosHttp: ps.http, pagamentos })
}
