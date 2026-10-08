import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { gerarSeed } from '../data/seed'
import { uid, toISO, brl, dataBR, multaDe } from '../lib/format'
import { itensDe } from '../lib/catalogo'

// ---------------------------------------------------------------------------
// Store do esboço: simula o backend salvando no localStorage.
// Na fase 2, cada ação abaixo vira uma escrita no banco (Firebase/Supabase),
// mantendo a mesma interface para os componentes.
// ---------------------------------------------------------------------------

const CHAVE = 'laura-celvio-v3'
const StoreContext = createContext(null)

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE))
    if (salvo?.versao === 3) return salvo
  } catch {
    /* sem storage disponível: usa seed */
  }
  return gerarSeed()
}

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
    const novoAgendamento = (ag) => ({ id: uid(), criadoEm: toISO(new Date()), status: 'agendado', origem: 'site', pagamento: null, nota: '', ...ag })
    const comTelefone = (d, ag) =>
      ag.clienteId && ag.clienteTelefone ? d.clientes.map((c) => (c.id === ag.clienteId ? { ...c, telefone: ag.clienteTelefone } : c)) : d.clientes

    return {
      // ---------- Sessão (simula login com Google) ----------
      entrarComoCliente: (clienteId) => setDb((d) => ({ ...d, sessao: { tipo: 'cliente', clienteId } })),
      entrarComoNovoCliente: (nome, email) =>
        setDb((d) => {
          const existente = d.clientes.find((c) => c.email === email)
          if (existente) return { ...d, sessao: { tipo: 'cliente', clienteId: existente.id } }
          const c = { id: uid(), nome, email, telefone: '', criadoEm: toISO(new Date()), aniversario: '', ficha: {}, notas: '' }
          return { ...d, clientes: [...d.clientes, c], sessao: { tipo: 'cliente', clienteId: c.id } }
        }),
      entrarComoAdmin: () => setDb((d) => ({ ...d, sessao: { tipo: 'admin' } })),
      sair: () => setDb((d) => ({ ...d, sessao: null })),

      // ---------- Agendamentos ----------
      /** Pelo site: já fica confirmado (sem sinal) e a Ana é notificada. Devolve o id. */
      criarAgendamento: (ag) => {
        const novo = novoAgendamento(ag)
        setDb((d) =>
          notificar(
            { ...d, clientes: comTelefone(d, ag), agendamentos: [...d.agendamentos, novo] },
            { tipo: 'agendamento', titulo: 'Novo agendamento pelo site', texto: `${ag.clienteNome} · ${ag.servicoNomes} · ${dataBR(ag.data)} às ${ag.hora}` }
          )
        )
        return novo.id
      },
      criarAgendamentoAdmin: (ag) =>
        setDb((d) => ({ ...d, clientes: comTelefone(d, ag), agendamentos: [...d.agendamentos, novoAgendamento({ ...ag, origem: 'admin' })] })),
      concluirAtendimento: (id, { total, forma }) =>
        setDb((d) => atualizarAg(d, id, { status: 'concluido', total, pagamento: { forma, em: toISO(new Date()) } })),
      reabrirAgendamento: (id) => setDb((d) => atualizarAg(d, id, { status: 'agendado', pagamento: null })),
      cancelarAgendamento: (id, porCliente = false) =>
        setDb((d) => {
          const ag = d.agendamentos.find((a) => a.id === id)
          if (!ag) return d
          if (ag.status === 'bloqueio') return { ...d, agendamentos: d.agendamentos.filter((a) => a.id !== id) }
          const prox = atualizarAg(d, id, { status: 'cancelado', canceladoPor: porCliente ? 'cliente' : 'admin' })
          return porCliente
            ? notificar(prox, { tipo: 'cancelamento', titulo: 'Cliente cancelou o horário', texto: `${ag.clienteNome} · ${dataBR(ag.data)} às ${ag.hora}` })
            : prox
        }),
      /** Falta (não veio ou cancelou em cima da hora): o horário fica livre, mas gera multa. */
      marcarFalta: (id, motivo = 'nao_compareceu') =>
        setDb((d) => {
          const ag = d.agendamentos.find((a) => a.id === id)
          const prox = atualizarAg(d, id, { status: 'falta', motivoFalta: motivo })
          return {
            ...prox,
            pendencias: [...prox.pendencias, {
              id: uid(), clienteId: ag.clienteId, clienteNome: ag.clienteNome, agendamentoId: ag.id, tipo: 'falta',
              descricao: `${motivo === 'cancelou_tarde' ? 'Cancelamento em cima da hora' : 'Falta'} em ${dataBR(ag.data)} (${ag.servicoNomes})`,
              valor: multaDe(ag.total, d.config.multaPct), status: 'aberta', bloqueia: true, criadaEm: toISO(new Date()), pagaEm: null, via: null,
            }],
          }
        }),
      editarAgendamento: (id, { servicoIds, data, hora }) =>
        setDb((d) => {
          const { nomes, total, duracao } = itensDe(d.servicos, servicoIds)
          return atualizarAg(d, id, { servicoIds, servicoNomes: nomes, total, duracao, data, hora })
        }),
      salvarNotaAgendamento: (id, nota) => setDb((d) => atualizarAg(d, id, { nota })),
      bloquearHorario: (data, hora, duracao, motivo) =>
        setDb((d) => ({ ...d, agendamentos: [...d.agendamentos, { id: uid(), data, hora, duracao, status: 'bloqueio', motivo: motivo || 'Horário fechado', total: 0 }] })),
      bloquearDia: (data, motivo) =>
        setDb((d) => ({
          ...d,
          agendamentos: [...d.agendamentos, { id: uid(), data, hora: '00:00', duracao: 1440, diaInteiro: true, status: 'bloqueio', motivo: motivo || 'Dia fechado', total: 0 }],
        })),
      desbloquearDia: (data) =>
        setDb((d) => ({ ...d, agendamentos: d.agendamentos.filter((a) => !(a.data === data && a.status === 'bloqueio' && a.diaInteiro)) })),

      // ---------- Multas e débitos (pendências) ----------
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
            titulo: via === 'pix' ? 'Multa paga no Pix' : 'Pendência marcada como paga',
            texto: `${pagas[0]?.clienteNome} pagou ${brl(pagas.reduce((s, m) => s + m.valor, 0))}. Agendamento liberado.`,
          })
        }),
      perdoarPendencia: (id) =>
        setDb((d) => ({ ...d, pendencias: d.pendencias.map((x) => (x.id === id ? { ...x, status: 'perdoada', pagaEm: toISO(new Date()) } : x)) })),

      // ---------- Clientes ----------
      salvarCliente: (c) => setDb((d) => ({ ...d, clientes: d.clientes.map((x) => (x.id === c.id ? { ...x, ...c } : x)) })),
      criarCliente: (c) => {
        const novo = { id: uid(), email: '', criadoEm: toISO(new Date()), aniversario: '', ficha: {}, notas: '', ...c }
        setDb((d) => ({ ...d, clientes: [...d.clientes, novo] }))
        return novo
      },

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
          let j = i + dir
          // pula serviços de outra categoria, para mover só dentro da mesma lista
          while (j >= 0 && j < lista.length && lista[j].categoria !== lista[i].categoria) j += dir
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

/** Multas/débitos em aberto que bloqueiam a cliente de agendar. */
export const pendenciasAbertasDe = (db, clienteId) =>
  db.pendencias.filter((m) => m.clienteId === clienteId && m.status === 'aberta' && m.bloqueia !== false)

/** Serviços visíveis no site, na ordem definida no painel. */
export const servicosAtivos = (db) => db.servicos.filter((s) => s.ativo).sort((a, b) => a.ordem - b.ordem)
