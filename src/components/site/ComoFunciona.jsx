import { Sparkles, CalendarDays, LogIn, HeartHandshake, Check, X } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'
import { brl, multaDe } from '../../lib/format'
import { useStore } from '../../store/Store'

export default function ComoFunciona() {
  const { db } = useStore()
  const { config } = db
  const PASSOS = [
    [Sparkles, 'Escolha o modelo', 'Cílios (aplicação ou manutenção), sobrancelha ou os dois juntos.'],
    [LogIn, 'Entre com o Google', 'Rapidinho, só para a gente saber quem é você.'],
    [CalendarDays, 'Dia e horário', 'Veja a agenda em tempo real e escolha o melhor para você.'],
    [HeartHandshake, 'Pronto!', 'Horário confirmado na hora. O pagamento é no dia do atendimento.'],
  ]
  // Exemplo com um modelo do catálogo (preço vem do painel)
  const ex = db.servicos.find((s) => s.id === 'glamour') || db.servicos[0]

  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-cacau-900 text-nude-100 grain">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <TituloSecao escuro sobre="Agendamento" titulo="Como funciona">
          Sem complicação: você agenda pelo site e paga só no dia, depois do atendimento.
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

        {/* Política de cancelamento: A CONFIRMAR com a Ana */}
        <div className="mt-16 grid md:grid-cols-[1fr_1.4fr] gap-0 rounded-3xl overflow-hidden border border-cacau-700">
          <div className="bg-blush-600 text-white p-8 flex flex-col justify-center">
            <p className="font-label uppercase tracking-[0.3em] text-[11px] text-blush-100">Exemplo</p>
            <p className="font-display text-2xl mt-2">{ex.nome} · {brl(ex.preco)}</p>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between border-b border-white/25 pb-2"><span>Compareceu</span><strong>paga {brl(ex.preco)} no dia</strong></div>
              <div className="flex justify-between"><span>Faltou sem avisar</span><strong>multa de {brl(multaDe(ex.preco, config.multaPct))}</strong></div>
            </div>
          </div>
          <div className="bg-cacau-800 p-8">
            <h3 className="font-label uppercase tracking-[0.25em] text-blush-300 text-sm mb-5">Combinados</h3>
            <ul className="space-y-3 text-sm">
              <Regra ok>Nada é cobrado para agendar: você <strong className="text-nude-50">paga no dia</strong>, no Pix, cartão ou dinheiro.</Regra>
              <Regra ok>Precisa desmarcar? Cancele em "Meus horários" até <strong className="text-nude-50">{config.antecedenciaCancelHoras}h antes</strong>, sem custo.</Regra>
              <Regra>Falta sem aviso gera multa de <strong className="text-nude-50">{config.multaPct}% do valor</strong>, paga antes do próximo agendamento.</Regra>
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
