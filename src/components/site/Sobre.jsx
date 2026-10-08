import { Coffee, Music2, ShieldCheck, HeartHandshake } from 'lucide-react'

const MIMOS = [
  [HeartHandshake, 'Atendimento com calma, carinho e atenção'],
  [ShieldCheck, 'Materiais higienizados e descartáveis'],
  [Coffee, 'Um cappuccino enquanto você relaxa'],
  [Music2, 'Maca confortável e playlist calma'],
]

export default function Sobre() {
  return (
    <section id="sobre" className="relative bg-nude-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-end pt-20 lg:pt-28">
        {/* Foto recortada da Ana na frente do nome gigante em contorno (efeito capa de revista) */}
        <div className="relative flex justify-center">
          <div className="absolute inset-x-0 top-6 sm:top-10 flex flex-col items-center font-display font-medium uppercase leading-[0.82] [--traco:rgba(255,255,255,0.22)] select-none pointer-events-none" aria-hidden="true">
            <span className="contorno text-[24vw] lg:text-[11rem]">Laura</span>
            <span className="contorno text-[24vw] lg:text-[11rem]">Célvio</span>
          </div>
          <img src="/img/ana-recorte.webp" alt="Ana Laura, lash designer" loading="lazy" className="relative w-[85%] sm:w-[70%] lg:w-full max-w-md object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-nude-50 to-transparent" />
        </div>

        <div className="pb-20 lg:pb-28">
          <p className="font-label uppercase tracking-[0.4em] text-blush-600 text-xs mb-4">Prazer, eu sou a</p>
          <h2 className="font-display font-light text-6xl md:text-8xl text-cacau-900 leading-[0.95]">
            Ana <span className="italic">Laura</span>
          </h2>
          <div className="h-px w-24 bg-cacau-900/30 my-8" />
          <div className="space-y-4 text-cacau-600 leading-relaxed text-[17px]">
            <p>
              Amo trabalhar com beleza e, principalmente, com os <strong className="text-cacau-900 font-medium">detalhes</strong> que fazem você se sentir ainda mais bonita.
            </p>
            <p>Cada atendimento é feito com calma, carinho e atenção, para que você se sinta bem do começo ao fim.</p>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-4 mt-10">
            {MIMOS.map(([Icone, txt]) => (
              <li key={txt} className="flex items-center gap-3 text-sm text-cacau-700">
                <span className="h-10 w-10 shrink-0 rounded-full border border-nude-300 flex items-center justify-center text-cacau-900"><Icone size={17} strokeWidth={1.5} /></span>
                {txt}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
