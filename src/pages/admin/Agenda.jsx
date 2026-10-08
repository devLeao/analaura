import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Lock, CalendarOff, CalendarCheck, ChevronDown, Coffee } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Cabecalho, Botao, Vazio, Campo, STATUS } from '../../components/admin/ui'
import { AgendamentoCard, useAcoesAgendamento } from '../../components/admin/AgendamentoCard'
import ModalEncaixe from '../../components/admin/ModalEncaixe'
import Modal from '../../components/ui/Modal'
import { brl, toISO, fromISO, addDays, DIAS_CURTOS, dataLonga, toMin, fromMin, duracaoLabel } from '../../lib/format'
import { gerarSlots, diaAberto, intervalosOcupados, slotLivre, ocupaAgenda, horarioDo, almocoDe } from '../../lib/schedule'

/** Trechos livres do expediente (já descontando almoço e horários ocupados). */
function trechosLivres(config, iso, ocupados) {
  const h = horarioDo(config, iso)
  if (!h) return []
  const almoco = almocoDe(config)
  const blocos = almoco
    ? [[toMin(h.abre), almoco[0]], [almoco[1], toMin(h.fecha)]]
    : [[toMin(h.abre), toMin(h.fecha)]]
  const out = []
  for (let [ini, fim] of blocos) {
    const dentro = ocupados.filter(([a, b]) => a < fim && b > ini).sort((x, y) => x[0] - y[0])
    for (const [a, b] of dentro) {
      if (a > ini) out.push([ini, a])
      ini = Math.max(ini, b)
    }
    if (fim > ini) out.push([ini, fim])
  }
  return out.filter(([a, b]) => b - a >= config.slotMin)
}

