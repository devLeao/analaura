import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Check, CalendarX2, CalendarCheck2, Clock, Copy, Loader2, ArrowLeft, Timer, QrCode, AlertCircle, Lock, ShieldAlert, Wallet } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'
import { WhatsApp } from '../ui/Icones'
import { CATEGORIAS } from '../../data/seed'
import { useStore, pendenciasAbertasDe, servicosAtivos } from '../../store/Store'
import { brl, dataCurta, dataLonga, DIAS_CURTOS, fromISO, telefoneMask, toMin, fromMin, duracaoLabel, sinalDe, pad, primeiroNome } from '../../lib/format'
import { gerarSlots, diaAberto, intervalosOcupados, slotLivre, proximosDias } from '../../lib/schedule'
import { gerarPix } from '../../lib/pix'

function Passo({ n, titulo, children, ativo = true }) {
  return (
    <div className={`transition-opacity ${ativo ? '' : 'opacity-35 pointer-events-none'}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="h-7 w-7 rounded-full bg-cacau-900 text-nude-50 font-label text-sm flex items-center justify-center">{n}</span>
        <h3 className="font-label uppercase tracking-[0.2em] text-cacau-900 text-sm">{titulo}</h3>
      </div>
      {children}
    </div>
  )
}

export default function Agendamento({ servicoInicial, onLogin, onPagarPendencias }) {
  const { db, usuario, reservar, confirmarSinal, descartarReserva } = useStore()
  const { config } = db
  const servicos = servicosAtivos(db)
  const [selecionados, setSelecionados] = useState([])
  const [data, setData] = useState(null)
  const [hora, setHora] = useState(null)
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState('')
  const [reservaId, setReservaId] = useState(null) // reserva criada (aguardando Pix ou já confirmada)

  useEffect(() => {
    if (servicoInicial) {
      setSelecionados([servicoInicial.id])
      setHora(null)
      setReservaId(null)
    }
  }, [servicoInicial])

  useEffect(() => {
    if (usuario?.telefone) setTelefone(usuario.telefone)
  }, [usuario?.id, usuario?.telefone])

  const itens = selecionados.map((id) => servicos.find((s) => s.id === id)).filter(Boolean)
  const duracao = itens.reduce((s, i) => s + i.duracao, 0)
  const total = itens.reduce((s, i) => s + i.preco, 0)
  const sinal = sinalDe(total, config.sinalPct)
  const credito = usuario?.tipo === 'cliente' ? usuario.credito || 0 : 0
  const creditoUsado = Math.min(credito, sinal)

  const dias = useMemo(() => proximosDias(config.diasAgendaAberta), [config])
  const slots = useMemo(() => gerarSlots(config), [config])
  const ocupados = useMemo(() => (data ? intervalosOcupados(db.agendamentos, data) : []), [db.agendamentos, data])
  const diaFechado = (iso) => db.agendamentos.some((a) => a.data === iso && a.status === 'bloqueio' && a.diaInteiro)
  const reserva = reservaId ? db.agendamentos.find((a) => a.id === reservaId) : null

  const toggle = (id) => {
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
    setHora(null)
    setErro('')
  }

  const irParaPagamento = () => {
    if (telefone.replace(/\D/g, '').length < 11) return setErro('Informe um WhatsApp válido.')
    // revalida o horário (outra cliente pode ter pego enquanto escolhia)
    if (!slotLivre(config, hora, duracao, intervalosOcupados(db.agendamentos, data), data)) {
      setHora(null)
      return setErro('Ops! Esse horário acabou de ser ocupado.')
    }
    setErro('')
    const id = reservar({
      clienteId: usuario.id,
      clienteNome: usuario.nome,
      clienteTelefone: telefone,
      servicoIds: itens.map((i) => i.id),
      servicoNomes: itens.map((i) => i.nome).join(' + '),
      total,
      duracao,
      data,
      hora,
    })
    setReservaId(id)
    setSelecionados([])
    setData(null)
    setHora(null)
    document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' })
  }

  // ---------- Estados especiais ----------
  let conteudo
  if (!usuario) {
    conteudo = (
      <div className="max-w-md mx-auto text-center py-12 bg-white border border-nude-200 rounded-3xl px-6 shadow-xl shadow-blush-700/5">
        <span className="h-14 w-14 rounded-full bg-blush-100 text-blush-600 flex items-center justify-center mx-auto mb-5"><Lock size={24} /></span>
        <h3 className="font-display text-3xl text-cacau-900 font-semibold mb-2">Entre para agendar</h3>
        <p className="text-cacau-600 mb-8 text-sm leading-relaxed">É rapidinho: entre com sua conta Google. Assim você acompanha seus horários, seu crédito e recebe a confirmação.</p>
        <button onClick={onLogin} className="btn-primary"><GoogleG /> Entrar com Google</button>
      </div>
    )
  } else if (usuario.tipo === 'admin') {
    conteudo = (
      <div className="max-w-md mx-auto text-center py-12 text-cacau-600">
        Você está logada como <strong className="text-cacau-900">administradora</strong>. Para encaixar uma cliente, use a{' '}
        <Link to="/admin/agenda" className="text-blush-700 underline underline-offset-4">agenda do painel</Link>.
      </div>
    )
  } else if (reserva?.status === 'confirmado') {
    conteudo = <Confirmado ag={reserva} config={config} onNovo={() => setReservaId(null)} />
  } else if (reserva?.status === 'aguardando_sinal') {
    conteudo = (
      <PagamentoSinal
        ag={reserva}
        config={config}
        onVoltar={() => { descartarReserva(reserva.id); setReservaId(null) }}
        onExpirou={() => { descartarReserva(reserva.id); setReservaId(null); setErro('O tempo para pagar o sinal acabou e o horário foi liberado. Escolha de novo.') }}
        onPago={() => confirmarSinal(reserva.id, 'pix')}
      />
    )
  } else if (pendenciasAbertasDe(db, usuario.id).length > 0) {
    const pend = pendenciasAbertasDe(db, usuario.id)
    const devido = pend.reduce((s, m) => s + m.valor, 0)
    conteudo = (
      <div className="max-w-lg mx-auto text-center py-10 bg-white border border-nude-200 rounded-3xl px-6 shadow-xl shadow-blush-700/5">
        <ShieldAlert className="mx-auto text-amber-600 mb-4" size={44} />
        <h3 className="font-display text-4xl text-cacau-900 font-semibold mb-3">Agenda bloqueada</h3>
        <p className="text-cacau-600 mb-5">
          Oi, <strong className="text-cacau-900">{primeiroNome(usuario.nome)}</strong>! Existe{pend.length > 1 ? 'm' : ''} pendência{pend.length > 1 ? 's' : ''} no seu cadastro:
        </p>
        <ul className="text-left bg-nude-50 border border-nude-200 rounded-2xl divide-y divide-nude-200 mb-6">
          {pend.map((m) => (
            <li key={m.id} className="flex justify-between gap-4 px-4 py-3 text-sm">
              <span className="text-cacau-700">{m.descricao}</span>
              <span className="text-cacau-900 tabular-nums whitespace-nowrap">{brl(m.valor)}</span>
            </li>
          ))}
        </ul>
        <div className="font-label uppercase tracking-[0.25em] text-xs text-cacau-500 mb-1">Total em aberto</div>
        <div className="font-display text-5xl font-semibold text-amber-700 mb-6">{brl(devido)}</div>
        <button onClick={() => onPagarPendencias(pend)} className="btn-primary"><QrCode size={16} /> Pagar com Pix</button>
        <p className="text-xs text-cacau-500 mt-4">Assim que o pagamento for confirmado, sua agenda é liberada na hora.</p>
      </div>
    )
  } else {
    conteudo = (
      <div className="grid lg:grid-cols-[1fr_360px] gap-10">
        <div className="space-y-10 min-w-0">
          <Passo n={1} titulo="Escolha o(s) serviço(s)">
            <div className="space-y-4">
              {CATEGORIAS.map(([cat, nomeCat]) => (
                <div key={cat}>
                  <p className="text-xs text-cacau-500 mb-2">{nomeCat}</p>
                  <div className="flex flex-wrap gap-2">
                    {servicos.filter((s) => s.categoria === cat).map((s) => {
                      const on = selecionados.includes(s.id)
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggle(s.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm transition-all cursor-pointer ${on ? 'bg-cacau-900 border-cacau-900 text-nude-50' : 'bg-white border-nude-300 text-cacau-800 hover:border-blush-500'}`}
                        >
                          {on && <Check size={14} />}
                          {s.nome}
                          <span className={on ? 'text-nude-300' : 'text-cacau-500'}>· {brl(s.preco)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Passo>

          <Passo n={2} titulo="Escolha o dia" ativo={itens.length > 0}>
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin -mx-1 px-1">
              {dias.map((iso) => {
                const lotado =
                  diaAberto(config, iso) &&
                  !slots.some((h) => slotLivre(config, h, duracao || config.slotMin, intervalosOcupados(db.agendamentos, iso), iso))
                const fechado = !diaAberto(config, iso) || diaFechado(iso) || lotado
                const d = fromISO(iso)
                const on = data === iso
                return (
                  <button
                    key={iso}
                    disabled={fechado}
                    title={lotado ? 'Sem horários livres' : undefined}
                    onClick={() => { setData(iso); setHora(null) }}
                    className={`shrink-0 w-16 py-3 rounded-2xl border flex flex-col items-center gap-0.5 transition-all cursor-pointer disabled:cursor-not-allowed ${
                      on ? 'bg-cacau-900 border-cacau-900 text-nude-50' : fechado ? 'border-nude-200 text-nude-400 line-through' : 'bg-white border-nude-300 text-cacau-800 hover:border-blush-500'
                    }`}
                  >
                    <span className="font-label text-[11px] uppercase tracking-wider">{DIAS_CURTOS[d.getDay()]}</span>
                    <span className="font-display text-2xl font-semibold leading-none">{d.getDate()}</span>
                  </button>
                )
              })}
            </div>
          </Passo>

          <Passo n={3} titulo="Escolha o horário" ativo={!!data}>
            {data && (() => {
              const livres = slots.filter((h) => slotLivre(config, h, duracao, ocupados, data))
              if (!livres.length)
                return (
                  <div className="flex items-center gap-3 text-cacau-500 py-4">
                    <CalendarX2 size={20} /> Sem horários livres para a duração escolhida ({duracaoLabel(duracao)}) neste dia.
                  </div>
                )
              return (
                <>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
                    {slots.map((h) => {
                      const livre = livres.includes(h)
                      const on = hora === h
                      // horários seguintes que ficam ocupados pela duração do atendimento
                      const coberto = hora && toMin(h) > toMin(hora) && toMin(h) < toMin(hora) + duracao
                      return (
                        <button
                          key={h}
                          disabled={!livre || coberto}
                          onClick={() => setHora(h)}
                          className={`py-2.5 rounded-xl border font-label text-sm tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed ${
                            on
                              ? 'bg-cacau-900 border-cacau-900 text-nude-50'
                              : coberto
                                ? 'bg-blush-100 border-blush-300 text-blush-700'
                                : livre
                                  ? 'bg-white border-nude-300 text-cacau-800 hover:border-blush-500'
                                  : 'border-nude-200 text-nude-400 line-through'
                          }`}
                        >
                          {h}
                        </button>
                      )
                    })}
                  </div>
                  {hora && (
                    <p className="text-sm text-cacau-600 mt-4 flex items-center gap-2">
                      <Clock size={14} className="text-blush-600" />
                      Seu atendimento: <strong className="text-cacau-900">{hora} às {fromMin(toMin(hora) + duracao)}</strong> ({duracaoLabel(duracao)})
                    </p>
                  )}
                </>
              )
            })()}
            {!data && <p className="text-cacau-500 text-sm">Selecione um dia primeiro.</p>}
          </Passo>
        </div>

        {/* Resumo */}
        <aside className="lg:sticky lg:top-28 h-fit bg-white border border-nude-200 rounded-3xl p-6 shadow-xl shadow-blush-700/5">
          <h3 className="font-label uppercase tracking-[0.2em] text-blush-600 text-sm mb-5">Resumo</h3>
          {itens.length === 0 ? (
            <p className="text-cacau-500 text-sm mb-4">Nenhum serviço selecionado.</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {itens.map((i) => (
                <li key={i.id} className="flex justify-between text-sm">
                  <span className="text-cacau-800">{i.nome}</span>
                  <span className="text-cacau-600">{brl(i.preco)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-dashed border-nude-300 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-cacau-500"><span className="flex items-center gap-1.5"><Clock size={14} /> Duração</span><span>{duracao ? duracaoLabel(duracao) : '—'}</span></div>
            <div className="flex justify-between text-cacau-500"><span>Quando</span><span className="text-cacau-800">{data ? `${dataCurta(data)}${hora ? ` · ${hora}` : ''}` : '—'}</span></div>
            <div className="flex justify-between text-cacau-500"><span>Total</span><span className="text-cacau-800">{brl(total)}</span></div>
          </div>
          <div className="mt-4 bg-blush-100/70 rounded-2xl px-4 py-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-blush-700 font-medium">Sinal ({config.sinalPct}%)</span>
              <span className="font-display text-3xl font-semibold text-cacau-900">{brl(sinal - creditoUsado)}</span>
            </div>
            {creditoUsado > 0 && (
              <div className="flex justify-between text-xs text-emerald-700 mt-1">
                <span className="flex items-center gap-1"><Wallet size={12} /> Seu crédito abatido</span>
                <span>− {brl(creditoUsado)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-cacau-500 mt-1">
              <span>Restante no dia</span>
              <span>{brl(total - sinal)}</span>
            </div>
          </div>

          <p className="text-xs text-cacau-500 mt-5">Agendando como <strong className="text-cacau-800">{usuario.nome}</strong></p>
          <label className="label mt-3">WhatsApp <span className="text-blush-600">*</span></label>
          <input className="input" type="tel" value={telefone} onChange={(e) => setTelefone(telefoneMask(e.target.value))} placeholder="(31) 99999-9999" />
          {erro && <p className="flex items-center gap-2 text-sm text-red-600 mt-3"><AlertCircle size={15} className="shrink-0" /> {erro}</p>}
          <button onClick={irParaPagamento} disabled={!itens.length || !data || !hora} className="btn-primary w-full mt-5">
            {itens.length && sinal - creditoUsado <= 0 ? <><Check size={16} /> Reservar com meu crédito</> : <><QrCode size={16} /> Pagar sinal e reservar</>}
          </button>
          <p className="text-[11px] text-cacau-500 mt-3 leading-relaxed text-center">O horário só é confirmado após o pagamento do sinal.</p>
        </aside>
      </div>
    )
  }

  return (
    <section id="agendar" className="py-24 md:py-32 bg-nude-50">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <TituloSecao sobre="Online, 24 horas" titulo="Agende seu horário" />
        {conteudo}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Pix do sinal. No esboço o pagamento é simulado; em produção a cobrança vem
// de um provedor (Mercado Pago/Asaas/Efí) com webhook confirmando sozinho.
// ---------------------------------------------------------------------------
function PagamentoSinal({ ag, config, onVoltar, onExpirou, onPago }) {
  const [agora, setAgora] = useState(Date.now())
  const [copiado, setCopiado] = useState(false)
  const restante = Math.max(0, ag.expiraEm - agora)
  const aPagar = ag.sinal.valor - (ag.sinal.creditoUsado || 0)

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (restante === 0) onExpirou()
  }, [restante, onExpirou])

  const codigo = gerarPix({ chave: config.pixChave, nome: config.pixNome, cidade: config.pixCidade, valor: aPagar, txid: `SINAL${ag.id}` })
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* navegador sem permissão de clipboard */
    }
  }
  const min = Math.floor(restante / 60000)
  const seg = Math.floor((restante % 60000) / 1000)

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-[320px_minmax(0,1fr)] bg-white border border-nude-200 rounded-3xl overflow-hidden shadow-xl shadow-blush-700/5 animate-fade-up">
      <div className="bg-cacau-900 text-nude-100 p-7 flex flex-col">
        <button onClick={onVoltar} className="self-start flex items-center gap-1.5 text-xs text-nude-300 hover:text-nude-50 cursor-pointer mb-6">
          <ArrowLeft size={14} /> Trocar horário
        </button>
        <p className="font-label uppercase tracking-[0.3em] text-[11px] text-blush-300">Sua reserva</p>
        <p className="font-display text-3xl text-nude-50 mt-2 leading-tight">{ag.servicoNomes}</p>
        <p className="text-sm text-nude-300 mt-2">{dataLonga(ag.data)} · {ag.hora} às {fromMin(toMin(ag.hora) + ag.duracao)}</p>
        <div className="mt-auto pt-8 space-y-2 text-sm">
          <div className="flex justify-between text-nude-300"><span>Total do serviço</span><span>{brl(ag.total)}</span></div>
          <div className="flex justify-between text-nude-300"><span>Restante no dia</span><span>{brl(ag.total - ag.sinal.valor)}</span></div>
          {ag.sinal.creditoUsado > 0 && <div className="flex justify-between text-emerald-300"><span>Crédito abatido</span><span>− {brl(ag.sinal.creditoUsado)}</span></div>}
          <div className="flex justify-between items-baseline border-t border-cacau-700 pt-3">
            <span className="text-nude-50">Sinal a pagar</span>
            <span className="font-display text-4xl font-semibold text-blush-300">{brl(aPagar)}</span>
          </div>
        </div>
      </div>

      <div className="p-7 text-center min-w-0">
        <div className={`flex w-fit mx-auto items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-5 ${min < 3 ? 'bg-red-50 text-red-700' : 'bg-blush-100 text-blush-700'}`}>
          <Timer size={15} /> Horário segurado por <strong className="tabular-nums">{pad(min)}:{pad(seg)}</strong>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-nude-200 w-fit mx-auto mb-4">
          <QRCodeSVG value={codigo} size={184} level="M" fgColor="#2a201d" />
        </div>
        <p className="text-xs text-cacau-500 mb-2">Abra o app do banco → Pix → Ler QR Code, ou use o copia e cola:</p>
        <div className="flex gap-2 mb-5 min-w-0">
          <div className="flex-1 min-w-0 bg-nude-50 border border-nude-300 rounded-xl px-3 py-2.5 text-xs font-mono text-cacau-600 truncate select-all text-left">{codigo}</div>
          <button onClick={copiar} className="btn-primary !px-4 !py-2 shrink-0 !text-[11px] !tracking-wider" title="Copiar">
            {copiado ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar</>}
          </button>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-cacau-600 mb-5">
          <Loader2 size={16} className="animate-spin text-blush-600" /> Aguardando pagamento...
        </div>
        <div className="border-t border-nude-200 pt-4">
          <button onClick={onPago} className="text-xs text-blush-700 hover:text-blush-600 underline underline-offset-4 cursor-pointer">
            [Esboço] Simular pagamento confirmado
          </button>
        </div>
      </div>
    </div>
  )
}

function Confirmado({ ag, config, onNovo }) {
  const msg = encodeURIComponent(
    `Oi, Ana! Acabei de reservar pelo site:\n${ag.servicoNomes}\n${dataLonga(ag.data)} às ${ag.hora}\nSinal pago: ${brl(ag.sinal.valor)}\nNome: ${ag.clienteNome}`
  )
  return (
    <div className="text-center py-6 max-w-md mx-auto animate-fade-up">
      <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
        <CalendarCheck2 className="text-emerald-600" size={30} />
      </div>
      <h3 className="font-display text-4xl text-cacau-900 font-semibold mb-2">Horário confirmado!</h3>
      <p className="text-cacau-600 mb-6">Obrigada, {primeiroNome(ag.clienteNome)}! {ag.sinal.via === 'credito' ? 'Seu crédito cobriu o sinal.' : 'Recebemos o seu sinal.'}</p>
      <div className="bg-white border border-nude-200 rounded-2xl p-5 text-left space-y-2 mb-6">
        <Linha k="Serviço" v={ag.servicoNomes} />
        <Linha k="Data" v={dataLonga(ag.data)} />
        <Linha k="Horário" v={`${ag.hora} às ${fromMin(toMin(ag.hora) + ag.duracao)}`} />
        <Linha k="Sinal pago" v={`${brl(ag.sinal.valor)}${ag.sinal.creditoUsado ? ` (${brl(ag.sinal.creditoUsado)} em crédito)` : ''}`} />
        <Linha k="A pagar no dia" v={brl(ag.total - ag.sinal.valor)} forte />
      </div>
      <p className="text-xs text-cacau-500 mb-6">
        Venha sem maquiagem nos olhos. Precisa remarcar? Cancele em "Meus horários" com {config.remarcarHoras}h de antecedência e o sinal vira crédito.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a href={`https://wa.me/${config.whatsapp}?text=${msg}`} target="_blank" rel="noreferrer" className="btn !bg-[#25D366] text-white hover:!brightness-95"><WhatsApp size={16} /> Avisar a Ana</a>
        <button onClick={onNovo} className="btn-ghost">Agendar outro</button>
      </div>
    </div>
  )
}

const Linha = ({ k, v, forte = false }) => (
  <div className="flex justify-between gap-4 text-sm">
    <span className="text-cacau-500">{k}</span>
    <span className={`text-right ${forte ? 'text-cacau-900 font-semibold' : 'text-cacau-800'}`}>{v}</span>
  </div>
)

export const GoogleG = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true" className="bg-white rounded-full p-px">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
)
