import { Droplets, Ban, Sparkles, CalendarClock, EyeOff, Hand } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'

const ANTES = [
  [EyeOff, 'Venha sem maquiagem nos olhos e sem lentes de contato.'],
  [CalendarClock, 'Chegue no horário: a aplicação leva de 1h a 2h30.'],
  [Sparkles, 'Evite cafeína em excesso — ajuda a relaxar de olhos fechados.'],
]

const DEPOIS = [
  [Droplets, 'Não molhe os cílios nas primeiras 24 horas.'],
  [Ban, 'Evite demaquilantes oleosos, rímel e curvex.'],
  [Hand, 'Não esfregue os olhos; penteie os fios todo dia com a escovinha.'],
  [CalendarClock, 'Faça a manutenção a cada 15 a 21 dias.'],
]

export default function Cuidados() {
  return (
    <section id="cuidados" className="py-24 md:py-32 bg-nude-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <TituloSecao sobre="Para durar mais" titulo="Cuidados" />
        <div className="grid md:grid-cols-2 gap-6">
          <Lista titulo="Antes de vir" itens={ANTES} />
          <Lista titulo="Depois da aplicação" itens={DEPOIS} destaque />
        </div>
      </div>
    </section>
  )
}

const Lista = ({ titulo, itens, destaque = false }) => (
  <div className={`rounded-3xl p-7 border ${destaque ? 'bg-blush-100/60 border-blush-200' : 'bg-white border-nude-200'}`}>
    <h3 className="font-display text-3xl font-semibold text-cacau-900 mb-5">{titulo}</h3>
    <ul className="space-y-4">
      {itens.map(([Icone, txt]) => (
        <li key={txt} className="flex gap-3 text-sm text-cacau-700 leading-relaxed">
          <span className="h-8 w-8 shrink-0 rounded-full bg-white border border-nude-200 text-blush-600 flex items-center justify-center"><Icone size={15} /></span>
          <span className="pt-1.5">{txt}</span>
        </li>
      ))}
    </ul>
  </div>
)