export default function Agenda() {
  const { db, desbloquearDia, bloquearDia, avisar } = useStore()
  const { config } = db
  const [data, setData] = useState(toISO(new Date()))
  const [onAcao, modais] = useAcoesAgendamento()
  const [encaixe, setEncaixe] = useState(null) // hora pré-selecionada ou ''
  const [bloqueio, setBloqueio] = useState(null)
  const [fecharDia, setFecharDia] = useState(false)
  const [verCancelados, setVerCancelados] = useState(false)

  const doDia = db.agendamentos.filter((a) => a.data === data)
  const ativos = doDia.filter((a) => a.status !== 'cancelado')
  const cancelados = doDia.filter((a) => a.status === 'cancelado')
  const diaFechado = doDia.some((a) => a.status === 'bloqueio' && a.diaInteiro)
  const aberto = diaAberto(config, data)
  const clientes = ativos.filter((a) => !['bloqueio', 'falta'].includes(a.status))
  const previsto = clientes.reduce((s, a) => s + a.total, 0)
  const recebido = clientes.filter((a) => a.status === 'concluido').reduce((s, a) => s + a.total, 0)

  // Linha do tempo: atendimentos + trechos livres + almoço
  const linhas = useMemo(() => {
    const ags = ativos.map((a) => ({ tipo: 'ag', ag: a, ini: a.diaInteiro ? -1 : toMin(a.hora) }))
    if (diaFechado || !aberto) return ags.sort((a, b) => a.ini - b.ini)
    const livres = trechosLivres(config, data, intervalosOcupados(db.agendamentos, data)).map(([a, b]) => ({ tipo: 'livre', ini: a, fim: b }))
    const pausa = almocoDe(config)
    const almoco = pausa ? [{ tipo: 'almoco', ini: pausa[0], fim: pausa[1] }] : []
    return [...ags, ...livres, ...almoco].sort((a, b) => a.ini - b.ini || (a.tipo === 'ag' ? -1 : 1))
  }, [ativos, diaFechado, aberto, config, db.agendamentos, data])
  const minLivres = linhas.filter((l) => l.tipo === 'livre').reduce((s, l) => s + l.fim - l.ini, 0)

  // Semana (segunda a domingo) da data selecionada
  const d0 = fromISO(data)
  const semana = Array.from({ length: 7 }, (_, i) => toISO(addDays(d0, i - ((d0.getDay() + 6) % 7))))
  const hoje = toISO(new Date())

  return (
    <>
      <Cabecalho titulo="Agenda" sub={<span className="first-letter:uppercase inline-block">{dataLonga(data)}</span>}>
        <Botao variante="pri" onClick={() => setEncaixe('')} disabled={diaFechado}><Plus size={16} /> Agendar cliente</Botao>
        <Botao onClick={() => setBloqueio('')} disabled={diaFechado || !aberto}><Lock size={15} /> Bloquear horário</Botao>
        {diaFechado ? (
          <Botao onClick={() => { desbloquearDia(data); avisar('Dia reaberto.') }}><CalendarCheck size={15} /> Reabrir dia</Botao>
        ) : (
          <Botao onClick={() => setFecharDia(true)} disabled={!aberto}><CalendarOff size={15} /> Fechar o dia</Botao>
        )}
      </Cabecalho>

      {/* Navegação por semana */}
      <div className="card p-2 sm:p-3 mb-5 flex items-center gap-1 sm:gap-2">
        <button onClick={() => setData(toISO(addDays(d0, -7)))} className="p-2 rounded-full hover:bg-nude-100 text-cacau-600 cursor-pointer" aria-label="Semana anterior"><ChevronLeft size={18} /></button>
        <div className="grid grid-cols-7 gap-1 flex-1">
          {semana.map((iso) => {
            const d = fromISO(iso)
            const doIso = db.agendamentos.filter((a) => a.data === iso && ocupaAgenda(a) && a.status !== 'bloqueio')
            const sel = iso === data
            const fechado = !diaAberto(config, iso)
            return (
              <button
                key={iso}
                onClick={() => setData(iso)}
                className={`rounded-2xl py-2 flex flex-col items-center cursor-pointer transition-colors ${sel ? 'bg-cacau-900 text-nude-50' : 'hover:bg-nude-100'} ${fechado && !sel ? 'opacity-40' : ''}`}
              >
                <span className={`text-[10px] sm:text-xs ${sel ? 'text-nude-300' : 'text-cacau-500'}`}>{DIAS_CURTOS[d.getDay()]}</span>
                <span className={`text-base sm:text-lg font-semibold ${iso === hoje && !sel ? 'text-blush-700' : ''}`}>{d.getDate()}</span>
                <span className="h-3 flex items-center gap-0.5">
                  {doIso.slice(0, 5).map((a) => <span key={a.id} className={`h-1.5 w-1.5 rounded-full ${sel ? 'bg-blush-300' : STATUS[a.status]?.barra || 'bg-nude-300'}`} />)}
                </span>
              </button>
            )
          })}
        </div>
        <button onClick={() => setData(toISO(addDays(d0, 7)))} className="p-2 rounded-full hover:bg-nude-100 text-cacau-600 cursor-pointer" aria-label="Próxima semana"><ChevronRight size={18} /></button>
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-nude-200">
          <Botao variante="fantasma" onClick={() => setData(hoje)}>Hoje</Botao>
          <input type="date" value={data} onChange={(e) => e.target.value && setData(e.target.value)} className="input !w-auto !py-1.5 text-sm" />
        </div>
      </div>

      {/* Resumo do dia */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mb-4 px-1">
        <span className="text-cacau-500">Clientes: <strong className="text-cacau-900 font-semibold">{clientes.length}</strong></span>
        <span className="text-cacau-500">Previsto: <strong className="text-cacau-900 font-semibold">{brl(previsto)}</strong></span>
        <span className="text-cacau-500">Recebido: <strong className="text-cacau-900 font-semibold">{brl(recebido)}</strong></span>
        {aberto && !diaFechado && <span className="text-cacau-500">Tempo livre: <strong className="text-cacau-900 font-semibold">{duracaoLabel(minLivres)}</strong></span>}
      </div>
      <Legenda />

      {!aberto && !ativos.length && <div className="card"><Vazio icone={CalendarOff} texto={`${DIAS_CURTOS[d0.getDay()]} é dia de folga. Os dias de atendimento ficam em Configurações.`} /></div>}
      {diaFechado && (
        <div className="card p-4 mb-3 text-sm text-cacau-600 flex items-center gap-3">
          <CalendarOff size={18} className="text-cacau-500" /> Este dia está fechado para agendamentos.
        </div>
      )}

      <div className="space-y-2">
        {linhas.map((l) => {
          if (l.tipo === 'ag') return <AgendamentoCard key={l.ag.id} ag={l.ag} onAcao={onAcao} />
          if (l.tipo === 'almoco')
            return (
              <div key="almoco" className="flex items-center gap-3 px-4 py-2 text-xs text-cacau-500">
                <span className="w-14 tabular-nums">{config.almocoInicio}</span>
                <Coffee size={14} /> Almoço até {config.almocoFim}
                <span className="flex-1 border-t border-dotted border-nude-300" />
              </div>
            )
          return (
            <div key={`l-${l.ini}`} className="group flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-nude-300 px-3 sm:px-4 py-3 hover:border-blush-300 hover:bg-white transition-colors">
              <span className="w-14 text-sm text-cacau-500 tabular-nums pl-1">{fromMin(l.ini)}</span>
              <span className="flex-1 text-sm text-cacau-500">
                Livre até {fromMin(l.fim)} <span className="text-cacau-500/70">· {duracaoLabel(l.fim - l.ini)}</span>
              </span>
              <div className="flex gap-1">
                <Botao variante="fantasma" className="!py-1 !px-2.5 !text-xs" onClick={() => setEncaixe(fromMin(l.ini))} title="Agendar"><Plus size={14} /> <span className="hidden sm:inline">Agendar</span></Botao>
                <Botao variante="fantasma" className="!py-1 !px-2.5 !text-xs" onClick={() => setBloqueio(fromMin(l.ini))} title="Bloquear"><Lock size={13} /> <span className="hidden sm:inline">Bloquear</span></Botao>
              </div>
            </div>
          )
        })}
      </div>

      {cancelados.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setVerCancelados(!verCancelados)} className="flex items-center gap-1 text-sm text-cacau-500 hover:text-cacau-900 mb-2 cursor-pointer">
            <ChevronDown size={16} className={verCancelados ? '' : '-rotate-90'} /> Cancelados ({cancelados.length})
          </button>
          {verCancelados && <div className="space-y-2">{cancelados.map((a) => <AgendamentoCard key={a.id} ag={a} onAcao={onAcao} />)}</div>}
        </div>
      )}

      {modais}
      {encaixe !== null && <ModalEncaixe dataInicial={data} horaInicial={encaixe} onFechar={() => setEncaixe(null)} />}
      {bloqueio !== null && <ModalBloqueio data={data} horaInicial={bloqueio} onFechar={() => setBloqueio(null)} />}
      <Modal aberto={fecharDia} onFechar={() => setFecharDia(false)} titulo="Fechar o dia?"
        rodape={<><Botao onClick={() => setFecharDia(false)}>Voltar</Botao><Botao variante="perigo" onClick={() => { bloquearDia(data, 'Dia fechado'); setFecharDia(false); avisar('Dia fechado para agendamentos.') }}>Fechar o dia</Botao></>}>
        <p className="text-sm text-cacau-600">Ninguém conseguirá agendar em {dataLonga(data).toLowerCase()} pelo site.</p>
        {clientes.length > 0 && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-3">
            Atenção: há {clientes.length} cliente(s) já marcada(s) neste dia. Elas continuam na agenda: avise pelo WhatsApp e remarque.
          </p>
        )}
      </Modal>
    </>
  )
}

