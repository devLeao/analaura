/**
 * Regras do sinal (Pix no Mercado Pago) e da multa. Usado no site e no servidor (api/), por isso não importa nada.
 *  - Com sinal ligado: a cliente paga `sinalPct`% para confirmar; se faltar, a Ana fica com o sinal
 *    e gera multa de `multaComSinalPct`% (30% + 20% = 50% no total).
 *  - Sem sinal: a falta gera multa de `multaPct`%.
 *  - Enquanto o sinal não é pago o horário fica "aguardando" e segurado por `prazoSinalMin` minutos.
 */

const centavos = (v) => Math.round(v * 100) / 100

export const sinalLigado = (config) => !!config?.sinalAtivo && Number(config?.sinalPct) > 0

export const valorSinal = (total, config) => centavos(((Number(total) || 0) * (Number(config?.sinalPct) || 0)) / 100)

/** Multa por falta deste agendamento (menor quando a Ana já ficou com o sinal). */
export const multaPara = (ag, config) =>
  centavos(((Number(ag?.total) || 0) * (ag?.sinal?.pago ? Number(config?.multaComSinalPct) || 0 : Number(config?.multaPct) || 0)) / 100)

export const sinalPago = (ag) => (ag?.sinal?.pago && !ag.sinal.devolvidoEm ? Number(ag.sinal.valor) || 0 : 0)

/** O que falta a cliente pagar no dia. */
export const restanteNoDia = (ag) => centavos((Number(ag?.total) || 0) - sinalPago(ag))

/** Horário esperando o Pix do sinal, ainda dentro do prazo. */
export const aguardandoValido = (a) => a?.status === 'aguardando' && (!a.expiraEm || new Date(a.expiraEm).getTime() > Date.now())

/** Passou do prazo sem pagar: o horário já está livre. */
export const aguardandoExpirado = (a) => a?.status === 'aguardando' && !aguardandoValido(a)
