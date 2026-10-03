import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { useStore } from '../../store/Store'

export default function Toast() {
  const { toast } = useStore()
  if (!toast) return null
  const erro = toast.tipo === 'erro'
  return (
    <div key={toast.id} className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-fade-up px-4 w-full max-w-sm">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border ${erro ? 'bg-red-50 border-red-200' : 'bg-cacau-900 border-cacau-800'}`}>
        {erro ? <AlertTriangle size={18} className="text-red-600 shrink-0" /> : <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
        <span className={`text-sm ${erro ? 'text-red-800' : 'text-nude-50'}`}>{toast.msg}</span>
      </div>
    </div>
  )
}
