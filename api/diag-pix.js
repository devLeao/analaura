// TEMPORÁRIO: testa a criação de um Pix de R$ 1,00 no Mercado Pago (protegido por chave). Apagar depois.
import { createHash } from 'node:crypto'
import { criarPix, lerOrder } from './_lib/mercadopago.js'

export default async function handler(req, res) {
  if (createHash('sha256').update(String(req.query.chave || '')).digest('hex') !== '924476f3f38795bf2cd23782ff4d64a042edf3c1ed3ced4f9ee516baf7bd00c6') return res.status(404).end()
  try {
    const pix = await criarPix({ valor: 1, email: 'lauracelviosalao@gmail.com', referencia: 'teste_diag', cobranca: { tipo: 'teste' } })
    const order = await lerOrder(pix.orderId)
    res.json({ ok: true, orderId: pix.orderId, temCopiaCola: !!pix.copiaCola, inicio: pix.copiaCola.slice(0, 20), temLink: !!pix.link, status: order.status, detalhe: order.status_detail })
  } catch (e) {
    res.json({ ok: false, erro: String(e.message).slice(0, 600) })
  }
}
