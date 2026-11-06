// TEMPORÁRIO: consulta o endereço do QR dinâmico, como o banco faz antes de pagar (protegido por chave). Apagar depois.
import { createHash } from 'node:crypto'
import { db } from './_lib/servidor.js'
import { criarPix } from './_lib/mercadopago.js'

const tlv = (s) => {
  const o = {}
  for (let i = 0; i + 4 <= s.length; ) {
    const t = s.slice(i, i + 2)
    const n = Number(s.slice(i + 2, i + 4))
    o[t] = s.slice(i + 4, i + 4 + n)
    i += 4 + n
  }
  return o
}
const tipoChave = (c) => (!c ? 'sem chave' : /^[0-9a-f-]{36}$/i.test(c) ? 'aleatória' : /^\d{14}$/.test(c) ? 'cnpj' : /^\d{11}$/.test(c) ? 'cpf' : c.includes('@') ? 'email' : c.startsWith('+') ? 'telefone' : 'outra')

async function conferir(codigo) {
  const raiz = tlv(codigo)
  const conta = tlv(raiz['26'] || '')
  const url = conta['25']
  const out = { gui: conta['00'], temUrl: !!url, dominio: url?.split('/')[0], valorNoCodigo: raiz['54'], cidade: raiz['60'] }
  if (!url) return { ...out, chaveNoCodigo: tipoChave(conta['01']) }
  const t0 = Date.now()
  try {
    const r = await fetch('https://' + url, { signal: AbortSignal.timeout(9000) })
    const txt = await r.text()
    out.http = r.status
    out.ms = Date.now() - t0
    const p = txt.split('.')
    if (p.length === 3) {
      const j = JSON.parse(Buffer.from(p[1], 'base64url').toString())
      out.payload = { status: j.status, revisao: j.revisao, calendario: j.calendario, valor: j.valor?.original, chave: tipoChave(j.chave), temTxid: !!j.txid }
    } else out.corpo = txt.slice(0, 160)
  } catch (e) {
    out.erro = String(e.message).slice(0, 200)
    out.ms = Date.now() - t0
  }
  return out
}

export default async function handler(req, res) {
  if (createHash('sha256').update(String(req.query.chave || '')).digest('hex') !== 'b7e3ffeec3e342b59f2fb56bac59308a063e9cfd3c8e1e692246bd6f86ea1e9d') return res.status(404).end()
  const snap = await db().collection('cobrancas').orderBy('criadaEm', 'desc').limit(12).get()
  const lista = snap.docs.map((d) => d.data()).filter((c) => c.pix?.copiaCola)
  const ultimo = lista.find((c) => c.tipo !== 'teste')
  const pago = lista.find((c) => c.status === 'paga')
  const novo = await criarPix({ valor: 1, email: 'lauracelviosalao@gmail.com', referencia: 'teste_diag', cobranca: { tipo: 'teste' } })
  res.json({
    agora: new Date().toISOString(),
    ultimo: ultimo && { em: ultimo.criadaEm, valor: ultimo.valor, site: ultimo.status, qr: await conferir(ultimo.pix.copiaCola) },
    pagoAntes: pago && { em: pago.criadaEm, valor: pago.valor, qr: await conferir(pago.pix.copiaCola) },
    novo: { qr: await conferir(novo.copiaCola), copiaCola: novo.copiaCola },
  })
}
