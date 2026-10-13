import { Instagram } from '../ui/Icones'
import { LogoCompleto } from '../ui/Logo'
import { useStore } from '../../store/Store'

// Capa num fundo único cinza claro (fundo de estúdio).
// Computador: logo e texto à esquerda, polaroides à direita.
// Celular: polaroides grandes no topo, saindo pelas bordas, e o texto logo abaixo.
export default function Hero() {
  const { config } = useStore().db

  return (
    <section
      id="inicio"
      className="tema-claro relative min-h-[100svh] overflow-hidden text-neutral-900 bg-[radial-gradient(ellipse_at_70%_40%,#f2f2f2_0%,#dcdcdc_45%,#c4c4c4_100%)]"
    >
      {/* Polaroides no computador, fixas à direita (no celular ficam entre o título e o texto) */}
      <div className="hidden lg:flex absolute inset-y-0 right-[3%] w-[52%] pt-16 justify-end items-center pointer-events-none">
        <img
          src="/img/polaroides.webp"
          alt="Polaroides com fotos de cílios e sobrancelhas"
          className="h-[82%] w-auto max-w-none drop-shadow-[0_30px_40px_rgba(0,0,0,0.25)] animate-fade-up"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:min-h-[100svh] flex items-start lg:items-center pt-24 pb-16 lg:py-28">
        <div className="w-full lg:w-[46%] text-center lg:text-left animate-fade-up">
          <LogoCompleto claro={false} className="w-36 sm:w-48 lg:w-56 mx-auto lg:mx-0" />

          <h1 className="font-display font-light italic leading-[0.95] text-[3rem] sm:text-7xl xl:text-[5rem] mt-6 lg:mt-10">
            Do natural <br />
            ao marcante.
          </h1>

          {/* Celular: polaroides entre o título e o texto, sem cobrir o logo */}
          <img
            src="/img/polaroides.webp"
            alt="Polaroides com fotos de cílios e sobrancelhas"
            className="lg:hidden w-[78%] max-w-sm mx-auto mt-8 drop-shadow-[0_20px_30px_rgba(0,0,0,0.2)]"
          />

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
