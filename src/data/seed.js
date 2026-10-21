
// ---------------------------------------------------------------------------
// Configuração e catálogo PADRÃO do estúdio. No primeiro acesso da admin eles são
// gravados no Firestore; depois disso o que vale é o que está no banco (editável
// no painel). Itens marcados com "A CONFIRMAR" ainda faltam a Ana passar.
// ---------------------------------------------------------------------------

export { CATEGORIAS } from '../lib/catalogo'

export const CONFIG_PADRAO = {
  marca: 'Laura Célvio',
  slogan: 'Lash Designer',
  frase: 'Praticidade, beleza e cuidado em um só lugar.',
  fraseServicos: 'Do natural ao marcante, técnicas personalizadas para um resultado que combina com você.',
  whatsapp: '5531997830336',
  instagram: 'studiolauracelvio',
  endereco: 'Rua Geraldo Ilídio Teixeira, 784',
  cidade: '', // A CONFIRMAR: bairro / cidade

  // Horário por dia da semana (0 = domingo). Dia sem horário = fechado.
  horarios: {
    0: null,
    1: null,
    2: ['08:00', '18:30'],
    3: ['08:00', '18:30'],
    4: ['08:00', '18:30'],
    5: ['08:00', '18:30'],
    6: ['07:00', '15:00'],
  },
  // Pausa opcional (deixe vazio se não tiver)
  almocoInicio: '',
  almocoFim: '',
  slotMin: 30,
  diasAgendaAberta: 21,

  // Igual ao Arian: sem sinal. Cancelamento grátis até X horas antes; falta gera multa.
  antecedenciaCancelHoras: 24,
  multaPct: 50, // falta sem sinal pago
  // Sinal no Pix (Mercado Pago) para confirmar o horário
  sinalAtivo: true,
  sinalPct: 30,
  multaComSinalPct: 20, // falta com sinal pago: a Ana fica com o sinal + esta multa
  prazoSinalMin: 15, // tempo para pagar antes do horário voltar a ficar livre
  devolverSinalTardio: true, // cancelou com menos de 24h: devolve o sinal mesmo assim

  // Pix para a cliente pagar multas/pendências pelo site
  pixChave: '60294908000187', // CNPJ
  pixNome: 'Laura Celvio', // A CONFIRMAR: nome exato do titular do CNPJ
  pixCidade: 'Belo Horizonte', // A CONFIRMAR
}

// Cílios: intensidade 1 (mais natural) a 5 (mais cheio) e "leque" (fios no desenho) são estimativas.
// A duração da manutenção (90 min) ainda precisa ser confirmada pela Ana.
const manut = (preco, dias = 21, diasMin = null) => ({ preco, duracao: 90, dias, diasMin })
const foto = (nome) => `/img/servicos/${nome}.webp`

export const SERVICOS = [
  { id: 'brasileiro', categoria: 'cilios', nome: 'Volume Brasileiro', preco: 125, duracao: 120, intensidade: 2, leque: 2, marrom: true, manutencao: manut(85), // manutenção A CONFIRMAR
    desc: 'Ideal para quem busca cílios mais volumosos sem perder a naturalidade. Fios em formato de Y. Disponível em tom claro e escuro de marrom.' },
  { id: 'sirena', categoria: 'cilios', nome: 'Efeito Sirena', preco: 115, duracao: 90, intensidade: 2, leque: 2, marrom: true, manutencao: manut(75, 18, 15), foto: foto('sirena'),
    desc: 'A escolha perfeita pra você que gosta de um olhar alongado e delicado, com o charme do efeito sereia.' },
  { id: 'egipcio', categoria: 'cilios', nome: 'Volume Egípcio', preco: 135, duracao: 120, intensidade: 3, leque: 3, marrom: true, manutencao: manut(90),
    desc: 'A escolha perfeita para quem ama um olhar marcado e cheio, com fios em formato de W (3D).' },
  { id: 'angel', categoria: 'cilios', nome: 'Volume Angel', preco: 135, duracao: 120, intensidade: 3, leque: 3, marrom: false, manutencao: manut(90), // manutenção A CONFIRMAR
    desc: 'Volume, leveza e definição na medida certa, para um olhar angelical e iluminado.' },
  { id: 'glamour', categoria: 'cilios', nome: 'Volume Glamour', preco: 135, duracao: 120, intensidade: 4, leque: 4, marrom: true, manutencao: manut(90), foto: foto('glamour'),
    desc: 'Perfeito para quem ama um olhar intenso e glamouroso, com bastante volume.' },
  { id: 'fox', categoria: 'cilios', nome: 'Efeito Fox', preco: 150, duracao: 120, intensidade: 4, leque: 3, marrom: true, manutencao: manut(100), foto: foto('fox'),
    desc: 'Técnica perfeita para quem ama um olhar puxado e alongado, o famoso "olho de raposa", com efeito delineado.' },
  { id: 'luxo', categoria: 'cilios', nome: 'Volume Luxo', preco: 145, duracao: 120, intensidade: 5, leque: 5, marrom: false, manutencao: manut(95), // manutenção A CONFIRMAR
    desc: 'Para quem ama um olhar marcante e sofisticado, com volume denso e acabamento impecável.' },
  { id: 'power', categoria: 'cilios', nome: 'Volume Glamour (Power)', preco: 170, duracao: 180, intensidade: 5, leque: 6, marrom: false, manutencao: manut(110), foto: foto('power'), // manutenção A CONFIRMAR
    desc: 'São colocados dois fios sintéticos 4D em cada fio natural: o volume mais intenso do estúdio.' },

  { id: 'design', categoria: 'sobrancelhas', nome: 'Design Personalizado', preco: 30, duracao: 30, desenho: 'design', foto: foto('design'),
    desc: 'O design personalizado tem o objetivo de valorizar o seu rosto, respeitando o formato natural das suas sobrancelhas.' },
  { id: 'henna', categoria: 'sobrancelhas', nome: 'Design com Henna', preco: 40, duracao: 60, desenho: 'henna', foto: foto('henna'),
    desc: 'O design com henna proporciona preenchimento das falhas e um contorno bem marcado, que dura na pele por vários dias.' },
  { id: 'tintura', categoria: 'sobrancelhas', nome: 'Design com Tintura', preco: 40, duracao: 60, desenho: 'henna', // duração A CONFIRMAR
    desc: 'Diferente da henna, a tintura tem ação nos fios: cor uniforme e efeito natural, sem marcar a pele.' },
  { id: 'lamination', categoria: 'sobrancelhas', nome: 'Brow Lamination', preco: 100, duracao: 90, desenho: 'lamination', foto: foto('lamination'),
    desc: 'A Brow Lamination alinha e fixa os fios, deixando as sobrancelhas mais volumosas e disciplinadas por semanas.' },
  { id: 'lamination-tintura', categoria: 'sobrancelhas', nome: 'Brow Lamination com Tintura', preco: 110, duracao: 90, desenho: 'lamination', foto: foto('lamination'),
    desc: 'A Brow Lamination com tintura nos fios: além de alinhados e volumosos, ficam com a cor mais uniforme e marcada.' },

  { id: 'remocao', categoria: 'remocao', nome: 'Remoção Química', preco: 20, duracao: 20,
    desc: 'Utilizo um produto específico que dissolve a cola sem agredir os fios naturais.' },
].map((s, i) => ({ manutencao: null, marrom: false, foto: null, ...s, ativo: true, ordem: i }))
