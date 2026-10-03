import { useState } from 'react'
import { Save, RotateCcw, QrCode, ShieldCheck, Clock, HandCoins, Store, Plug } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Cabecalho, Botao, Secao, Campo } from '../../components/admin/ui'
import Modal from '../../components/ui/Modal'
import { DIAS_CURTOS, brl, sinalDe, duracaoLabel } from '../../lib/format'
import { gerarSlots } from '../../lib/schedule'
import { CONFIG_PADRAO } from '../../data/seed'

export default function Configuracoes() {
  const { db, salvarConfig, resetar, avisar } = useStore()
  const [f, setF] = useState({ ...db.config })
  const [confirmarReset, setConfirmarReset] = useState(false)
  const set = (k, num = false) => (e) => setF({ ...f, [k]: num ? Number(e.target.value) : e.target.value })
  const toggleDia = (d) => setF({ ...f, diasAbertos: f.diasAbertos.includes(d) ? f.diasAbertos.filter((x) => x !== d) : [...f.diasAbertos, d].sort() })
  const alterado = JSON.stringify(f) !== JSON.stringify(db.config)
  const ex = db.servicos.find((s) => s.id === 'brasileiro') || db.servicos[0]
  const slots = gerarSlots(f)

  return (
    <>
      <Cabecalho titulo="Configurações" sub="Regras da agenda, do sinal e dados do estúdio">
        <Botao variante="pri" disabled={!alterado} onClick={() => { salvarConfig(f); avisar('Configurações salvas.') }}><Save size={16} /> Salvar alterações</Botao>
      </Cabecalho>
      {alterado && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-5">Você tem alterações não salvas.</p>}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Secao titulo="Dias e horários" icone={Clock}>
          <label className="label">Dias de atendimento</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <button key={d} onClick={() => toggleDia(d)} className={`h-10 w-12 rounded-full text-sm cursor-pointer transition-colors ${f.diasAbertos.includes(d) ? 'bg-cacau-900 text-nude-50 font-medium' : 'bg-nude-100 text-cacau-500 hover:bg-nude-200'}`}>
                {DIAS_CURTOS[d]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Abre às"><input type="time" className="input" value={f.abre} onChange={set('abre')} /></Campo>
            <Campo rotulo="Fecha às"><input type="time" className="input" value={f.fecha} onChange={set('fecha')} /></Campo>
            <Campo rotulo="Almoço de"><input type="time" className="input" value={f.almocoInicio} onChange={set('almocoInicio')} /></Campo>
            <Campo rotulo="Almoço até"><input type="time" className="input" value={f.almocoFim} onChange={set('almocoFim')} /></Campo>
            <Campo rotulo="Intervalo entre horários (min)"><input type="number" min="10" step="5" className="input" value={f.slotMin} onChange={set('slotMin', true)} /></Campo>
            <Campo rotulo="Agenda aberta para (dias)"><input type="number" min="1" className="input" value={f.diasAgendaAberta} onChange={set('diasAgendaAberta', true)} /></Campo>
          </div>
          <p className="text-xs text-cacau-500 mt-3">{slots.length} horários de início por dia: {slots.slice(0, 4).join(', ')}…</p>
        </Secao>

        <Secao titulo="Sinal e cancelamento" icone={HandCoins}>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Sinal para reservar (%)"><input type="number" min="0" max="100" className="input" value={f.sinalPct} onChange={set('sinalPct', true)} /></Campo>
            <Campo rotulo="Tempo para pagar o Pix (min)"><input type="number" min="5" className="input" value={f.reservaMin} onChange={set('reservaMin', true)} /></Campo>
            <Campo rotulo="Cancelar e ganhar crédito até (horas antes)"><input type="number" min="0" className="input" value={f.remarcarHoras} onChange={set('remarcarHoras', true)} /></Campo>
            <Campo rotulo="Prazo da manutenção (dias)"><input type="number" min="7" className="input" value={f.manutencaoDias} onChange={set('manutencaoDias', true)} /></Campo>
          </div>
          <div className="mt-4 bg-nude-50 rounded-2xl p-4 text-xs text-cacau-600 space-y-1.5 leading-relaxed">
            <p><strong className="text-cacau-900">Como fica:</strong> {ex.nome} ({brl(ex.preco)}) → sinal de <strong className="text-cacau-900">{brl(sinalDe(ex.preco, f.sinalPct))}</strong> no Pix, restante no dia.</p>
            <p>A cliente tem {duracaoLabel(f.reservaMin)} para pagar; depois disso o horário volta para a agenda.</p>
            <p>Cancelando com mais de {f.remarcarHoras}h, o sinal vira crédito. Em cima da hora ou falta, o sinal fica com você.</p>
            <p>Clientes com extensão há ~{f.manutencaoDias} dias e sem horário aparecem no Início para você lembrar.</p>
          </div>

          <h4 className="text-sm font-semibold text-cacau-900 mt-6 mb-3 flex items-center gap-2"><QrCode size={16} className="text-blush-600" /> Recebimento via Pix</h4>
          <div className="grid gap-3">
            <Campo rotulo="Chave Pix"><input className="input" value={f.pixChave} onChange={set('pixChave')} /></Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Nome do recebedor"><input className="input" value={f.pixNome} onChange={set('pixNome')} /></Campo>
              <Campo rotulo="Cidade"><input className="input" value={f.pixCidade} onChange={set('pixCidade')} /></Campo>
            </div>
          </div>
        </Secao>

        <Secao titulo="Dados do estúdio" icone={Store} sub="Aparecem no site">
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Nome"><input className="input" value={f.marca} onChange={set('marca')} /></Campo>
              <Campo rotulo="Subtítulo"><input className="input" value={f.slogan} onChange={set('slogan')} /></Campo>
            </div>
            <Campo rotulo="WhatsApp (com DDI e DDD, só números)"><input className="input" value={f.whatsapp} onChange={set('whatsapp')} /></Campo>
            <Campo rotulo="Instagram (sem @)"><input className="input" value={f.instagram} onChange={set('instagram')} /></Campo>
            <Campo rotulo="Endereço"><input className="input" value={f.endereco} onChange={set('endereco')} /></Campo>
            <Campo rotulo="Cidade"><input className="input" value={f.cidade} onChange={set('cidade')} /></Campo>
          </div>
        </Secao>

        <Secao titulo="Próxima fase" icone={Plug}>
          <ul className="space-y-4 text-sm">
            <Integracao icone={QrCode} titulo="Pix com confirmação automática" texto="Cobrança gerada pelo Mercado Pago / Asaas. Quando o banco confirma, o horário é confirmado sozinho." />
            <Integracao icone={ShieldCheck} titulo="Login com Google de verdade" texto="Autenticação real e dados salvos na nuvem, acessíveis do celular e do computador." />
          </ul>
          <div className="mt-6 pt-5 border-t border-nude-200">
            <Botao variante="fantasma" className="!text-red-600" onClick={() => setConfirmarReset(true)}><RotateCcw size={15} /> Recriar dados de exemplo</Botao>
          </div>
        </Secao>
      </div>

      <Modal aberto={confirmarReset} onFechar={() => setConfirmarReset(false)} titulo="Recriar dados de exemplo?"
        rodape={<><Botao onClick={() => setConfirmarReset(false)}>Voltar</Botao><Botao variante="perigo" onClick={() => { resetar(); setConfirmarReset(false); setF({ ...CONFIG_PADRAO }); avisar('Dados de exemplo recriados.') }}>Recriar</Botao></>}>
        <p className="text-sm text-cacau-600">Apaga tudo o que foi feito no esboço e gera as clientes e agendamentos fictícios de novo.</p>
      </Modal>
    </>
  )
}

const Integracao = ({ icone: Ic, titulo, texto }) => (
  <li className="flex gap-3">
    <span className="h-9 w-9 rounded-full bg-blush-100 text-blush-700 flex items-center justify-center shrink-0"><Ic size={16} /></span>
    <div>
      <div className="text-cacau-900 flex items-center gap-2">{titulo} <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-nude-100 text-cacau-500">fase 2</span></div>
      <div className="text-cacau-500 text-xs mt-0.5">{texto}</div>
    </div>
  </li>
)
