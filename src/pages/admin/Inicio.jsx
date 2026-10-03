import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, HandCoins, Wallet, Gauge, ArrowRight, Hourglass, AlertTriangle, Sparkles, Cake, CheckCircle2, CalendarPlus } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Cabecalho, Kpi, Vazio, Botao, Avatar } from '../../components/admin/ui'
import { AgendamentoCard, useAcoesAgendamento, linkWhats, mensagens } from '../../components/admin/AgendamentoCard'
import { CardGrafico, GraficoColunas } from '../../components/admin/Graficos'
import ModalEncaixe from '../../components/admin/ModalEncaixe'
import FichaCliente from '../../components/admin/FichaCliente'
import { WhatsApp } from '../../components/ui/Icones'
import { calcularStats, movimentacoes, manutencaoVencendo, aniversariantes } from '../../lib/stats'
import { brl, toISO, addDays, DIAS_CURTOS, fromISO, dataCurta, toMin, primeiroNome, dataLonga } from '../../lib/format'
import { diaAberto, reservaExpirada } from '../../lib/schedule'

export default function Inicio() {
  const { db } = useStore()
  const { config } = db
  const [onAcao, modais] = useAcoesAgendamento()
  const [encaixe, setEncaixe] = useState(false)
  const [ficha, setFicha] = useState(null)
  const agora = new Date()
  const hoje = toISO(agora)

  const doDia = db.agendamentos.filter((a) => a.data === hoje && !['cancelado', 'bloqueio'].includes(a.status) && !reservaExpirada(a)).sort((a, b) => a.hora.localeCompare(b.hora))
  const atendidas = doDia.filter((a) => a.status === 'concluido')
  const aReceberHoje = doDia.filter((a) => a.status === 'confirmado').reduce((s, a) => s + a.total - a.sinal.valor, 0)

  const iniMes = toISO(new Date(agora.getFullYear(), agora.getMonth(), 1))
  const recebidoMes = movimentacoes(db, iniMes, hoje).reduce((s, m) => s + m.valor, 0)
  const mes = calcularStats(db, iniMes, hoje)

  // Ocupação dos próximos 7 dias abertos
  const prox7 = Array.from({ length: 7 }, (_, i) => toISO(addDays(agora, i))).filter((iso) => diaAberto(config, iso))
  const minDia = toMin(config.fecha) - toMin(config.abre) - (toMin(config.almocoFim) - toMin(config.almocoInicio))
  const minOcup = db.agendamentos.filter((a) => prox7.includes(a.data) && ['confirmado', 'aguardando_sinal'].includes(a.status) && !a.diaInteiro).reduce((s, a) => s + a.duracao, 0)
  const ocupacao = prox7.length ? Math.min(1, minOcup / (minDia * prox7.length)) : 0

  const ultimos7 = calcularStats(db, toISO(addDays(agora, -6)), hoje).porDia

  // Lista de atenção
  const aguardando = db.agendamentos.filter((a) => a.status === 'aguardando_sinal' && !reservaExpirada(a) && a.data >= hoje).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
  const pendencias = db.pendencias.filter((m) => m.status === 'aberta')
  const manutencao = manutencaoVencendo(db)
  const aniver = aniversariantes(db, 7)
  const tudoEmDia = !aguardando.length && !pendencias.length && !manutencao.length && !aniver.length

  const saudacao = agora.getHours() < 12 ? 'Bom dia' : agora.getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  const proxima = doDia.find((a) => a.status === 'confirmado' && toMin(a.hora) + a.duracao > agora.getHours() * 60 + agora.getMinutes())
  const site = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <>
      <Cabecalho
        titulo={`${saudacao}, Ana`}
        sub={diaAberto(config, hoje) ? `${doDia.length} cliente${doDia.length === 1 ? '' : 's'} hoje · ${doDia.length - atendidas.length} ainda por atender` : 'Hoje o estúdio está fechado. Bom descanso!'}
      >
        <Botao onClick={() => setEncaixe(true)}><CalendarPlus size={16} /> Agendar cliente</Botao>
        <Link to="/admin/agenda" className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-cacau-900 text-nude-50 font-medium hover:bg-blush-700">
          Abrir agenda <ArrowRight size={16} />
        </Link>
      </Cabecalho>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Kpi icone={CalendarCheck} rotulo="Atendimentos hoje" valor={`${atendidas.length} de ${doDia.length}`} detalhe={proxima ? `Próxima: ${proxima.hora} · ${primeiroNome(proxima.clienteNome)}` : 'nenhuma por vir'} />
        <Kpi icone={HandCoins} rotulo="A receber hoje" valor={brl(aReceberHoje)} detalhe="restante das confirmadas" tom="info" />
        <Kpi icone={Wallet} rotulo="Recebido no mês" valor={brl(recebidoMes)} detalhe={`${mes.concluidos.length} atendimentos · sinais + restantes`} tom="bom" />
        <Kpi icone={Gauge} rotulo="Agenda dos próximos 7 dias" valor={`${Math.round(ocupacao * 100)}% cheia`} detalhe={`${prox7.length} dias abertos`} tom={ocupacao > 0.8 ? 'alerta' : 'neutro'} />
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <section className="min-w-0 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-cacau-900">Agenda de hoje</h2>
              <span className="text-xs text-cacau-500 first-letter:uppercase">{dataLonga(hoje)}</span>
            </div>
            <div className="space-y-2">
              {doDia.length === 0 ? (
                <div className="card"><Vazio texto={diaAberto(config, hoje) ? 'Nenhum horário marcado para hoje.' : 'Fechado hoje.'} /></div>
              ) : (
                doDia.map((a) => <AgendamentoCard key={a.id} ag={a} onAcao={onAcao} compacto />)
              )}
            </div>
          </div>

          <CardGrafico
            titulo="Faturamento · últimos 7 dias"
            sub="Atendimentos concluídos"
            tabela={{ colunas: ['Dia', 'Faturamento', 'Atendimentos'], linhas: ultimos7.map((d) => [dataCurta(d.data), brl(d.faturamento), d.atendimentos]) }}
          >
            <GraficoColunas
              dados={ultimos7}
              x="data"
              y="faturamento"
              altura={190}
              formatarY={(v) => brl(v)}
              formatarTick={(v) => `R$${v}`}
              tickX={(iso) => DIAS_CURTOS[fromISO(iso).getDay()]}
              rotuloTooltip={(iso, p) => `${dataCurta(iso)} · ${p.atendimentos} atendimento(s)`}
            />
          </CardGrafico>
        </section>

        {/* Lista de atenção: o que precisa de uma ação da Ana */}
        <aside className="space-y-4 min-w-0">
          <h2 className="text-sm font-semibold text-cacau-900">Precisa da sua atenção</h2>
          {tudoEmDia && (
            <div className="card p-6 text-center">
              <CheckCircle2 className="mx-auto text-emerald-600 mb-2" size={28} />
              <p className="text-sm text-cacau-600">Tudo em dia por aqui!</p>
            </div>
          )}

          {aguardando.length > 0 && (
            <Bloco icone={Hourglass} cor="text-amber-700 bg-amber-50" titulo="Aguardando o sinal" n={aguardando.length} sub="Horário segurado, falta o Pix">
              {aguardando.slice(0, 4).map((a) => (
                <Item key={a.id} nome={a.clienteNome} onNome={() => setFicha(a.clienteId)} linha={`${dataCurta(a.data)} às ${a.hora} · sinal ${brl(a.sinal.valor)}`}>
                  <a href={linkWhats(a.clienteTelefone, mensagens.cobrarSinal(a, config))} target="_blank" rel="noreferrer" className="p-2 rounded-full text-[#1fa855] hover:bg-nude-100" title="Cobrar no WhatsApp"><WhatsApp size={17} /></a>
                  <Botao variante="sec" className="!px-2.5 !py-1 !text-xs" onClick={() => onAcao('sinal', a)}>Recebi</Botao>
                </Item>
              ))}
            </Bloco>
          )}

          {pendencias.length > 0 && (
            <Bloco icone={AlertTriangle} cor="text-red-600 bg-red-50" titulo="Clientes devendo" n={pendencias.length} sub={`${brl(pendencias.reduce((s, m) => s + m.valor, 0))} em aberto`} link="/admin/financeiro?aba=pendencias">
              {pendencias.slice(0, 3).map((m) => (
                <Item key={m.id} nome={m.clienteNome} onNome={() => setFicha(m.clienteId)} linha={m.descricao}>
                  <span className="text-sm font-semibold text-cacau-900 tabular-nums">{brl(m.valor)}</span>
                </Item>
              ))}
            </Bloco>
          )}

          {manutencao.length > 0 && (
            <Bloco icone={Sparkles} cor="text-violet-700 bg-violet-50" titulo="Manutenção vencendo" n={manutencao.length} sub={`Extensão há ~${config.manutencaoDias} dias e sem horário marcado`}>
              {manutencao.slice(0, 5).map((c) => {
                const msg = `Oi, ${primeiroNome(c.nome)}! Já faz ${c.dias} dias da sua extensão. Bora marcar a manutenção pra ela continuar linda? Os horários estão aqui: ${site}`
                return (
                  <Item key={c.id} nome={c.nome} onNome={() => setFicha(c.id)} linha={`${c.dias} dias · ${c.ultimaExtensaoServico}`} alerta={c.dias > config.manutencaoDias}>
                    {c.telefone && <a href={linkWhats(c.telefone, msg)} target="_blank" rel="noreferrer" className="p-2 rounded-full text-[#1fa855] hover:bg-nude-100" title="Lembrar no WhatsApp"><WhatsApp size={17} /></a>}
                  </Item>
                )
              })}
            </Bloco>
          )}

          {aniver.length > 0 && (
            <Bloco icone={Cake} cor="text-blush-700 bg-blush-100" titulo="Aniversariantes da semana" n={aniver.length}>
              {aniver.map((c) => (
                <Item key={c.id} nome={c.nome} onNome={() => setFicha(c.id)} linha={c.emDias === 0 ? 'Hoje!' : `${DIAS_CURTOS[fromISO(c.data).getDay()]}, ${dataCurta(c.data)}`}>
                  {c.telefone && (
                    <a href={linkWhats(c.telefone, `Feliz aniversário, ${primeiroNome(c.nome)}! Que seu ano seja lindo. Um beijo da Ana!`)} target="_blank" rel="noreferrer" className="p-2 rounded-full text-[#1fa855] hover:bg-nude-100" title="Dar parabéns">
                      <WhatsApp size={17} />
                    </a>
                  )}
                </Item>
              ))}
            </Bloco>
          )}
        </aside>
      </div>

      {modais}
      {encaixe && <ModalEncaixe onFechar={() => setEncaixe(false)} />}
      {ficha && <FichaCliente clienteId={ficha} onFechar={() => setFicha(null)} />}
    </>
  )
}

function Bloco({ icone: Icone, cor, titulo, sub, n, link, children }) {
  return (
    <section className="card p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${cor}`}><Icone size={16} /></span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-cacau-900">{titulo} <span className="text-cacau-500 font-normal">· {n}</span></h3>
          {sub && <p className="text-xs text-cacau-500">{sub}</p>}
        </div>
        {link && <Link to={link} className="text-xs text-blush-700 hover:underline shrink-0">Ver todas</Link>}
      </div>
      <ul className="divide-y divide-nude-200">{children}</ul>
    </section>
  )
}

function Item({ nome, linha, onNome, alerta, children }) {
  return (
    <li className="py-2 flex items-center gap-3">
      <Avatar nome={nome} className="!h-8 !w-8 !text-[10px]" />
      <div className="flex-1 min-w-0">
        <button onClick={onNome} className="text-sm text-cacau-900 truncate block max-w-full text-left hover:text-blush-700 cursor-pointer">{nome}</button>
        <div className={`text-xs truncate ${alerta ? 'text-red-600' : 'text-cacau-500'}`}>{linha}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">{children}</div>
    </li>
  )
}
