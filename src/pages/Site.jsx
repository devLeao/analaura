import { useState } from 'react'
import Navbar from '../components/site/Navbar'
import Hero from '../components/site/Hero'
import Faixa from '../components/site/Faixa'
import Sobre from '../components/site/Sobre'
import Servicos from '../components/site/Servicos'
import ComoFunciona from '../components/site/ComoFunciona'
import Agendamento from '../components/site/Agendamento'
import Galeria from '../components/site/Galeria'
import Cuidados from '../components/site/Cuidados'
import { Contato, Rodape } from '../components/site/Contato'
import { MinhaContaModal, PagarPendenciasModal } from '../components/site/Modais'
import { WhatsApp } from '../components/ui/Icones'
import { useStore } from '../store/Store'

export default function Site() {
  const { db, entrar } = useStore()
  const [conta, setConta] = useState(false)
  const [pagar, setPagar] = useState(null)
  const [servicoInicial, setServicoInicial] = useState(null)
  const escolherServico = (id) => {
    setServicoInicial({ id, t: Date.now() })
    document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    // tema-escuro: o site usa a paleta preta e cinza (ver index.css)
    <div className="tema-escuro min-h-screen">
      <Navbar onLogin={entrar} onMinhaConta={() => setConta(true)} />
      <main>
        <Hero />
        <Faixa />
        <Sobre />
        <Servicos onEscolher={escolherServico} />
        <ComoFunciona />
        <Agendamento servicoInicial={servicoInicial} onLogin={entrar} onPagarPendencias={setPagar} />
        <Galeria />
        <Cuidados />
        <Contato />
      </main>
      <Rodape />

      <a
        href={`https://wa.me/${db.config.whatsapp}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:scale-110 transition-transform"
        aria-label="Falar no WhatsApp"
      >
        <WhatsApp size={28} />
      </a>

      <MinhaContaModal aberto={conta} onFechar={() => setConta(false)} onPagarPendencias={setPagar} />
      <PagarPendenciasModal pendencias={pagar} onFechar={() => setPagar(null)} />
    </div>
  )
}
