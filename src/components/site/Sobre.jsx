import { Coffee, Music2, ShieldCheck, HeartHandshake } from 'lucide-react'
import Ornamento from '../ui/Ornamento'
import { FotoPlaceholder } from '../ui/Ilustracoes'
import { useStore } from '../../store/Store'

const MIMOS = [
  [HeartHandshake, 'Atendimento individual, sem pressa'],
  [ShieldCheck, 'Materiais higienizados e descartáveis'],
  [Coffee, 'Cafezinho ou chá enquanto relaxa'],
  [Music2, 'Maca confortável e playlist calma'],
]

export default function Sobre() {
  const { config } = useStore().db
  return (
    <section id="sobre" className="py-24 md:py-32 bg-nude-50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-14 md:gap-20 items-center">
        <div className="relative max-w-sm mx-auto w-full">
          <div className="absolute -inset-3 arco border border-blush-300 -translate-x-4 translate-y-4" aria-hidden="true" />
          <FotoPlaceholder legenda="Foto da Ana Laura" className="relative arco aspect-[4/5]" leque={2} />
          <div className="absolute -bottom-6 -right-2 sm:-right-8 bg-blush-600 text-white px-6 py-4 rounded-2xl shadow-xl">
            <div className="font-display text-3xl font-semibold italic leading-none">Lash designer</div>
            <div className="font-label uppercase tracking-widest text-[11px] mt-1.5 text-blush-100">& designer de sobrancelhas</div>
          </div>
        </div>
        <div>
          <p className="font-label uppercase tracking-[0.35em] text-blush-600 text-xs mb-3">Prazer, eu sou a</p>
          <h2 className="font-display text-5xl md:text-6xl font-semibold text-cacau-900">{config.marca}</h2>
          <Ornamento className="mt-5 mb-8 !justify-start" />
          <div className="space-y-4 text-cacau-600 leading-relaxed">
            {/* Texto provisório: trocar pela história real da Ana */}
            <p>
              Acredito que o cílio certo é aquele que <strong className="text-cacau-900">parece seu</strong>. Por isso cada atendimento começa
              com uma conversa: o formato do seu olho, sua rotina e o efeito que você quer — do mais natural ao mais cheio.
            </p>
            <p>Atendo uma cliente por vez, com hora marcada, para você chegar, deitar e sair renovada.</p>
          </div>
          <ul className="grid sm:grid-cols-2 gap-4 mt-8">
            {MIMOS.map(([Icone, txt]) => (
              <li key={txt} className="flex items-center gap-3 text-sm text-cacau-800">
                <span className="h-10 w-10 shrink-0 rounded-full bg-blush-100 flex items-center justify-center text-blush-600"><Icone size={18} /></span>
                {txt}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
