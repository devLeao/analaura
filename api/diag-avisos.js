// TEMPORÁRIO: diagnóstico dos avisos feito pelo desenvolvedor (protegido por chave). Apagar depois.
import { createHash, createSign } from 'node:crypto'
import { quemChamou, SUPER_ADMIN } from './_lib/servidor.js'
import { testar } from './avisos.js'

const HASH = '68f356432f612c299c3b70f6df4ab245092fc35d9c09f4322ca9a8af0f5a3dd0'
const API_KEY = 'AIzaSyBqLC2vWgOghUaVaxUBlIlTlExSvt9ZC0A'
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url')

async function loginDeTeste() {
  const conta = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  const agora = Math.floor(Date.now() / 1000)
  const corpo = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: conta.client_email, sub: conta.client_email, uid: 'diagnostico-avisos', iat: agora, exp: agora + 3600,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
  })}`
  const assinatura = createSign('RSA-SHA256').update(corpo).sign(conta.private_key).toString('base64url')
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Referer: 'https://analaura.vercel.app/' },
    body: JSON.stringify({ token: `${corpo}.${assinatura}`, returnSecureToken: true }),
  })
  const j = await r.json()
  if (!j.idToken) return `não consegui logar: ${JSON.stringify(j).slice(0, 300)}`
  const quem = await quemChamou({ headers: { authorization: `Bearer ${j.idToken}` } })
  return quem ? `ok (uid ${quem.uid})` : 'O SERVIDOR RECUSOU UM LOGIN VÁLIDO'
}

export default async function handler(req, res) {
  if (createHash('sha256').update(String(req.query.chave || '')).digest('hex') !== HASH) return res.status(404).end()
  const login = await loginDeTeste().catch((e) => `erro: ${e.message}`)
  const avisos = await testar({ email: SUPER_ADMIN }).catch((e) => ({ erro: e.message }))
  res.json({ login, ...avisos })
}
