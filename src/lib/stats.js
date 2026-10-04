import { toISO, fromISO, addDays, diasEntreISO } from './format'
import { resolver } from './catalogo'

export const FORMAS_PAGAMENTO = { pix: 'Pix', cartao: 'Cartão', dinheiro: 'Dinheiro', manual: 'Pago por fora' }

/** Todas as datas ISO entre ini e fim (inclusive). */
export function diasEntre(ini, fim) {
  const out = []
  for (let d = fromISO(ini); toISO(d) <= fim; d = addDays(d, 1)) out.push(toISO(d))
  return out
}

/** Métricas de um período [ini, fim] (datas ISO). */
export function calcularStats(db, ini, fim) {
  const ags = db.agendamentos.filter((a) => a.status !== 'bloqueio' && a.data >= ini && a.data <= fim)
  const concluidos = ags.filter((a) => a.status === 'concluido')
  const faltas = ags.filter((a) => a.status === 'falta')
  const cancelados = ags.filter((a) => a.status === 'cancelado')
  const agendados = ags.filter((a) => a.status === 'agendado')

  const soma = (arr) => arr.reduce((s, a) => s + (a.total || 0), 0)
  const faturamento = soma(concluidos)

  const multasPeriodo = db.pendencias.filter((m) => m.tipo === 'falta' && m.criadaEm >= ini && m.criadaEm <= fim)
  const multasRecebidas = db.pendencias.filter((m) => m.status === 'paga' && m.pagaEm >= ini && m.pagaEm <= fim)
  const abertas = db.pendencias.filter((m) => m.status === 'aberta')

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

  // Por serviço: o modelo de cílios junta preto e marrom; manutenção aparece separada
  const servMap = {}
  const porCategoria = { cilios: 0, sobrancelhas: 0, remocao: 0 }
  const cilios = { aplicacoes: 0, manutencoes: 0, marrom: 0 }
  for (const a of concluidos) {
    const itens = (a.servicoIds || []).map((v) => resolver(db.servicos, v)).filter(Boolean)
    const somaTabela = itens.reduce((s, i) => s + i.preco, 0)
    for (const it of itens) {
      const nome = `${it.base.nome}${it.manutencao ? ' · manutenção' : ''}`
      servMap[nome] ??= { nome, qtd: 0, receita: 0 }
      servMap[nome].qtd++
      // distribui o total proporcional ao preço de tabela (lida com valores ajustados)
      const parte = a.total * (somaTabela ? it.preco / somaTabela : 1 / itens.length)
      servMap[nome].receita += parte
      porCategoria[it.categoria] = (porCategoria[it.categoria] || 0) + parte
      if (it.categoria === 'cilios') {
        cilios[it.manutencao ? 'manutencoes' : 'aplicacoes']++
        if (it.marrom) cilios.marrom++
      }
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

  const formas = {}
  for (const a of concluidos) {
    const f = a.pagamento?.forma || 'pix'
    formas[f] = (formas[f] || 0) + a.total
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
    agendados,
    faturamento,
    ticket: concluidos.length ? faturamento / concluidos.length : 0,
    taxaFalta: finalizados ? faltas.length / finalizados : 0,
    taxaCancel: ags.length ? cancelados.length / ags.length : 0,
    perdaFaltas: soma(faltas),
    multasGeradas: multasPeriodo.reduce((s, m) => s + m.valor, 0),
    multasRecebidas: multasRecebidas.reduce((s, m) => s + m.valor, 0),
    abertasValor: abertas.reduce((s, m) => s + m.valor, 0),
    atendidas: atendidas.size,
    novas,
    recorrentes: atendidas.size - novas,
    porDia,
    porServico,
    porCategoria,
    cilios,
    porDiaSemana,
    heat,
    formas,
    topGasto: clientesRank.filter((c) => c.gasto > 0).sort((a, b) => b.gasto - a.gasto).slice(0, 5),
    topFaltas: clientesRank.filter((c) => c.faltas > 0).sort((a, b) => b.faltas - a.faltas).slice(0, 5),
  }
}

/** Variação percentual entre dois valores (null se não dá pra comparar). */
export const variacao = (atual, anterior) => (anterior ? (atual - anterior) / anterior : null)

/** Livro-caixa: cada dinheiro que entrou (atendimentos pagos e multas/débitos quitados). */
export function movimentacoes(db, ini, fim) {
  const out = []
  const dentro = (iso) => iso && iso >= ini && iso <= fim
  for (const a of db.agendamentos) {
    if (a.status === 'concluido' && a.total > 0 && dentro(a.pagamento?.em || a.data))
      out.push({ id: `a-${a.id}`, data: a.pagamento?.em || a.data, tipo: 'Atendimento', cliente: a.clienteNome, descricao: a.servicoNomes, forma: a.pagamento?.forma || 'pix', valor: a.total })
  }
  for (const p of db.pendencias) {
    if (p.status === 'paga' && dentro(p.pagaEm))
      out.push({ id: `p-${p.id}`, data: p.pagaEm, tipo: p.tipo === 'falta' ? 'Multa' : 'Débito', cliente: p.clienteNome, descricao: p.descricao, forma: p.via === 'pix' ? 'pix' : 'manual', valor: p.valor })
  }
  return out.sort((a, b) => b.data.localeCompare(a.data))
}

/** Última aplicação/manutenção de cílios de um conjunto de agendamentos concluídos (ordenados). */
function ultimaDeCilios(db, concl) {
  for (let i = concl.length - 1; i >= 0; i--) {
    const it = (concl[i].servicoIds || []).map((v) => resolver(db.servicos, v)).find((x) => x?.categoria === 'cilios')
    if (it) return { data: concl[i].data, item: it }
  }
  return null
}

/** Resumo por cliente (para a página de clientes). */
export function resumoClientes(db) {
  const hoje = toISO(new Date())
  return db.clientes.map((c) => {
    const ags = db.agendamentos.filter((a) => a.clienteId === c.id)
    const concl = ags.filter((a) => a.status === 'concluido').sort((a, b) => a.data.localeCompare(b.data))
    const ult = ultimaDeCilios(db, concl)
    const proximo = ags.filter((a) => a.status === 'agendado' && a.data >= hoje).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))[0]
    const abertas = db.pendencias.filter((m) => m.clienteId === c.id && m.status === 'aberta')
    return {
      ...c,
      visitas: concl.length,
      gasto: concl.reduce((s, a) => s + a.total, 0),
      faltas: ags.filter((a) => a.status === 'falta').length,
      cancelamentos: ags.filter((a) => a.status === 'cancelado').length,
      ultima: concl.length ? concl[concl.length - 1].data : null,
      // última vez que mexeu nos cílios e o prazo da manutenção daquele modelo
      ultimaCilios: ult?.data || null,
      ultimaCiliosItem: ult?.item || null,
      prazoManutencao: ult?.item.base.manutencao?.dias || null,
      proximo: proximo || null,
      devendo: abertas.reduce((s, m) => s + m.valor, 0),
    }
  })
}

/** A manutenção está "vencendo" de 5 dias antes do prazo até 7 dias depois. */
export const emManutencao = (c, hoje = toISO(new Date())) => {
  if (!c.ultimaCilios || !c.prazoManutencao || c.proximo) return false
  const dias = diasEntreISO(c.ultimaCilios, hoje)
  return dias >= c.prazoManutencao - 5 && dias <= c.prazoManutencao + 7
}

/**
 * Clientes com a manutenção do modelo delas perto de vencer e sem horário marcado:
 * a Ana manda um lembrete no WhatsApp e não perde a cliente.
 */
export function manutencaoVencendo(db) {
  const hoje = toISO(new Date())
  return resumoClientes(db)
    .filter((c) => emManutencao(c, hoje))
    .map((c) => ({ ...c, dias: diasEntreISO(c.ultimaCilios, hoje) }))
    .sort((a, b) => b.dias - b.prazoManutencao - (a.dias - a.prazoManutencao))
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
