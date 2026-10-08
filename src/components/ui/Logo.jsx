import { useStore } from '../../store/Store'

/**
 * Logotipo da Laura Célvio: monograma LC (imagem do PDF original) + nome.
 * `claro` = versão branca, para fundo escuro (site).
 */
export default function Logo({ className = '', claro = false, compacto = false }) {
  const { config } = useStore().db
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img src={claro ? '/img/logo-monograma-branco.png' : '/img/logo-monograma-preto.png'} alt="" className="h-10 w-auto shrink-0" />
      {!compacto && (
        <div className="leading-none">
          <div className={`font-marca text-[17px] tracking-[0.12em] uppercase ${claro ? 'text-white' : 'text-cacau-900'}`}>{config.marca}</div>
          <div className={`font-label text-[9px] tracking-[0.5em] uppercase mt-1.5 ${claro ? 'text-white/60' : 'text-cacau-500'}`}>{config.slogan}</div>
        </div>
      )}
    </div>
  )
}

/** Logotipo completo (monograma em cima, nome embaixo), para capa e rodapé. */
export const LogoCompleto = ({ claro = true, className = '' }) => (
  <img src={claro ? '/img/logo-completo-branco.png' : '/img/logo-completo-preto.png'} alt="Laura Célvio · Lash Designer" className={className} />
)
