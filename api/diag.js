// Temporário: descobre qual módulo falha ao carregar no Vercel (não mostra segredos).
const testes = {
  lembretes: () => import('../src/lib/lembretes.js'),
  adminApp: () => import('firebase-admin/app'),
  adminFirestore: () => import('firebase-admin/firestore'),
  adminAuth: () => import('firebase-admin/auth'),
  googleAuth: () => import('google-auth-library'),
  nodemailer: () => import('nodemailer'),
  servidor: () => import('./_lib/servidor.js'),
}
export default async function handler(req, res) {
  const out = {}
  for (const [k, f] of Object.entries(testes)) {
    try { await f(); out[k] = 'ok' } catch (e) { out[k] = String(e?.stack || e).slice(0, 500) }
  }
  res.json(out)
}
