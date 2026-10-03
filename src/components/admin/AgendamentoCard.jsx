import { useMemo, useState } from 'react'
import { Check, Pencil, UserX, CalendarX2, Unlock, RotateCcw, AlertTriangle, HandCoins, StickyNote, Globe, Lock } from 'lucide-react'
import Modal from '../ui/Modal'
import { WhatsApp } from '../ui/Icones'
import { Status, Botao, Etiqueta, Toggle, Campo } from './ui'
import FichaCliente from './FichaCliente'
import { EscolhaServicos, Pilulas } from './Escolhas'
import { useStore } from '../../store/Store'
import { brl, fromMin, toMin, dataLonga, duracaoLabel, waNumero, primeiroNome, sinalDe } from '../../lib/format'
import { gerarSlots, intervalosOcupados, slotLivre } from '../../lib/schedule'
import { FORMAS_PAGAMENTO } from '../../lib/stats'

/** Mensagens prontas de WhatsApp (a Ana só aperta enviar). */
export const mensagens = {
  lembrete: (ag) =>
    `Oi, ${primeiroNome(ag.clienteNome)}! Passando pra lembrar do seu horário de ${ag.servicoNomes} ${dataLonga(ag.data).toLowerCase()} às ${ag.hora}. Venha sem maquiagem nos olhos, tá? Qualquer coisa me avisa!`,
  cobrarSinal: (ag, config) =>
    `Oi, ${primeiroNome(ag.clienteNome)}! Separei seu horário de ${ag.servicoNomes} ${dataLonga(ag.data).toLowerCase()} às ${ag.hora}. Pra confirmar, falta só o sinal de ${brl(ag.sinal.valor)} no Pix: ${config.pixChave}`,
}

export const linkWhats = (tel, texto) => `https://wa.me/${waNumero(tel)}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`

