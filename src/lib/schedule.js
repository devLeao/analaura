import { toMin, fromMin, fromISO, toISO, addDays } from './format'

/** Status que ocupam espaço na agenda. Falta e cancelado liberam o horário. */
export const STATUS_OCUPA = ['agendado', 'concluido', 'bloqueio']

export const ocupaAgenda = (a) => STATUS_OCUPA.includes(a.status)

/**
 * Horário de funcionamento de um dia da semana (0 = domingo).
 * `config.horarios` = { 2: ['08:00', '18:30'], ... }; dia sem entrada = fechado.
 */
export const horarioDaSemana = (config, diaSemana) => {
  const h = config.horarios?.[diaSemana]
  return h ? { abre: h[0], fecha: h[1] } : null
}

/** Horário de funcionamento de uma data ISO (null = fechado). */
export const horarioDo = (config, iso) => horarioDaSemana(config, fromISO(iso).getDay())

export const diaAberto = (config, iso) => !!horarioDo(config, iso)

/** Dias da semana em que o estúdio abre, de segunda a domingo. */
export const diasAbertos = (config) => [1, 2, 3, 4, 5, 6, 0].filter((d) => horarioDaSemana(config, d))

/** Pausa de almoço é opcional: só vale se início e fim estiverem preenchidos. */
export const almocoDe = (config) =>
  config.almocoInicio && config.almocoFim && toMin(config.almocoFim) > toMin(config.almocoInicio)
    ? [toMin(config.almocoInicio), toMin(config.almocoFim)]
    : null

/** Lista de horários de início possíveis num dia, respeitando o almoço (se houver). */
export function gerarSlots(config, iso) {
  const h = horarioDo(config, iso)
  if (!h) return []
  const slots = []
  const fecha = toMin(h.fecha)
  const almoco = almocoDe(config)
  let t = toMin(h.abre)
  while (t < fecha) {
    if (almoco && t >= almoco[0] && t < almoco[1]) t = almoco[1]
    if (t >= fecha) break
    slots.push(fromMin(t))
    t += config.slotMin
  }
  return slots
}

/** Intervalos ocupados [ini, fim] em minutos num dia. `ignorarId` deixa de fora um agendamento (ex.: ao editar). */
export function intervalosOcupados(agendamentos, iso, ignorarId = null) {
  return agendamentos
    .filter((a) => a.data === iso && a.id !== ignorarId && ocupaAgenda(a))
    .map((a) => (a.diaInteiro ? [0, 24 * 60] : [toMin(a.hora), toMin(a.hora) + a.duracao]))
}

/**
 * O serviço inteiro (de `hora` até `hora + duracao`) cabe nesse dia?
 * `permitirPassado` = true no painel (a Ana pode registrar algo que já aconteceu).
 */
export function slotLivre(config, iso, hora, duracao, ocupados, permitirPassado = false) {
  const h = horarioDo(config, iso)
  if (!h) return false
  const ini = toMin(hora)
  const fim = ini + duracao
  if (ini < toMin(h.abre) || fim > toMin(h.fecha)) return false
  const almoco = almocoDe(config)
  if (almoco && ini < almoco[1] && fim > almoco[0]) return false
  if (ocupados.some(([a, b]) => ini < b && fim > a)) return false
  // Não deixa agendar no passado
  const agora = new Date()
  if (!permitirPassado && iso === toISO(agora) && ini <= agora.getHours() * 60 + agora.getMinutes()) return false
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
