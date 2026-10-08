import { Check, X } from 'lucide-react'
import { brl, multaDe } from '../../lib/format'
import { useStore } from '../../store/Store'

// Faixa clara ("papel") no meio do site escuro, com o pôster BROWS · LASHES ao lado.
export default function ComoFunciona() {
  const { db } = useStore()
  const { config } = db
  const PASSOS = [
    ['Escolha o modelo', 'Cílios (aplicação, manutenção ou remoção), sobrancelha ou os dois juntos.'],
    ['Entre com o Google', 'Rapidinho, só para a gente saber quem é você.'],
    ['Dia e horário', 'Veja a agenda em tempo real e escolha o melhor para você.'],
    ['Pronto!', 'Horário confirmado na hora. O pagamento é no dia do atendimento.'],
  ]
  // Exemplo com um modelo do catálogo (preço vem do painel)
  const ex = db.servicos.find((s) => s.id === 'glamour') || db.servicos[0]

  return (
    <section id="como-funciona" className="relative bg-[#ececec] text-neutral-900 overflow-hidden">
      {/* Cílios postiços pretos, decorando o canto da faixa clara */}
      <img src="/img/cilios-posticos.webp" alt="" aria-hidden="true" loading="lazy" className="hidden sm:block absolute top-16 left-[6%] lg:left-[10%] w-32 md:w-44 opacity-80 -rotate-12 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-center">
        <div className="relative hidden sm:block">
          <img src="/img/brows-lashes.webp" alt="" loading="lazy" className="w-full max-w-md mx-auto rounded-[2rem] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)]" />
          <img src="/img/pincel-gel.webp" alt="" aria-hidden="true" loading="lazy" className="absolute -bottom-10 -right-6 w-48 md:w-60 animate-flutuar [--giro:-8deg] drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]" />
        </div>

        <div>
          <p className="font-label uppercase tracking-[0.4em] text-neutral-500 text-xs mb-4">Agendamento</p>
          <h2 className="font-display font-light text-5xl md:text-7xl leading-[0.95]">Como <span className="italic">funciona</span></h2>
          <p className="mt-5 text-neutral-600 max-w-lg">Sem complicação: você agenda pelo site e paga só no dia, depois do atendimento.</p>

          <ol className="mt-10 divide-y divide-neutral-300 border-y border-neutral-300">
            {PASSOS.map(([titulo, texto], i) => (
              <li key={titulo} className="flex gap-6 py-5">
                <span className="font-display italic text-4xl text-neutral-400 w-10 shrink-0 leading-none">{i + 1}</span>
                <div>
                  <h3 className="font-label uppercase tracking-[0.2em] text-sm text-neutral-900">{titulo}</h3>
                  <p className="text-sm text-neutral-600 mt-1">{texto}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Política de cancelamento */}
          <div className="mt-10 rounded-3xl bg-black text-white p-7">
            <h3 className="font-label uppercase tracking-[0.25em] text-xs text-white/60 mb-4">Combinados</h3>
            <ul className="space-y-3 text-sm">
              <Regra ok>Nada é cobrado para agendar: você <strong className="text-white">paga no dia</strong>, no Pix, cartão ou dinheiro.</Regra>
              <Regra ok>Precisa desmarcar? Cancele em "Meus horários" até <strong className="text-white">{config.antecedenciaCancelHoras}h antes</strong>, sem custo.</Regra>
              <Regra>
                Falta sem aviso gera multa de <strong className="text-white">{config.multaPct}% do valor</strong> (ex.: {ex.nome}, {brl(ex.preco)} → {brl(multaDe(ex.preco, config.multaPct))}), paga antes do próximo agendamento.
              </Regra>
              <Regra>Atraso acima de 15 minutos pode reduzir o serviço ou exigir remarcação.</Regra>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

const Regra = ({ ok = false, children }) => (
  <li className="flex gap-3 text-white/70">
    <span className={`h-5 w-5 shrink-0 rounded-full border flex items-center justify-center mt-0.5 ${ok ? 'border-white/40 text-white' : 'border-white/20 text-white/60'}`}>
      {ok ? <Check size={11} /> : <X size={11} />}
    </span>
    <span>{children}</span>
  </li>
)