function Legenda() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-cacau-500 mb-4 px-1">
      {['agendado', 'concluido', 'falta'].map((s) => (
        <span key={s} className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${STATUS[s].barra}`} />{STATUS[s].txt}</span>
      ))}
    </div>
  )
}

function ModalBloqueio({ data, horaInicial, onFechar }) {
  const { db, bloquearHorario, avisar } = useStore()
  const { config } = db
  const [hora, setHora] = useState(horaInicial)
  const [duracao, setDuracao] = useState(60)
  const [motivo, setMotivo] = useState('')
  const ocupados = intervalosOcupados(db.agendamentos, data)
  const horas = gerarSlots(config, data).filter((h) => slotLivre(config, data, h, config.slotMin, ocupados, true))
  const ateFim = hora ? toMin(horarioDo(config, data).fecha) - toMin(hora) : 0

  return (
    <Modal aberto onFechar={onFechar} titulo="Bloquear horário" sub="Some do site, mas não mexe em quem já está marcada"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao variante="pri" disabled={!hora} onClick={() => { bloquearHorario(data, hora, Number(duracao), motivo); avisar('Horário bloqueado.'); onFechar() }}>Bloquear</Botao></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="A partir de">
            <select className="input" value={hora} onChange={(e) => setHora(e.target.value)}>
              <option value="">Selecione</option>
              {horas.map((h) => <option key={h}>{h}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Por quanto tempo">
            <select className="input" value={duracao} onChange={(e) => setDuracao(e.target.value)}>
              {[30, 60, 90, 120, 180].map((n) => <option key={n} value={n}>{duracaoLabel(n)}</option>)}
              {ateFim > 0 && <option value={ateFim}>Até o fim do dia</option>}
            </select>
          </Campo>
        </div>
        <Campo rotulo="Motivo (só você vê)">
          <input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: curso, médico, buscar material" />
        </Campo>
      </div>
    </Modal>
  )
}
