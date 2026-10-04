import { useMemo, useState } from 'react'
import { Check, Pencil, UserX, CalendarX2, Unlock, RotateCcw, AlertTriangle, StickyNote, Globe, Lock } from 'lucide-react'
import Modal from '../ui/Modal'
import { WhatsApp } from '../ui/Icones'
import { Status, Botao, Etiqueta, Campo } from './ui'
import FichaCliente from './FichaCliente'
import { EscolhaServicos, Pilulas } from './Escolhas'
import { useStore } from '../../store/Store'
import { brl, fromMin, toMin, dataLonga, duracaoLabel, waNumero, primeiroNome, multaDe } from '../../lib/format'
import { gerarSlots, intervalosOcupados, slotLivre } from '../../lib/schedule'
import { itensDe } from '../../lib/catalogo'
import { FORMAS_PAGAMENTO } from '../../lib/stats'

/** Mensagens prontas de WhatsApp (a Ana só aperta enviar). */
export const mensagens = {
  lembrete: (ag) =>
    `Oi, ${primeiroNome(ag.clienteNome)}! Passando pra lembrar do seu horário de ${ag.servicoNomes} ${dataLonga(ag.data).toLowerCase()} às ${ag.hora}. Venha sem maquiagem nos olhos, tá? Pode me confirmar?`,
}

export const linkWhats = (tel, texto) => `https://wa.me/${waNumero(tel)}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`

export function AgendamentoCard({ ag, onAcao, compacto = false }) {
  const { db } = useStore()
  const fim = fromMin(toMin(ag.hora) + ag.duracao)
  const cliente = db.clientes.find((c) => c.id === ag.clienteId)
  const alergia = cliente?.ficha?.alergias
  const apagado = ag.status === 'cancelado' || ag.status === 'falta'
  const barra = { agendado: 'bg-violet-400', concluido: 'bg-emerald-400', falta: 'bg-red-400', cancelado: 'bg-nude-300', bloqueio: 'bg-nude-400' }[ag.status]

  if (ag.status === 'bloqueio')
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
            <span>{ag.status === 'concluido' ? 'Recebido' : 'Valor'} <strong className="text-cacau-800 font-medium">{brl(ag.total)}</strong></span>
            {ag.status === 'concluido' && ag.pagamento && <span>via {FORMAS_PAGAMENTO[ag.pagamento.forma]?.toLowerCase()}</span>}
            {ag.status === 'falta' && <span className="text-red-600">multa de {brl(multaDe(ag.total, db.config.multaPct))} gerada</span>}
          </div>
          {ag.nota && <p className="text-xs text-cacau-600 mt-1.5 flex items-start gap-1.5"><StickyNote size={12} className="mt-0.5 shrink-0 text-blush-600" /> {ag.nota}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1 md:justify-end pl-[4.25rem] md:pl-0 flex-wrap">
        {ag.status === 'agendado' && (
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
          <IconeAcao titulo="Desfazer (voltar para agendado)" onClick={() => onAcao('reabrir', ag)}><RotateCcw size={16} /></IconeAcao>
        )}
      </div>
    </div>
  )
}

const IconeAcao = ({ titulo, cor = 'hover:text-cacau-900', onClick, children }) => (
  <button onClick={onClick} title={titulo} aria-label={titulo} className={`p-2 rounded-full text-cacau-500 ${cor} hover:bg-nude-100 cursor-pointer`}>
    {children}
  </button>
)

