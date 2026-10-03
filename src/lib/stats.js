import { toISO, fromISO, addDays, diasEntreISO } from './format'
import { EXTENSOES } from '../data/seed'

export const FORMAS_PAGAMENTO = { pix: 'Pix', cartao: 'Cartão', dinheiro: 'Dinheiro', manual: 'Pix/dinheiro (manual)', credito: 'Crédito da cliente' }

/** Todas as datas ISO entre ini e fim (inclusive). */
export function diasEntre(ini, fim) {
  const out = []
  for (let d = fromISO(ini); toISO(d) <= fim; d = addDays(d, 1)) out.push(toISO(d))
  return out
}

/** Sinal que ficou com o estúdio (falta ou cancelamento em cima da hora). */
const sinalRetido = (a) => (a.sinal?.pago && a.sinal.destino === 'retido' ? a.sinal.valor : 0)

/** Métricas de um período [ini, fim] (datas ISO). */
export function calcularStats(db, ini, fim) {
  const ags = db.agendamentos.filter((a) => a.status !== 'bloqueio' && a.data >= ini && a.data <= fim)
  const concluidos = ags.filter((a) => a.status === 'concluido')
  const faltas = ags.filter((a) => a.status === 'falta')
  const cancelados = ags.filter((a) => a.status === 'cancelado')
  const futuros = ags.filter((a) => a.status === 'confirmado' || a.status === 'aguardando_sinal')

  const soma = (arr) => arr.reduce((s, a) => s + (a.total || 0), 0)
  const retidos = [...faltas, ...cancelados].reduce((s, a) => s + sinalRetido(a), 0)
  // Receita = atendimentos realizados + sinais que ficaram com o estúdio
  const faturamento = soma(concluidos) + retidos

  // Primeiro atendimento de cada cliente (para novas x recorrentes)
  const primeiraVisita = {}
  for (const a of db.agendamentos) {
    if (a.status !== 'concluido' || !a.clienteId) continue
    if (!primeiraVisita[a.clienteId] || a.data < primeiraVisita[a.clienteId]) primeiraVisita[a.clienteId] = a.data
  }
  const atendidas = new Set(concluidos.map((a) => a.clienteId))
  const novas = [...atendidas].filter((id) => primeiraVisita[id] >= ini).length

  const porDia = diasEntre(ini, fim).map((iso) => {
    const doDia = concluidos.filter((a) => a.data === iso)
    return { data: iso, faturamento: soma(doDia), atendimentos: doDia.length }
  })

  const servicos = Object.fromEntries(db.servicos.map((s) => [s.id, s]))
  const servMap = {}
  const porCategoria = { cilios: 0, sobrancelhas: 0 }
  for (const a of concluidos) {
    const ids = a.servicoIds || []
    const somaCatalogo = ids.reduce((s, id) => s + (servicos[id]?.preco ?? 0), 0)
    for (const id of ids) {
      const s = servicos[id]
      const nome = s?.nome || id
      servMap[nome] ??= { nome, qtd: 0, receita: 0, categoria: s?.categoria }
      servMap[nome].qtd++
      // distribui o total proporcional ao preço de tabela (lida com valores ajustados)
      const parte = a.total * (somaCatalogo ? (s?.preco ?? 0) / somaCatalogo : 1 / ids.length)
      servMap[nome].receita += parte
      if (s?.categoria) porCategoria[s.categoria] += parte
    }
  }
  const porServico = Object.values(servMap).sort((a, b) => b.receita - a.receita)

  const porDiaSemana = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const doDia = concluidos.filter((a) => fromISO(a.data).getDay() === d)
    return { dia: d, atendimentos: doDia.length, faturamento: soma(doDia) }
  })

  const heat = {}
  for (const a of concluidos) {
    const k = `${fromISO(a.data).getDay()}-${Number(a.hora.slice(0, 2))}`
    heat[k] = (heat[k] || 0) + 1
  }

  // Como o restante foi pago no dia
  const formas = {}
  for (const a of concluidos) {
    if (!a.restante?.valor) continue
    formas[a.restante.forma] = (formas[a.restante.forma] || 0) + a.restante.valor
  }

  const cliMap = {}
  for (const a of ags) {
    if (!a.clienteId) continue
    cliMap[a.clienteId] ??= { id: a.clienteId, nome: a.clienteNome, gasto: 0, visitas: 0, faltas: 0 }
    if (a.status === 'concluido') {
      cliMap[a.clienteId].gasto += a.total
      cliMap[a.clienteId].visitas++
    }
    if (a.status === 'falta') cliMap[a.clienteId].faltas++
  }
  const clientesRank = Object.values(cliMap)

  const finalizados = concluidos.length + faltas.length
  return {
    ags,
    concluidos,
    faltas,
    cancelados,
    futuros,
    faturamento,
    retidos,
    previsto: soma(futuros),
    ticket: concluidos.length ? soma(concluidos) / concluidos.length : 0,
    taxaFalta: finalizados ? faltas.length / finalizados : 0,
    taxaCancel: ags.length ? cancelados.length / ags.length : 0,
    atendidas: atendidas.size,
    novas,
    recorrentes: atendidas.size - novas,
    porDia,
    porServico,
    porCategoria,
    porDiaSemana,
    heat,
    formas,
    topGasto: clientesRank.filter((c) => c.gasto > 0).sort((a, b) => b.gasto - a.gasto).slice(0, 5),
  }
}

