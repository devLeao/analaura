// Gera o Pix (Mercado Pago) que a cliente paga pelo site.
//  { tipo: 'sinal', id }  sinal de um agendamento que está "aguardando"
//  { tipo: 'multa' }      todas as multas em aberto da cliente logada
// O valor é sempre calculado aqui, com os preços do banco (não confia no navegador).
import { db, lerDoc, quemChamou } from './_lib/servidor.js'
import { criarPix } from './_lib/mercadopago.js'
import { itensDe } from '../src/lib/catalogo.js'
import { valorSinal, aguardandoValido } from '../src/lib/sinal.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const quem = await quemChamou(req)
  if (!quem) return res.status(401).json({ erro: 'Faça login.' })
  const { tipo, id } = req.body || {}
  try {
    if (tipo === 'sinal') return res.json(await pixDoSinal(quem, id))
    if (tipo === 'multa') return res.json(await pixDasMultas(quem))
    res.status(400).json({ erro: 'Tipo inválido.' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ erro: 'Não foi possível gerar o Pix agora. Tente de novo em instantes.' })
  }
}

async function pixDoSinal(quem, id) {
  const ref = db().doc(`agendamentos/${id}`)
  const ag = await lerDoc(`agendamentos/${id}`)
  if (!ag || ag.clienteId !== quem.uid) return { erro: 'Horário não encontrado.' }
  if (ag.status === 'agendado') return { pago: true }
  if (!aguardandoValido(ag)) return { erro: 'O tempo para pagar acabou e o horário foi liberado. Escolha outro horário.' }

  // Já existe um Pix válido para este horário: reaproveita (a cliente pode ter fechado a tela)
  if (ag.pix?.copiaCola && new Date(ag.pix.venceEm).getTime() > Date.now() + 60e3) return { pix: ag.pix }

  const [config, servicosSnap] = await Promise.all([lerDoc('config/estudio'), db().collection('servicos').get()])
  const servicos = servicosSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const { total } = itensDe(servicos, ag.servicoIds || [])
  if (!total) return { erro: 'Serviço não encontrado.' }
  const valor = valorSinal(total, { sinalPct: 30, ...config })
  if (valor <= 0) return { erro: 'Sinal sem valor.' }

  const pix = await criarPix({
    valor,
    email: quem.email || ag.clienteEmail,
    referencia: `sinal_${id}`,
    cobranca: { tipo: 'sinal', agendamentoId: id, clienteId: ag.clienteId },
  })
  // total corrigido pelo servidor (se alguém mexeu no valor pelo navegador)
  await ref.update({ pix, total })
  return { pix }
}

async function pixDasMultas(quem) {
  const snap = await db().collection('pendencias').where('clienteId', '==', quem.uid).where('status', '==', 'aberta').get()
  const pend = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  if (!pend.length) return { pago: true }
  const valor = Math.round(pend.reduce((s, p) => s + (Number(p.valor) || 0), 0) * 100) / 100
  const ids = pend.map((p) => p.id).sort().join(',')

  // Reaproveita um Pix ainda válido das mesmas multas (evita criar uma cobrança a cada clique)
  const anteriores = await db().collection('cobrancas').where('clienteId', '==', quem.uid).get()
  const valido = anteriores.docs
    .map((d) => d.data())
    .find((c) => c.tipo === 'multa' && c.status === 'pendente' && c.pix && [...(c.pendenciaIds || [])].sort().join(',') === ids && new Date(c.pix.venceEm).getTime() > Date.now() + 2 * 60e3)
  if (valido) return { pix: valido.pix }

  const pix = await criarPix({
    valor,
    email: quem.email,
    referencia: `multa_${quem.uid}`.slice(0, 64),
    cobranca: { tipo: 'multa', pendenciaIds: pend.map((p) => p.id), clienteId: quem.uid },
  })
  return { pix }
}
