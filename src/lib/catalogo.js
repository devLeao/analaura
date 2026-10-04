// Cada modelo de cílios tem a própria manutenção e alguns também são feitos em marrom.
// Em vez de cadastrar cada combinação como um serviço separado, o agendamento guarda
// um "id de variação": o id do modelo + '.marrom' e/ou '.manutencao'.
//   'fox'                    -> Efeito Fox (aplicação, preto)
//   'fox.marrom.manutencao'  -> Manutenção Efeito Fox Marrom

export const CATEGORIAS = [
  ['cilios', 'Cílios'],
  ['sobrancelhas', 'Sobrancelhas'],
  ['remocao', 'Remoção'],
]

export const montarVid = (baseId, { marrom = false, manutencao = false } = {}) =>
  `${baseId}${marrom ? '.marrom' : ''}${manutencao ? '.manutencao' : ''}`

export const lerVid = (vid = '') => {
  const [baseId, ...extras] = vid.split('.')
  return { baseId, marrom: extras.includes('marrom'), manutencao: extras.includes('manutencao') }
}

/** Prazo da manutenção em texto: "21 dias" ou "15 a 18 dias". */
export const prazoLabel = (m) => (m ? (m.diasMin ? `${m.diasMin} a ${m.dias} dias` : `${m.dias} dias`) : '')

/** Transforma um id de variação no item que vai para a agenda (nome, preço e duração certos). */
export function resolver(servicos, vid) {
  const { baseId, marrom, manutencao } = lerVid(vid)
  const base = servicos.find((s) => s.id === baseId)
  if (!base) return null
  const usaManut = manutencao && !!base.manutencao
  const nomeModelo = `${base.nome}${marrom && base.marrom ? ' Marrom' : ''}`
  return {
    vid,
    base,
    categoria: base.categoria,
    marrom: marrom && !!base.marrom,
    manutencao: usaManut,
    nome: usaManut ? `Manutenção ${nomeModelo}` : nomeModelo,
    preco: usaManut ? base.manutencao.preco : base.preco,
    duracao: usaManut ? base.manutencao.duracao : base.duracao,
  }
}

/** Lista de itens resolvidos + totais, a partir dos ids de variação. */
export function itensDe(servicos, vids = []) {
  const itens = vids.map((v) => resolver(servicos, v)).filter(Boolean)
  return {
    itens,
    nomes: itens.map((i) => i.nome).join(' + '),
    total: itens.reduce((s, i) => s + i.preco, 0),
    duracao: itens.reduce((s, i) => s + i.duracao, 0),
  }
}

/**
 * Listras decorativas de cada modelo de cílios (aparecem na borda das opções de agendamento).
 * Modelos sem tema (ex.: um cadastrado depois pela Ana) usam as cores neutras.
 */
export const TEMAS_CILIOS = {
  brasileiro: ['#009c3b', '#ffdf00', '#002776'], // bandeira do Brasil
  egipcio: ['#c9a227', '#1f3a93', '#2ec4b6'], // ouro, lápis-lazúli e turquesa
  sirena: ['#7fdbda', '#2a7fba', '#b9a3e3'], // escamas de sereia
  angel: ['#c9d3df', '#9fcdeb', '#e8c76a'], // prata, céu e auréola dourada
  glamour: ['#e8a0b4', '#f3e0c7', '#b76e79'], // rosa, champanhe e rose gold
  fox: ['#f28c28', '#a0451f', '#3b2620'], // pelo laranja, ferrugem e patinhas escuras da raposa
  luxo: ['#1f1715', '#c9a227', '#efe0c4'], // preto, dourado e champanhe
  power: ['#d6246e', '#6a1b9a', '#1f1715'], // magenta, roxo e preto
}
export const TEMA_NEUTRO = ['#ecdfd4', '#dcc8b8', '#c4ab98']