/** Modais das ações sobre um agendamento. */
function ModaisAgendamento({ acao, onFechar }) {
  const st = useStore()
  const { db, avisar } = st
  const ag = acao?.ag
  const [valor, setValor] = useState(ag ? String(ag.total) : '')
  const [forma, setForma] = useState('pix')
  const [sel, setSel] = useState(ag?.servicoIds || [])
  const [data, setData] = useState(ag?.data || '')
  const [hora, setHora] = useState(ag?.hora || '')
  const [nota, setNota] = useState(ag?.nota || '')

  const { total: novoTotal, duracao: novaDur } = itensDe(db.servicos, sel)
  const horasLivres = useMemo(() => {
    if (acao?.tipo !== 'editar') return []
    const oc = intervalosOcupados(db.agendamentos, data, ag.id)
    return gerarSlots(db.config).filter((h) => slotLivre(db.config, h, novaDur || db.config.slotMin, oc, '0000-00-00'))
  }, [acao, db, data, novaDur, ag])

  if (!acao || !ag) return null
  const fazer = (fn, msg) => { fn(); avisar(msg); onFechar() }
  const { tipo } = acao
  const multa = multaDe(ag.total, db.config.multaPct)

  if (tipo === 'ficha') return <FichaCliente clienteId={ag.clienteId} onFechar={onFechar} />

  if (tipo === 'concluir')
    return (
      <Modal aberto onFechar={onFechar} titulo="Atendimento concluído" sub={`${ag.clienteNome} · ${ag.servicoNomes}`}
        rodape={<><Botao onClick={onFechar}>Voltar</Botao><Botao variante="ok" onClick={() => fazer(() => st.concluirAtendimento(ag.id, { total: Number(valor) || 0, forma }), 'Atendimento concluído.')}><Check size={16} /> Concluir</Botao></>}>
        <div className="space-y-5">
          <Campo rotulo="Valor recebido (R$)" dica="Ajuste se cobrou diferente (desconto, serviço extra).">
            <input className="input tabular-nums" type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} />
          </Campo>
          <Campo rotulo="Como ela pagou?">
            <Pilulas valor={forma} onChange={setForma} opcoes={[['pix', 'Pix'], ['cartao', 'Cartão'], ['dinheiro', 'Dinheiro']]} />
          </Campo>
        </div>
      </Modal>
    )

  if (tipo === 'falta')
    return (
      <Modal aberto onFechar={onFechar} titulo="Marcar falta?"
        rodape={<><Botao onClick={onFechar}>Voltar</Botao><Botao variante="perigo" onClick={() => fazer(() => st.marcarFalta(ag.id), 'Falta registrada e multa gerada.')}><UserX size={16} /> Confirmar falta</Botao></>}>
        <div className="flex gap-3 items-start">
          <AlertTriangle className="text-amber-600 shrink-0" size={22} />
          <div className="text-sm text-cacau-600 space-y-2">
            <p><strong className="text-cacau-900">{ag.clienteNome}</strong> não compareceu em {dataLonga(ag.data).toLowerCase()} às {ag.hora}.</p>
            <p>Será gerada uma multa de <strong className="text-cacau-900">{brl(multa)}</strong> ({db.config.multaPct}% de {brl(ag.total)}). Ela só volta a agendar pelo site depois de pagar.</p>
            <p>O horário fica livre para encaixar outra cliente.</p>
          </div>
        </div>
      </Modal>
    )

  if (tipo === 'cancelar')
    return (
      <Modal aberto onFechar={onFechar} titulo="Cancelar horário" sub={`${ag.clienteNome} · ${dataLonga(ag.data)} às ${ag.hora}`} largura="max-w-lg">
        <p className="text-sm text-cacau-600 mb-4">Nos dois casos o horário volta a ficar livre na agenda.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <button onClick={() => fazer(() => st.cancelarAgendamento(ag.id), 'Horário cancelado e liberado.')} className="text-left rounded-2xl border border-nude-300 hover:border-cacau-500 p-4 cursor-pointer">
            <div className="text-cacau-900 font-medium text-sm mb-1">Cancelar sem multa</div>
            <div className="text-xs text-cacau-600">Ela avisou com antecedência ou foi você que desmarcou.</div>
          </button>
          <button onClick={() => fazer(() => st.marcarFalta(ag.id, 'cancelou_tarde'), `Horário liberado e multa de ${brl(multa)} gerada.`)} className="text-left rounded-2xl border border-amber-300 bg-amber-50/60 hover:border-amber-500 p-4 cursor-pointer">
            <div className="text-amber-900 font-medium text-sm mb-1">Cancelar com multa de {brl(multa)}</div>
            <div className="text-xs text-cacau-600">Avisou em cima da hora. Libera o horário e cobra {db.config.multaPct}%.</div>
          </button>
        </div>
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
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-nude-50 rounded-2xl p-3"><div className="text-[11px] text-cacau-500">Duração</div><div className="font-semibold text-cacau-900">{duracaoLabel(novaDur)}</div></div>
            <div className="bg-nude-50 rounded-2xl p-3"><div className="text-[11px] text-cacau-500">Valor</div><div className="font-semibold text-cacau-900 tabular-nums">{brl(novoTotal)}</div></div>
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
      avisar('Atendimento voltou para "agendado".')
      return
    }
    setAcao({ tipo, ag, k: Date.now() })
  }
  // `key` recria os modais a cada ação, já com os valores daquele agendamento
  return [onAcao, acao ? <ModaisAgendamento key={acao.k} acao={acao} onFechar={() => setAcao(null)} /> : null]
}
