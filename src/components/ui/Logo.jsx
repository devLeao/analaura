import { useStore } from '../../store/Store'

// Logo provisório até recebermos a identidade visual do estúdio.
export default function Logo({ className = '', claro = false }) {
  const { config } = useStore().db
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <svg viewBox="0 0 48 48" className="h-11 w-11 shrink-0" aria-hidden="true">
        <circle cx="24" cy="24" r="22.5" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-blush-500" />
        <text x="24" y="29.5" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="600" fontSize="17" className={claro ? 'fill-nude-50' : 'fill-cacau-900'}>AL</text>
        <path d="M15 34.5q9 4.5 18 0" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-blush-500" />
      </svg>
      <div className="leading-none">
        <div className={`font-display font-semibold text-2xl ${claro ? 'text-nude-50' : 'text-cacau-900'}`}>{config.marca}</div>
        <div className="font-label text-[10px] tracking-[0.4em] uppercase text-blush-600 mt-1">{config.slogan}</div>
      </div>
    </div>
  )
}
