// Faixa infinita "LASHES ✦ BROWS", inspirada no pôster de referência da Ana:
// uma palavra preenchida e a outra só no contorno, correndo devagar.
const PALAVRAS = ['Lashes', 'Brows', 'Lashes', 'Brows']

export default function Faixa({ invertida = false }) {
  const grupo = (
    <div className="flex shrink-0 items-center" aria-hidden="true">
      {PALAVRAS.map((p, i) => (
        <span key={i} className="flex items-center">
          <span className={`font-display font-medium uppercase leading-none text-6xl sm:text-8xl md:text-9xl px-6 sm:px-10 ${i % 2 ? 'contorno' : ''}`}>{p}</span>
          <span className="text-2xl sm:text-4xl opacity-60">✦</span>
        </span>
      ))}
    </div>
  )
  return (
    <div className={`overflow-hidden border-y py-6 sm:py-8 select-none ${invertida ? 'bg-[#ececec] text-black border-black/10 [--traco:#0a0a0a]' : 'bg-black text-white border-white/10 [--traco:#ffffff]'}`}>
      <div className="flex w-max animate-marquee">
        {grupo}
        {grupo}
      </div>
      <span className="sr-only">Lashes e brows: cílios e sobrancelhas</span>
    </div>
  )
}
