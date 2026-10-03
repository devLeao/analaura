import { CheckCircle2, XCircle, Clock3, Ban, Lock, Inbox, Hourglass, CalendarCheck } from 'lucide-react'
import { iniciais } from '../../lib/format'

export function Cabecalho({ titulo, sub, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-4xl font-semibold text-cacau-900 leading-tight">{titulo}</h1>
        {sub && <p className="text-sm text-cacau-500 mt-1">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

/** Variação vs período anterior. `menorMelhor` inverte a cor (ex.: faltas). */
export function Delta({ v, menorMelhor = false }) {
  if (v == null || !isFinite(v)) return <span className="text-cacau-500">sem comparação</span>
  const bom = menorMelhor ? v <= 0 : v >= 0
  const seta = v > 0 ? '↑' : v < 0 ? '↓' : '→'
  return (
    <span className={bom ? 'text-emerald-700' : 'text-red-600'}>
      {seta} {Math.abs(Math.round(v * 100))}% <span className="text-cacau-500">vs. anterior</span>
    </span>
  )
}

const TONS = {
  neutro: 'text-blush-700 bg-blush-100',
  bom: 'text-emerald-700 bg-emerald-50',
  alerta: 'text-amber-700 bg-amber-50',
  critico: 'text-red-600 bg-red-50',
  info: 'text-violet-700 bg-violet-50',
}

export function Kpi({ icone: Icone, rotulo, valor, detalhe, tom = 'neutro' }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="text-xs sm:text-sm text-cacau-500">{rotulo}</span>
        {Icone && <span className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${TONS[tom]}`}><Icone size={15} /></span>}
      </div>
      <div className="text-xl sm:text-2xl font-semibold text-cacau-900 tracking-tight tabular-nums">{valor}</div>
      {detalhe && <div className="text-xs text-cacau-500 mt-1">{detalhe}</div>}
    </div>
  )
}

export const STATUS = {
  aguardando_sinal: { txt: 'Aguardando sinal', icone: Hourglass, cls: 'text-amber-800 bg-amber-50 border-amber-200', barra: 'bg-amber-400' },
  confirmado: { txt: 'Confirmado', icone: CalendarCheck, cls: 'text-violet-800 bg-violet-50 border-violet-200', barra: 'bg-violet-400' },
  concluido: { txt: 'Concluído', icone: CheckCircle2, cls: 'text-emerald-800 bg-emerald-50 border-emerald-200', barra: 'bg-emerald-400' },
  cancelado: { txt: 'Cancelado', icone: Ban, cls: 'text-cacau-600 bg-nude-100 border-nude-300', barra: 'bg-nude-300' },
  falta: { txt: 'Faltou', icone: XCircle, cls: 'text-red-700 bg-red-50 border-red-200', barra: 'bg-red-400' },
  bloqueio: { txt: 'Bloqueado', icone: Lock, cls: 'text-cacau-600 bg-nude-100 border-nude-300', barra: 'bg-nude-400' },
  aberta: { txt: 'Em aberto', icone: Clock3, cls: 'text-amber-800 bg-amber-50 border-amber-200' },
  paga: { txt: 'Paga', icone: CheckCircle2, cls: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  perdoada: { txt: 'Perdoada', icone: Ban, cls: 'text-cacau-600 bg-nude-100 border-nude-300' },
}

export function Status({ s }) {
  const st = STATUS[s] || STATUS.confirmado
  const Icone = st.icone
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${st.cls}`}>
      <Icone size={12} /> {st.txt}
    </span>
  )
}

/** Etiqueta pequena e neutra (ex.: "Débito", "pelo site"). */
export const Etiqueta = ({ children, cls = 'text-cacau-600 bg-nude-100 border-nude-300' }) => (
  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap ${cls}`}>{children}</span>
)

export function Vazio({ texto, icone: Icone = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icone size={28} className="text-nude-400 mb-3" />
      <p className="text-sm text-cacau-500">{texto}</p>
    </div>
  )
}

export function Abas({ abas, valor, onChange }) {
  return (
    <div className="inline-flex bg-white border border-nude-200 rounded-full p-1 gap-1 overflow-x-auto max-w-full scrollbar-thin">
      {abas.map(([id, nome, n]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors cursor-pointer ${valor === id ? 'bg-cacau-900 text-nude-50' : 'text-cacau-600 hover:text-cacau-900 hover:bg-nude-100'}`}
        >
          {nome}
          {n != null && <span className={`ml-1.5 text-xs ${valor === id ? 'text-nude-300' : 'text-cacau-500'}`}>{n}</span>}
        </button>
      ))}
    </div>
  )
}

export const Botao = ({ variante = 'sec', className = '', ...p }) => {
  const v = {
    pri: 'bg-cacau-900 text-nude-50 hover:bg-blush-700 font-medium',
    blush: 'bg-blush-600 text-white hover:bg-blush-700 font-medium',
    sec: 'bg-white border border-nude-300 text-cacau-800 hover:border-blush-400 hover:text-blush-700',
    perigo: 'bg-red-600 text-white hover:bg-red-700 font-medium',
    ok: 'bg-emerald-600 text-white hover:bg-emerald-700 font-medium',
    fantasma: 'text-cacau-600 hover:bg-nude-100 hover:text-cacau-900',
  }
  return (
    <button
      {...p}
      className={`inline-flex items-center justify-center gap-2 text-sm px-4 py-2 rounded-full transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${v[variante]} ${className}`}
    />
  )
}

const CORES_AVATAR = ['bg-blush-100 text-blush-700', 'bg-violet-50 text-violet-700', 'bg-amber-50 text-amber-800', 'bg-emerald-50 text-emerald-800', 'bg-sky-50 text-sky-800', 'bg-nude-200 text-cacau-700']

export function Avatar({ nome, className = '' }) {
  const cor = CORES_AVATAR[[...(nome || '?')].reduce((s, ch) => s + ch.charCodeAt(0), 0) % CORES_AVATAR.length]
  return (
    <span className={`h-9 w-9 shrink-0 rounded-full ${cor} text-xs font-semibold flex items-center justify-center ${className}`}>{iniciais(nome || '?')}</span>
  )
}

export function Toggle({ ligado, onChange, rotulo }) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        onClick={() => onChange(!ligado)}
        className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${ligado ? 'bg-blush-600' : 'bg-nude-300'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${ligado ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
      {rotulo && <span className="text-sm text-cacau-800">{rotulo}</span>}
    </label>
  )
}

export const Secao = ({ titulo, sub, icone: Icone, acao, children, className = '' }) => (
  <section className={`card p-5 ${className}`}>
    {(titulo || acao) && (
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-cacau-900 flex items-center gap-2">{Icone && <Icone size={16} className="text-blush-600" />}{titulo}</h3>
          {sub && <p className="text-xs text-cacau-500 mt-0.5">{sub}</p>}
        </div>
        {acao}
      </div>
    )}
    {children}
  </section>
)

export const Campo = ({ rotulo, dica, children, className = '' }) => (
  <div className={className}>
    <label className="label">{rotulo}</label>
    {children}
    {dica && <p className="text-[11px] text-cacau-500 mt-1">{dica}</p>}
  </div>
)
