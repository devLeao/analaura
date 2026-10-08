import { Droplets, Ban, Sparkles, CalendarClock, EyeOff, Hand } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'

const ANTES = [
  [EyeOff, 'Venha sem maquiagem nos olhos e sem lentes de contato.'],
  [CalendarClock, 'Chegue no horário: a aplicação leva de 1h30 a 3h.'],
  [Sparkles, 'Evite cafeína em excesso: ajuda a relaxar de olhos fechados.'],
]

const DEPOIS = [
  [Droplets, 'Não molhe os cílios nas primeiras 24 horas.'],
  [Ban, 'Evite demaquilantes oleosos, rímel e curvex.'],
  [Hand, 'Não esfregue os olhos; penteie os fios todo dia com a escovinha.'],
  [CalendarClock, 'Faça a manutenção no prazo do seu modelo (de 15 a 21 dias).'],
]

export default function Cuidados() {
  return (
    <section id="cuidados" className="relative py-24 md:py-32 bg-nude-50 overflow-hidden">
      {/* Olho com cílios na lateral direita: as bordas somem no fundo (esquerda e topo) para esconder o recorte */}
      <img
        src="/img/olho-cilios.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="hidden lg:block absolute right-0 bottom-0 h-full w-auto max-w-[50%] object-cover object-[left_bottom] opacity-55 grayscale"
        style={{
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 45%), linear-gradient(to bottom, transparent 0%, black 35%)',
          WebkitMaskComposite: 'source-in',
          maskImage: 'linear-gradient(to right, transparent 0%, black 45%), linear-gradient(to bottom, transparent 0%, black 35%)',
          maskComposite: 'intersect',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="lg:max-w-[62%]">
          <TituloSecao sobre="Para durar mais" titulo="Cuidados" />
          <div className="grid md:grid-cols-2 gap-6">
            <Lista titulo="Antes de vir" itens={ANTES} />
            <Lista titulo="Depois da aplicação" itens={DEPOIS} />
          </div>
        </div>
      </div>
    </section>
  )
}

const Lista = ({ titulo, itens }) => (
  <div className="rounded-3xl p-7 border bg-superficie/80 backdrop-blur border-nude-200">
    <h3 className="font-display text-3xl text-cacau-900 mb-5">{titulo}</h3>
    <ul className="space-y-4">
      {itens.map(([Icone, txt]) => (
        <li key={txt} className="flex gap-3 text-sm text-cacau-700 leading-relaxed">
          <span className="h-8 w-8 shrink-0 rounded-full border border-nude-300 text-cacau-900 flex items-center justify-center"><Icone size={15} strokeWidth={1.6} /></span>
          <span className="pt-1.5">{txt}</span>
        </li>
      ))}
    </ul>
  </div>
)
