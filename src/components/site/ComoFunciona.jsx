import { Sparkles, CalendarDays, QrCode, HeartHandshake, Check, X } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'
import { brl, sinalDe } from '../../lib/format'
import { useStore } from '../../store/Store'

export default function ComoFunciona() {
  const { db } = useStore()
  const { config } = db
  const PASSOS = [
    [Sparkles, 'Escolha o estilo', 'Cílios, sobrancelha ou os dois no mesmo horário.'],
    [CalendarDays, 'Dia e horário', 'Entre com sua conta Google e veja a agenda em tempo real.'],
    [QrCode, `Sinal de ${config.sinalPct}% no Pix`, `O horário fica segurado por ${config.reservaMin} minutos enquanto você paga.`],
    [HeartHandshake, 'Horário garantido', 'O restante você paga no dia do atendimento.'],
  ]
  // Exemplo com o serviço mais procurado (preço vem do painel)
  const ex = db.servicos.find((s) => s.id === 'brasileiro') || db.servicos[0]
  const exSinal = sinalDe(ex.preco, config.sinalPct)
  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-cacau-900 text-nude-100 grain">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <TituloSecao escuro sobre="Agendamento" titulo="Como funciona">
          Para garantir o seu horário (e o de todas as clientes), a reserva só é confirmada com o sinal.
        </TituloSecao>

        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative">
          <span className="hidden lg:block absolute top-7 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-blush-500/50 to-transparent" aria-hidden="true" />
          {PASSOS.map(([Icone, titulo, texto], i) => (
            <li key={titulo} className="relative text-center">
              <span className="relative mx-auto h-14 w-14 rounded-full bg-cacau-800 border border-blush-500/50 text-blush-300 flex items-center justify-center">
                <Icone size={22} />
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blush-500 text-white text-[11px] font-label flex items-center justify-center">{i + 1}</span>
              </span>
              <h3 className="font-display text-2xl text-nude-50 font-semibold mt-5">{titulo}</h3>
              <p className="text-sm text-nude-300 mt-2 max-w-[15rem] mx-auto leading-relaxed">{texto}</p>
            </li>
          ))}
        </ol>

        {/* Política do sinal: A CONFIRMAR com a Ana */}
        <div className="mt-16 grid md:grid-cols-[1fr_1.4fr] gap-0 rounded-3xl overflow-hidden border border-cacau-700">
          <div className="bg-blush-600 text-white p-8 flex flex-col justify-center">
            <p className="font-label uppercase tracking-[0.3em] text-[11px] text-blush-100">Exemplo</p>
            <p className="font-display text-2xl mt-2">{ex.nome} · {brl(ex.preco)}</p>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between border-b border-white/25 pb-2"><span>Sinal no Pix ({config.sinalPct}%)</span><strong>{brl(exSinal)}</strong></div>
              <div className="flex justify-between"><span>No dia do atendimento</span><strong>{brl(ex.preco - exSinal)}</strong></div>
            </div>
          </div>
          <div className="bg-cacau-800 p-8">
            <h3 className="font-label uppercase tracking-[0.25em] text-blush-300 text-sm mb-5">Regrinhas do sinal</h3>
            <ul className="space-y-3 text-sm">
              <Regra ok>O sinal é <strong className="text-nude-50">descontado do valor total</strong> — não é taxa extra.</Regra>
              <Regra ok>Cancelou com <strong className="text-nude-50">{config.remarcarHoras}h de antecedência</strong>? O sinal vira crédito e já paga o próximo horário.</Regra>
              <Regra>Falta ou cancelamento em cima da hora: o sinal não é devolvido.</Regra>
              <Regra>Atraso acima de 15 minutos pode reduzir o serviço ou exigir remarcação.</Regra>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

const Regra = ({ ok = false, children }) => (
  <li className="flex gap-3 text-nude-300">
    <span className={`h-5 w-5 shrink-0 rounded-full flex items-center justify-center mt-0.5 ${ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-blush-500/15 text-blush-300'}`}>
      {ok ? <Check size={12} /> : <X size={12} />}
    </span>
    <span>{children}</span>
  </li>
)
