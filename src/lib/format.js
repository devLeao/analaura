export const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

export const pad = (n) => String(n).padStart(2, '0')

/** Date -> 'YYYY-MM-DD' (horário local) */
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** 'YYYY-MM-DD' -> Date ao meio-dia local (evita problemas de fuso) */
export const fromISO = (s) => new Date(`${s}T12:00:00`)

export const addDays = (d, n) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export const hoje = () => toISO(new Date())

export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export const dataBR = (iso) => iso.split('-').reverse().join('/')
export const dataCurta = (iso) => {
  const d = fromISO(iso)
  return `${pad(d.getDate())} ${MESES_CURTOS[d.getMonth()]}`
}
export const dataLonga = (iso) => {
  const d = fromISO(iso)
  return `${DIAS[d.getDay()]}, ${pad(d.getDate())} de ${MESES_CURTOS[d.getMonth()]}`
}

export const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export const fromMin = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`

export const telefoneMask = (v) => {
  let d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length > 2) d = `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length > 10) d = `${d.slice(0, 10)}-${d.slice(10)}`
  return d
}

export const duracaoLabel = (min) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} min`
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

/** Valor da multa (porcentagem do total) arredondado para centavos. */
export const multaDe = (total, pct) => Math.round(total * pct) / 100

export const iniciais = (nome = '') =>
  nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

/** Só os dígitos do telefone, com DDI 55 (para links do WhatsApp). */
export const waNumero = (tel = '') => {
  const d = tel.replace(/\D/g, '')
  return d ? (d.startsWith('55') && d.length > 11 ? d : `55${d}`) : ''
}

export const primeiroNome = (nome = '') => nome.split(' ')[0]

/** Dias entre duas datas ISO (b - a). */
export const diasEntreISO = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000)

// DDDs que existem no Brasil
const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
])

/**
 * Confere se o celular tem formato real: DDD existente + 9 dígitos começando com 9.
 * Devolve a mensagem de erro, ou '' se estiver ok. (Não confirma que o número é da pessoa.)
 */
export const erroTelefone = (tel = '') => {
  const d = tel.replace(/\D/g, '')
  if (d.length !== 11) return 'Digite o celular com DDD: (31) 99999-9999.'
  if (!DDDS.has(Number(d.slice(0, 2)))) return 'Esse DDD não existe. Confira o número.'
  if (d[2] !== '9') return 'Celular precisa começar com 9 depois do DDD.'
  if (/^(\d)\1+$/.test(d.slice(2)) || d.slice(3) === '12345678' || d.slice(3) === '87654321') return 'Esse número não parece válido. Confira, por favor.'
  return ''
}