export function AgendamentoCard({ ag, onAcao, compacto = false }) {
  const { db } = useStore()
  const fim = fromMin(toMin(ag.hora) + ag.duracao)
  const bloqueio = ag.status === 'bloqueio'
  const cliente = db.clientes.find((c) => c.id === ag.clienteId)
  const alergia = cliente?.ficha?.alergias
  const apagado = ag.status === 'cancelado' || ag.status === 'falta'
  const barra = { aguardando_sinal: 'bg-amber-400', confirmado: 'bg-violet-400', concluido: 'bg-emerald-400', falta: 'bg-red-400', cancelado: 'bg-nude-300', bloqueio: 'bg-nude-400' }[ag.status]

  if (bloqueio)
    return (
      <div className="card relative overflow-hidden p-3 sm:p-4 flex items-center gap-3 bg-[repeating-linear-gradient(135deg,#fff,#fff_8px,#fbf7f3_8px,#fbf7f3_16px)]">
        <span className={`absolute inset-y-0 left-0 w-1 ${barra}`} />
        <div className="w-14 shrink-0 tabular-nums pl-1">
          <div className="text-cacau-900 font-semibold">{ag.diaInteiro ? 'Dia' : ag.hora}</div>
          <div className="text-xs text-cacau-500">{ag.diaInteiro ? 'inteiro' : fim}</div>
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2 text-sm text-cacau-600"><Lock size={14} /> {ag.motivo || 'Horário bloqueado'}</div>
        <Botao variante="fantasma" onClick={() => onAcao('liberar', ag)} className="!px-3 !py-1.5"><Unlock size={15} /> Liberar</Botao>
      </div>
    )

  const pagoSinal = ag.sinal?.pago
  const falta = ag.total - (pagoSinal ? ag.sinal.valor : 0)

  return (
    <div className={`card relative overflow-hidden p-3 sm:p-4 flex flex-col md:flex-row md:items-center gap-3 ${apagado ? 'opacity-70' : ''}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${barra}`} />
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-14 shrink-0 tabular-nums pl-1">
          <div className="text-cacau-900 font-semibold">{ag.hora}</div>
          <div className="text-xs text-cacau-500">{fim}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => onAcao('ficha', ag)} className="text-cacau-900 font-medium truncate hover:text-blush-700 hover:underline underline-offset-4 cursor-pointer text-left">
              {ag.clienteNome}
            </button>
            <Status s={ag.status} />
            {ag.origem === 'site' && !compacto && <Etiqueta><Globe size={11} /> site</Etiqueta>}
            {alergia && <Etiqueta cls="text-red-700 bg-red-50 border-red-200"><AlertTriangle size={11} /> alergia</Etiqueta>}
          </div>
          <div className="text-sm text-cacau-600 mt-0.5">{ag.servicoNomes} <span className="text-cacau-500">· {duracaoLabel(ag.duracao)}</span></div>
          <div className="text-xs text-cacau-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums">
            <span>Total <strong className="text-cacau-800 font-medium">{brl(ag.total)}</strong></span>
            <SinalInfo ag={ag} />
            {ag.status === 'confirmado' && <span>Receber no dia <strong className="text-cacau-800 font-medium">{brl(falta)}</strong></span>}
            {ag.status === 'concluido' && ag.restante && <span>Restante via {FORMAS_PAGAMENTO[ag.restante.forma]?.toLowerCase()}</span>}
          </div>
          {ag.nota && <p className="text-xs text-cacau-600 mt-1.5 flex items-start gap-1.5"><StickyNote size={12} className="mt-0.5 shrink-0 text-blush-600" /> {ag.nota}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1 md:justify-end pl-[4.25rem] md:pl-0 flex-wrap">
        {ag.status === 'aguardando_sinal' && (
          <>
            <a href={linkWhats(ag.clienteTelefone, mensagens.cobrarSinal(ag, db.config))} target="_blank" rel="noreferrer" className="p-2 rounded-full text-[#1fa855] hover:bg-nude-100" title="Cobrar sinal no WhatsApp">
              <WhatsApp size={18} />
            </a>
            <Botao variante="sec" className="!px-3 !py-1.5 !text-xs" onClick={() => onAcao('sinal', ag)}><HandCoins size={14} /> Recebi o sinal</Botao>
            <IconeAcao titulo="Editar / remarcar" onClick={() => onAcao('editar', ag)}><Pencil size={16} /></IconeAcao>
            <IconeAcao titulo="Cancelar" cor="hover:text-red-600" onClick={() => onAcao('cancelar', ag)}><CalendarX2 size={17} /></IconeAcao>
          </>
        )}
        {ag.status === 'confirmado' && (
          <>
            <a href={linkWhats(ag.clienteTelefone, mensagens.lembrete(ag))} target="_blank" rel="noreferrer" className="p-2 rounded-full text-[#1fa855] hover:bg-nude-100" title="Lembrete no WhatsApp">
              <WhatsApp size={18} />
            </a>
            <Botao variante="ok" className="!px-3 !py-1.5 !text-xs" onClick={() => onAcao('concluir', ag)}><Check size={14} /> Atendida</Botao>
            <IconeAcao titulo="Editar / remarcar" onClick={() => onAcao('editar', ag)}><Pencil size={16} /></IconeAcao>
            <IconeAcao titulo="Não compareceu" cor="hover:text-amber-700" onClick={() => onAcao('falta', ag)}><UserX size={17} /></IconeAcao>
            <IconeAcao titulo="Cancelar" cor="hover:text-red-600" onClick={() => onAcao('cancelar', ag)}><CalendarX2 size={17} /></IconeAcao>
          </>
        )}
        {ag.status === 'concluido' && !compacto && (
          <IconeAcao titulo="Desfazer (voltar para confirmado)" onClick={() => onAcao('reabrir', ag)}><RotateCcw size={16} /></IconeAcao>
        )}
      </div>
    </div>
  )
}

