import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, HandCoins, Wallet, Gauge, ArrowRight, BellRing, AlertTriangle, Sparkles, Cake, CheckCircle2, CalendarPlus } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Cabecalho, Kpi, Vazio, Botao, Avatar } from '../../components/admin/ui'
import { AgendamentoCard, useAcoesAgendamento, linkWhats, mensagens } from '../../components/admin/AgendamentoCard'
import { CardGrafico, GraficoColunas } from '../../components/admin/Graficos'
import ModalEncaixe from '../../components/admin/ModalEncaixe'
import FichaCliente from '../../components/admin/FichaCliente'
import { WhatsApp } from '../../components/ui/Icones'
import { calcularStats, variacao, manutencaoVencendo, aniversariantes } from '../../lib/stats'
import { brl, toISO, addDays, DIAS_CURTOS, fromISO, dataCurta, toMin, primeiroNome, dataLonga } from '../../lib/format'
import { diaAberto } from '../../lib/schedule'

export default function Inicio() {
  const { db } = useStore()
  const { config } = db
  const [onAcao, modais] = useAcoesAgendamento()
  const [encaixe, setEncaixe] = useState(false)
  const [ficha, setFicha] = useState(null)
  const agora = new Date()
  const hoje = toISO(agora)

  const doDia = db.agendamentos.filter((a) => a.data === hoje && !['cancelado', 'bloqueio'].includes(a.status)).sort((a, b) => a.hora.localeCompare(b.hora))
  const atendidas = doDia.filter((a) => a.status === 'concluido')
  const previstoHoje = doDia.filter((a) => a.status !== 'falta').reduce((s, a) => s + a.total, 0)

  // Mês atual vs mesmo período do mês anterior
  const iniMes = toISO(new Date(agora.getFullYear(), agora.getMonth(), 1))
  const iniMesAnt = toISO(new Date(agora.getFullYear(), agora.getMonth() - 1, 1))
  const fimMesAnt = toISO(new Date(agora.getFullYear(), agora.getMonth() - 1, Math.min(agora.getDate(), new Date(agora.getFullYear(), agora.getMonth(), 0).getDate())))
  const mes = calcularStats(db, iniMes, hoje)
  const varMes = variacao(mes.faturamento, calcularStats(db, iniMesAnt, fimMesAnt).faturamento)

  // Ocupação dos próximos 7 dias abertos
  const prox7 = Array.from({ length: 7 }, (_, i) => toISO(addDays(agora, i))).filter((iso) => diaAberto(config, iso))
  const minDia = toMin(config.fecha) - toMin(config.abre) - (toMin(config.almocoFim) - toMin(config.almocoInicio))
  const minOcup = db.agendamentos.filter((a) => prox7.includes(a.data) && a.status === 'agendado').reduce((s, a) => s + a.duracao, 0)
  const ocupacao = prox7.length ? Math.min(1, minOcup / (minDia * prox7.length)) : 0

  const ultimos7 = calcularStats(db, toISO(addDays(agora, -6)), hoje).porDia

  // Lista de atenção
  const amanha = toISO(addDays(agora, 1))
  const deAmanha = db.agendamentos.filter((a) => a.data === amanha && a.status === 'agendado').sort((a, b) => a.hora.localeCompare(b.hora))
  const pendencias = db.pendencias.filter((m) => m.status === 'aberta')
  const manutencao = manutencaoVencendo(db)
  const aniver = aniversariantes(db, 7)
  const tudoEmDia = !deAmanha.length && !pendencias.length && !manutencao.length && !aniver.length

  const saudacao = agora.getHours() < 12 ? 'Bom dia' : agora.getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  const proxima = doDia.find((a) => a.status === 'agendado' && toMin(a.hora) + a.duracao > agora.getHours() * 60 + agora.getMinutes())
  const site = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <>
      <Cabecalho
        titulo={`${saudacao}, Ana`}
        sub={diaAberto(config, hoje) ? `${doDia.length} cliente${doDia.length === 1 ? '' : 's'} hoje · ${doDia.filter((a) => a.status === 'agendado').length} ainda por atender` : 'Hoje o estúdio está fechado. Bom descanso!'}
      >
        <Botao onClick={() => setEncaixe(true)}><CalendarPlus size={16} /> Agendar cliente</Botao>
        <Link to="/admin/agenda" className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-cacau-900 text-nude-50 font-medium hover:bg-blush-700">
          Abrir agenda <ArrowRight size={16} />
        </Link>
      </Cabecalho>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Kpi icone={CalendarCheck} rotulo="Atendimentos hoje" valor={`${atendidas.length} de ${doDia.length}`} detalhe={proxima ? `Próxima: ${proxima.hora} · ${primeiroNome(proxima.clienteNome)}` : 'nenhuma por vir'} />
        <Kpi icone={HandCoins} rotulo="Previsto hoje" valor={brl(previstoHoje)} detalhe={`${brl(atendidas.reduce((s, a) => s + a.total, 0))} já recebido`} tom="info" />
        <Kpi icone={Wallet} rotulo="Faturamento do mês" valor={brl(mes.faturamento)}
          detalhe={varMes == null ? `${mes.concluidos.length} atendimentos` : `${varMes >= 0 ? '↑' : '↓'} ${Math.abs(Math.round(varMes * 100))}% vs. mês passado`} tom="bom" />
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

          {deAmanha.length > 0 && (
            <Bloco icone={BellRing} cor="text-violet-700 bg-violet-50" titulo="Lembrar as clientes de amanhã" n={deAmanha.length} sub="Um lembrete evita falta">
              {deAmanha.slice(0, 5).map((a) => (
                <Item key={a.id} nome={a.clienteNome} onNome={() => setFicha(a.clienteId)} linha={`${a.hora} · ${a.servicoNomes}`}>
                  <a href={linkWhats(a.clienteTelefone, mensagens.lembrete(a))} target="_blank" rel="noreferrer" className="p-2 rounded-full text-[#1fa855] hover:bg-nude-100" title="Lembrete no WhatsApp"><WhatsApp size={17} /></a>
                </Item>
              ))}
            </Bloco>
          )}

          {pendencias.length > 0 && (
            <Bloco icone={AlertTriangle} cor="text-red-600 bg-red-50" titulo="Multas e débitos em aberto" n={pendencias.length} sub={`${brl(pendencias.reduce((s, m) => s + m.valor, 0))} a receber`} link="/admin/financeiro?aba=pendencias">
              {pendencias.slice(0, 3).map((m) => (
                <Item key={m.id} nome={m.clienteNome} onNome={() => setFicha(m.clienteId)} linha={m.descricao}>
                  <span className="text-sm font-semibold text-cacau-900 tabular-nums">{brl(m.valor)}</span>
                </Item>
              ))}
            </Bloco>
          )}

          {manutencao.length > 0 && (
            <Bloco icone={Sparkles} cor="text-blush-700 bg-blush-100" titulo="Manutenção vencendo" n={manutencao.length} sub="Perto do prazo do modelo e sem horário marcado">
              {manutencao.slice(0, 5).map((c) => {
                const msg = `Oi, ${primeiroNome(c.nome)}! Já faz ${c.dias} dias do seu ${c.ultimaCiliosItem.base.nome}. Bora marcar a manutenção pra ele continuar lindo? Os horários estão aqui: ${site}`
                return (
                  <Item key={c.id} nome={c.nome} onNome={() => setFicha(c.id)} linha={`${c.dias} de ${c.prazoManutencao} dias · ${c.ultimaCiliosItem.base.nome}`} alerta={c.dias > c.prazoManutencao}>
                    {c.telefone && <a href={linkWhats(c.telefone, msg)} target="_blank" rel="noreferrer" className="p-2 rounded-full text-[#1fa855] hover:bg-nude-100" title="Lembrar no WhatsApp"><WhatsApp size={17} /></a>}
                  </Item>
                )
              })}
            </Bloco>
          )}

          {aniver.length > 0 && (
            <Bloco icone={Cake} cor="text-amber-700 bg-amber-50" titulo="Aniversariantes da semana" n={aniver.length}>
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
