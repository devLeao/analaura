import { Instagram } from '../ui/Icones'
import { LogoCompleto } from '../ui/Logo'
import { useStore } from '../../store/Store'

// Capa num fundo único cinza claro (fundo de estúdio): logo e texto à esquerda,
// a luva preta com os pincéis saindo da borda de baixo, à direita.
export default function Hero() {
  const { config } = useStore().db

  return (
    <section
      id="inicio"
      className="tema-claro relative min-h-[100svh] overflow-hidden text-neutral-900 bg-[radial-gradient(ellipse_at_70%_40%,#f2f2f2_0%,#dcdcdc_45%,#c4c4c4_100%)]"
    >
      {/* Luva: embaixo à direita, encostada na borda de baixo */}
      <div className="absolute bottom-0 right-0 lg:right-[4%] h-[46svh] sm:h-[55svh] lg:h-[88%] w-full lg:w-[52%] flex justify-center lg:justify-end items-end pointer-events-none">
        <img
          src="/img/luva-pinceis.webp"
          alt="Mão com luva preta segurando pincéis de cílios"
          className="h-full w-auto max-w-none drop-shadow-[0_30px_40px_rgba(0,0,0,0.25)] animate-fade-up"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 min-h-[100svh] flex items-start lg:items-center pt-24 pb-[48svh] sm:pb-[57svh] lg:py-28">
        <div className="w-full lg:w-[46%] text-center lg:text-left animate-fade-up">
          <LogoCompleto claro={false} className="w-44 sm:w-56 mx-auto lg:mx-0" />

          <h1 className="font-display font-light leading-[0.95] text-[3rem] sm:text-7xl xl:text-[5rem] mt-8 lg:mt-10">
            Do natural <br />
            <span className="italic">ao marcante.</span>
          </h1>

          <div className="h-px w-20 bg-neutral-900/30 my-7 mx-auto lg:mx-0" />

          <p className="text-neutral-700 text-[17px] font-light leading-relaxed max-w-md mx-auto lg:mx-0">
            {config.frase} Técnicas personalizadas para um resultado que combina com você.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <a href="#agendar" className="btn bg-neutral-900 text-white hover:bg-black">Agendar horário</a>
            <a href="#servicos" className="btn border border-neutral-900/30 text-neutral-900 hover:border-neutral-900">Ver serviços</a>
          </div>

          <a href={`https://www.instagram.com/${config.instagram}`} target="_blank" rel="noreferrer" className="hidden lg:inline-flex items-center gap-2 mt-9 font-label uppercase tracking-[0.3em] text-[11px] text-neutral-600 hover:text-neutral-900 transition-colors">
            <Instagram size={14} /> @{config.instagram}
          </a>
        </div>
      </div>
    </section>
  )
}
