import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Wallet, Sparkles, Ticket, Users, UserX, HandCoins, Download, Receipt, CheckCircle2, Ban, Plus, Zap, ArrowDownLeft } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Cabecalho, Kpi, Delta, Abas, Botao, Vazio, Status, Avatar, Etiqueta } from '../../components/admin/ui'
import { CardGrafico, GraficoColunas, BarrasRanking, MapaCalor, COR } from '../../components/admin/Graficos'
import ModalDebito from '../../components/admin/ModalDebito'
import { linkWhats } from '../../components/admin/AgendamentoCard'
import { WhatsApp } from '../../components/ui/Icones'
import Modal from '../../components/ui/Modal'
import { calcularStats, variacao, movimentacoes, FORMAS_PAGAMENTO } from '../../lib/stats'
import { brl, toISO, fromISO, addDays, DIAS_CURTOS, dataCurta, dataBR, toMin, primeiroNome } from '../../lib/format'
import { diasAbertos, horarioDaSemana } from '../../lib/schedule'

const PRESETS = [
  ['7d', '7 dias'],
  ['30d', '30 dias'],
  ['mes', 'Este mês'],
  ['mesAnt', 'Mês passado'],
  ['90d', '90 dias'],
  ['custom', 'Escolher datas'],
]

function intervalo(preset, custom) {
  const h = new Date()
  const hoje = toISO(h)
  switch (preset) {
    case '7d': return [toISO(addDays(h, -6)), hoje]
    case '30d': return [toISO(addDays(h, -29)), hoje]
    case 'mes': return [toISO(new Date(h.getFullYear(), h.getMonth(), 1)), hoje]
    case 'mesAnt': return [toISO(new Date(h.getFullYear(), h.getMonth() - 1, 1)), toISO(new Date(h.getFullYear(), h.getMonth(), 0))]
    case '90d': return [toISO(addDays(h, -89)), hoje]
    default: return custom
  }
}

const pct = (v) => `${(v * 100).toFixed(1).replace('.', ',')}%`

function baixarCSV(nome, linhas) {
  const csv = '﻿' + linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const el = document.createElement('a')
  el.href = url
  el.download = nome
  el.click()
  URL.revokeObjectURL(url)
}

export default function Financeiro() {
  const { db } = useStore()
  const [params, setParams] = useSearchParams()
  const aba = params.get('aba') || 'resumo'
  const setAba = (a) => setParams(a === 'resumo' ? {} : { aba: a }, { replace: true })
  const [preset, setPreset] = useState('30d')
  const [custom, setCustom] = useState([toISO(addDays(new Date(), -13)), toISO(new Date())])
  const [ini, fim] = intervalo(preset, custom)
  const abertas = db.pendencias.filter((m) => m.status === 'aberta')

  return (
    <>
      <Cabecalho titulo="Financeiro" sub={aba === 'pendencias' ? 'Multas por falta e valores que as clientes ficaram devendo' : `${dataBR(ini)} a ${dataBR(fim)}`} />
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
        <Abas valor={aba} onChange={setAba} abas={[['resumo', 'Resumo'], ['caixa', 'Entradas e saídas'], ['pendencias', 'Multas e débitos', abertas.length]]} />
        {aba !== 'pendencias' && (
          <div className="flex flex-col md:flex-row md:items-center gap-3 lg:ml-auto">
            <Abas valor={preset} onChange={setPreset} abas={PRESETS} />
            {preset === 'custom' && (
              <div className="flex items-center gap-2">
                <input type="date" className="input !w-auto !py-1.5" value={custom[0]} max={custom[1]} onChange={(e) => e.target.value && setCustom([e.target.value, custom[1]])} />
                <span className="text-cacau-500 text-sm">até</span>
                <input type="date" className="input !w-auto !py-1.5" value={custom[1]} min={custom[0]} onChange={(e) => e.target.value && setCustom([custom[0], e.target.value])} />
              </div>
            )}
          </div>
        )}
      </div>
      {aba === 'resumo' && <Resumo ini={ini} fim={fim} />}
      {aba === 'caixa' && <Caixa ini={ini} fim={fim} />}
      {aba === 'pendencias' && <Pendencias />}
    </>
  )
}