function SinalInfo({ ag }) {
  const s = ag.sinal
  if (!s) return null
  if (!s.pago) return <span className="text-amber-700">Sinal {brl(s.valor)} pendente</span>
  const extra = s.destino === 'retido' ? ' · retido' : s.destino === 'credito' ? ' · virou crédito' : s.destino === 'devolvido' ? ' · devolvido' : ''
  return <span className="text-emerald-700">Sinal {brl(s.valor)} pago{s.via === 'credito' ? ' (crédito)' : ''}{extra}</span>
}

const IconeAcao = ({ titulo, cor = 'hover:text-cacau-900', onClick, children }) => (
  <button onClick={onClick} title={titulo} aria-label={titulo} className={`p-2 rounded-full text-cacau-500 ${cor} hover:bg-nude-100 cursor-pointer`}>
    {children}
  </button>
)

function Opcao({ titulo, texto, ativo, onClick, tom = 'neutro' }) {
  const cores = { neutro: 'border-nude-300', ok: 'border-emerald-300 bg-emerald-50/50', alerta: 'border-amber-300 bg-amber-50/50' }
  return (
    <button onClick={onClick} className={`w-full text-left rounded-2xl border p-4 cursor-pointer transition-all ${ativo ? 'ring-2 ring-cacau-900 border-cacau-900' : `${cores[tom]} hover:border-cacau-500`}`}>
      <div className="text-cacau-900 font-medium text-sm mb-0.5">{titulo}</div>
      <div className="text-xs text-cacau-600">{texto}</div>
    </button>
  )
}

