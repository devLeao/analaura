// Recebe as mensagens enviadas ao @LauraCelvioBot.
//  /start ana_<código>  liga o Telegram da Ana (link gerado no painel → Configurações)
//  /start ag_<id>       a cliente ativa lembretes do agendamento dela
//  /parar               a cliente desliga os lembretes
import { SITE, db, lerDoc, telegram, segredoWebhook, esc, dataLonga, primeiroNome } from './_lib/servidor.js'
import { horaFim } from '../src/lib/lembretes.js'

export default async function handler(req, res) {
  if (req.method !== 'POST' || req.headers['x-telegram-bot-api-secret-token'] !== segredoWebhook()) return res.status(401).end()
  const msg = req.body?.message
  const chat = msg?.chat?.id
  if (!chat) return res.status(200).end()
  const [comando, arg = ''] = (msg.text || '').trim().split(/\s+/)

  try {
    if (comando === '/start' && arg.startsWith('ana_')) {
      const privado = await lerDoc('privado/telegram')
      const valido = privado?.codigo && arg.slice(4) === privado.codigo && Date.now() - new Date(privado.codigoEm).getTime() < 30 * 60e3
      if (!valido) {
        await telegram(chat, 'Esse link expirou. Gere outro no painel: Configurações → Avisos → Conectar Telegram.')
      } else {
        await db().doc('privado/telegram').set({ anaChatId: chat, codigo: null }, { merge: true })
        await db().doc('config/estudio').set({ telegramAna: true }, { merge: true })
        await telegram(chat, `Pronto, ${esc(primeiroNome(msg.from?.first_name || ''))}! ✨\nA partir de agora eu te aviso aqui de cada agendamento e cancelamento feito pelo site, e todo fim de tarde mando a agenda do dia seguinte.`)
      }
    } else if (comando === '/start' && arg.startsWith('ag_')) {
      const ag = await lerDoc(`agendamentos/${arg.slice(3)}`)
      if (!ag?.clienteId) {
        await telegram(chat, `Não encontrei esse agendamento. Confira em ${SITE}`)
      } else {
        await db().doc(`clientes/${ag.clienteId}`).set({ telegramChatId: chat }, { merge: true })
        await telegram(
          chat,
          `Oi, ${esc(primeiroNome(ag.clienteNome))}! 💖 Lembretes ativados.\n\nSeu horário: <b>${dataLonga(ag.data)}, ${ag.hora} às ${horaFim(ag)}</b>\n${esc(ag.servicoNomes)}\n\nVou te lembrar na véspera. Para parar de receber, mande /parar.`
        )
      }
    } else if (comando === '/parar') {
      const s = await db().collection('clientes').where('telegramChatId', '==', chat).get()
      await Promise.all(s.docs.map((d) => d.ref.update({ telegramChatId: null })))
      await telegram(chat, 'Combinado, não vou mais mandar lembretes. Para voltar, toque no link de lembrete do seu próximo agendamento.')
    } else {
      await telegram(chat, `Oi! Sou o assistente do estúdio Laura Célvio ✨\nPara agendar ou ver seus horários: ${SITE}`)
    }
  } catch (e) {
    console.error(e)
  }
  res.status(200).end()
}
