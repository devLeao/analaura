import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { gerarSeed } from '../data/seed'
import { uid, toISO, brl, dataBR, sinalDe } from '../lib/format'
import { reservaExpirada } from '../lib/schedule'

// ---------------------------------------------------------------------------
// Store do esboço: simula o backend salvando no localStorage.
// Na fase 2, cada ação abaixo vira uma escrita no banco (Firebase/Supabase),
// mantendo a mesma interface para os componentes.
// ---------------------------------------------------------------------------

const CHAVE = 'analaura-esboco-v1'
const StoreContext = createContext(null)

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE))
    if (salvo?.versao === 1) return limparExpiradas(salvo)
  } catch {
    /* sem storage disponível: usa seed */
  }
  return gerarSeed()
}

/** Reservas do site que não tiveram o Pix pago a tempo saem da agenda. */
const limparExpiradas = (d) => ({ ...d, agendamentos: d.agendamentos.filter((a) => !reservaExpirada(a)) })

export function StoreProvider({ children }) {
  const [db, setDb] = useState(carregar)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(db))
    } catch {
      /* ignora */
    }
  }, [db])

  const avisar = useCallback((msg, tipo = 'ok') => {
    setToast({ msg, tipo, id: uid() })
    setTimeout(() => setToast((t) => (t?.msg === msg ? null : t)), 3500)
  }, [])

  const acoes = useMemo(() => {
    const notificar = (d, n) => ({
      ...d,
      notificacoes: [{ id: uid(), criadoEm: new Date().toISOString(), lida: false, ...n }, ...d.notificacoes],
    })
    const atualizarAg = (d, id, patch) => ({
      ...d,
      agendamentos: d.agendamentos.map((a) => (a.id === id ? { ...a, ...(typeof patch === 'function' ? patch(a) : patch) } : a)),
    })
    const somarCredito = (d, clienteId, valor) => ({
      ...d,
      clientes: d.clientes.map((c) => (c.id === clienteId ? { ...c, credito: Math.max(0, Math.round(((c.credito || 0) + valor) * 100) / 100) } : c)),
    })
    const novoAgendamento = (d, ag) => ({
      id: ag.id || uid(),
      criadoEm: toISO(new Date()),
      expiraEm: null,
      restante: null,
      nota: '',
      origem: 'site',
      ...ag,
      sinal: { valor: sinalDe(ag.total, d.config.sinalPct), pago: false, pagoEm: null, via: null, creditoUsado: 0, destino: null, ...ag.sinal },
    })

    return {
      // ---------- Sessão (simula login com Google) ----------
      entrarComoCliente: (clienteId) => setDb((d) => ({ ...d, sessao: { tipo: 'cliente', clienteId } })),
      entrarComoNovoCliente: (nome, email) =>
        setDb((d) => {
          const existente = d.clientes.find((c) => c.email === email)
          if (existente) return { ...d, sessao: { tipo: 'cliente', clienteId: existente.id } }
          const c = { id: uid(), nome, email, telefone: '', criadoEm: toISO(new Date()), aniversario: '', credito: 0, ficha: {}, notas: '' }
          return { ...d, clientes: [...d.clientes, c], sessao: { tipo: 'cliente', clienteId: c.id } }
        }),
      entrarComoAdmin: () => setDb((d) => ({ ...d, sessao: { tipo: 'admin' } })),
      sair: () => setDb((d) => ({ ...d, sessao: null })),

      // ---------- Reserva pelo site: segura o horário até o Pix do sinal ----------
      /** Cria a reserva e devolve o id. Se o crédito da cliente cobre o sinal, já confirma. */
      reservar: (ag) => {
        const id = uid()
        setDb((d) => {
          const cliente = d.clientes.find((c) => c.id === ag.clienteId)
          const sinal = sinalDe(ag.total, d.config.sinalPct)
          const creditoUsado = Math.min(cliente?.credito || 0, sinal)
          const pagoComCredito = creditoUsado >= sinal
          let prox = {
            ...d,
            clientes: d.clientes.map((c) => (c.id === ag.clienteId && ag.clienteTelefone ? { ...c, telefone: ag.clienteTelefone } : c)),
          }
          const novo = novoAgendamento(prox, {
            ...ag,
            id,
            status: pagoComCredito ? 'confirmado' : 'aguardando_sinal',
            expiraEm: pagoComCredito ? null : Date.now() + d.config.reservaMin * 60 * 1000,
            sinal: pagoComCredito
              ? { pago: true, pagoEm: toISO(new Date()), via: 'credito', creditoUsado }
              : { creditoUsado },
          })
          prox = { ...prox, agendamentos: [...prox.agendamentos, novo] }
          if (pagoComCredito) {
            prox = somarCredito(prox, ag.clienteId, -creditoUsado)
            prox = notificar(prox, { tipo: 'agendamento', titulo: 'Novo agendamento (sinal pago com crédito)', texto: `${ag.clienteNome} · ${ag.servicoNomes} · ${dataBR(ag.data)} às ${ag.hora}` })
          }
          return prox
        })
        return id
      },
      /** Pix do sinal confirmado (no esboço: simulado; na fase 2: webhook do banco). */
      confirmarSinal: (id, via = 'pix') =>
        setDb((d) => {
          const ag = d.agendamentos.find((a) => a.id === id)
          if (!ag) return d
          let prox = atualizarAg(d, id, (a) => ({ status: 'confirmado', expiraEm: null, sinal: { ...a.sinal, pago: true, pagoEm: toISO(new Date()), via } }))
          if (ag.sinal.creditoUsado) prox = somarCredito(prox, ag.clienteId, -ag.sinal.creditoUsado)
          return notificar(prox, {
            tipo: 'agendamento',
            titulo: via === 'pix' ? 'Novo agendamento · sinal pago no Pix' : 'Sinal marcado como recebido',
            texto: `${ag.clienteNome} · ${ag.servicoNomes} · ${dataBR(ag.data)} às ${ag.hora} · sinal ${brl(ag.sinal.valor - (ag.sinal.creditoUsado || 0))}`,
          })
        }),
      /** Cliente desistiu na tela do Pix ou o tempo acabou: some da agenda. */
      descartarReserva: (id) => setDb((d) => ({ ...d, agendamentos: d.agendamentos.filter((a) => !(a.id === id && a.status === 'aguardando_sinal')) })),

      // ---------- Agendamentos pelo painel ----------
      criarAgendamentoAdmin: (ag, sinalPago) =>
        setDb((d) => {
          let prox = { ...d }
          if (ag.clienteId && ag.clienteTelefone)
            prox.clientes = prox.clientes.map((c) => (c.id === ag.clienteId && !c.telefone ? { ...c, telefone: ag.clienteTelefone } : c))
          const novo = novoAgendamento(prox, {
            ...ag,
            origem: 'admin',
            status: sinalPago ? 'confirmado' : 'aguardando_sinal',
            sinal: sinalPago ? { pago: true, pagoEm: toISO(new Date()), via: 'manual' } : {},
          })
          return { ...prox, agendamentos: [...prox.agendamentos, novo] }
        }),
      concluirAtendimento: (id, { total, forma }) =>
        setDb((d) =>
          atualizarAg(d, id, (a) => {
            const pagoAntes = a.sinal.pago ? a.sinal.valor : 0
            return { status: 'concluido', total, restante: { valor: Math.max(0, total - pagoAntes), forma, em: toISO(new Date()) } }
          })
        ),
      reabrirAgendamento: (id) =>
        setDb((d) => atualizarAg(d, id, (a) => ({ status: a.sinal.pago ? 'confirmado' : 'aguardando_sinal', restante: null }))),
      /** Falta: com sinal pago, ele fica retido. Sem sinal, pode virar pendência. */
      marcarFalta: (id, gerarPendencia = false) =>
        setDb((d) => {
          const ag = d.agendamentos.find((a) => a.id === id)
          let prox = atualizarAg(d, id, (a) => ({ status: 'falta', sinal: { ...a.sinal, destino: a.sinal.pago ? 'retido' : null } }))
          if (!ag.sinal.pago && gerarPendencia)
            prox = {
              ...prox,
              pendencias: [...prox.pendencias, {
                id: uid(), clienteId: ag.clienteId, clienteNome: ag.clienteNome, agendamentoId: ag.id, tipo: 'falta',
                descricao: `Falta em ${dataBR(ag.data)} sem sinal pago (${ag.servicoNomes})`, valor: ag.sinal.valor,
                status: 'aberta', bloqueia: true, criadaEm: toISO(new Date()), pagaEm: null, via: null,
              }],
            }
          return prox
        }),
      /** destino do sinal pago: 'credito' (vale na próxima), 'devolvido' (estorno) ou 'retido'. */
      cancelarAgendamento: (id, destino = null, porCliente = false) =>
        setDb((d) => {
          const ag = d.agendamentos.find((a) => a.id === id)
          if (!ag) return d
          if (ag.status === 'bloqueio') return { ...d, agendamentos: d.agendamentos.filter((a) => a.id !== id) }
          const dest = ag.sinal.pago ? destino || 'credito' : null
          let prox = atualizarAg(d, id, (a) => ({ status: 'cancelado', canceladoPor: porCliente ? 'cliente' : 'admin', sinal: { ...a.sinal, destino: dest } }))
          if (dest === 'credito') prox = somarCredito(prox, ag.clienteId, ag.sinal.valor)
          if (porCliente)
            prox = notificar(prox, {
              tipo: 'cancelamento',
              titulo: 'Cliente cancelou o horário',
              texto: `${ag.clienteNome} · ${dataBR(ag.data)} às ${ag.hora} · sinal ${dest === 'credito' ? 'virou crédito' : 'retido'}`,
            })
          return prox
        }),
      editarAgendamento: (id, { servicoIds, data, hora }) =>
        setDb((d) =>
          atualizarAg(d, id, (a) => {
            const itens = servicoIds.map((s) => d.servicos.find((x) => x.id === s)).filter(Boolean)
            const total = itens.reduce((s, i) => s + i.preco, 0)
            return {
              servicoIds,
              servicoNomes: itens.map((s) => s.nome).join(' + '),
              total,
              duracao: itens.reduce((s, i) => s + i.duracao, 0),
              data,
              hora,
              // sinal já pago não muda; se ainda não pagou, acompanha o novo valor
              sinal: a.sinal.pago ? a.sinal : { ...a.sinal, valor: sinalDe(total, d.config.sinalPct) },
            }
          })
        ),
      salvarNotaAgendamento: (id, nota) => setDb((d) => atualizarAg(d, id, { nota })),
      bloquearHorario: (data, hora, duracao, motivo) =>
        setDb((d) => ({
          ...d,
          agendamentos: [...d.agendamentos, { id: uid(), data, hora, duracao, status: 'bloqueio', motivo: motivo || 'Horário fechado', total: 0, sinal: { valor: 0, pago: false } }],
        })),
      bloquearDia: (data, motivo) =>
        setDb((d) => ({
          ...d,
          agendamentos: [...d.agendamentos, { id: uid(), data, hora: '00:00', duracao: 1440, diaInteiro: true, status: 'bloqueio', motivo: motivo || 'Dia fechado', total: 0, sinal: { valor: 0, pago: false } }],
        })),
      desbloquearDia: (data) =>
        setDb((d) => ({ ...d, agendamentos: d.agendamentos.filter((a) => !(a.data === data && a.status === 'bloqueio' && a.diaInteiro)) })),

      // ---------- Pendências (débitos) ----------
      lancarDebito: ({ clienteId, clienteNome, valor, descricao, bloqueia = true }) =>
        setDb((d) => ({
          ...d,
          pendencias: [...d.pendencias, {
            id: uid(), clienteId, clienteNome, agendamentoId: null, tipo: 'debito', descricao, valor,
            status: 'aberta', bloqueia, criadaEm: toISO(new Date()), pagaEm: null, via: null,
          }],
        })),
      /** Aceita um id ou uma lista (cliente paga tudo de uma vez pelo Pix do site). */
      pagarPendencias: (ids, via) =>
        setDb((d) => {
          const lista = [].concat(ids)
          const pagas = d.pendencias.filter((x) => lista.includes(x.id))
          const prox = { ...d, pendencias: d.pendencias.map((x) => (lista.includes(x.id) ? { ...x, status: 'paga', pagaEm: toISO(new Date()), via } : x)) }
          return notificar(prox, {
            tipo: 'pendencia_paga',
            titulo: via === 'pix' ? 'Pendência paga no Pix' : 'Pendência marcada como paga',
            texto: `${pagas[0]?.clienteNome} pagou ${brl(pagas.reduce((s, m) => s + m.valor, 0))}. Agendamento liberado.`,
          })
        }),
      perdoarPendencia: (id) =>
        setDb((d) => ({ ...d, pendencias: d.pendencias.map((x) => (x.id === id ? { ...x, status: 'perdoada', pagaEm: toISO(new Date()) } : x)) })),

      // ---------- Clientes ----------
      salvarCliente: (c) => setDb((d) => ({ ...d, clientes: d.clientes.map((x) => (x.id === c.id ? { ...x, ...c } : x)) })),
      criarCliente: (c) => {
        const novo = { id: uid(), email: '', criadoEm: toISO(new Date()), aniversario: '', credito: 0, ficha: {}, notas: '', ...c }
        setDb((d) => ({ ...d, clientes: [...d.clientes, novo] }))
        return novo
      },
      ajustarCredito: (clienteId, valor) => setDb((d) => somarCredito(d, clienteId, valor)),

      // ---------- Serviços ----------
      salvarServico: (s) =>
        setDb((d) => {
          const existe = d.servicos.some((x) => x.id === s.id)
          return {
            ...d,
            servicos: existe ? d.servicos.map((x) => (x.id === s.id ? s : x)) : [...d.servicos, { ...s, id: uid(), ordem: d.servicos.length }],
          }
        }),
      removerServico: (id) => setDb((d) => ({ ...d, servicos: d.servicos.filter((x) => x.id !== id) })),
      /** Sobe/desce o serviço na ordem em que aparece no site. */
      moverServico: (id, dir) =>
        setDb((d) => {
          const lista = d.servicos.slice().sort((a, b) => a.ordem - b.ordem)
          const i = lista.findIndex((s) => s.id === id)
          const j = i + dir
          if (j < 0 || j >= lista.length) return d
          ;[lista[i], lista[j]] = [lista[j], lista[i]]
          return { ...d, servicos: lista.map((s, k) => ({ ...s, ordem: k })) }
        }),

      // ---------- Config / notificações ----------
      salvarConfig: (config) => setDb((d) => ({ ...d, config })),
      lerNotificacoes: () => setDb((d) => ({ ...d, notificacoes: d.notificacoes.map((n) => ({ ...n, lida: true })) })),
      resetar: () => setDb({ ...gerarSeed(), sessao: { tipo: 'admin' } }),
    }
  }, [])

  // Derivados úteis
  const usuario = useMemo(() => {
    if (!db.sessao) return null
    if (db.sessao.tipo === 'admin') return { tipo: 'admin', nome: 'Ana Laura', email: 'admin@analaura.com.br' }
    const c = db.clientes.find((x) => x.id === db.sessao.clienteId)
    return c ? { tipo: 'cliente', ...c } : null
  }, [db.sessao, db.clientes])

  const valor = useMemo(() => ({ db, usuario, avisar, toast, ...acoes }), [db, usuario, avisar, toast, acoes])
  return <StoreContext.Provider value={valor}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)

/** Pendências em aberto que bloqueiam a cliente de agendar. */
export const pendenciasAbertasDe = (db, clienteId) =>
  db.pendencias.filter((m) => m.clienteId === clienteId && m.status === 'aberta' && m.bloqueia !== false)

/** Serviços visíveis no site, na ordem definida no painel. */
export const servicosAtivos = (db) => db.servicos.filter((s) => s.ativo).sort((a, b) => a.ordem - b.ordem)
