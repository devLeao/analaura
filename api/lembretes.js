// Roda todo dia às 18h (horário de Brasília) pelo Cron do Vercel (vercel.json):
//  - lembra cada cliente do horário de amanhã (e-mail + Telegram, se ativou)
//  - manda pra Ana, no Telegram, a agenda de amanhã
import { db, lerDoc, todas, telegram, email, modeloEmail, esc, dataBR, dataLonga, brl, primeiroNome, SITE } from './_lib/servidor.js'
import { horaFim, linkGoogleAgenda } from '../src/lib/lembretes.js'

export default async function handler(req, res) {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).end()

  // "amanhã" no horário de Brasília (UTC-3)
  const agora = new Date(Date.now() - 3 * 3600e3)
  agora.setUTCDate(agora.getUTCDate() + 1)
  const amanha = agora.toISOString().slice(0, 10)

  const [config, privado, snap] = await Promise.all([
    lerDoc('config/estudio'),
    lerDoc('privado/telegram'),
    db().collection('agendamentos').where('data', '==', amanha).get(),
  ])
  const ags = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((a) => a.status === 'agendado' && a.clienteId)
    .sort((a, b) => a.hora.localeCompare(b.hora))

  // Clientes
  for (const ag of ags.filter((a) => !a.avisos?.lembrete)) {
    const cliente = await lerDoc(`clientes/${ag.clienteId}`)
    await todas([
      email(
        cliente?.email || ag.clienteEmail,
        `Lembrete: amanhã às ${ag.hora}`,
        modeloEmail({
          titulo: 'Te espero amanhã!',
          texto: `Oi, ${esc(primeiroNome(ag.clienteNome))}! Passando para lembrar do seu horário.`,
          linhas: [['Serviço', ag.servicoNomes], ['Data', dataLonga(ag.data)], ['Horário', `${ag.hora} às ${horaFim(ag)}`], ['Valor (pago no dia)', brl(ag.total)]],
          botoes: [['Ver no Google Agenda', linkGoogleAgenda(ag, config)], ['Meus horários', `${SITE}/#agendar`]],
          rodape: `Endereço: ${esc([config?.endereco, config?.cidade].filter(Boolean).join(', '))}<br>Tolerância de atraso: 10 minutos. Venha sem maquiagem nos olhos.`,
        })
      ),
      telegram(cliente?.telegramChatId, `⏰ <b>Lembrete:</b> amanhã, ${dataBR(ag.data).slice(0, 5)}, às <b>${ag.hora}</b>\n${esc(ag.servicoNomes)}\n\n📍 ${esc(config?.endereco || '')}\nTolerância de atraso: 10 minutos.`),
    ])
    await db().doc(`agendamentos/${ag.id}`).update({ 'avisos.lembrete': new Date().toISOString() })
  }

  // Ana: agenda de amanhã (uma vez por dia)
  if (privado?.anaChatId && privado.resumoDe !== amanha && ags.length) {
    const lista = ags.map((a) => `<b>${a.hora}</b> · ${esc(a.clienteNome)}\n      ${esc(a.servicoNomes)}`).join('\n')
    await telegram(privado.anaChatId, `🗓 <b>Amanhã, ${dataLonga(amanha)}</b>: ${ags.length} atendimento${ags.length > 1 ? 's' : ''}\n\n${lista}`)
    await db().doc('privado/telegram').set({ resumoDe: amanha }, { merge: true })
  }

  res.json({ ok: true, amanha, lembretes: ags.length })
}
