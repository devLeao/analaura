// Peças do servidor (funções do Vercel): banco, Telegram, Google Agenda e e-mail.
// As chaves ficam SÓ nas variáveis de ambiente do Vercel:
//   FIREBASE_SERVICE_ACCOUNT  conteúdo do .json da conta de serviço do Firebase
//   TELEGRAM_BOT_TOKEN        token do @LauraCelvioBot (BotFather)
//   GMAIL_USER                lauracelvio@gmail.com
//   GMAIL_APP_PASSWORD        senha de app do Gmail
//   GOOGLE_CALENDAR_ID        (opcional) agenda da Ana; padrão = GMAIL_USER
import { createHash } from 'node:crypto'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { JWT } from 'google-auth-library'
import nodemailer from 'nodemailer'
import { horaFim } from '../../src/lib/lembretes.js'

export const SUPER_ADMIN = 'leandrofls16@gmail.com'
export const SITE = 'https://analaura.vercel.app'

// ---------- Firebase ----------
let conta
const contaServico = () => (conta ||= JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
const app = () => getApps()[0] || initializeApp({ credential: cert(contaServico()) })
export const db = () => getFirestore(app())

/** Quem chamou a função (pelo login do Firebase no site) e se é administradora. */
export async function quemChamou(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  if (!token) return null
  try {
    const u = await getAuth(app()).verifyIdToken(token)
    const ehAdmin = !!u.email_verified && (u.email === SUPER_ADMIN || (await db().doc(`admins/${u.email}`).get()).exists)
    return { uid: u.uid, email: u.email, ehAdmin }
  } catch {
    return null
  }
}

export const lerDoc = async (caminho) => {
  const s = await db().doc(caminho).get()
  return s.exists ? { id: s.id, ...s.data() } : null
}

/** Roda várias tarefas sem que o erro de uma impeça as outras. */
export async function todas(tarefas) {
  const r = await Promise.allSettled(tarefas)
  r.filter((x) => x.status === 'rejected').forEach((x) => console.error(x.reason))
}

// ---------- Textos ----------
export const esc = (t = '') => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
export const dataBR = (iso) => iso.split('-').reverse().join('/')
export const dataLonga = (iso) => `${DIAS[new Date(`${iso}T12:00:00Z`).getUTCDay()]}, ${dataBR(iso).slice(0, 5)}`
export const brl = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const primeiroNome = (n = '') => n.trim().split(/\s+/)[0]

// ---------- Telegram ----------
export async function telegram(chatId, texto) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token || !chatId) return
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: 'HTML', disable_web_page_preview: true }),
  })
  if (!r.ok) throw new Error(`Telegram ${r.status}: ${await r.text()}`)
}

export async function telegramApi(metodo, corpo) {
  const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${metodo}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  })
  return r.json()
}

/** Senha que o Telegram manda junto em cada mensagem pro site (derivada do token, sem precisar de outra variável). */
export const segredoWebhook = () => createHash('sha256').update(`webhook:${process.env.TELEGRAM_BOT_TOKEN}`).digest('hex').slice(0, 48)

// ---------- Google Agenda (da Ana) ----------
let jwt
const calendario = () => process.env.GOOGLE_CALENDAR_ID || process.env.GMAIL_USER
async function agenda(metodo, caminho = '', corpo) {
  jwt ||= new JWT({ email: contaServico().client_email, key: contaServico().private_key, scopes: ['https://www.googleapis.com/auth/calendar.events'] })
  const { token } = await jwt.getAccessToken()
  const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendario())}/events${caminho}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  if (r.status === 404 || r.status === 410) return null // evento já apagado na agenda
  if (!r.ok) throw new Error(`Agenda ${r.status}: ${await r.text()}`)
  return r.status === 204 ? null : r.json()
}

const eventoDe = (ag, cliente) => ({
  summary: `${ag.clienteNome} · ${ag.servicoNomes}`,
  description: [
    `Serviço: ${ag.servicoNomes}`,
    `Valor: ${brl(ag.total)}`,
    ag.clienteTelefone || cliente?.telefone ? `WhatsApp: https://wa.me/55${(ag.clienteTelefone || cliente.telefone).replace(/\D/g, '')}` : '',
    ag.origem === 'site' ? 'Agendado pelo site.' : 'Agendado pelo painel.',
  ]
    .filter(Boolean)
    .join('\n'),
  start: { dateTime: `${ag.data}T${ag.hora}:00`, timeZone: 'America/Sao_Paulo' },
  end: { dateTime: `${ag.data}T${horaFim(ag)}:00`, timeZone: 'America/Sao_Paulo' },
  reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
})

export const criarEvento = async (ag, cliente) => (await agenda('POST', '', eventoDe(ag, cliente)))?.id
export const atualizarEvento = (id, ag, cliente) => agenda('PUT', `/${id}`, eventoDe(ag, cliente))
export const apagarEvento = (id) => agenda('DELETE', `/${id}`)

// ---------- E-mail (pelo Gmail da Laura) ----------
let correio
export async function email(para, assunto, html, anexos = []) {
  if (!para || !process.env.GMAIL_APP_PASSWORD) return
  correio ||= nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, '') },
  })
  await correio.sendMail({ from: `"Laura Célvio" <${process.env.GMAIL_USER}>`, to: para, subject: assunto, html, attachments: anexos })
}

/** Moldura dos e-mails: preto e cinza, igual ao site. */
export function modeloEmail({ titulo, texto, linhas = [], botoes = [], rodape = '' }) {
  const linha = ([k, v]) =>
    `<tr><td style="padding:6px 0;color:#8a8a8a;font-size:14px">${esc(k)}</td><td style="padding:6px 0;color:#f2f2f2;font-size:14px;text-align:right">${esc(v)}</td></tr>`
  const botao = ([rotulo, href]) =>
    `<a href="${href}" style="display:inline-block;margin:4px;padding:12px 20px;border-radius:999px;background:#f2f2f2;color:#111;text-decoration:none;font-size:12px;letter-spacing:.12em;text-transform:uppercase">${esc(rotulo)}</a>`
  return `<!doctype html><html><body style="margin:0;background:#0d0d0d;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
  <p style="margin:0 0 24px;text-align:center;color:#bdbdbd;font-family:Georgia,serif;font-size:22px;letter-spacing:.3em">LAURA CÉLVIO</p>
  <div style="background:#171717;border:1px solid #2a2a2a;border-radius:20px;padding:28px 24px">
    <h1 style="margin:0 0 10px;color:#fff;font-family:Georgia,serif;font-weight:normal;font-size:28px">${esc(titulo)}</h1>
    <p style="margin:0 0 18px;color:#cfcfcf;font-size:15px;line-height:1.6">${texto}</p>
    ${linhas.length ? `<table style="width:100%;border-top:1px solid #2a2a2a;border-collapse:collapse;margin-bottom:18px">${linhas.map(linha).join('')}</table>` : ''}
    ${botoes.length ? `<div style="text-align:center">${botoes.map(botao).join('')}</div>` : ''}
  </div>
  <p style="margin:20px 0 0;text-align:center;color:#777;font-size:12px;line-height:1.6">${rodape || 'Tolerância de atraso: 10 minutos. Venha sem maquiagem nos olhos.'}<br><a href="${SITE}" style="color:#999">${SITE.replace('https://', '')}</a></p>
</div></body></html>`
}
