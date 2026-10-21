// TEMPORÁRIO: diagnóstico dos avisos feito pelo desenvolvedor (protegido por chave). Apagar depois.
import { createHash, createSign } from 'node:crypto'
import { JWT } from 'google-auth-library'
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
  const senha = process.env.GMAIL_APP_PASSWORD || ''
  const conta = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  const jwt = new JWT({ email: conta.client_email, key: conta.private_key, scopes: ['https://www.googleapis.com/auth/calendar'] })
  const { token } = await jwt.getAccessToken()
  const cal = process.env.GOOGLE_CALENDAR_ID || process.env.GMAIL_USER
  const r1 = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal)}`, { headers: { Authorization: `Bearer ${token}` } })
  const r2 = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', { headers: { Authorization: `Bearer ${token}` } })
  const lista = await r2.json()
  res.json({
    login, ...avisos,
    detalhes: {
      gmailUser: JSON.stringify(process.env.GMAIL_USER || null),
      calendarioUsado: JSON.stringify(cal),
      senhaCaracteres: senha.length, senhaSemEspacos: senha.replace(/s/g, '').length, senhaSoLetras: /^[a-zA-Zs]*$/.test(senha),
      agendaStatus: r1.status + ' ' + (await r1.text()).slice(0, 200),
      agendasQueORoboVe: (lista.items || []).map((c) => c.id), erroLista: lista.error?.message,
      deployEm: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    },
  })
}
