/**
 * Links para a cliente salvar o horário na própria agenda e receber lembretes.
 * Usado no site e também no servidor (api/), por isso não importa nada.
 */

export const BOT_TELEGRAM = 'LauraCelvioBot'

const pad = (n) => String(n).padStart(2, '0')
const somarMin = (hora, min) => {
  const [h, m] = hora.split(':').map(Number)
  const t = h * 60 + m + min
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`
}

/** Brasília não tem horário de verão desde 2019: UTC-3 fixo. */
const utc = (data, hora) => {
  const [a, mes, d] = data.split('-').map(Number)
  const [h, m] = hora.split(':').map(Number)
  return new Date(Date.UTC(a, mes - 1, d, h + 3, m)).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

const titulo = (ag, config) => `${config?.marca || 'Laura Célvio'} · ${ag.servicoNomes}`
const local = (config) => [config?.endereco, config?.cidade].filter(Boolean).join(', ')
const detalhes = (ag, config) =>
  [
    `${ag.servicoNomes}`,
    `Chegue no horário: tolerância de 10 minutos.`,
    `Venha sem maquiagem nos olhos.`,
    config?.whatsapp ? `WhatsApp: https://wa.me/${config.whatsapp}` : '',
  ]
    .filter(Boolean)
    .join('\n')

/** Abre o Google Agenda com o evento já preenchido (a cliente só toca em Salvar). */
export function linkGoogleAgenda(ag, config) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo(ag, config),
    dates: `${utc(ag.data, ag.hora)}/${utc(ag.data, somarMin(ag.hora, ag.duracao))}`,
    details: detalhes(ag, config),
    location: local(config),
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

/** Arquivo .ics (iPhone e outros apps de agenda), com alarme na véspera e 2h antes. */
export function icsDe(ag, config) {
  const esc = (t) => String(t).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Laura Celvio//Agendamento//PT',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${ag.id}@lauracelvio`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${utc(ag.data, ag.hora)}`,
    `DTEND:${utc(ag.data, somarMin(ag.hora, ag.duracao))}`,
    `SUMMARY:${esc(titulo(ag, config))}`,
    `DESCRIPTION:${esc(detalhes(ag, config))}`,
    `LOCATION:${esc(local(config))}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Amanhã tem horário no estúdio',
    'TRIGGER:-P1D',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Seu horário é daqui a 2 horas',
    'TRIGGER:-PT2H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export const linkIcs = (ag, config) => `data:text/calendar;charset=utf-8,${encodeURIComponent(icsDe(ag, config))}`

/** Abre o bot já ligado a este agendamento: a cliente só aperta "Iniciar". */
export const linkTelegram = (ag) => `https://t.me/${BOT_TELEGRAM}?start=ag_${ag.id}`

export const horaFim = (ag) => somarMin(ag.hora, ag.duracao)
