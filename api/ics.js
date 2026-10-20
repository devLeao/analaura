// Arquivo de agenda (.ics) de um agendamento: no iPhone abre direto "Adicionar ao Calendário".
// O id do agendamento é aleatório e só a cliente (e a Ana) o conhecem; o arquivo não leva nome nem telefone.
import { lerDoc } from './_lib/servidor.js'
import { icsDe } from '../src/lib/lembretes.js'

export default async function handler(req, res) {
  const id = String(req.query.id || '')
  const ag = /^[A-Za-z0-9]{10,40}$/.test(id) && (await lerDoc(`agendamentos/${id}`))
  if (!ag || ag.status !== 'agendado') return res.status(404).send('Horário não encontrado.')
  const config = await lerDoc('config/estudio')
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'inline; filename="horario-laura-celvio.ics"')
  res.send(icsDe(ag, config))
}
