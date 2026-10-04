import { toISO, addDays, uid, toMin, fromMin, pad, multaDe } from '../lib/format'
import { slotLivre } from '../lib/schedule'
import { itensDe, montarVid, lerVid } from '../lib/catalogo'

// ---------------------------------------------------------------------------
// Dados do esboço. Serviços e preços vieram da Ana; o que está marcado com
// "A CONFIRMAR" ainda falta ela passar. Clientes e agendamentos são FICTÍCIOS.
// ---------------------------------------------------------------------------

export { CATEGORIAS } from '../lib/catalogo'

export const CONFIG_PADRAO = {
  marca: 'Ana Laura', // A CONFIRMAR: nome do estúdio
  slogan: 'Lash & Brow',
  whatsapp: '5531900000000', // A CONFIRMAR
  instagram: 'analaura.lash', // A CONFIRMAR
  endereco: 'Rua Exemplo, 123 — Sala 2', // A CONFIRMAR
  cidade: 'Belo Horizonte - MG', // A CONFIRMAR

  abre: '09:00',
  fecha: '19:00',
  almocoInicio: '12:00',
  almocoFim: '13:00',
  slotMin: 30,
  diasAbertos: [1, 2, 3, 4, 5, 6], // seg a sáb
  diasAgendaAberta: 21,

  // Igual ao Arian: sem sinal. Cancelamento grátis até X horas antes; falta gera multa.
  antecedenciaCancelHoras: 24,
  multaPct: 50,

  // Pix para a cliente pagar multas/pendências pelo site
  pixChave: 'analaura@exemplo.com', // A CONFIRMAR
  pixNome: 'Ana Laura',
  pixCidade: 'Belo Horizonte',
}

// Cílios: intensidade 1 (mais natural) a 5 (mais cheio) e "leque" (fios no desenho) são estimativas.
// Durações e as manutenções marcadas com "A CONFIRMAR" ainda precisam vir da Ana.
const manut = (preco, dias = 21, diasMin = null) => ({ preco, duracao: 90, dias, diasMin })

export const SERVICOS = [
  { id: 'brasileiro', categoria: 'cilios', nome: 'Volume Brasileiro', preco: 125, duracao: 120, intensidade: 2, leque: 2, marrom: true, manutencao: manut(85), // manutenção A CONFIRMAR
    desc: 'Ideal para quem busca cílios mais volumosos sem perder a naturalidade. Fios em formato de Y. Disponível em tom claro e escuro de marrom.' },
  { id: 'sirena', categoria: 'cilios', nome: 'Efeito Sirena', preco: 115, duracao: 120, intensidade: 2, leque: 2, marrom: true, manutencao: manut(75, 18, 15),
    desc: 'A escolha perfeita pra você que gosta de um olhar alongado e delicado, com o charme do efeito sereia.' },
  { id: 'egipcio', categoria: 'cilios', nome: 'Volume Egípcio', preco: 135, duracao: 150, intensidade: 3, leque: 3, marrom: true, manutencao: manut(90),
    desc: 'A escolha perfeita para quem ama um olhar marcado e cheio, com fios em formato de W (3D).' },
  { id: 'angel', categoria: 'cilios', nome: 'Volume Angel', preco: 135, duracao: 150, intensidade: 3, leque: 3, marrom: false, manutencao: manut(90), // manutenção A CONFIRMAR
    desc: 'Volume, leveza e definição na medida certa, para um olhar angelical e iluminado.' },
  { id: 'glamour', categoria: 'cilios', nome: 'Volume Glamour', preco: 135, duracao: 150, intensidade: 4, leque: 4, marrom: true, manutencao: manut(90),
    desc: 'Perfeito para quem ama um olhar intenso e glamouroso, com bastante volume.' },
  { id: 'fox', categoria: 'cilios', nome: 'Efeito Fox', preco: 150, duracao: 150, intensidade: 4, leque: 3, marrom: true, manutencao: manut(100),
    desc: 'Técnica perfeita para quem ama um olhar puxado e alongado, o famoso "olho de raposa", com efeito delineado.' },
  { id: 'luxo', categoria: 'cilios', nome: 'Volume Luxo', preco: 145, duracao: 150, intensidade: 5, leque: 5, marrom: false, manutencao: manut(95), // manutenção A CONFIRMAR
    desc: 'Para quem ama um olhar marcante e sofisticado, com volume denso e acabamento impecável.' },
  { id: 'power', categoria: 'cilios', nome: 'Volume Glamour (Power)', preco: 170, duracao: 180, intensidade: 5, leque: 6, marrom: false, manutencao: manut(110), // manutenção A CONFIRMAR
    desc: 'São colocados dois fios sintéticos 4D em cada fio natural: o volume mais intenso do estúdio.' },

  { id: 'design', categoria: 'sobrancelhas', nome: 'Design Personalizado', preco: 30, duracao: 30, desenho: 'design',
    desc: 'O design personalizado tem o objetivo de valorizar o seu rosto, respeitando o formato natural das suas sobrancelhas.' },
  { id: 'henna', categoria: 'sobrancelhas', nome: 'Design com Henna', preco: 40, duracao: 45, desenho: 'henna',
    desc: 'O design com henna proporciona preenchimento das falhas e um contorno bem marcado, que dura na pele por vários dias.' },
  { id: 'tintura', categoria: 'sobrancelhas', nome: 'Design com Tintura', preco: 40, duracao: 45, desenho: 'henna',
    desc: 'Diferente da henna, a tintura tem ação nos fios: cor uniforme e efeito natural, sem marcar a pele.' },
  { id: 'lamination', categoria: 'sobrancelhas', nome: 'Brow Lamination', preco: 100, duracao: 60, desenho: 'lamination',
    desc: 'A Brow Lamination alinha e fixa os fios, deixando as sobrancelhas mais volumosas e disciplinadas por semanas.' },

  { id: 'remocao', categoria: 'remocao', nome: 'Remoção Química', preco: 20, duracao: 30,
    desc: 'Utilizo um produto específico que dissolve a cola sem agredir os fios naturais.' },
].map((s, i) => ({ manutencao: null, marrom: false, ...s, ativo: true, ordem: i }))