// ---------------------------------------------------------------------------
function Resumo({ ini, fim }) {
  const { db } = useStore()
  const dias = Math.round((fromISO(fim) - fromISO(ini)) / 86400000) + 1
  const antFim = toISO(addDays(fromISO(ini), -1))
  const antIni = toISO(addDays(fromISO(ini), -dias))
  const s = useMemo(() => calcularStats(db, ini, fim), [db, ini, fim])
  const a = useMemo(() => calcularStats(db, antIni, antFim), [db, antIni, antFim])
  const caixa = useMemo(() => movimentacoes(db, ini, fim).reduce((x, m) => x + m.valor, 0), [db, ini, fim])
  // Tudo que já está marcado daqui pra frente (independe do período escolhido)
  const hoje = toISO(new Date())
  const futuros = db.agendamentos.filter((x) => x.data >= hoje && x.status === 'agendado')
  const aReceber = futuros.reduce((x, g) => x + g.total, 0)

  // Para períodos longos, agrupa por semana
  const porSemana = dias > 45
  const serie = porSemana
    ? Object.values(
        s.porDia.reduce((acc, d) => {
          const dt = fromISO(d.data)
          const chave = toISO(addDays(dt, -((dt.getDay() + 6) % 7)))
          acc[chave] ??= { data: chave, faturamento: 0, atendimentos: 0 }
          acc[chave].faturamento += d.faturamento
          acc[chave].atendimentos += d.atendimentos
          return acc
        }, {})
      )
    : s.porDia

  const horas = []
  // do horário que abre mais cedo ao que fecha mais tarde na semana
  const abertos = diasAbertos(db.config).map((d) => horarioDaSemana(db.config, d))
  const hIni = Math.min(...abertos.map((h) => toMin(h.abre))) / 60
  const hFim = Math.max(...abertos.map((h) => toMin(h.fecha))) / 60
  for (let h = Math.floor(hIni); h < Math.ceil(hFim); h++) horas.push(h)
  const CATS = [['cilios', 'Cílios', COR.serie], ['sobrancelhas', 'Sobrancelhas', '#dcc8b8'], ['remocao', 'Remoção', '#8a736b']]
  const totalCat = CATS.reduce((x, [k]) => x + (s.porCategoria[k] || 0), 0)
  const totalCilios = s.cilios.aplicacoes + s.cilios.manutencoes
  const formas = Object.entries(s.formas).sort((x, y) => y[1] - x[1])

  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Kpi icone={Wallet} rotulo="Faturamento" valor={brl(s.faturamento)} detalhe={<Delta v={variacao(s.faturamento, a.faturamento)} />} tom="bom" />
        <Kpi icone={HandCoins} rotulo="Entrou no caixa" valor={brl(caixa)} detalhe="atendimentos + multas pagas" tom="info" />
        <Kpi icone={Sparkles} rotulo="Atendimentos" valor={s.concluidos.length} detalhe={<Delta v={variacao(s.concluidos.length, a.concluidos.length)} />} />
        <Kpi icone={Ticket} rotulo="Ticket médio" valor={brl(s.ticket)} detalhe={<Delta v={variacao(s.ticket, a.ticket)} />} />
        <Kpi icone={Users} rotulo="Clientes atendidas" valor={s.atendidas} detalhe={`${s.novas} novas · ${s.recorrentes} que voltaram`} />
        <Kpi icone={UserX} rotulo="Faltas" valor={`${s.faltas.length} · ${pct(s.taxaFalta)}`} detalhe={<Delta v={variacao(s.faltas.length, a.faltas.length)} menorMelhor />} tom="critico" />
        <Kpi icone={Receipt} rotulo="Multas recebidas" valor={brl(s.multasRecebidas)} detalhe={`${brl(s.multasGeradas)} geradas · ${brl(s.perdaFaltas)} perdidos com faltas`} tom="alerta" />
        <Kpi icone={Wallet} rotulo="A receber da agenda futura" valor={brl(aReceber)} detalhe={`${futuros.length} horário(s) marcado(s) a partir de hoje`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 mb-6 items-start">
        <div className="lg:col-span-2 min-w-0">
          <CardGrafico
            titulo={`Faturamento por ${porSemana ? 'semana' : 'dia'}`}
            sub="Somente atendimentos concluídos"
            tabela={{ colunas: [porSemana ? 'Semana de' : 'Dia', 'Faturamento', 'Atendimentos'], linhas: serie.map((d) => [dataCurta(d.data), brl(d.faturamento), d.atendimentos]) }}
          >
            <GraficoColunas
              dados={serie}
              x="data"
              y="faturamento"
              altura={260}
              formatarY={(v) => brl(v)}
              formatarTick={(v) => (v >= 1000 ? `R$${(v / 1000).toFixed(1).replace('.', ',')}k` : `R$${v}`)}
              tickX={(iso) => dataCurta(iso)}
              rotuloTooltip={(iso, p) => `${porSemana ? 'Semana de ' : `${DIAS_CURTOS[fromISO(iso).getDay()]}, `}${dataCurta(iso)} · ${p.atendimentos} atendimento(s)`}
            />
          </CardGrafico>
        </div>

        <section className="card p-4 sm:p-5 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-cacau-900">Cílios, sobrancelhas e remoção</h3>
            <p className="text-xs text-cacau-500 mt-0.5 mb-4">Participação no faturamento</p>
            {totalCat === 0 ? <Vazio texto="Sem dados no período." /> : (
              <>
                <div className="flex h-3 rounded-full overflow-hidden gap-[2px] mb-3">
                  {CATS.map(([k, , cor]) => <div key={k} style={{ width: `${((s.porCategoria[k] || 0) / totalCat) * 100}%`, background: cor }} />)}
                </div>
                <ul className="space-y-1.5 text-sm">
                  {CATS.map(([k, nome, cor]) => (
                    <li key={k} className="flex justify-between">
                      <span className="flex items-center gap-2 text-cacau-600"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: cor }} />{nome}</span>
                      <span className="tabular-nums text-cacau-900">{brl(s.porCategoria[k] || 0)} <span className="text-cacau-500 text-xs">{pct((s.porCategoria[k] || 0) / totalCat)}</span></span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {totalCilios > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-cacau-900">Cílios: aplicação x manutenção</h3>
              <p className="text-xs text-cacau-500 mt-0.5 mb-3">{s.cilios.marrom} em marrom</p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-nude-50 rounded-2xl p-3"><div className="text-[11px] text-cacau-500">Aplicações</div><div className="font-semibold text-cacau-900">{s.cilios.aplicacoes} <span className="text-xs text-cacau-500 font-normal">{pct(s.cilios.aplicacoes / totalCilios)}</span></div></div>
                <div className="bg-nude-50 rounded-2xl p-3"><div className="text-[11px] text-cacau-500">Manutenções</div><div className="font-semibold text-cacau-900">{s.cilios.manutencoes} <span className="text-xs text-cacau-500 font-normal">{pct(s.cilios.manutencoes / totalCilios)}</span></div></div>
              </div>
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-cacau-900">Formas de pagamento</h3>
            <p className="text-xs text-cacau-500 mt-0.5 mb-4">Atendimentos concluídos</p>
            {formas.length === 0 ? <Vazio texto="Sem dados no período." /> : (
              <BarrasRanking itens={formas} valor={(f) => f[1]} rotulo={(f) => FORMAS_PAGAMENTO[f[0]] || f[0]} formatar={brl} />
            )}
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        <CardGrafico titulo="Serviços que mais faturam" sub="Receita · quantidade" tabela={{ colunas: ['Serviço', 'Qtd', 'Receita'], linhas: s.porServico.map((x) => [x.nome, x.qtd, brl(x.receita)]) }}>
          {s.porServico.length ? <BarrasRanking itens={s.porServico} valor={(x) => x.receita} rotulo={(x) => x.nome} formatar={brl} extra={(x) => `${x.qtd}x`} /> : <Vazio texto="Sem atendimentos no período." />}
        </CardGrafico>
        <CardGrafico titulo="Movimento por dia da semana" sub="Atendimentos concluídos" tabela={{ colunas: ['Dia', 'Atendimentos', 'Faturamento'], linhas: s.porDiaSemana.map((d) => [DIAS_CURTOS[d.dia], d.atendimentos, brl(d.faturamento)]) }}>
          <GraficoColunas
            dados={s.porDiaSemana.filter((d) => diasAbertos(db.config).includes(d.dia) || d.atendimentos)}
            x="dia" y="atendimentos" altura={240}
            formatarY={(v) => `${v} atendimentos`} formatarTick={(v) => v}
            tickX={(d) => DIAS_CURTOS[d]} rotuloTooltip={(d, p) => `${DIAS_CURTOS[d]} · ${brl(p.faturamento)}`}
          />
        </CardGrafico>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-4 sm:gap-6">
        <CardGrafico titulo="Horários mais procurados" sub="Atendimentos por dia da semana e hora de início">
          <MapaCalor heat={s.heat} dias={diasAbertos(db.config)} horas={horas} nomesDias={DIAS_CURTOS} />
        </CardGrafico>
        <section className="card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-cacau-900 mb-3">Clientes que mais gastaram</h3>
          {s.topGasto.length === 0 ? <Vazio texto="Sem dados." /> : (
            <ol className="divide-y divide-nude-200">
              {s.topGasto.map((c, i) => (
                <li key={c.id} className="py-2 flex items-center gap-3 text-sm">
                  <span className="text-cacau-500 tabular-nums w-4">{i + 1}.</span>
                  <Avatar nome={c.nome} className="!h-7 !w-7 !text-[10px]" />
                  <span className="flex-1 text-cacau-800 truncate">{c.nome}</span>
                  <span className="text-cacau-500 text-xs">{c.visitas}x</span>
                  <span className="tabular-nums text-cacau-900">{brl(c.gasto)}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
function Caixa({ ini, fim }) {
  const { db } = useStore()
  const [tipo, setTipo] = useState('todos')
  const movs = useMemo(() => movimentacoes(db, ini, fim), [db, ini, fim])
  const lista = movs.filter((m) => tipo === 'todos' || m.tipo === tipo)
  const soma = (arr) => arr.reduce((s, m) => s + m.valor, 0)
  const porForma = {}
  movs.forEach((m) => (porForma[m.forma] = (porForma[m.forma] || 0) + m.valor))

  const exportar = () =>
    baixarCSV(`caixa-${ini}-a-${fim}.csv`, [
      ['Data', 'Tipo', 'Cliente', 'Descrição', 'Forma', 'Valor'],
      ...lista.map((m) => [dataBR(m.data), m.tipo, m.cliente, m.descricao, FORMAS_PAGAMENTO[m.forma] || m.forma, String(m.valor.toFixed(2)).replace('.', ',')]),
    ])

  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Kpi icone={ArrowDownLeft} rotulo="Total que entrou" valor={brl(soma(movs))} detalhe={`${movs.length} entradas`} tom="bom" />
        <Kpi icone={Wallet} rotulo="Atendimentos" valor={brl(soma(movs.filter((m) => m.tipo === 'Atendimento')))} detalhe={`${movs.filter((m) => m.tipo === 'Atendimento').length} pagamentos`} />
        <Kpi icone={Receipt} rotulo="Multas pagas" valor={brl(soma(movs.filter((m) => m.tipo === 'Multa')))} tom="alerta" />
        <Kpi icone={HandCoins} rotulo="Débitos quitados" valor={brl(soma(movs.filter((m) => m.tipo === 'Débito')))} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        {Object.entries(porForma).map(([f, v]) => (
          <Etiqueta key={f}>{FORMAS_PAGAMENTO[f] || f}: <strong className="font-semibold">{brl(v)}</strong></Etiqueta>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <Abas valor={tipo} onChange={setTipo} abas={[['todos', 'Tudo', movs.length], ['Atendimento', 'Atendimentos'], ['Multa', 'Multas'], ['Débito', 'Débitos']]} />
        <Botao onClick={exportar}><Download size={16} /> Exportar planilha</Botao>
      </div>

      <div className="card overflow-hidden">
        {lista.length === 0 ? <Vazio texto="Nenhuma movimentação no período." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-xs text-cacau-500 border-b border-nude-200 bg-nude-50/60">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Data</th>
                  <th className="text-left font-medium px-4 py-3">Tipo</th>
                  <th className="text-left font-medium px-4 py-3">Cliente</th>
                  <th className="text-left font-medium px-4 py-3">Forma</th>
                  <th className="text-right font-medium px-4 py-3">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nude-200">
                {lista.slice(0, 200).map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2.5 text-cacau-600 tabular-nums whitespace-nowrap">{dataCurta(m.data)}</td>
                    <td className="px-4 py-2.5"><TipoMov t={m.tipo} /></td>
                    <td className="px-4 py-2.5">
                      <div className="text-cacau-900">{m.cliente}</div>
                      <div className="text-xs text-cacau-500 truncate max-w-xs">{m.descricao}</div>
                    </td>
                    <td className="px-4 py-2.5 text-cacau-600">{FORMAS_PAGAMENTO[m.forma] || m.forma}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${m.valor < 0 ? 'text-red-600' : 'text-cacau-900'}`}>{m.valor < 0 ? '− ' : ''}{brl(Math.abs(m.valor))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-nude-300 bg-nude-50/60">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm text-cacau-600">Saldo do período{lista.length > 200 ? ' (mostrando as 200 mais recentes)' : ''}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-cacau-900">{brl(soma(lista))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

const TipoMov = ({ t }) => {
  const cls = {
    Atendimento: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    Multa: 'text-red-700 bg-red-50 border-red-200',
    'Débito': 'text-amber-800 bg-amber-50 border-amber-200',
  }[t]
  return <Etiqueta cls={cls}>{t}</Etiqueta>
}

// ---------------------------------------------------------------------------
function Pendencias() {
  const { db, pagarPendencias, perdoarPendencia, avisar } = useStore()
  const [aba, setAba] = useState('aberta')
  const [confirmar, setConfirmar] = useState(null)
  const [debito, setDebito] = useState(false)

  const iniMes = toISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const por = (s) => db.pendencias.filter((m) => m.status === s)
  const lista = (aba === 'todas' ? db.pendencias : por(aba)).slice().sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
  const soma = (arr) => arr.reduce((s, m) => s + m.valor, 0)
  const telDe = (id) => db.clientes.find((c) => c.id === id)?.telefone || ''
  const msgCobranca = (m) =>
    `Oi, ${primeiroNome(m.clienteNome)}! Tudo bem? Ficou em aberto ${brl(m.valor)}: ${m.descricao}. Você pode pagar pelo Pix direto no site (em "Meus horários") e a agenda libera na hora. Obrigada!`

  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Kpi icone={Receipt} rotulo="Em aberto" valor={brl(soma(por('aberta')))} detalhe={`${por('aberta').length} multa(s)/débito(s)`} tom="alerta" />
        <Kpi icone={HandCoins} rotulo="Recebido no mês" valor={brl(soma(por('paga').filter((m) => m.pagaEm >= iniMes)))} tom="bom" />
        <Kpi icone={CheckCircle2} rotulo="Recebido (total)" valor={brl(soma(por('paga')))} detalhe={`${por('paga').length} pendência(s) quitada(s)`} />
        <Kpi icone={Ban} rotulo="Perdoadas" valor={brl(soma(por('perdoada')))} detalhe={`${por('perdoada').length} pendência(s)`} />
      </div>

      <div className="card p-4 mb-5 flex gap-3 items-start !bg-blush-100/40 !border-blush-200">
        <Zap size={18} className="text-blush-700 shrink-0 mt-0.5" />
        <p className="text-sm text-cacau-700">
          Falta sem aviso gera multa de {db.config.multaPct}% automaticamente. Quando a cliente paga pelo Pix no site, a multa é baixada <strong className="text-cacau-900">sozinha</strong>, a agenda dela libera e você recebe uma notificação.
          Use "Marcar como paga" só para pagamentos feitos por fora.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <Abas valor={aba} onChange={setAba} abas={[['aberta', 'Em aberto', por('aberta').length], ['paga', 'Pagas', por('paga').length], ['perdoada', 'Perdoadas', por('perdoada').length], ['todas', 'Todas', db.pendencias.length]]} />
        <Botao variante="pri" onClick={() => setDebito(true)}><Plus size={16} /> Lançar débito</Botao>
      </div>

      <div className="card divide-y divide-nude-200">
        {lista.length === 0 ? (
          <Vazio texto={aba === 'aberta' ? 'Ninguém devendo. Tudo em dia!' : 'Nada por aqui.'} />
        ) : (
          lista.map((m) => {
            const tel = telDe(m.clienteId)
            return (
              <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar nome={m.clienteNome} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-cacau-900">{m.clienteNome}</span>
                      <Status s={m.status} />
                      <Etiqueta cls={m.tipo === 'falta' ? 'text-red-700 bg-red-50 border-red-200' : undefined}>{m.tipo === 'falta' ? 'Multa por falta' : 'Débito'}</Etiqueta>
                      {!m.bloqueia && m.status === 'aberta' && <Etiqueta>não bloqueia</Etiqueta>}
                    </div>
                    <div className="text-xs text-cacau-500 mt-0.5">
                      {m.descricao} · lançada em {dataCurta(m.criadaEm)}
                      {m.status === 'paga' && ` · paga em ${dataCurta(m.pagaEm)} ${m.via === 'pix' ? 'pelo site' : '(manual)'}`}
                      {m.status === 'perdoada' && ` · perdoada em ${dataCurta(m.pagaEm)}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  <span className="text-lg font-semibold text-cacau-900 tabular-nums whitespace-nowrap sm:mr-3">{brl(m.valor)}</span>
                  {m.status === 'aberta' && (
                    <div className="flex gap-1 shrink-0">
                      {tel && <a href={linkWhats(tel, msgCobranca(m))} target="_blank" rel="noreferrer" title="Cobrar no WhatsApp" className="p-2 rounded-full text-[#1fa855] hover:bg-nude-100"><WhatsApp size={18} /></a>}
                      <Botao variante="fantasma" className="!px-3" onClick={() => setConfirmar({ tipo: 'perdoar', m })}>Perdoar</Botao>
                      <Botao variante="ok" className="!px-3" onClick={() => setConfirmar({ tipo: 'pagar', m })}>Marcar paga</Botao>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <Modal
        aberto={!!confirmar}
        onFechar={() => setConfirmar(null)}
        titulo={confirmar?.tipo === 'pagar' ? 'Confirmar pagamento' : 'Perdoar pendência?'}
        rodape={
          <>
            <Botao onClick={() => setConfirmar(null)}>Voltar</Botao>
            <Botao
              variante={confirmar?.tipo === 'pagar' ? 'ok' : 'pri'}
              onClick={() => {
                if (confirmar.tipo === 'pagar') { pagarPendencias(confirmar.m.id, 'manual'); avisar('Pendência baixada. Agenda da cliente liberada.') }
                else { perdoarPendencia(confirmar.m.id); avisar('Pendência perdoada. Agenda da cliente liberada.') }
                setConfirmar(null)
              }}
            >
              Confirmar
            </Botao>
          </>
        }
      >
        {confirmar && (
          <p className="text-sm text-cacau-600">
            {confirmar.tipo === 'pagar'
              ? `Confirma que ${confirmar.m.clienteNome} pagou ${brl(confirmar.m.valor)} por fora do site?`
              : `${confirmar.m.clienteNome} fica isenta de ${brl(confirmar.m.valor)}.`}{' '}
            Ela volta a poder agendar pelo site.
          </p>
        )}
      </Modal>
      {debito && <ModalDebito onFechar={() => setDebito(false)} />}
    </>
  )
}