/** Modais das ações sobre um agendamento. */
function ModaisAgendamento({ acao, onFechar }) {
  const st = useStore()
  const { db, avisar } = st
  const ag = acao?.ag
  const [valor, setValor] = useState(ag ? String(ag.total) : '')
  const [forma, setForma] = useState('pix')
  const [destino, setDestino] = useState('credito')
  const [gerarPendencia, setGerarPendencia] = useState(false)
  const [sel, setSel] = useState(ag?.servicoIds || [])
  const [data, setData] = useState(ag?.data || '')
  const [hora, setHora] = useState(ag?.hora || '')
  const [nota, setNota] = useState(ag?.nota || '')

  const itens = sel.map((id) => db.servicos.find((s) => s.id === id)).filter(Boolean)
  const novaDur = itens.reduce((s, i) => s + i.duracao, 0)
  const horasLivres = useMemo(() => {
    if (acao?.tipo !== 'editar') return []
    const oc = intervalosOcupados(db.agendamentos, data, ag.id)
    return gerarSlots(db.config).filter((h) => slotLivre(db.config, h, novaDur || db.config.slotMin, oc, '0000-00-00'))
  }, [acao, db, data, novaDur, ag])

  if (!acao || !ag) return null
  const fazer = (fn, msg) => { fn(); avisar(msg); onFechar() }
  const { tipo } = acao

  if (tipo === 'ficha') return <FichaCliente clienteId={ag.clienteId} onFechar={onFechar} />

  if (tipo === 'concluir') {
    const total = Number(valor) || 0
    const jaPago = ag.sinal.pago ? ag.sinal.valor : 0
    return (
      <Modal aberto onFechar={onFechar} titulo="Atendimento concluído" sub={`${ag.clienteNome} · ${ag.servicoNomes}`}
        rodape={<><Botao onClick={onFechar}>Voltar</Botao><Botao variante="ok" onClick={() => fazer(() => st.concluirAtendimento(ag.id, { total, forma }), 'Atendimento concluído.')}><Check size={16} /> Concluir</Botao></>}>
        <div className="space-y-5">
          <Campo rotulo="Valor total do atendimento (R$)" dica="Ajuste se cobrou diferente (desconto, serviço extra).">
            <input className="input tabular-nums" type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} />
          </Campo>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-nude-50 rounded-2xl p-3"><div className="text-[11px] text-cacau-500">Sinal já pago</div><div className="font-semibold text-cacau-900 tabular-nums">{brl(jaPago)}</div></div>
            <div className="bg-emerald-50 rounded-2xl p-3"><div className="text-[11px] text-emerald-800">Receber agora</div><div className="font-semibold text-emerald-900 tabular-nums">{brl(Math.max(0, total - jaPago))}</div></div>
          </div>
          <Campo rotulo="Como ela pagou o restante?">
            <Pilulas valor={forma} onChange={setForma} opcoes={[['pix', 'Pix'], ['cartao', 'Cartão'], ['dinheiro', 'Dinheiro']]} />
          </Campo>
        </div>
      </Modal>
    )
  }

  if (tipo === 'falta')
    return (
      <Modal aberto onFechar={onFechar} titulo="Marcar falta?"
        rodape={<><Botao onClick={onFechar}>Voltar</Botao><Botao variante="perigo" onClick={() => fazer(() => st.marcarFalta(ag.id, gerarPendencia), 'Falta registrada.')}><UserX size={16} /> Confirmar falta</Botao></>}>
        <div className="text-sm text-cacau-600 space-y-3">
          <p><strong className="text-cacau-900">{ag.clienteNome}</strong> não compareceu em {dataLonga(ag.data)} às {ag.hora}.</p>
          {ag.sinal.pago ? (
            <p className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-amber-900">O sinal de <strong>{brl(ag.sinal.valor)}</strong> fica retido, conforme a política do estúdio.</p>
          ) : (
            <Toggle ligado={gerarPendencia} onChange={setGerarPendencia} rotulo={`Gerar pendência de ${brl(ag.sinal.valor)} (valor do sinal)`} />
          )}
          <p>O horário volta a ficar livre para encaixar outra cliente.</p>
        </div>
      </Modal>
    )

  if (tipo === 'cancelar')
    return (
      <Modal aberto onFechar={onFechar} titulo="Cancelar horário" sub={`${ag.clienteNome} · ${dataLonga(ag.data)} às ${ag.hora}`} largura="max-w-lg"
        rodape={<><Botao onClick={onFechar}>Voltar</Botao><Botao variante="perigo" onClick={() => fazer(() => st.cancelarAgendamento(ag.id, ag.sinal.pago ? destino : null), 'Horário cancelado e liberado na agenda.')}>Cancelar horário</Botao></>}>
        {ag.sinal.pago ? (
          <div className="space-y-2">
            <p className="text-sm text-cacau-600 mb-3">E o sinal de <strong className="text-cacau-900">{brl(ag.sinal.valor)}</strong> que ela já pagou?</p>
            <Opcao ativo={destino === 'credito'} onClick={() => setDestino('credito')} tom="ok" titulo="Vira crédito para o próximo horário" texto="Ela avisou com antecedência. O valor abate o sinal quando ela agendar de novo." />
            <Opcao ativo={destino === 'devolvido'} onClick={() => setDestino('devolvido')} titulo="Devolver o sinal" texto="Você faz o estorno no Pix. Fica registrado como saída no financeiro." />
            <Opcao ativo={destino === 'retido'} onClick={() => setDestino('retido')} tom="alerta" titulo="Reter o sinal" texto="Cancelou em cima da hora. O sinal fica com o estúdio." />
          </div>
        ) : (
          <p className="text-sm text-cacau-600">O sinal ainda não tinha sido pago, então não há nada a devolver. O horário volta a ficar livre.</p>
        )}
      </Modal>
    )

  if (tipo === 'sinal')
    return (
      <Modal aberto onFechar={onFechar} titulo="Recebeu o sinal?"
        rodape={<><Botao onClick={onFechar}>Voltar</Botao><Botao variante="ok" onClick={() => fazer(() => st.confirmarSinal(ag.id, 'manual'), 'Sinal registrado. Horário confirmado.')}><HandCoins size={16} /> Sim, recebi</Botao></>}>
        <p className="text-sm text-cacau-600">
          Confirma que <strong className="text-cacau-900">{ag.clienteNome}</strong> pagou o sinal de <strong className="text-cacau-900">{brl(ag.sinal.valor)}</strong> por fora (Pix direto ou dinheiro)?
          O horário de {dataLonga(ag.data)} às {ag.hora} passa a ficar confirmado.
        </p>
      </Modal>
    )

  if (tipo === 'liberar')
    return (
      <Modal aberto onFechar={onFechar} titulo="Liberar horário?"
        rodape={<><Botao onClick={onFechar}>Voltar</Botao><Botao variante="pri" onClick={() => fazer(() => st.cancelarAgendamento(ag.id), 'Horário liberado.')}>Liberar</Botao></>}>
        <p className="text-sm text-cacau-600">{ag.diaInteiro ? 'O dia volta a aceitar agendamentos.' : `O horário das ${ag.hora} fica disponível para as clientes.`}</p>
      </Modal>
    )

  if (tipo === 'editar') {
    const novoTotal = itens.reduce((s, i) => s + i.preco, 0)
    const horaOk = horasLivres.includes(hora)
    return (
      <Modal aberto onFechar={onFechar} titulo="Editar ou remarcar" sub={ag.clienteNome} largura="max-w-lg"
        rodape={<><Botao onClick={onFechar}>Voltar</Botao><Botao variante="pri" disabled={!sel.length || !horaOk} onClick={() => fazer(() => { st.editarAgendamento(ag.id, { servicoIds: sel, data, hora }); if (nota !== ag.nota) st.salvarNotaAgendamento(ag.id, nota) }, 'Agendamento atualizado.')}>Salvar</Botao></>}>
        <div className="space-y-5">
          <Campo rotulo="Serviços"><EscolhaServicos sel={sel} onChange={setSel} /></Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Data"><input type="date" className="input" value={data} onChange={(e) => e.target.value && setData(e.target.value)} /></Campo>
            <Campo rotulo="Horário">
              <select className="input" value={hora} onChange={(e) => setHora(e.target.value)}>
                {!horaOk && <option value={hora}>{hora} (não cabe)</option>}
                {horasLivres.map((h) => <option key={h} value={h}>{h} – {fromMin(toMin(h) + novaDur)}</option>)}
              </select>
            </Campo>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-nude-50 rounded-2xl p-3"><div className="text-[11px] text-cacau-500">Duração</div><div className="font-semibold text-cacau-900">{duracaoLabel(novaDur)}</div></div>
            <div className="bg-nude-50 rounded-2xl p-3"><div className="text-[11px] text-cacau-500">Novo total</div><div className="font-semibold text-cacau-900 tabular-nums">{brl(novoTotal)}</div></div>
            <div className="bg-nude-50 rounded-2xl p-3"><div className="text-[11px] text-cacau-500">Sinal</div><div className="font-semibold text-cacau-900 tabular-nums">{brl(ag.sinal.pago ? ag.sinal.valor : sinalDe(novoTotal, db.config.sinalPct))}</div></div>
          </div>
          <Campo rotulo="Observação deste atendimento (só você vê)">
            <textarea className="input min-h-16" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ex.: quer testar curvatura L, trazer foto de referência" />
          </Campo>
        </div>
      </Modal>
    )
  }
  return null
}

/** Hook: devolve o handler de ações e o elemento dos modais. */
export function useAcoesAgendamento() {
  const { reabrirAgendamento, avisar } = useStore()
  const [acao, setAcao] = useState(null)
  const onAcao = (tipo, ag) => {
    if (tipo === 'reabrir') {
      reabrirAgendamento(ag.id)
      avisar('Atendimento voltou para "confirmado".')
      return
    }
    setAcao({ tipo, ag, k: Date.now() })
  }
  // `key` recria os modais a cada ação, já com os valores daquele agendamento
  return [onAcao, acao ? <ModaisAgendamento key={acao.k} acao={acao} onFechar={() => setAcao(null)} /> : null]
}
