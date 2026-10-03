import { useEffect, useRef, useState } from 'react'
import { NavLink, Route, Routes, Link, Navigate, useLocation } from 'react-router-dom'
import {
  Home, CalendarDays, Users, Wallet, Sparkles, Settings, Bell, ExternalLink, LogOut, MoreHorizontal, X, Crown,
  CheckCircle2, CalendarPlus, CalendarX, Info,
} from 'lucide-react'
import Logo from '../../components/ui/Logo'
import { GoogleG } from '../../components/site/Agendamento'
import { useStore } from '../../store/Store'
import { reservaExpirada } from '../../lib/schedule'
import Inicio from './Inicio'
import Agenda from './Agenda'
import Clientes from './Clientes'
import Financeiro from './Financeiro'
import Servicos from './Servicos'
import Configuracoes from './Configuracoes'

const MENU = [
  ['', 'Início', Home],
  ['agenda', 'Agenda', CalendarDays],
  ['clientes', 'Clientes', Users],
  ['financeiro', 'Financeiro', Wallet],
  ['servicos', 'Serviços', Sparkles],
  ['configuracoes', 'Configurações', Settings],
]
const MOBILE_PRINCIPAL = ['', 'agenda', 'clientes', 'financeiro']

export default function AdminApp() {
  const { usuario, entrarComoAdmin, db } = useStore()
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0) // cada página abre do topo
  }, [pathname])

  if (usuario?.tipo !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blush-100/70 to-nude-50">
        <div className="card p-8 max-w-sm w-full text-center shadow-xl shadow-blush-700/5 !rounded-3xl">
          <Logo className="justify-center mb-6" />
          <h1 className="font-display text-3xl font-semibold text-cacau-900 mb-1">Seu painel</h1>
          <p className="text-sm text-cacau-500 mb-6">Acesso restrito à administradora.</p>
          <button onClick={entrarComoAdmin} className="w-full flex items-center justify-center gap-3 bg-white border border-nude-300 text-cacau-900 font-medium py-3 rounded-full hover:border-blush-400 cursor-pointer">
            <GoogleG /> Entrar com Google
          </button>
          <p className="text-xs text-cacau-500 mt-4">Esboço: entra direto como administradora.</p>
          <Link to="/" className="text-xs text-blush-700 hover:underline mt-6 inline-block">← Voltar ao site</Link>
        </div>
      </div>
    )
  }

  const badges = {
    agenda: db.agendamentos.filter((a) => a.status === 'aguardando_sinal' && !reservaExpirada(a)).length,
    financeiro: db.pendencias.filter((m) => m.status === 'aberta').length,
  }

  return (
    <div className="min-h-screen bg-nude-50 text-cacau-800 lg:pl-64">
      {/* Menu lateral (computador) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-nude-200">
        <div className="h-20 flex items-center px-6 border-b border-nude-200"><Logo /></div>
        <nav className="flex-1 p-4 space-y-1">
          {MENU.map(([to, nome, Icone]) => <ItemMenu key={to} to={to} nome={nome} Icone={Icone} badge={badges[to] || 0} />)}
        </nav>
        <div className="p-4 border-t border-nude-200">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-cacau-600 hover:text-cacau-900 hover:bg-nude-100">
            <ExternalLink size={18} /> Ver o site
          </Link>
        </div>
      </aside>

      <Topo />

      <main className="px-4 sm:px-6 lg:px-10 py-6 pb-28 lg:pb-12 max-w-7xl">
        <Routes>
          <Route index element={<Inicio />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="financeiro" element={<Financeiro />} />
          <Route path="servicos" element={<Servicos />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>

      <NavMobile badges={badges} />
    </div>
  )
}

function ItemMenu({ to, nome, Icone, badge }) {
  return (
    <NavLink
      to={`/admin/${to}`}
      end={to === ''}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive ? 'bg-blush-100 text-cacau-900 font-medium' : 'text-cacau-600 hover:text-cacau-900 hover:bg-nude-100'}`
      }
    >
      {({ isActive }) => (
        <>
          <Icone size={18} className={isActive ? 'text-blush-700' : ''} />
          <span className="flex-1">{nome}</span>
          {badge > 0 && <span className="text-[11px] min-w-5 h-5 px-1.5 rounded-full bg-amber-100 text-amber-800 font-medium flex items-center justify-center">{badge}</span>}
        </>
      )}
    </NavLink>
  )
}

const ICONE_NOTIF = {
  pendencia_paga: [CheckCircle2, 'text-emerald-600 bg-emerald-50'],
  agendamento: [CalendarPlus, 'text-violet-700 bg-violet-50'],
  cancelamento: [CalendarX, 'text-amber-700 bg-amber-50'],
  info: [Info, 'text-blush-700 bg-blush-100'],
}

function Topo() {
  const { db, sair, lerNotificacoes } = useStore()
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)
  const naoLidas = db.notificacoes.filter((n) => !n.lida).length

  useEffect(() => {
    const f = (e) => ref.current && !ref.current.contains(e.target) && setAberto(false)
    document.addEventListener('mousedown', f)
    return () => document.removeEventListener('mousedown', f)
  }, [])

  return (
    <header className="sticky top-0 z-30 h-16 lg:h-20 bg-nude-50/90 backdrop-blur border-b border-nude-200 flex items-center justify-between px-4 sm:px-6 lg:px-10">
      <div className="lg:hidden"><Logo /></div>
      <div className="hidden lg:block text-sm text-cacau-500 first-letter:uppercase">
        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="relative" ref={ref}>
          <button
            onClick={() => { setAberto(!aberto); if (!aberto && naoLidas) setTimeout(lerNotificacoes, 1500) }}
            className="relative p-2.5 rounded-full text-cacau-600 hover:bg-white hover:text-cacau-900 cursor-pointer"
            aria-label="Notificações"
          >
            <Bell size={20} />
            {naoLidas > 0 && <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-blush-600 text-[10px] font-semibold text-white flex items-center justify-center">{naoLidas}</span>}
          </button>
          {aberto && (
            <div className="absolute right-0 mt-2 w-[min(92vw,380px)] card shadow-2xl overflow-hidden animate-fade-up">
              <div className="px-4 py-3 border-b border-nude-200 flex justify-between items-center">
                <span className="font-semibold text-cacau-900 text-sm">Notificações</span>
                <button onClick={() => setAberto(false)} className="text-cacau-500 hover:text-cacau-900 cursor-pointer"><X size={16} /></button>
              </div>
              <ul className="max-h-96 overflow-y-auto scrollbar-thin divide-y divide-nude-200">
                {db.notificacoes.slice(0, 20).map((n) => {
                  const [Ic, cor] = ICONE_NOTIF[n.tipo] || ICONE_NOTIF.info
                  return (
                    <li key={n.id} className={`px-4 py-3 flex gap-3 ${n.lida ? '' : 'bg-blush-100/40'}`}>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${cor}`}><Ic size={15} /></span>
                      <div className="min-w-0">
                        <p className="text-sm text-cacau-900">{n.titulo}</p>
                        <p className="text-xs text-cacau-500 mt-0.5">{n.texto}</p>
                        <p className="text-[11px] text-cacau-500/80 mt-1">{tempoAtras(n.criadoEm)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-2 pl-3 ml-1 border-l border-nude-200">
          <span className="h-9 w-9 rounded-full bg-cacau-900 text-blush-200 flex items-center justify-center"><Crown size={15} /></span>
          <span className="text-sm text-cacau-800">Ana Laura</span>
        </div>
        <button onClick={sair} className="p-2.5 rounded-full text-cacau-500 hover:bg-white hover:text-cacau-900 cursor-pointer" title="Sair"><LogOut size={18} /></button>
      </div>
    </header>
  )
}

function NavMobile({ badges }) {
  const [mais, setMais] = useState(false)
  const loc = useLocation()
  useEffect(() => {
    setMais(false)
  }, [loc.pathname])
  const principais = MENU.filter(([to]) => MOBILE_PRINCIPAL.includes(to))
  const extras = MENU.filter(([to]) => !MOBILE_PRINCIPAL.includes(to))

  return (
    <>
      {mais && (
        <div className="lg:hidden fixed inset-0 z-40 bg-cacau-950/40" onClick={() => setMais(false)}>
          <div className="absolute bottom-16 inset-x-0 bg-white border-t border-nude-200 rounded-t-3xl p-4 pb-5 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            {extras.map(([to, nome, Icone]) => <ItemMenu key={to} to={to} nome={nome} Icone={Icone} badge={badges[to] || 0} />)}
            <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-cacau-600"><ExternalLink size={18} /> Ver o site</Link>
          </div>
        </div>
      )}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 h-16 bg-white border-t border-nude-200 grid grid-cols-5">
        {principais.map(([to, nome, Icone]) => (
          <NavLink
            key={to}
            to={`/admin/${to}`}
            end={to === ''}
            className={({ isActive }) => `relative flex flex-col items-center justify-center gap-1 text-[10px] ${isActive ? 'text-blush-700 font-medium' : 'text-cacau-500'}`}
          >
            <Icone size={20} />
            {nome}
            {badges[to] > 0 && <span className="absolute top-2 right-[28%] h-2 w-2 rounded-full bg-amber-500" />}
          </NavLink>
        ))}
        <button onClick={() => setMais(!mais)} className={`flex flex-col items-center justify-center gap-1 text-[10px] cursor-pointer ${mais ? 'text-blush-700' : 'text-cacau-500'}`}>
          <MoreHorizontal size={20} />
          Mais
        </button>
      </nav>
    </>
  )
}

function tempoAtras(iso) {
  const min = Math.round((Date.now() - new Date(iso)) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  if (min < 1440) return `há ${Math.round(min / 60)} h`
  return `há ${Math.round(min / 1440)} dias`
}
