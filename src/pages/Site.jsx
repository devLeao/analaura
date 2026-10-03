import { useState } from 'react'
import { X } from 'lucide-react'
import Navbar from '../components/site/Navbar'
import Hero from '../components/site/Hero'
import Sobre from '../components/site/Sobre'
import Servicos from '../components/site/Servicos'
import ComoFunciona from '../components/site/ComoFunciona'
import Agendamento from '../components/site/Agendamento'
import Galeria from '../components/site/Galeria'
import Cuidados from '../components/site/Cuidados'
import { Contato, Rodape } from '../components/site/Contato'
import { LoginModal, MinhaContaModal, PagarPendenciasModal } from '../components/site/Modais'
import { WhatsApp } from '../components/ui/Icones'
import { useStore } from '../store/Store'

export default function Site() {
  const { db } = useStore()
  const [login, setLogin] = useState(false)
  const [conta, setConta] = useState(false)
  const [pagar, setPagar] = useState(null)
  const [servicoInicial, setServicoInicial] = useState(null)
  const [seloTeste, setSeloTeste] = useState(() => {
    try { return sessionStorage.getItem('selo-teste') !== 'fechado' } catch { return true }
  })
  const fecharSelo = () => {
    setSeloTeste(false)
    try { sessionStorage.setItem('selo-teste', 'fechado') } catch { /* sem storage */ }
  }

  const escolherServico = (id) => {
    setServicoInicial({ id, t: Date.now() })
    document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Navbar onLogin={() => setLogin(true)} onMinhaConta={() => setConta(true)} />
      <main>
        <Hero />
        <Sobre />
        <Servicos onEscolher={escolherServico} />
        <ComoFunciona />
        <Agendamento servicoInicial={servicoInicial} onLogin={() => setLogin(true)} onPagarPendencias={setPagar} />
        <Galeria />
        <Cuidados />
        <Contato />
      </main>
      <Rodape />

      <a
        href={`https://wa.me/${db.config.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
        aria-label="Falar no WhatsApp"
      >
        <WhatsApp size={28} />
      </a>

      {/* Selo do esboço: deixa claro que textos, preços e login são provisórios */}
      {seloTeste && (
        <div className="fixed bottom-5 left-4 z-40 flex items-center gap-2 text-[11px] leading-tight bg-cacau-900/95 backdrop-blur border border-blush-500/40 text-nude-300 pl-3 pr-1 py-1 rounded-full shadow-xl">
          <span>
            <span className="text-blush-300 font-semibold">Esboço</span>
            <span className="hidden sm:inline"> · dados, login e pagamento fictícios</span>
          </span>
          <button onClick={fecharSelo} className="p-1.5 text-nude-400 hover:text-nude-50 cursor-pointer" aria-label="Fechar aviso">
            <X size={14} />
          </button>
        </div>
      )}

      <LoginModal aberto={login} onFechar={() => setLogin(false)} />
      <MinhaContaModal aberto={conta} onFechar={() => setConta(false)} onPagarPendencias={setPagar} />
      <PagarPendenciasModal pendencias={pagar} onFechar={() => setPagar(null)} />
    </>
  )
}
