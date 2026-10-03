import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ aberto, onFechar, titulo, sub, children, largura = 'max-w-md', rodape }) {
  useEffect(() => {
    if (!aberto) return
    const esc = (e) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [aberto, onFechar])

  if (!aberto) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-cacau-950/50 backdrop-blur-sm sm:p-4" onMouseDown={onFechar}>
      <div
        className={`w-full ${largura} bg-white border border-nude-200 sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col animate-fade-up text-cacau-800`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {titulo && (
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-nude-200">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-cacau-900 text-2xl leading-tight">{titulo}</h3>
              {sub && <p className="text-xs text-cacau-500 mt-0.5">{sub}</p>}
            </div>
            <button onClick={onFechar} className="p-1.5 rounded-full text-cacau-500 hover:text-cacau-900 hover:bg-nude-100 cursor-pointer shrink-0" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto scrollbar-thin">{children}</div>
        {rodape && <div className="px-6 py-4 border-t border-nude-200 flex gap-2 justify-end flex-wrap">{rodape}</div>}
      </div>
    </div>
  )
}