/** Variação percentual entre dois valores (null se não dá pra comparar). */
export const variacao = (atual, anterior) => (anterior ? (atual - anterior) / anterior : null)

/**
 * Livro-caixa: cada dinheiro que entrou (ou saiu, no caso de sinal devolvido).
 * Crédito usado pela cliente não é dinheiro novo, então não entra.
 */
export function movimentacoes(db, ini, fim) {
  const out = []
  const dentro = (iso) => iso && iso >= ini && iso <= fim
  for (const a of db.agendamentos) {
    if (a.status === 'bloqueio' || !a.sinal) continue
    const pagoNoPix = a.sinal.valor - (a.sinal.creditoUsado || 0)
    if (a.sinal.pago && a.sinal.via !== 'credito' && pagoNoPix > 0 && dentro(a.sinal.pagoEm))
      out.push({ id: `s-${a.id}`, data: a.sinal.pagoEm, tipo: 'Sinal', cliente: a.clienteNome, descricao: `${a.servicoNomes} · ${a.data.split('-').reverse().join('/')}`, forma: a.sinal.via, valor: pagoNoPix })
    if (a.restante?.valor > 0 && dentro(a.restante.em))
      out.push({ id: `r-${a.id}`, data: a.restante.em, tipo: 'Restante', cliente: a.clienteNome, descricao: a.servicoNomes, forma: a.restante.forma, valor: a.restante.valor })
    if (a.sinal.destino === 'devolvido' && a.sinal.pago && dentro(a.data))
      out.push({ id: `d-${a.id}`, data: a.data, tipo: 'Sinal devolvido', cliente: a.clienteNome, descricao: a.servicoNomes, forma: 'pix', valor: -a.sinal.valor })
  }
  for (const p of db.pendencias) {
    if (p.status === 'paga' && dentro(p.pagaEm))
      out.push({ id: `p-${p.id}`, data: p.pagaEm, tipo: 'Pendência', cliente: p.clienteNome, descricao: p.descricao, forma: p.via, valor: p.valor })
  }
  return out.sort((a, b) => b.data.localeCompare(a.data))
}

/** Resumo por cliente (para a página de clientes). */
export function resumoClientes(db) {
  const hoje = toISO(new Date())
  return db.clientes.map((c) => {
    const ags = db.agendamentos.filter((a) => a.clienteId === c.id)
    const concl = ags.filter((a) => a.status === 'concluido').sort((a, b) => a.data.localeCompare(b.data))
    const ultimaExt = concl.filter((a) => (a.servicoIds || []).some((id) => EXTENSOES.includes(id))).pop()
    const proximo = ags
      .filter((a) => (a.status === 'confirmado' || a.status === 'aguardando_sinal') && a.data >= hoje)
      .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))[0]
    const abertas = db.pendencias.filter((m) => m.clienteId === c.id && m.status === 'aberta')
    return {
      ...c,
      visitas: concl.length,
      gasto: concl.reduce((s, a) => s + a.total, 0),
      faltas: ags.filter((a) => a.status === 'falta').length,
      cancelamentos: ags.filter((a) => a.status === 'cancelado').length,
      ultima: concl.length ? concl[concl.length - 1].data : null,
      ultimaExtensao: ultimaExt?.data || null,
      ultimaExtensaoServico: ultimaExt?.servicoNomes || null,
      proximo: proximo || null,
      devendo: abertas.reduce((s, m) => s + m.valor, 0),
    }
  })
}

/**
 * Clientes com extensão perto de vencer a manutenção e sem horário marcado:
 * a Ana manda um lembrete no WhatsApp e não perde a cliente.
 */
export function manutencaoVencendo(db) {
  const hoje = toISO(new Date())
  const prazo = db.config.manutencaoDias
  return resumoClientes(db)
    .filter((c) => c.ultimaExtensao && !c.proximo)
    .map((c) => ({ ...c, dias: diasEntreISO(c.ultimaExtensao, hoje), vence: toISO(addDays(fromISO(c.ultimaExtensao), prazo)) }))
    .filter((c) => c.dias >= prazo - 7 && c.dias <= prazo + 7)
    .sort((a, b) => b.dias - a.dias)
}

/** Aniversariantes dos próximos N dias (inclui hoje). */
export function aniversariantes(db, n = 7) {
  const base = new Date()
  const out = []
  for (let i = 0; i < n; i++) {
    const iso = toISO(addDays(base, i))
    for (const c of db.clientes) if (c.aniversario && c.aniversario === iso.slice(5)) out.push({ ...c, data: iso, emDias: i })
  }
  return out
}
