import { useState } from 'react'
import { Clock, RefreshCw, Plus } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'
import { Olho, Sobrancelha } from '../ui/Ilustracoes'
import { useStore, servicosAtivos } from '../../store/Store'
import { prazoLabel } from '../../lib/catalogo'
import { brl, duracaoLabel } from '../../lib/format'

/** Régua de 5 pontos: do mais natural ao mais cheio */
export function Intensidade({ nivel, className = '' }) {
  if (nivel == null) return null
  return (
    <div className={className}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`h-1 flex-1 rounded-full ${n <= nivel ? 'bg-blush-500' : 'bg-nude-300'}`} />
        ))}
      </div>
      <div className="flex justify-between font-label uppercase tracking-[0.2em] text-[10px] text-cacau-500 mt-1.5">
        <span>Natural</span>
        <span>Marcante</span>
      </div>
    </div>
  )
}

/** Bolinhas das cores disponíveis */
export const Cores = ({ marrom, className = '' }) => (
  <span className={`inline-flex items-center gap-1.5 ${className}`}>
    <span className="h-3 w-3 rounded-full bg-black ring-1 ring-white/70" title="Preto" />
    {marrom && <span className="h-3 w-3 rounded-full bg-[#6b4226] ring-1 ring-white/70 -ml-2.5" title="Marrom" />}
    <span className="text-[11px] text-white/80">{marrom ? 'Preto ou marrom' : 'Preto'}</span>
  </span>
)

/** Foto real do serviço ou, se ainda não tiver, o desenho em linha. */
export function CapaServico({ s, className = '' }) {
  if (s.foto)
    return (
      <img
        src={s.foto}
        alt={s.nome}
        loading="lazy"
        className={`h-full w-full object-cover md:grayscale md:group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ${className}`}
      />
    )
  return (
    <div className="h-full w-full bg-[radial-gradient(ellipse_at_center,#262626_0%,#0f0f0f_75%)] flex items-center justify-center">
      {s.categoria === 'sobrancelhas'
        ? <Sobrancelha variante={s.desenho || 'design'} className="w-2/5 text-white/80 group-hover:scale-110 transition-transform duration-700" />
        : <Olho leque={s.leque || 1} className="w-2/5 text-white/80 group-hover:scale-110 transition-transform duration-700" />}
    </div>
  )
}

const ABAS = [
  ['cilios', 'Cílios'],
  ['sobrancelhas', 'Sobrancelhas'],
]

export default function Servicos({ onEscolher }) {
  const { db } = useStore()
  const [aba, setAba] = useState('cilios')
  const servicos = servicosAtivos(db)
  const lista = servicos.filter((s) => s.categoria === aba)
  const remocao = servicos.filter((s) => s.categoria === 'remocao')

  return (
    <section id="servicos" className="py-24 md:py-32 bg-nude-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <TituloSecao sobre="Escolha o seu efeito" titulo="Serviços">
          Do mais natural ao mais marcante: veja cada modelo, compare os efeitos pela régua de volume e encontre o estilo que mais combina com você.
        </TituloSecao>

        <div className="flex justify-center mb-10">
          <div className="inline-flex border border-nude-300 rounded-full p-1">
            {ABAS.map(([id, nome]) => (
              <button
                key={id}
                onClick={() => setAba(id)}
                className={`font-label uppercase tracking-[0.2em] text-xs px-6 py-2.5 rounded-full transition-colors cursor-pointer ${aba === id ? 'bg-cacau-900 text-nude-50' : 'text-cacau-600 hover:text-cacau-900'}`}
              >
                {nome} <span className="opacity-60">{servicos.filter((s) => s.categoria === id).length}</span>
              </button>
            ))}
          </div>
        </div>

        <div key={aba} className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-up">
          {lista.map((s) => (
            <article key={s.id} className="group bg-superficie border border-nude-200 hover:border-nude-400 rounded-3xl overflow-hidden transition-colors flex flex-col">
              <div className="relative aspect-[4/3] overflow-hidden bg-black">
                <CapaServico s={s} />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur px-2.5 py-1 rounded-full text-[11px] text-white font-label tracking-wider">
                  <Clock size={12} /> {duracaoLabel(s.duracao)}
                </span>
                {s.categoria === 'cilios' && <Cores marrom={s.marrom} className="absolute bottom-3 left-3" />}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-display text-[1.6rem] leading-tight text-cacau-900">{s.nome}</h3>
                <Intensidade nivel={s.intensidade} className="mt-3" />
                <p className="text-sm text-cacau-600 mt-3 flex-1 leading-relaxed">{s.desc}</p>

                {/* Preços: aplicação e manutenção lado a lado */}
                <div className={`mt-4 pt-4 border-t border-nude-300 grid ${s.manutencao ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                  <div>
                    <div className="text-[10px] font-label uppercase tracking-[0.2em] text-cacau-500">{s.manutencao ? 'Aplicação' : 'Valor'}</div>
                    <div className="font-display text-2xl text-cacau-900 leading-tight">{brl(s.preco)}</div>
                  </div>
                  {s.manutencao && (
                    <div className="border-l border-nude-300 pl-3">
                      <div className="text-[10px] font-label uppercase tracking-[0.2em] text-cacau-500 flex items-center gap-1"><RefreshCw size={10} /> Manutenção</div>
                      <div className="font-display text-2xl text-cacau-900 leading-tight">{brl(s.manutencao.preco)}</div>
                      <div className="text-[11px] text-cacau-500">até {prazoLabel(s.manutencao)}</div>
                    </div>
                  )}
                </div>
                <button onClick={() => onEscolher(s.id)} className="btn-ghost !py-2.5 !text-[11px] mt-4 w-full group-hover:bg-cacau-900 group-hover:text-nude-50 group-hover:border-cacau-900">
                  Agendar
                </button>
              </div>
            </article>
          ))}
        </div>

        {aba === 'cilios' && remocao.length > 0 && (
          <div className="mt-6 max-w-xl mx-auto space-y-3">
            {remocao.map((s) => (
              <div key={s.id} className="flex items-center gap-4 border border-nude-300 rounded-2xl px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <h4 className="font-display text-xl text-cacau-900">{s.nome}</h4>
                    <span className="font-label text-cacau-700 whitespace-nowrap">{brl(s.preco)}</span>
                  </div>
                  <p className="text-xs text-cacau-500 mt-0.5">{s.desc}</p>
                </div>
                <button onClick={() => onEscolher(s.id)} className="h-9 w-9 shrink-0 rounded-full border border-nude-300 text-cacau-700 hover:bg-cacau-900 hover:text-nude-50 hover:border-cacau-900 flex items-center justify-center cursor-pointer transition-colors" aria-label={`Agendar ${s.nome}`}>
                  <Plus size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-cacau-500 mt-10">Dá para combinar cílios e sobrancelha no mesmo horário. O pagamento é feito no dia do atendimento.</p>
      </div>
    </section>
  )
}
