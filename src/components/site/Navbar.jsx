import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, CalendarDays, LayoutDashboard, LogOut, AlertCircle } from 'lucide-react'
import Logo from '../ui/Logo'
import { useStore, pendenciasAbertasDe } from '../../store/Store'

const LINKS = [
  ['inicio', 'Início'],
  ['sobre', 'Sobre'],
  ['servicos', 'Serviços'],
  ['como-funciona', 'Como funciona'],
  ['galeria', 'Galeria'],
  ['contato', 'Contato'],
]

export default function Navbar({ onLogin, onMinhaConta }) {
  const { usuario, sair, db } = useStore()
  const [aberto, setAberto] = useState(false)
  const [rolou, setRolou] = useState(false)
  const pendente = usuario?.tipo === 'cliente' && pendenciasAbertasDe(db, usuario.id).length > 0

  useEffect(() => {
    const f = () => setRolou(window.scrollY > 40)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])

  const sairBtn = (
    <button onClick={sair} className="p-2 rounded-full text-cacau-500 hover:text-cacau-900 hover:bg-nude-100 cursor-pointer" title="Sair"><LogOut size={18} /></button>
  )
  const botaoConta = !usuario ? (
    <div className="flex items-center gap-2">
      <button onClick={onLogin} className="btn-ghost !py-2.5 !px-5 !text-xs">Entrar</button>
      <a href="#agendar" className="btn-primary !py-2.5 !px-6 !text-xs">Agendar</a>
    </div>
  ) : usuario.tipo === 'admin' ? (
    <div className="flex items-center gap-2">
      <Link to="/admin" className="btn-primary !py-2.5 !px-5 !text-xs"><LayoutDashboard size={14} /> Meu painel</Link>
      {sairBtn}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <button onClick={onMinhaConta} className="btn-ghost !py-2.5 !px-5 !text-xs relative">
        <CalendarDays size={14} /> Meus horários
        {pendente && <AlertCircle size={16} className="absolute -top-1.5 -right-1.5 text-amber-600 fill-white" />}
      </button>
      <a href="#agendar" className="btn-primary !py-2.5 !px-6 !text-xs">Agendar</a>
      {sairBtn}
    </div>
  )

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${rolou || aberto ? 'bg-nude-50/95 backdrop-blur-md border-b border-nude-200 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <a href="#inicio" aria-label="Início"><Logo /></a>
        <nav className="hidden xl:flex items-center gap-7">
          {LINKS.map(([id, nome]) => (
            <a key={id} href={`#${id}`} className="font-label uppercase tracking-[0.2em] text-[12px] text-cacau-700 hover:text-blush-600 transition-colors">{nome}</a>
          ))}
        </nav>
        <div className="hidden lg:block">{botaoConta}</div>
        <button className="lg:hidden p-2 text-cacau-900 cursor-pointer" onClick={() => setAberto(!aberto)} aria-label="Menu">
          {aberto ? <X /> : <Menu />}
        </button>
      </div>
      {aberto && (
        <nav className="lg:hidden border-t border-nude-200 mt-3 px-6 py-6 flex flex-col gap-5 animate-fade-up">
          {LINKS.map(([id, nome]) => (
            <a key={id} href={`#${id}`} onClick={() => setAberto(false)} className="font-label uppercase tracking-[0.2em] text-cacau-800 hover:text-blush-600">{nome}</a>
          ))}
          <div className="pt-2" onClick={() => setAberto(false)}>{botaoConta}</div>
        </nav>
      )}
    </header>
  )
}
