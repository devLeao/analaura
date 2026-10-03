import { useState } from 'react'
import { Clock, Plus } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'
import { Olho, Sobrancelha } from '../ui/Ilustracoes'
import { CATEGORIAS } from '../../data/seed'
import { useStore, servicosAtivos } from '../../store/Store'
import { brl, duracaoLabel } from '../../lib/format'

const VARIANTE_SOBRANCELHA = { design: 'design', 'design-henna': 'henna', 'brow-lamination': 'lamination' }

/** Régua de 5 pontos: do mais natural ao mais cheio */
export function Intensidade({ nivel, className = '' }) {
  if (nivel == null)
    return <p className={`font-label uppercase tracking-[0.2em] text-[10px] text-cacau-500 ${className}`}>Sem extensão · 100% natural</p>
  return (
    <div className={className}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= nivel ? 'bg-blush-500' : 'bg-nude-200'}`} />
        ))}
      </div>
      <div className="flex justify-between font-label uppercase tracking-[0.2em] text-[10px] text-cacau-500 mt-1.5">
        <span>Natural</span>
        <span>Cheio</span>
      </div>
    </div>
  )
}

export default function Servicos({ onEscolher }) {
  const { db } = useStore()
  const [aba, setAba] = useState('cilios')
  const servicos = servicosAtivos(db)
  const principais = servicos.filter((s) => s.categoria === aba && !s.extra)
  const extras = servicos.filter((s) => s.categoria === aba && s.extra)

  return (
    <section id="servicos" className="py-24 md:py-32 bg-nude-100 border-y border-nude-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <TituloSecao sobre="Escolha o seu efeito" titulo="Serviços">
          Mais natural ou mais cheio? Compare os estilos pelo desenho e pela régua — e, se ficar na dúvida, a Ana te ajuda a escolher no dia.
        </TituloSecao>

        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-white border border-nude-200 rounded-full p-1">
            {CATEGORIAS.map(([id, nome]) => (
              <button
                key={id}
                onClick={() => setAba(id)}
                className={`font-label uppercase tracking-[0.2em] text-xs px-6 py-2.5 rounded-full transition-colors cursor-pointer ${aba === id ? 'bg-cacau-900 text-nude-50' : 'text-cacau-600 hover:text-blush-600'}`}
              >
                {nome}
              </button>
            ))}
          </div>
        </div>

        <div key={aba} className="flex flex-wrap justify-center gap-6 animate-fade-up">
          {principais.map((s) => (
            <article key={s.id} className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] group bg-white border border-nude-200 hover:border-blush-300 hover:shadow-xl hover:shadow-blush-700/5 rounded-3xl overflow-hidden transition-all flex flex-col">
              <div className="h-40 bg-gradient-to-b from-blush-100 to-nude-50 flex items-center justify-center relative">
                {s.categoria === 'cilios'
                  ? <Olho leque={s.leque} className="w-36 text-cacau-800 group-hover:scale-110 transition-transform duration-500" />
                  : <Sobrancelha variante={VARIANTE_SOBRANCELHA[s.id] || 'design'} className="w-36 text-cacau-800 group-hover:scale-110 transition-transform duration-500" />}
                <span className="absolute top-3 right-3 flex items-center gap-1 bg-white/80 backdrop-blur px-2.5 py-1 rounded-full text-[11px] text-cacau-700 font-label tracking-wider">
                  <Clock size={12} className="text-blush-600" /> {duracaoLabel(s.duracao)}
                </span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="font-label uppercase tracking-[0.25em] text-[10px] text-blush-600">{s.apelido}</p>
                <h3 className="font-display text-[1.7rem] leading-tight font-semibold text-cacau-900 mt-1">{s.nome}</h3>
                {s.categoria === 'cilios' && <Intensidade nivel={s.intensidade} className="mt-3" />}
                <p className="text-sm text-cacau-600 mt-3 flex-1 leading-relaxed">{s.desc}</p>
                <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-dashed border-nude-300">
                  <span className="font-display text-2xl font-semibold text-cacau-900">{brl(s.preco)}</span>
                  <button onClick={() => onEscolher(s.id)} className="btn-ghost !py-2 !px-4 !text-[11px] group-hover:bg-cacau-900 group-hover:text-nude-50 group-hover:border-cacau-900">
                    Agendar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {extras.length > 0 && (
          <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {extras.map((s) => (
              <div key={s.id} className="flex items-center gap-4 bg-white/60 border border-nude-200 rounded-2xl px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <h4 className="font-display text-xl font-semibold text-cacau-900">{s.nome}</h4>
                    <span className="font-label text-blush-700 whitespace-nowrap">{brl(s.preco)}</span>
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

        <p className="text-center text-xs text-cacau-500 mt-10">Valores ilustrativos do esboço · Dá para combinar cílios e sobrancelha no mesmo horário.</p>
      </div>
    </section>
  )
}
