import { toISO, addDays, uid, sinalDe, toMin, fromMin, pad } from '../lib/format'
import { slotLivre } from '../lib/schedule'

// ---------------------------------------------------------------------------
// Dados FICTÍCIOS do esboço. Tudo marcado com "A CONFIRMAR" depende da Ana
// (nome do estúdio, preços, endereço...). Na fase 2 isso vem do banco de dados.
// ---------------------------------------------------------------------------

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

  // Regra do sinal: % no Pix para reservar, restante no dia
  sinalPct: 50,
  reservaMin: 15, // minutos que o horário fica segurado esperando o Pix
  remarcarHoras: 24, // cancelando com essa antecedência, o sinal vira crédito
  manutencaoDias: 21, // prazo da manutenção da extensão

  pixChave: 'analaura@exemplo.com', // A CONFIRMAR
  pixNome: 'Ana Laura',
  pixCidade: 'Belo Horizonte',
}

export const CATEGORIAS = [
  ['cilios', 'Cílios'],
  ['sobrancelhas', 'Sobrancelhas'],
]

/** Serviços que contam como "extensão" (para lembrar a manutenção). */
export const EXTENSOES = ['fio-a-fio', 'brasileiro', 'egipcio', 'russo', 'manutencao']

// intensidade: 1 (mais natural) a 5 (mais cheio). leque: fios por cílio no desenho.
// Preços ILUSTRATIVOS (A CONFIRMAR).
export const SERVICOS = [
  { id: 'fio-a-fio', categoria: 'cilios', nome: 'Fio a Fio', apelido: 'Clássico', duracao: 120, preco: 150, intensidade: 1, leque: 1,
    desc: 'Um fio aplicado em cada cílio natural. Efeito rímel, leve e discreto — para quem quer acordar pronta sem parecer “feito”.' },
  { id: 'brasileiro', categoria: 'cilios', nome: 'Volume Brasileiro', apelido: 'Fios em Y', duracao: 120, preco: 170, intensidade: 2, leque: 2,
    desc: 'Fios em formato Y que preenchem as falhas e dão mais definição, sem perder a leveza. O queridinho do dia a dia.' },
  { id: 'egipcio', categoria: 'cilios', nome: 'Volume Egípcio', apelido: 'Fios em W · 3D', duracao: 150, preco: 190, intensidade: 3, leque: 3,
    desc: 'Três pontas por cílio: olhar mais marcado e cheio, ainda com acabamento delicado e aspecto de “cílio de verdade”.' },
  { id: 'russo', categoria: 'cilios', nome: 'Volume Russo', apelido: 'Mega volume', duracao: 150, preco: 220, intensidade: 5, leque: 5,
    desc: 'Leques de 4 a 6 fios ultrafinos em cada cílio. O mais cheio e glamouroso, com efeito de delineado natural.' },
  { id: 'lash-lifting', categoria: 'cilios', nome: 'Lash Lifting', apelido: 'Seus próprios fios', duracao: 60, preco: 120, intensidade: null, leque: 1,
    desc: 'Curvatura e tintura nos seus cílios naturais, sem extensão. Zero manutenção, dura de 6 a 8 semanas.' },
  { id: 'manutencao', categoria: 'cilios', extra: true, nome: 'Manutenção', duracao: 90, preco: 100,
    desc: 'Reposição dos fios em até 21 dias após a aplicação.' },
  { id: 'remocao', categoria: 'cilios', extra: true, nome: 'Remoção', duracao: 30, preco: 40,
    desc: 'Retirada segura da extensão, sem danificar os fios naturais.' },
  { id: 'design', categoria: 'sobrancelhas', nome: 'Design de Sobrancelha', apelido: 'Na pinça', duracao: 40, preco: 45,
    desc: 'Mapeamento do rosto e desenho personalizado, respeitando o formato natural das suas sobrancelhas.' },
  { id: 'design-henna', categoria: 'sobrancelhas', nome: 'Design com Henna', apelido: 'Preenchimento', duracao: 60, preco: 60,
    desc: 'Design + henna para preencher falhas e dar contorno. Fica na pele por até 10 dias e nos fios por mais tempo.' },
  { id: 'brow-lamination', categoria: 'sobrancelhas', nome: 'Brow Lamination', apelido: 'Efeito penteado', duracao: 60, preco: 130,
    desc: 'Alinha e fixa os fios para cima, deixando a sobrancelha mais volumosa e disciplinada por semanas.' },
].map((s, i) => ({ ...s, ativo: true, ordem: i }))

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

