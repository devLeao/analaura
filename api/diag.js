// Temporário: descobre qual módulo falha ao carregar no Vercel (não mostra segredos).
export default async function handler(req, res) {
  const out = { node: process.version, envs: ['FIREBASE_SERVICE_ACCOUNT', 'TELEGRAM_BOT_TOKEN', 'GMAIL_USER', 'GMAIL_APP_PASSWORD'].map((k) => `${k}:${process.env[k] ? 'ok' : 'FALTA'}`) }
  for (const m of ['../src/lib/lembretes.js', 'firebase-admin/app', 'firebase-admin/firestore', 'firebase-admin/auth', 'google-auth-library', 'nodemailer', './_lib/servidor.js']) {
    try { await import(m); out[m] = 'ok' } catch (e) { out[m] = String(e?.message || e).slice(0, 300) }
  }
  try { JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || ''); out.jsonConta = 'ok' } catch (e) { out.jsonConta = 'inválido: ' + e.message.slice(0, 80) }
  res.json(out)
}
