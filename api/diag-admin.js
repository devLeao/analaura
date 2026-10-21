// TEMPORÁRIO: libera o painel para o e-mail do estúdio (protegido por chave). Apagar depois.
import { createHash } from 'node:crypto'
import { db } from './_lib/servidor.js'

export default async function handler(req, res) {
  if (createHash('sha256').update(String(req.query.chave || '')).digest('hex') !== 'e8c8f1b1ec4311a0b61be5137c894ace6412698c26353b7861435c09a9edb904') return res.status(404).end()
  await db().doc('admins/lauracelviosalao@gmail.com').set({ criadoEm: new Date().toISOString().slice(0, 10) })
  const lista = (await db().collection('admins').get()).docs.map((d) => d.id)
  res.json({ ok: true, admins: lista })
}