const COMBOS = [
  [['manutencao'], 26],
  [['brasileiro'], 16],
  [['fio-a-fio'], 10],
  [['egipcio'], 8],
  [['russo'], 6],
  [['lash-lifting'], 7],
  [['design'], 12],
  [['design-henna'], 8],
  [['brow-lamination'], 4],
  [['manutencao', 'design'], 7],
  [['brasileiro', 'design-henna'], 3],
  [['remocao'], 2],
]

const FORMAS = [['pix', 55], ['cartao', 30], ['dinheiro', 15]]

// Ficha técnica: o "mapa" de cada cliente para repetir a aplicação igualzinha
const CURVATURAS = ['C', 'CC', 'D', 'L']
const MAPPINGS = ['8-9-10-11-12 · natural', '9-10-11-12-12 · aberto', '8-10-11-12-11 · boneca', '9-11-12-13-12 · gatinho']
const OBS = ['', '', '', 'Olhos lacrimejam: usar ventilador na secagem', 'Prefere fios mais curtos no canto interno', 'Dorme de lado (direito): reforçar esse olho', 'Gosta de conversar pouco, prefere relaxar']

function fichaAleatoria(r) {
  const estilo = sortear(r, [['Fio a Fio', 3], ['Volume Brasileiro', 5], ['Volume Egípcio', 2], ['Volume Russo', 2]])
  const fino = estilo !== 'Fio a Fio'
  return {
    estilo,
    curvatura: CURVATURAS[Math.floor(r() * CURVATURAS.length)],
    espessura: fino ? (r() < 0.5 ? '0.05' : '0.07') : (r() < 0.5 ? '0.12' : '0.15'),
    mapping: MAPPINGS[Math.floor(r() * MAPPINGS.length)],
    cola: r() < 0.7 ? 'Sensitive (baixa emanação)' : 'Secagem rápida (1s)',
    alergias: r() < 0.12 ? 'Sensibilidade à cola — usar sempre a Sensitive' : '',
    observacoes: OBS[Math.floor(r() * OBS.length)],
  }
}

export const montarAgendamento = (cliente, servicoIds, data, hora, status, extra = {}) => {
  const itens = servicoIds.map((id) => SERVICOS.find((s) => s.id === id))
  const total = itens.reduce((s, i) => s + i.preco, 0)
  return {
    id: uid(),
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    clienteTelefone: cliente.telefone,
    servicoIds,
    servicoNomes: itens.map((s) => s.nome).join(' + '),
    total,
    duracao: itens.reduce((s, i) => s + i.duracao, 0),
    data,
    hora,
    status,
    origem: 'site',
    criadoEm: data,
    expiraEm: null,
    sinal: { valor: sinalDe(total, CONFIG_PADRAO.sinalPct), pago: status !== 'aguardando_sinal', pagoEm: data, via: 'pix', creditoUsado: 0, destino: null },
    restante: null,
    nota: '',
    ...extra,
  }
}

