import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import {
  collection, doc, onSnapshot, query, where, orderBy, limit, writeBatch, setDoc, getDoc, deleteDoc,
} from 'firebase/firestore'
import { auth, fs, googleProvider, SUPER_ADMIN } from '../lib/firebase'
import { CONFIG_PADRAO, SERVICOS } from '../data/seed'
import { uid, toISO, brl, dataBR, multaDe, addDays } from '../lib/format'
import { itensDe } from '../lib/catalogo'
import { ocupaAgenda } from '../lib/schedule'

// ---------------------------------------------------------------------------
// Store: dados em tempo real do Firestore + login com Google.
// As telas continuam usando `db` (mesmo formato do esboço) e as mesmas ações.
//
// Coleções:
//   config/estudio   configurações do estúdio (público)
//   servicos/{id}    catálogo (público)
//   ocupados/{id}    horários ocupados, sem dados pessoais (público)
//   agendamentos/{id}  completos (a cliente lê os dela; a admin lê tudo)
//   clientes/{id}    cadastro (a cliente lê o dela)
//   fichas/{id}      ficha técnica e anotações (só admin)
//   pendencias/{id}  multas e débitos (a cliente lê as dela)
//   notificacoes/{id}  avisos para o painel (só admin lê)
//   admins/{email}   e-mails com acesso ao painel
// ---------------------------------------------------------------------------

const StoreContext = createContext(null)

/** Firestore não aceita `undefined`: remove esses campos antes de gravar. */
const limpar = (o) => JSON.parse(JSON.stringify(o))
const comId = (snap) => snap.docs.map((d) => ({ ...d.data(), id: d.id }))
const ref = (col, id) => doc(fs, col, id)
const novoId = (col) => doc(collection(fs, col)).id

/** Registro público do horário ocupado (sem nome, telefone ou valores). */
const ocupadoDe = (ag) => limpar({ data: ag.data, hora: ag.hora, duracao: ag.duracao, status: ag.status, diaInteiro: ag.diaInteiro || false })

/** Mantém `ocupados/{id}` igual ao agendamento: existe enquanto ele ocupa a agenda. */
const sincronizarOcupado = (batch, ag) => {
  if (ocupaAgenda(ag)) batch.set(ref('ocupados', ag.id), ocupadoDe(ag))
  else batch.delete(ref('ocupados', ag.id))
}

/**
 * Pede ao servidor (api/avisos) os avisos de um agendamento: Telegram da Ana,
 * Google Agenda e e-mail da cliente. Não trava a tela se falhar (ex.: rodando local).
 */
const avisarServidor = async (tipo, id) => {
  try {
    const token = await auth.currentUser?.getIdToken()
    if (!token) return null
    const r = await fetch('/api/avisos', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ tipo, id }) })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

const notificacao = (n) => ({ criadoEm: new Date().toISOString(), lida: false, ...n })

