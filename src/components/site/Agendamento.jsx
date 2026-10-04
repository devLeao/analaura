import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarX2, CalendarCheck2, Clock, AlertCircle, Lock, ShieldAlert, QrCode, X } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'
import { WhatsApp } from '../ui/Icones'
import SeletorServicos, { parteDe } from '../ui/SeletorServicos'
import { useStore, pendenciasAbertasDe, servicosAtivos } from '../../store/Store'
import { brl, dataCurta, dataLonga, DIAS_CURTOS, fromISO, telefoneMask, toMin, fromMin, duracaoLabel, primeiroNome } from '../../lib/format'
import { gerarSlots, diaAberto, intervalosOcupados, slotLivre, proximosDias } from '../../lib/schedule'
import { itensDe } from '../../lib/catalogo'

function Passo({ n, titulo, children }) {
  return (
    <div className="animate-fade-up">
      <h3 className="flex items-center gap-2.5 text-sm font-medium text-cacau-900 mb-3">
        <span className="h-6 w-6 rounded-full bg-blush-100 text-blush-700 text-xs flex items-center justify-center">{n}</span>
        {titulo}
      </h3>
      {children}
    </div>
  )
}

export default function Agendamento({ servicoInicial, onLogin, onPagarPendencias }) {
  const { db, usuario, criarAgendamento } = useStore()
  const { config } = db
  const servicos = servicosAtivos(db)
  const [selecionados, setSelecionados] = useState([])
  const [data, setData] = useState(null)
  const [hora, setHora] = useState(null)
  const [telefone, setTelefone] = useState('')
  const [erro, setErro] = useState('')
  const [confirmadoId, setConfirmadoId] = useState(null)

  useEffect(() => {
    if (servicoInicial) {
      setSelecionados([servicoInicial.id])
      setHora(null)
      setConfirmadoId(null)
    }
  }, [servicoInicial])

  useEffect(() => {
    if (usuario?.telefone) setTelefone(usuario.telefone)
  }, [usuario?.id, usuario?.telefone])

  const { itens, nomes, total, duracao } = itensDe(servicos, selecionados)

  const dias = useMemo(() => proximosDias(config.diasAgendaAberta), [config])
  const slots = useMemo(() => gerarSlots(config), [config])
  const ocupados = useMemo(() => (data ? intervalosOcupados(db.agendamentos, data) : []), [db.agendamentos, data])
  const diaFechado = (iso) => db.agendamentos.some((a) => a.data === iso && a.status === 'bloqueio' && a.diaInteiro)
  const confirmado = confirmadoId ? db.agendamentos.find((a) => a.id === confirmadoId) : null

  const escolher = (vids) => {
    setSelecionados(vids)
    setHora(null)
    setErro('')
  }

  const confirmar = () => {
    if (telefone.replace(/\D/g, '').length < 11) return setErro('Informe um WhatsApp válido.')
    // revalida o horário (outra cliente pode ter pego enquanto escolhia)
    if (!slotLivre(config, hora, duracao, intervalosOcupados(db.agendamentos, data), data)) {
      setHora(null)
      return setErro('Ops! Esse horário acabou de ser ocupado.')
    }
    setErro('')
    const id = criarAgendamento({
      clienteId: usuario.id,
      clienteNome: usuario.nome,
      clienteTelefone: telefone,
      servicoIds: selecionados,
      servicoNomes: nomes,
      total,
      duracao,
      data,
      hora,
    })
    setConfirmadoId(id)
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
        <p className="text-cacau-600 mb-8 text-sm leading-relaxed">É rapidinho: entre com sua conta Google. Assim você acompanha e cancela seus horários quando precisar.</p>
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
  } else if (confirmado) {
    conteudo = <Confirmado ag={confirmado} config={config} onNovo={() => setConfirmadoId(null)} />
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
    const livres = data ? slots.filter((h) => slotLivre(config, h, duracao, ocupados, data)) : []
    conteudo = (
      <div className="grid lg:grid-cols-[1fr_340px] gap-8 lg:gap-10 items-start">
        <div className="space-y-8 min-w-0">
          <Passo n={1} titulo="Serviços">
            <SeletorServicos key={servicoInicial?.t || 0} servicos={servicos} sel={selecionados} onChange={escolher} />
          </Passo>

          {/* Os próximos passos só aparecem quando o anterior foi respondido */}
          {itens.length > 0 && (
            <Passo n={2} titulo="Dia">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1">
                {dias.map((iso) => {
                  const lotado =
                    diaAberto(config, iso) &&
                    !slots.some((h) => slotLivre(config, h, duracao, intervalosOcupados(db.agendamentos, iso), iso))
                  const fechado = !diaAberto(config, iso) || diaFechado(iso) || lotado
                  const d = fromISO(iso)
                  const on = data === iso
                  return (
                    <button
                      key={iso}
                      disabled={fechado}
                      title={lotado ? 'Sem horários livres' : undefined}
                      onClick={() => { setData(iso); setHora(null) }}
                      className={`shrink-0 w-14 py-2.5 rounded-2xl border flex flex-col items-center transition-all cursor-pointer disabled:cursor-not-allowed ${
                        on ? 'bg-cacau-900 border-cacau-900 text-nude-50' : fechado ? 'border-transparent text-nude-400' : 'bg-white border-nude-300 text-cacau-800 hover:border-blush-500'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider">{DIAS_CURTOS[d.getDay()]}</span>
                      <span className="font-display text-xl font-semibold leading-tight">{d.getDate()}</span>
                    </button>
                  )
                })}
              </div>
            </Passo>
          )}

          {itens.length > 0 && data && (
            <Passo n={3} titulo="Horário">
              {livres.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-cacau-500"><CalendarX2 size={18} /> Nenhum horário com {duracaoLabel(duracao)} livres neste dia. Tente outro.</p>
              ) : (
                <>
                  {/* Grade do dia inteiro: só dá para começar onde o serviço inteiro cabe */}
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
                          className={`py-2 rounded-xl border text-sm tabular-nums transition-all cursor-pointer disabled:cursor-not-allowed ${
                            on
                              ? 'bg-cacau-900 border-cacau-900 text-nude-50'
                              : coberto
                                ? 'bg-blush-100 border-blush-300 text-blush-700'
                                : livre
                                  ? 'bg-white border-nude-300 text-cacau-800 hover:border-blush-500'
                                  : 'border-transparent text-nude-400 line-through'
                          }`}
                        >
                          {h}
                        </button>
                      )
                    })}
                  </div>
                  {hora ? (
                    <p className="text-sm text-cacau-600 mt-3 flex items-center gap-2">
                      <Clock size={14} className="text-blush-600 shrink-0" />
                      Seu atendimento: <strong className="text-cacau-900 font-medium">{hora} às {fromMin(toMin(hora) + duracao)}</strong> ({duracaoLabel(duracao)})
                    </p>
                  ) : (
                    <p className="text-xs text-cacau-500 mt-3">
                      Escolha o horário de início. Os riscados estão ocupados ou não têm tempo para os {duracaoLabel(duracao)} do serviço.
                    </p>
                  )}
                </>
              )}
            </Passo>
          )}
        </div>

        {/* Resumo */}
        <aside className="lg:sticky lg:top-28 bg-white border border-nude-200 rounded-3xl p-6 shadow-xl shadow-blush-700/5">
          <h3 className="font-display text-2xl font-semibold text-cacau-900 mb-4">Seu horário</h3>
          {itens.length === 0 ? (
            <p className="text-sm text-cacau-500">Escolha um serviço para começar.</p>
          ) : (
            <>
              {/* Itens separados por parte, na mesma ordem do lado esquerdo */}
              <ul className="space-y-3">
                {[['cilios', 'Cílios'], ['sobrancelhas', 'Sobrancelhas']].map(([parte, rotulo]) => {
                  const it = itens.find((i) => parteDe(servicos, i.vid) === parte)
                  if (!it) return null
                  return (
                    <li key={parte}>
                      <div className="text-[10px] font-label uppercase tracking-[0.2em] text-blush-600">{rotulo}</div>
                      <div className="flex items-center gap-2 text-sm mt-0.5">
                        <span className="flex-1 text-cacau-800">{it.nome}</span>
                        <span className="text-cacau-600 tabular-nums whitespace-nowrap">{brl(it.preco)}</span>
                        <button onClick={() => escolher(selecionados.filter((v) => v !== it.vid))} className="p-1 -mr-1 rounded-full text-cacau-500 hover:text-red-600 hover:bg-red-50 cursor-pointer" aria-label={`Remover ${it.nome}`}>
                          <X size={14} />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="flex items-center gap-2 text-sm text-cacau-600 mt-3">
                <Clock size={14} className="text-blush-600 shrink-0" />
                {data ? `${dataCurta(data)}${hora ? `, ${hora} às ${fromMin(toMin(hora) + duracao)}` : ' · escolha o horário'}` : `${duracaoLabel(duracao)} · escolha o dia`}
              </div>
              <div className="flex justify-between items-baseline border-t border-dashed border-nude-300 mt-4 pt-4">
                <span className="text-sm text-cacau-600">Total no dia</span>
                <span className="font-display text-3xl font-semibold text-cacau-900">{brl(total)}</span>
              </div>
            </>
          )}

          {hora && (
            <div className="mt-5 animate-fade-up">
              <label className="label">Seu WhatsApp</label>
              <input className="input" type="tel" value={telefone} onChange={(e) => setTelefone(telefoneMask(e.target.value))} placeholder="(31) 99999-9999" />
            </div>
          )}
          {erro && <p className="flex items-center gap-2 text-sm text-red-600 mt-3"><AlertCircle size={15} className="shrink-0" /> {erro}</p>}
          <button onClick={confirmar} disabled={!itens.length || !data || !hora} className="btn-primary w-full mt-5">Confirmar</button>
          <p className="text-[11px] text-cacau-500 mt-3 text-center">
            Paga no dia · cancele grátis até {config.antecedenciaCancelHoras}h antes · falta gera multa de {config.multaPct}%
          </p>
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

function Confirmado({ ag, config, onNovo }) {
  const msg = encodeURIComponent(`Oi, Ana! Acabei de agendar pelo site:\n${ag.servicoNomes}\n${dataLonga(ag.data)} às ${ag.hora}\nNome: ${ag.clienteNome}`)
  return (
    <div className="text-center py-6 max-w-md mx-auto animate-fade-up">
      <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5">
        <CalendarCheck2 className="text-emerald-600" size={30} />
      </div>
      <h3 className="font-display text-4xl text-cacau-900 font-semibold mb-2">Horário confirmado!</h3>
      <p className="text-cacau-600 mb-6">Obrigada, {primeiroNome(ag.clienteNome)}! Te espero no dia e horário abaixo.</p>
      <div className="bg-white border border-nude-200 rounded-2xl p-5 text-left space-y-2 mb-6">
        <Linha k="Serviço" v={ag.servicoNomes} />
        <Linha k="Data" v={dataLonga(ag.data)} />
        <Linha k="Horário" v={`${ag.hora} às ${fromMin(toMin(ag.hora) + ag.duracao)}`} />
        <Linha k="Valor (pago no dia)" v={brl(ag.total)} forte />
      </div>
      <p className="text-xs text-cacau-500 mb-6">
        Venha sem maquiagem nos olhos. Precisa desmarcar? Cancele em "Meus horários" até {config.antecedenciaCancelHoras}h antes. Faltas sem aviso geram multa de {config.multaPct}%.
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