export function gerarSeed() {
  const r = rng(20261002)
  const hojeD = new Date()
  const agoraMin = hojeD.getHours() * 60 + hojeD.getMinutes()
  const config = CONFIG_PADRAO

  const clientes = NOMES.map((nome, i) => ({
    id: `c${i + 1}`,
    nome,
    email: `${nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ /g, '.')}@gmail.com`,
    telefone: `(31) 9${String(8000 + Math.floor(r() * 1999)).padStart(4, '0')}-${String(Math.floor(r() * 9999)).padStart(4, '0')}`,
    criadoEm: toISO(addDays(hojeD, -110 + Math.floor(i * 2.8))),
    // duas aniversariantes nesta semana, o resto espalhado no ano
    aniversario: i < 2 ? toISO(addDays(hojeD, 2 + i * 3)).slice(5) : `${pad(1 + Math.floor(r() * 12))}-${pad(1 + Math.floor(r() * 28))}`,
    credito: 0,
    ficha: fichaAleatoria(r),
    notas: '',
  }))

  // Contas do login de demonstração
  const demo = {
    id: 'demo', nome: 'Cliente Demo', email: 'cliente.demo@gmail.com', telefone: '(31) 98888-7777',
    criadoEm: toISO(addDays(hojeD, -80)), aniversario: '03-15', credito: 0,
    ficha: { estilo: 'Volume Brasileiro', curvatura: 'D', espessura: '0.07', mapping: '9-10-11-12-12 · aberto', cola: 'Sensitive (baixa emanação)', alergias: '', observacoes: 'Prefere fios mais curtos no canto interno' },
    notas: 'Indicação da Júlia Martins.',
  }
  const devedora = {
    id: 'devedora', nome: 'Bianca Pendente', email: 'bianca.pendente@gmail.com', telefone: '(31) 97777-6666',
    criadoEm: toISO(addDays(hojeD, -50)), aniversario: '11-02', credito: 0,
    ficha: { estilo: 'Volume Russo', curvatura: 'L', espessura: '0.05', mapping: '9-11-12-13-12 · gatinho', cola: 'Secagem rápida (1s)', alergias: '', observacoes: '' },
    notas: '',
  }
  clientes.push(demo, devedora)
  const sorteaveis = clientes.slice(0, NOMES.length)

  const agendamentos = []
  const pendencias = []

  for (let off = -95; off <= 14; off++) {
    const dia = addDays(hojeD, off)
    const iso = toISO(dia)
    if (!config.diasAbertos.includes(dia.getDay())) continue
    let ocupacao = dia.getDay() >= 4 ? 0.7 : 0.5 // quinta a sábado mais cheio
    if (off > 0) ocupacao *= Math.max(0.12, 0.6 - off / 18) // futuro mais vazio: ainda tem horário pra agendar

    let t = toMin(config.abre)
    while (t < toMin(config.fecha)) {
      if (r() > ocupacao) { t += 30; continue }
      const combo = sortear(r, COMBOS)
      // uma cliente não aparece duas vezes no mesmo dia
      let cliente = sorteaveis[Math.floor(r() * sorteaveis.length)]
      while (agendamentos.some((x) => x.data === iso && x.clienteId === cliente.id)) cliente = sorteaveis[Math.floor(r() * sorteaveis.length)]
      const ag = montarAgendamento(cliente, combo, iso, fromMin(t), 'confirmado')
      if (!slotLivre(config, ag.hora, ag.duracao, [], '0000-00-00')) { t += 30; continue }

      const passou = off < 0 || (off === 0 && t + ag.duracao < agoraMin)
      ag.criadoEm = toISO(addDays(dia, -1 - Math.floor(r() * 8)))
      ag.sinal.pagoEm = ag.criadoEm
      ag.sinal.via = r() < 0.9 ? 'pix' : 'manual'

      if (passou) {
        const x = r()
        if (x < 0.86) {
          ag.status = 'concluido'
          ag.restante = { valor: ag.total - ag.sinal.valor, forma: sortear(r, FORMAS), em: iso }
        } else if (x < 0.93) {
          ag.status = 'cancelado'
          ag.sinal.destino = r() < 0.5 ? 'devolvido' : 'retido'
        } else {
          ag.status = 'falta'
          ag.sinal.destino = 'retido'
        }
      } else if (off >= 1 && r() < 0.08) {
        // Encaixe feito pela Ana, cliente ainda vai mandar o Pix do sinal
        ag.status = 'aguardando_sinal'
        ag.origem = 'admin'
        ag.sinal = { ...ag.sinal, pago: false, pagoEm: null }
      } else if (r() < 0.05) {
        ag.status = 'cancelado'
        ag.sinal.destino = 'devolvido'
      }
      agendamentos.push(ag)
      t += ag.duracao
    }
  }

  // Cliente demo: aplicou Volume Brasileiro há 16 dias (manutenção vencendo) e tem crédito de um cancelamento
  const proximoAberto = (off, dir = 1) => {
    let d = addDays(hojeD, off)
    while (!config.diasAbertos.includes(d.getDay())) d = addDays(d, dir)
    return toISO(d)
  }
  const livreNoDia = (iso, hora, dur) =>
    !agendamentos.some((a) => a.data === iso && ['confirmado', 'concluido', 'aguardando_sinal'].includes(a.status) && toMin(hora) < toMin(a.hora) + a.duracao && toMin(hora) + dur > toMin(a.hora))
  const historicoDemo = [[-58, ['brasileiro'], 'concluido'], [-37, ['manutencao', 'design'], 'concluido'], [-16, ['brasileiro'], 'concluido'], [-9, ['design-henna'], 'cancelado']]
  for (const [off, servs, status] of historicoDemo) {
    const iso = proximoAberto(off, -1)
    const ag = montarAgendamento(demo, servs, iso, '09:00', status)
    ag.hora = ['13:00', '09:00', '14:30', '16:00', '10:00'].find((h) => livreNoDia(iso, h, ag.duracao)) || '16:00'
    if (status === 'concluido') ag.restante = { valor: ag.total - ag.sinal.valor, forma: 'pix', em: iso }
    if (status === 'cancelado') { ag.sinal.destino = 'credito'; demo.credito += ag.sinal.valor }
    agendamentos.push(ag)
  }

  // Bianca: fez Volume Russo, pagou só o sinal e ficou de acertar o restante -> pendência que bloqueia
  const isoBianca = proximoAberto(-12, -1)
  const agBianca = montarAgendamento(devedora, ['russo'], isoBianca, '09:00', 'concluido', { restante: null })
  agBianca.hora = ['09:00', '13:00', '14:00', '15:30'].find((h) => livreNoDia(isoBianca, h, agBianca.duracao)) || '13:00'
  agendamentos.push(agBianca)
  pendencias.push({
    id: uid(), clienteId: devedora.id, clienteNome: devedora.nome, agendamentoId: agBianca.id, tipo: 'debito',
    descricao: `Restante do Volume Russo (${isoBianca.split('-').reverse().join('/')}) não pago`, valor: agBianca.total - agBianca.sinal.valor,
    status: 'aberta', bloqueia: true, criadaEm: isoBianca, pagaEm: null, via: null,
  })
  // ...e já tinha faltado uma vez antes (sinal retido)
  const agFalta = montarAgendamento(devedora, ['manutencao'], proximoAberto(-33, -1), '17:00', 'falta')
  agFalta.sinal.destino = 'retido'
  agendamentos.push(agFalta)

  // Pendência antiga já paga e uma perdoada, para o histórico do financeiro
  pendencias.push(
    { id: uid(), clienteId: 'c7', clienteNome: clientes[6].nome, agendamentoId: null, tipo: 'debito', descricao: 'Manutenção paga pela metade', valor: 50, status: 'paga', bloqueia: true, criadaEm: toISO(addDays(hojeD, -40)), pagaEm: toISO(addDays(hojeD, -38)), via: 'pix' },
    { id: uid(), clienteId: 'c15', clienteNome: clientes[14].nome, agendamentoId: null, tipo: 'debito', descricao: 'Henna (faltou troco)', valor: 10, status: 'perdoada', bloqueia: false, criadaEm: toISO(addDays(hojeD, -25)), pagaEm: toISO(addDays(hojeD, -25)), via: null },
  )

  agendamentos.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))

  return {
    versao: 1,
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