export function StoreProvider({ children }) {
  const [toast, setToast] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [authPronto, setAuthPronto] = useState(false)
  const [ehAdmin, setEhAdmin] = useState(false)

  const [config, setConfig] = useState(null)
  const [servicos, setServicos] = useState(null)
  const [ocupados, setOcupados] = useState([])
  const [agendamentos, setAgendamentos] = useState([])
  const [clientes, setClientes] = useState([])
  const [fichas, setFichas] = useState({})
  const [pendencias, setPendencias] = useState([])
  const [notificacoes, setNotificacoes] = useState([])
  const [admins, setAdmins] = useState([])

  const avisar = useCallback((msg, tipo = 'ok') => {
    setToast({ msg, tipo, id: uid() })
    setTimeout(() => setToast((t) => (t?.msg === msg ? null : t)), 3500)
  }, [])
  const avisarRef = useRef(avisar)
  avisarRef.current = avisar

  /** Roda uma gravação e mostra o erro (se houver) sem travar a tela. */
  const gravar = useCallback((promessa) => {
    promessa.catch((e) => {
      console.error(e)
      avisarRef.current('Não foi possível salvar. Verifique a conexão e tente de novo.', 'erro')
    })
    return promessa
  }, [])

  // ---------- Login ----------
  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setAuthUser(u)
        let admin = false
        if (u?.email && u.emailVerified) {
          if (u.email === SUPER_ADMIN) admin = true
          else {
            try {
              admin = (await getDoc(ref('admins', u.email))).exists()
            } catch {
              admin = false
            }
          }
        }
        setEhAdmin(admin)
        // Primeira vez da cliente: cria o cadastro dela
        if (u && !admin) {
          try {
            const c = await getDoc(ref('clientes', u.uid))
            if (!c.exists())
              await setDoc(ref('clientes', u.uid), limpar({ nome: u.displayName || u.email, email: u.email, telefone: '', aniversario: '', criadoEm: toISO(new Date()) }))
          } catch (e) {
            console.error(e)
          }
        }
        setAuthPronto(true)
      }),
    []
  )

  // ---------- Dados públicos ----------
  useEffect(() => {
    const ontem = toISO(addDays(new Date(), -1))
    const erro = (e) => console.error(e)
    const subs = [
      onSnapshot(ref('config', 'estudio'), (s) => setConfig(s.exists() ? { ...CONFIG_PADRAO, ...s.data() } : null), erro),
      onSnapshot(collection(fs, 'servicos'), (s) => setServicos(comId(s)), erro),
      onSnapshot(query(collection(fs, 'ocupados'), where('data', '>=', ontem)), (s) => setOcupados(comId(s)), erro),
    ]
    return () => subs.forEach((f) => f())
  }, [])

  // ---------- Dados privados (dependem de quem está logado) ----------
  useEffect(() => {
    setAgendamentos([])
    setClientes([])
    setFichas({})
    setPendencias([])
    setNotificacoes([])
    setAdmins([])
    if (!authUser) return
    const erro = (e) => console.error(e)
    let subs
    if (ehAdmin) {
      subs = [
        onSnapshot(collection(fs, 'agendamentos'), (s) => setAgendamentos(comId(s)), erro),
        onSnapshot(collection(fs, 'clientes'), (s) => setClientes(comId(s)), erro),
        onSnapshot(collection(fs, 'fichas'), (s) => setFichas(Object.fromEntries(s.docs.map((d) => [d.id, d.data()]))), erro),
        onSnapshot(collection(fs, 'pendencias'), (s) => setPendencias(comId(s)), erro),
        onSnapshot(query(collection(fs, 'notificacoes'), orderBy('criadoEm', 'desc'), limit(40)), (s) => setNotificacoes(comId(s)), erro),
        onSnapshot(collection(fs, 'admins'), (s) => setAdmins(s.docs.map((d) => d.id)), erro),
      ]
    } else {
      const minha = where('clienteId', '==', authUser.uid)
      subs = [
        onSnapshot(query(collection(fs, 'agendamentos'), minha), (s) => setAgendamentos(comId(s)), erro),
        onSnapshot(query(collection(fs, 'pendencias'), minha), (s) => setPendencias(comId(s)), erro),
        onSnapshot(ref('clientes', authUser.uid), (s) => setClientes(s.exists() ? [{ ...s.data(), id: s.id }] : []), erro),
      ]
    }
    return () => subs.forEach((f) => f())
  }, [authUser, ehAdmin])

  // Primeiro acesso da admin: grava configurações e serviços padrão no banco
  useEffect(() => {
    if (!ehAdmin || servicos === null || servicos.length > 0) return
    const b = writeBatch(fs)
    b.set(ref('config', 'estudio'), limpar(CONFIG_PADRAO), { merge: true })
    SERVICOS.forEach((s) => b.set(ref('servicos', s.id), limpar(s)))
    gravar(b.commit()).then(() => avisar('Serviços e configurações iniciais publicados.'))
  }, [ehAdmin, servicos, gravar, avisar])

  // ---------- Ações ----------
  const estado = useRef({})
  estado.current = { agendamentos, servicos, config, pendencias, notificacoes, authUser }

  const acoes = useMemo(() => {
    const cfg = () => estado.current.config || CONFIG_PADRAO
    const listaServicos = () => (estado.current.servicos?.length ? estado.current.servicos : SERVICOS)
    const agPorId = (id) => estado.current.agendamentos.find((a) => a.id === id)

    /** Atualiza um agendamento e o registro público do horário juntos. */
    const atualizarAg = (id, patch, extra) => {
      const ag = agPorId(id)
      if (!ag) return Promise.resolve()
      const novo = { ...ag, ...patch }
      const b = writeBatch(fs)
      b.update(ref('agendamentos', id), limpar(patch))
      sincronizarOcupado(b, novo)
      extra?.(b, novo)
      return gravar(b.commit())
    }

    return {
      // ---------- Login ----------
      entrar: async () => {
        try {
          await signInWithPopup(auth, googleProvider)
        } catch (e) {
          // Navegadores que bloqueiam pop-up: entra por redirecionamento
          if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') return signInWithRedirect(auth, googleProvider)
          if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
            console.error(e)
            avisarRef.current('Não foi possível entrar com o Google.', 'erro')
          }
        }
      },
      sair: () => signOut(auth),

      // ---------- Agendamentos ----------
      /** Pelo site: já fica confirmado (sem sinal) e a Ana é notificada. Devolve o id. */
      criarAgendamento: (ag) => {
        const id = novoId('agendamentos')
        const novo = limpar({ criadoEm: toISO(new Date()), status: 'agendado', origem: 'site', pagamento: null, nota: '', ...ag })
        const b = writeBatch(fs)
        b.set(ref('agendamentos', id), novo)
        b.set(ref('ocupados', id), ocupadoDe(novo))
        b.set(doc(collection(fs, 'notificacoes')), notificacao({ tipo: 'agendamento', titulo: 'Novo agendamento pelo site', texto: `${ag.clienteNome} · ${ag.servicoNomes} · ${dataBR(ag.data)} às ${ag.hora}` }))
        if (ag.clienteId && ag.clienteTelefone) b.set(ref('clientes', ag.clienteId), { telefone: ag.clienteTelefone }, { merge: true })
        gravar(b.commit()).then(() => avisarServidor('novo', id))
        return id
      },
      criarAgendamentoAdmin: (ag) => {
        const id = novoId('agendamentos')
        const novo = limpar({ criadoEm: toISO(new Date()), status: 'agendado', pagamento: null, nota: '', ...ag, origem: 'admin' })
        const b = writeBatch(fs)
        b.set(ref('agendamentos', id), novo)
        b.set(ref('ocupados', id), ocupadoDe(novo))
        if (ag.clienteId && ag.clienteTelefone) b.set(ref('clientes', ag.clienteId), { telefone: ag.clienteTelefone }, { merge: true })
        return gravar(b.commit()).then(() => { if (ag.clienteId) avisarServidor('novo', id) })
      },
      concluirAtendimento: (id, { total, forma }) => atualizarAg(id, { status: 'concluido', total, pagamento: { forma, em: toISO(new Date()) } }),
      reabrirAgendamento: (id) => atualizarAg(id, { status: 'agendado', pagamento: null }),
      cancelarAgendamento: (id, porCliente = false) => {
        const ag = agPorId(id)
        if (!ag) return Promise.resolve()
        if (ag.status === 'bloqueio') {
          const b = writeBatch(fs)
          b.delete(ref('agendamentos', id))
          b.delete(ref('ocupados', id))
          return gravar(b.commit())
        }
        return atualizarAg(id, { status: 'cancelado', canceladoPor: porCliente ? 'cliente' : 'admin' }, (b) => {
          if (porCliente)
            b.set(doc(collection(fs, 'notificacoes')), notificacao({ tipo: 'cancelamento', titulo: 'Cliente cancelou o horário', texto: `${ag.clienteNome} · ${dataBR(ag.data)} às ${ag.hora}` }))
        }).then(() => { if (ag.clienteId) avisarServidor('cancelado', id) })
      },
      /** Falta (não veio ou cancelou em cima da hora): o horário fica livre, mas gera multa. */
      marcarFalta: (id, motivo = 'nao_compareceu') => {
        const ag = agPorId(id)
        if (!ag) return Promise.resolve()
        return atualizarAg(id, { status: 'falta', motivoFalta: motivo }, (b) =>
          b.set(doc(collection(fs, 'pendencias')), limpar({
            clienteId: ag.clienteId, clienteNome: ag.clienteNome, agendamentoId: ag.id, tipo: 'falta',
            descricao: `${motivo === 'cancelou_tarde' ? 'Cancelamento em cima da hora' : 'Falta'} em ${dataBR(ag.data)} (${ag.servicoNomes})`,
            valor: multaDe(ag.total, cfg().multaPct), status: 'aberta', bloqueia: true, criadaEm: toISO(new Date()), pagaEm: null, via: null,
          }))
        )
      },
      editarAgendamento: (id, { servicoIds, data, hora }) => {
        const { nomes, total, duracao } = itensDe(listaServicos(), servicoIds)
        const ag = agPorId(id)
        return atualizarAg(id, { servicoIds, servicoNomes: nomes, total, duracao, data, hora }).then(() => { if (ag?.clienteId && ag.status === 'agendado') avisarServidor('alterado', id) })
      },
      salvarNotaAgendamento: (id, nota) => gravar(setDoc(ref('agendamentos', id), { nota }, { merge: true })),
      bloquearHorario: (data, hora, duracao, motivo) => {
        const id = novoId('agendamentos')
        const ag = { data, hora, duracao, status: 'bloqueio', motivo: motivo || 'Horário fechado', total: 0 }
        const b = writeBatch(fs)
        b.set(ref('agendamentos', id), ag)
        b.set(ref('ocupados', id), ocupadoDe(ag))
        return gravar(b.commit())
      },
      bloquearDia: (data, motivo) => {
        const id = novoId('agendamentos')
        const ag = { data, hora: '00:00', duracao: 1440, diaInteiro: true, status: 'bloqueio', motivo: motivo || 'Dia fechado', total: 0 }
        const b = writeBatch(fs)
        b.set(ref('agendamentos', id), ag)
        b.set(ref('ocupados', id), ocupadoDe(ag))
        return gravar(b.commit())
      },
      desbloquearDia: (data) => {
        const b = writeBatch(fs)
        estado.current.agendamentos
          .filter((a) => a.data === data && a.status === 'bloqueio' && a.diaInteiro)
          .forEach((a) => {
            b.delete(ref('agendamentos', a.id))
            b.delete(ref('ocupados', a.id))
          })
        return gravar(b.commit())
      },

      // ---------- Multas e débitos (pendências) ----------
      lancarDebito: ({ clienteId, clienteNome, valor, descricao, bloqueia = true }) =>
        gravar(setDoc(doc(collection(fs, 'pendencias')), limpar({
          clienteId, clienteNome, agendamentoId: null, tipo: 'debito', descricao, valor,
          status: 'aberta', bloqueia, criadaEm: toISO(new Date()), pagaEm: null, via: null,
        }))),
      /** Baixa uma ou várias pendências (pela admin; na fase do Pix automático, pelo servidor). */
      pagarPendencias: (ids, via) => {
        const lista = [].concat(ids)
        const pagas = estado.current.pendencias.filter((x) => lista.includes(x.id))
        const b = writeBatch(fs)
        lista.forEach((id) => b.update(ref('pendencias', id), { status: 'paga', pagaEm: toISO(new Date()), via }))
        b.set(doc(collection(fs, 'notificacoes')), notificacao({
          tipo: 'pendencia_paga',
          titulo: via === 'pix' ? 'Multa paga no Pix' : 'Pendência marcada como paga',
          texto: `${pagas[0]?.clienteNome} pagou ${brl(pagas.reduce((s, m) => s + m.valor, 0))}. Agendamento liberado.`,
        }))
        return gravar(b.commit())
      },
      perdoarPendencia: (id) => gravar(setDoc(ref('pendencias', id), { status: 'perdoada', pagaEm: toISO(new Date()) }, { merge: true })),

      // ---------- Clientes ----------
      /** Dados do cadastro vão para `clientes`; ficha técnica e anotações para `fichas` (só admin). */
      salvarCliente: (c) => {
        const { id, ficha, notas, ...dados } = c
        const b = writeBatch(fs)
        if (Object.keys(dados).length) b.set(ref('clientes', id), limpar(dados), { merge: true })
        if (ficha !== undefined || notas !== undefined) b.set(ref('fichas', id), limpar({ ficha, notas }), { merge: true })
        return gravar(b.commit())
      },
      criarCliente: (c) => {
        const id = novoId('clientes')
        const { ficha, notas, ...dados } = c
        const novo = { email: '', criadoEm: toISO(new Date()), aniversario: '', ...dados }
        const b = writeBatch(fs)
        b.set(ref('clientes', id), limpar(novo))
        if (ficha || notas) b.set(ref('fichas', id), limpar({ ficha: ficha || {}, notas: notas || '' }))
        gravar(b.commit())
        return { ...novo, id, ficha: ficha || {}, notas: notas || '' }
      },

      // ---------- Serviços ----------
      salvarServico: (s) => {
        const existe = s.id && listaServicos().some((x) => x.id === s.id)
        const id = existe ? s.id : novoId('servicos')
        const { id: _, ...dados } = s
        return gravar(setDoc(ref('servicos', id), limpar({ ...dados, ordem: existe ? s.ordem : listaServicos().length })))
      },
      removerServico: (id) => gravar(deleteDoc(ref('servicos', id))),
      /** Sobe/desce o serviço na ordem em que aparece no site. */
      moverServico: (id, dir) => {
        const lista = listaServicos().slice().sort((a, b) => a.ordem - b.ordem)
        const i = lista.findIndex((s) => s.id === id)
        let j = i + dir
        // pula serviços de outra categoria, para mover só dentro da mesma lista
        while (j >= 0 && j < lista.length && lista[j].categoria !== lista[i].categoria) j += dir
        if (j < 0 || j >= lista.length) return Promise.resolve()
        ;[lista[i], lista[j]] = [lista[j], lista[i]]
        const b = writeBatch(fs)
        lista.forEach((s, k) => b.set(ref('servicos', s.id), { ordem: k }, { merge: true }))
        return gravar(b.commit())
      },

      // ---------- Config / admins / notificações ----------
      salvarConfig: (config) => gravar(setDoc(ref('config', 'estudio'), limpar(config))),
      adicionarAdmin: (email) => gravar(setDoc(ref('admins', email.trim().toLowerCase()), { criadoEm: toISO(new Date()) })),
      removerAdmin: (email) => gravar(deleteDoc(ref('admins', email))),
      /** Gera o link para a Ana ligar o Telegram dela ao bot. */
      conectarTelegram: () => avisarServidor('conectar-telegram'),
      lerNotificacoes: () => {
        const naoLidas = estado.current.notificacoes.filter((n) => !n.lida)
        if (!naoLidas.length) return Promise.resolve()
        const b = writeBatch(fs)
        naoLidas.forEach((n) => b.update(ref('notificacoes', n.id), { lida: true }))
        return gravar(b.commit())
      },
    }
  }, [gravar])

  // ---------- Formato usado pelas telas ----------
  const db = useMemo(() => {
    const clientesComFicha = ehAdmin ? clientes.map((c) => ({ ...c, ficha: fichas[c.id]?.ficha || {}, notas: fichas[c.id]?.notas || '' })) : clientes
    return {
      config: config || CONFIG_PADRAO,
      // Enquanto a admin não publicar os serviços, o site mostra o catálogo padrão
      servicos: servicos?.length ? servicos : SERVICOS,
      ocupados,
      agendamentos,
      clientes: clientesComFicha,
      pendencias,
      notificacoes,
      admins,
      carregando: !authPronto || servicos === null,
    }
  }, [config, servicos, ocupados, agendamentos, clientes, fichas, pendencias, notificacoes, admins, authPronto, ehAdmin])

  const usuario = useMemo(() => {
    if (!authUser) return null
    if (ehAdmin) return { tipo: 'admin', id: authUser.uid, nome: authUser.displayName || 'Administradora', email: authUser.email, foto: authUser.photoURL }
    const c = clientes.find((x) => x.id === authUser.uid)
    return { tipo: 'cliente', id: authUser.uid, nome: authUser.displayName || authUser.email, email: authUser.email, telefone: '', ...c }
  }, [authUser, ehAdmin, clientes])

  const valor = useMemo(() => ({ db, usuario, authPronto, avisar, toast, ...acoes }), [db, usuario, authPronto, avisar, toast, acoes])
  return <StoreContext.Provider value={valor}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)

/** Multas/débitos em aberto que bloqueiam a cliente de agendar. */
export const pendenciasAbertasDe = (db, clienteId) =>
  db.pendencias.filter((m) => m.clienteId === clienteId && m.status === 'aberta' && m.bloqueia !== false)

/** Serviços visíveis no site, na ordem definida no painel. */
export const servicosAtivos = (db) => db.servicos.filter((s) => s.ativo).sort((a, b) => a.ordem - b.ordem)
