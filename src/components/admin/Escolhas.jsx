import { useStore } from '../../store/Store'
import { CATEGORIAS } from '../../data/seed'
import { brl } from '../../lib/format'

/** Escolha de serviços agrupada por categoria (usada no encaixe e na edição). */
export function EscolhaServicos({ sel, onChange }) {
  const { db } = useStore()
  const servicos = db.servicos.slice().sort((a, b) => a.ordem - b.ordem)
  return (
    <div className="space-y-3">
      {CATEGORIAS.map(([cat, nome]) => (
        <div key={cat}>
          <p className="text-[11px] text-cacau-500 mb-1.5">{nome}</p>
          <div className="flex flex-wrap gap-1.5">
            {servicos.filter((s) => s.categoria === cat).map((s) => {
              const on = sel.includes(s.id)
              return (
                <button key={s.id} onClick={() => onChange(on ? sel.filter((x) => x !== s.id) : [...sel, s.id])}
                  className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors ${on ? 'bg-cacau-900 text-nude-50 border-cacau-900' : 'border-nude-300 text-cacau-700 hover:border-blush-400'} ${s.ativo ? '' : 'opacity-60'}`}>
                  {s.nome} <span className="opacity-70">· {brl(s.preco)}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Escolhas lado a lado em "pílulas" (forma de pagamento, destino do sinal...). */
export const Pilulas = ({ opcoes, valor, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {opcoes.map(([v, nome]) => (
      <button key={v} onClick={() => onChange(v)}
        className={`px-3.5 py-1.5 rounded-full text-sm border cursor-pointer ${valor === v ? 'bg-cacau-900 text-nude-50 border-cacau-900' : 'border-nude-300 text-cacau-700 hover:border-blush-400'}`}>
        {nome}
      </button>
    ))}
  </div>
)
