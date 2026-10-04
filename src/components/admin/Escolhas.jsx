import SeletorServicos from '../ui/SeletorServicos'
import { useStore } from '../../store/Store'

/** Escolha de serviços no painel (mesmo seletor do site, em versão compacta e com os ocultos). */
export function EscolhaServicos({ sel, onChange }) {
  const { db } = useStore()
  const servicos = db.servicos.slice().sort((a, b) => a.ordem - b.ordem)
  return <SeletorServicos servicos={servicos} sel={sel} onChange={onChange} compacto />
}

/** Escolhas lado a lado em "pílulas" (forma de pagamento, curvatura...). */
export const Pilulas = ({ opcoes, valor, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {opcoes.map(([v, nome]) => (
      <button key={v} type="button" onClick={() => onChange(v)}
        className={`px-3.5 py-1.5 rounded-full text-sm border cursor-pointer ${valor === v ? 'bg-cacau-900 text-nude-50 border-cacau-900' : 'border-nude-300 text-cacau-700 hover:border-blush-400'}`}>
        {nome}
      </button>
    ))}
  </div>
)