const NOMES = [
  'Ana Beatriz Lima', 'Bruna Carvalho', 'Camila Ferreira', 'Carolina Duarte', 'Daniela Prado', 'Fernanda Lopes',
  'Gabriela Nunes', 'Giovanna Reis', 'Isabela Moura', 'Jéssica Andrade', 'Júlia Martins', 'Larissa Campos',
  'Letícia Barros', 'Luana Teixeira', 'Manuela Freitas', 'Mariana Costa', 'Natália Pires', 'Patrícia Gomes',
  'Rafaela Torres', 'Renata Siqueira', 'Sabrina Rocha', 'Thaís Monteiro', 'Vanessa Araújo', 'Vitória Mendes',
  'Yasmin Correia', 'Aline Batista', 'Beatriz Cunha', 'Clara Vieira', 'Débora Azevedo', 'Eduarda Pinto',
  'Helena Castro', 'Isadora Ramos', 'Lorena Cardoso', 'Milena Fonseca', 'Priscila Ribeiro', 'Sophia Dias',
]

// PRNG determinístico: os dados de exemplo saem sempre iguais
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function sortear(r, pesos) {
  const total = pesos.reduce((s, [, p]) => s + p, 0)
  let x = r() * total
  for (const [v, p] of pesos) if ((x -= p) < 0) return v
  return pesos[0][0]
}

const ESTILOS = [['brasileiro', 8], ['egipcio', 4], ['sirena', 4], ['angel', 3], ['glamour', 6], ['fox', 5], ['luxo', 3], ['power', 2]]
const SOBRANCELHA = [['design', 45], ['henna', 25], ['tintura', 15], ['lamination', 15]]
const VISITAS = [['cilios', 58], ['sobrancelha', 24], ['cilios+sobrancelha', 14], ['remocao', 4]]
const FORMAS = [['pix', 55], ['cartao', 30], ['dinheiro', 15]]

// Ficha técnica: o "mapa" de cada cliente para repetir a aplicação igualzinha
const CURVATURAS = ['C', 'CC', 'D', 'L']
const MAPPINGS = ['8-9-10-11-12 · natural', '9-10-11-12-12 · aberto', '8-10-11-12-11 · boneca', '9-11-12-13-12 · gatinho']
const OBS = ['', '', '', 'Olhos lacrimejam: usar ventilador na secagem', 'Prefere fios mais curtos no canto interno', 'Dorme de lado (direito): reforçar esse olho', 'Gosta de conversar pouco, prefere relaxar']

function fichaAleatoria(r, estiloId, marrom) {
  return {
    estilo: SERVICOS.find((s) => s.id === estiloId).nome,
    cor: marrom ? 'Marrom' : 'Preto',
    curvatura: CURVATURAS[Math.floor(r() * CURVATURAS.length)],
    espessura: r() < 0.5 ? '0.05' : '0.07',
    mapping: MAPPINGS[Math.floor(r() * MAPPINGS.length)],
    cola: r() < 0.7 ? 'Sensitive (baixa emanação)' : 'Secagem rápida (1s)',
    alergias: r() < 0.12 ? 'Sensibilidade à cola — usar sempre a Sensitive' : '',
    observacoes: OBS[Math.floor(r() * OBS.length)],
  }
}

