// Desenhos em SVG que substituem fotos no esboço e ajudam a cliente
// a visualizar a diferença entre os estilos (mais natural x mais cheio).

const P0 = [10, 20]
const P1 = [60, 50]
const P2 = [110, 20]

const ponto = (t) => [
  (1 - t) ** 2 * P0[0] + 2 * t * (1 - t) * P1[0] + t ** 2 * P2[0],
  (1 - t) ** 2 * P0[1] + 2 * t * (1 - t) * P1[1] + t ** 2 * P2[1],
]

const girar = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]

/** Olho fechado com cílios. `leque` = fios por cílio (1 = fio a fio, 5 = russo). */
export function Olho({ leque = 1, fios = 15, className = '' }) {
  const linhas = []
  const espessura = leque === 1 ? 1.5 : leque <= 3 ? 1.05 : 0.7
  const abertura = { 2: 0.24, 3: 0.17 }[leque] ?? 0.1 // radianos entre os fios de um mesmo leque
  for (let i = 0; i < fios; i++) {
    const t = 0.05 + (0.9 * i) / (fios - 1)
    const [bx, by] = ponto(t)
    // normal da curva apontando para fora (para baixo)
    const dx = 100
    const dy = 60 - 120 * t
    const len = Math.hypot(dx, dy)
    const n = [-dy / len, dx / len]
    const comp = 7 + 12 * Math.sin(Math.PI * (0.12 + 0.8 * t))
    for (let k = 0; k < leque; k++) {
      const a = (k - (leque - 1) / 2) * abertura
      const [nx, ny] = girar(n, a)
      const tx = bx + nx * comp
      const ty = by + ny * comp
      // leve curvatura para o lado de fora do olho
      const lado = t < 0.5 ? -1 : 1
      const cx = bx + nx * comp * 0.55 + lado * 1.6
      const cy = by + ny * comp * 0.55
      linhas.push(<path key={`${i}-${k}`} d={`M${bx.toFixed(1)} ${by.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`} strokeWidth={espessura} />)
    }
  }
  return (
    <svg viewBox="0 0 120 72" className={className} fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
      <path d="M10 20Q60 50 110 20" strokeWidth="1.8" />
      {linhas}
    </svg>
  )
}

/** Sobrancelha estilizada. variante: 'design' | 'henna' | 'lamination' */
export function Sobrancelha({ variante = 'design', className = '' }) {
  const fios = []
  const total = variante === 'lamination' ? 34 : 22
  for (let i = 0; i < total; i++) {
    const t = i / (total - 1)
    const x = 18 + t * 86
    const y = 46 - Math.sin(t * Math.PI * 0.82) * 20 + t * 4
    const inclina = variante === 'lamination' ? -2 + t * 3 : 4 + t * 6
    const alto = variante === 'lamination' ? 10 - t * 4 : 7 - t * 3
    fios.push(<path key={i} d={`M${x.toFixed(1)} ${(y + 3).toFixed(1)}l${inclina.toFixed(1)} -${alto.toFixed(1)}`} strokeWidth="0.9" />)
  }
  return (
    <svg viewBox="0 0 120 72" className={className} fill="none" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
      {variante !== 'lamination' && (
        <path
          d="M16 50C30 38 58 24 84 25c12 .4 19 5 22 11-8-3-14-4-22-3.5C62 33 36 42 16 50Z"
          fill="currentColor"
          stroke="none"
          opacity={variante === 'henna' ? 0.55 : 0.18}
        />
      )}
      {fios}
    </svg>
  )
}

/** Espaço reservado para foto real (vai sair quando chegarem as fotos da Ana). */
export function FotoPlaceholder({ legenda, className = '', leque = 3 }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-blush-100 via-nude-100 to-nude-200 flex flex-col items-center justify-center gap-4 ${className}`}>
      <Olho leque={leque} className="w-1/2 text-blush-400/70" />
      {legenda && (
        <span className="whitespace-nowrap font-label uppercase tracking-[0.25em] text-[10px] text-cacau-500 bg-nude-50/80 backdrop-blur px-3 py-1 rounded-full">
          {legenda}
        </span>
      )}
    </div>
  )
}
