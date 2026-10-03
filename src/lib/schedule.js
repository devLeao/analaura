import { toMin, fromMin, fromISO, toISO, addDays } from './format'

/** Status que ocupam espaço na agenda. Falta e cancelado liberam o horário. */
export const STATUS_OCUPA = ['aguardando_sinal', 'confirmado', 'concluido', 'bloqueio']

/** Reserva esperando o Pix do sinal que já passou do prazo não segura mais o horário. */
export const reservaExpirada = (a, agora = Date.now()) => a.status === 'aguardando_sinal' && a.expiraEm && a.expiraEm < agora

export const ocupaAgenda = (a) => STATUS_OCUPA.includes(a.status) && !reservaExpirada(a)

/** Lista de horários de início possíveis num dia, respeitando o almoço. */
export function gerarSlots(config) {
  const slots = []
  const fecha = toMin(config.fecha)
  const almocoIni = toMin(config.almocoInicio)
  const almocoFim = toMin(config.almocoFim)
  let t = toMin(config.abre)
  while (t < fecha) {
    if (t >= almocoIni && t < almocoFim) t = almocoFim
    if (t >= fecha) break
    slots.push(fromMin(t))
    t += config.slotMin
  }
  return slots
}

export const diaAberto = (config, iso) => config.diasAbertos.includes(fromISO(iso).getDay())

/** Intervalos ocupados [ini, fim] em minutos num dia. `ignorarId` deixa de fora um agendamento (ex.: ao editar). */
export function intervalosOcupados(agendamentos, iso, ignorarId = null) {
  return agendamentos
    .filter((a) => a.data === iso && a.id !== ignorarId && ocupaAgenda(a))
    .map((a) => (a.diaInteiro ? [0, 24 * 60] : [toMin(a.hora), toMin(a.hora) + a.duracao]))
}

/** `iso` = '0000-00-00' desliga a checagem de horário passado (uso no painel). */
export function slotLivre(config, hora, duracao, ocupados, iso) {
  const ini = toMin(hora)
  const fim = ini + duracao
  if (fim > toMin(config.fecha)) return false
  const almocoIni = toMin(config.almocoInicio)
  const almocoFim = toMin(config.almocoFim)
  if (ini < almocoFim && fim > almocoIni) return false
  if (ocupados.some(([a, b]) => ini < b && fim > a)) return false
  // Não deixa agendar no passado
  const agora = new Date()
  if (iso === toISO(agora) && ini <= agora.getHours() * 60 + agora.getMinutes()) return false
  return true
}

/** Próximos N dias (para o seletor de datas). */
export function proximosDias(n) {
  const out = []
  let d = new Date()
  for (let i = 0; i < n; i++, d = addDays(d, 1)) out.push(toISO(d))
  return out
}

/** Minutos até o início do agendamento (negativo se já passou). */
export function minutosAte(ag) {
  const ini = fromISO(ag.data)
  const [h, m] = ag.hora.split(':').map(Number)
  ini.setHours(h, m, 0, 0)
  return (ini - new Date()) / 60000
}
