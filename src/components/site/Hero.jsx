import { ChevronDown, CalendarCheck2, Sparkles } from 'lucide-react'
import Ornamento from '../ui/Ornamento'
import { Olho } from '../ui/Ilustracoes'

export default function Hero() {
  return (
    <section id="inicio" className="relative min-h-[100svh] flex items-center overflow-hidden bg-gradient-to-b from-blush-100/70 via-nude-50 to-nude-50 grain">
      <div className="absolute -top-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-blush-200/50 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-nude-200/70 blur-3xl" aria-hidden="true" />

      <div className="relative max-w-7xl w-full mx-auto px-4 sm:px-6 pt-32 pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
        <div className="text-center lg:text-left animate-fade-up">
          <p className="font-label uppercase tracking-[0.45em] text-blush-600 text-xs sm:text-sm mb-6">Extensão de cílios · Sobrancelhas</p>
          <h1 className="font-display font-semibold text-cacau-900 leading-[0.95] text-6xl sm:text-7xl md:text-8xl">
            Seu olhar, <br />
            <span className="italic text-blush-600">em evidência.</span>
          </h1>
          <Ornamento className="my-8 lg:!justify-start" />
          <p className="text-cacau-600 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Do Volume Brasileiro mais natural ao Volume Power mais marcante, em preto ou marrom: cada aplicação é pensada para o formato dos seus olhos e o seu estilo.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <a href="#agendar" className="btn-primary">Agendar horário</a>
            <a href="#servicos" className="btn-ghost">Ver modelos</a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-md animate-fade-up [animation-delay:150ms]">
          <div className="absolute -inset-3 arco border border-blush-300 translate-x-4 translate-y-4" aria-hidden="true" />
          <div className="relative arco aspect-[4/5] bg-gradient-to-b from-blush-200 via-blush-100 to-nude-100 flex items-center justify-center overflow-hidden">
            <Olho leque={3} className="w-3/4 text-cacau-800" />
            <span className="absolute bottom-4 font-label uppercase tracking-[0.3em] text-[10px] text-cacau-500">foto da cliente aqui</span>
          </div>
          <div className="absolute -left-4 sm:-left-10 top-1/4 bg-white shadow-xl shadow-blush-700/10 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-blush-100 text-blush-600 flex items-center justify-center"><Sparkles size={16} /></span>
            <div className="text-left">
              <div className="text-sm font-semibold text-cacau-900">Fios hipoalergênicos</div>
              <div className="text-xs text-cacau-500">leves e confortáveis</div>
            </div>
          </div>
          <div className="absolute -right-2 sm:-right-8 bottom-12 bg-cacau-900 text-nude-50 shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3">
            <CalendarCheck2 size={18} className="text-blush-300" />
            <div className="text-left">
              <div className="text-sm font-semibold">Agenda online</div>
              <div className="text-xs text-nude-300">reserve em 2 minutos</div>
            </div>
          </div>
        </div>
      </div>

      <a href="#sobre" className="absolute bottom-6 left-1/2 -translate-x-1/2 text-cacau-500 hover:text-blush-600 animate-bounce" aria-label="Rolar">
        <ChevronDown size={28} />
      </a>
    </section>
  )
}