export const montarAgendamento = (cliente, vids, data, hora, status, extra = {}) => {
  const { nomes, total, duracao } = itensDe(SERVICOS, vids)
  return {
    id: uid(),
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    clienteTelefone: cliente.telefone,
    servicoIds: vids,
    servicoNomes: nomes,
    total,
    duracao,
    data,
    hora,
    status,
    origem: 'site',
    criadoEm: data,
    pagamento: null,
    nota: '',
    ...extra,
  }
}

const multaFalta = (ag, status, pagaEm = null, via = null) => ({
  id: uid(),
  clienteId: ag.clienteId,
  clienteNome: ag.clienteNome,
  agendamentoId: ag.id,
  tipo: 'falta',
  descricao: `Falta em ${ag.data.split('-').reverse().join('/')} (${ag.servicoNomes})`,
  valor: multaDe(ag.total, CONFIG_PADRAO.multaPct),
  status,
  bloqueia: true,
  criadaEm: ag.data,
  pagaEm,
  via,
})

export function gerarSeed() {
  const r = rng(20261003)
  const hojeD = new Date()
  const agoraMin = hojeD.getHours() * 60 + hojeD.getMinutes()
  const config = CONFIG_PADRAO

  const clientes = NOMES.map((nome, i) => {
    const estiloId = sortear(r, ESTILOS)
    const marrom = SERVICOS.find((s) => s.id === estiloId).marrom && r() < 0.25
    return {
      id: `c${i + 1}`,
      nome,
      email: `${nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ /g, '.')}@gmail.com`,
      telefone: `(31) 9${String(8000 + Math.floor(r() * 1999)).padStart(4, '0')}-${String(Math.floor(r() * 9999)).padStart(4, '0')}`,
      criadoEm: toISO(addDays(hojeD, -110 + Math.floor(i * 2.8))),
      // duas aniversariantes nesta semana, o resto espalhado no ano
      aniversario: i < 2 ? toISO(addDays(hojeD, 2 + i * 3)).slice(5) : `${pad(1 + Math.floor(r() * 12))}-${pad(1 + Math.floor(r() * 28))}`,
      ficha: fichaAleatoria(r, estiloId, marrom),
      notas: '',
      _estilo: estiloId,
      _marrom: marrom,
    }
  })

  // Contas do login de demonstração
  const demo = {
    id: 'demo', nome: 'Cliente Demo', email: 'cliente.demo@gmail.com', telefone: '(31) 98888-7777',
    criadoEm: toISO(addDays(hojeD, -80)), aniversario: '03-15',
    ficha: { estilo: 'Volume Brasileiro', cor: 'Preto', curvatura: 'D', espessura: '0.07', mapping: '9-10-11-12-12 · aberto', cola: 'Sensitive (baixa emanação)', alergias: '', observacoes: 'Prefere fios mais curtos no canto interno' },
    notas: 'Indicação da Júlia Martins.',
  }
  const devedora = {
    id: 'devedora', nome: 'Bianca Pendente', email: 'bianca.pendente@gmail.com', telefone: '(31) 97777-6666',
    criadoEm: toISO(addDays(hojeD, -50)), aniversario: '11-02',
    ficha: { estilo: 'Efeito Fox', cor: 'Marrom', curvatura: 'L', espessura: '0.05', mapping: '9-11-12-13-12 · gatinho', cola: 'Secagem rápida (1s)', alergias: '', observacoes: '' },
    notas: '',
  }
  const sorteaveis = clientes.slice()
  clientes.push(demo, devedora)

  const agendamentos = []
  const pendencias = []
  // última visita de cílios de cada cliente: decide se a próxima é aplicação ou manutenção
  const ultimaCilios = {}

  const visitaDe = (cliente, iso) => {
    const tipo = sortear(r, VISITAS)
    const vids = []
    if (tipo.startsWith('cilios')) {
      const ult = ultimaCilios[cliente.id]
      const dias = ult ? (new Date(iso) - new Date(ult)) / 86400000 : 999
      vids.push(montarVid(cliente._estilo, { marrom: cliente._marrom, manutencao: dias <= 25 }))
    }
    if (tipo.endsWith('sobrancelha')) vids.push(sortear(r, SOBRANCELHA))
    if (tipo === 'remocao') vids.push('remocao')
    return vids
  }

  for (let off = -95; off <= 14; off++) {
    const dia = addDays(hojeD, off)
    const iso = toISO(dia)
    if (!config.diasAbertos.includes(dia.getDay())) continue
    let ocupacao = dia.getDay() >= 4 ? 0.7 : 0.5 // quinta a sábado mais cheio
    if (off > 0) ocupacao *= Math.max(0.12, 0.6 - off / 18) // futuro mais vazio: ainda tem horário pra agendar

    let t = toMin(config.abre)
    while (t < toMin(config.fecha)) {
      if (r() > ocupacao) { t += 30; continue }
      // uma cliente não aparece duas vezes no mesmo dia
      let cliente = sorteaveis[Math.floor(r() * sorteaveis.length)]
      while (agendamentos.some((x) => x.data === iso && x.clienteId === cliente.id)) cliente = sorteaveis[Math.floor(r() * sorteaveis.length)]
      const ag = montarAgendamento(cliente, visitaDe(cliente, iso), iso, fromMin(t), 'agendado')
      if (!slotLivre(config, ag.hora, ag.duracao, [], '0000-00-00')) { t += 30; continue }

      const passou = off < 0 || (off === 0 && t + ag.duracao < agoraMin)
      ag.criadoEm = toISO(addDays(dia, -1 - Math.floor(r() * 8)))
      if (passou) {
        const x = r()
        if (x < 0.86) {
          ag.status = 'concluido'
          ag.pagamento = { forma: sortear(r, FORMAS), em: iso }
          if (ag.servicoIds.some((v) => SERVICOS.find((s) => s.id === lerVid(v).baseId)?.categoria === 'cilios')) ultimaCilios[cliente.id] = iso
        } else if (x < 0.93) {
          ag.status = 'cancelado'
        } else {
          ag.status = 'falta'
          // multas antigas já foram pagas (ou perdoadas); as recentes ficam em aberto
          const antiga = off < -8
          const perdoada = antiga && r() < 0.15
          pendencias.push(multaFalta(ag, antiga ? (perdoada ? 'perdoada' : 'paga') : 'aberta', antiga ? toISO(addDays(dia, 1 + Math.floor(r() * 4))) : null, antiga && !perdoada ? (r() < 0.7 ? 'pix' : 'manual') : null))
        }
      } else if (r() < 0.05) {
        ag.status = 'cancelado'
      }
      agendamentos.push(ag)
      t += ag.duracao
    }
  }

  const proximoAberto = (off) => {
    let d = addDays(hojeD, off)
    while (!config.diasAbertos.includes(d.getDay())) d = addDays(d, -1)
    return toISO(d)
  }
  const livreNoDia = (iso, hora, dur) =>
    !agendamentos.some((a) => a.data === iso && ['agendado', 'concluido'].includes(a.status) && toMin(hora) < toMin(a.hora) + a.duracao && toMin(hora) + dur > toMin(a.hora))
  const encaixar = (cliente, vids, off, status, extra) => {
    const iso = proximoAberto(off)
    const ag = montarAgendamento(cliente, vids, iso, '09:00', status, extra)
    ag.hora = ['13:00', '09:00', '14:30', '16:00', '10:00'].find((h) => livreNoDia(iso, h, ag.duracao)) || '16:00'
    agendamentos.push(ag)
    return ag
  }

  // Cliente demo: aplicou Volume Brasileiro, fez a manutenção há 19 dias (está vencendo)
  encaixar(demo, ['brasileiro'], -61, 'concluido', { pagamento: { forma: 'pix', em: proximoAberto(-61) } })
  encaixar(demo, ['brasileiro.manutencao', 'design'], -40, 'concluido', { pagamento: { forma: 'cartao', em: proximoAberto(-40) } })
  encaixar(demo, ['brasileiro.manutencao'], -19, 'concluido', { pagamento: { forma: 'pix', em: proximoAberto(-19) } })

  // Bianca: fez Efeito Fox Marrom e faltou na manutenção -> multa em aberto (bloqueada)
  encaixar(devedora, ['fox.marrom'], -30, 'concluido', { pagamento: { forma: 'pix', em: proximoAberto(-30) } })
  const falta = encaixar(devedora, ['fox.marrom.manutencao'], -5, 'falta')
  pendencias.push(multaFalta(falta, 'aberta'))

  agendamentos.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
  for (const c of clientes) { delete c._estilo; delete c._marrom }

  return {
    versao: 2,
    config,
    servicos: SERVICOS,
    clientes,
    agendamentos,
    pendencias,
    notificacoes: [
      {
        id: uid(),
        tipo: 'info',
        titulo: 'Bem-vinda ao esboço do painel',
        texto: 'Todos os dados aqui são fictícios. Dá pra recriá-los em Configurações.',
        criadoEm: new Date().toISOString(),
        lida: false,
      },
    ],
    sessao: null, // { tipo: 'cliente', clienteId } | { tipo: 'admin' }
  }
}
