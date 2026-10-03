// Divisor com um olho fechado e cílios, a "assinatura" visual do site
export default function Ornamento({ className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-4 text-blush-500 ${className}`} aria-hidden="true">
      <span className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-blush-400" />
      <svg viewBox="0 0 24 20" className="h-5 w-6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
        <path d="M3 8q9 9 18 0" />
        <path d="M6.6 10.2 5 12.5M9.3 11.2l-.7 2.8M12 11.5V14.5M14.7 11.2l.7 2.8M17.4 10.2l1.6 2.3" />
      </svg>
      <span className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-blush-400" />
    </div>
  )
}

export function TituloSecao({ sobre, titulo, children, escuro = false }) {
  return (
    <div className="text-center mb-12 md:mb-16">
      <p className={`font-label uppercase tracking-[0.35em] text-xs mb-3 ${escuro ? 'text-blush-300' : 'text-blush-600'}`}>{sobre}</p>
      <h2 className={`font-display text-4xl md:text-6xl font-semibold ${escuro ? 'text-nude-50' : 'text-cacau-900'}`}>{titulo}</h2>
      <Ornamento className="mt-5" />
      {children && <p className={`mt-5 max-w-xl mx-auto leading-relaxed ${escuro ? 'text-nude-300' : 'text-cacau-600'}`}>{children}</p>}
    </div>
  )
}
