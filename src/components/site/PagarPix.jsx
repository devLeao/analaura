import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, Loader2, Clock, ExternalLink, AlertCircle } from 'lucide-react'
import { useStore } from '../../store/Store'
import { brl, dataLonga, fromMin, toMin } from '../../lib/format'
import { restanteNoDia } from '../../lib/sinal'

/** Relógio que atualiza a cada segundo (para contadores). */
export function useAgora() {
  const [agora, setAgora] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return agora
}

const mmss = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** QR + copia e cola de um Pix do Mercado Pago. A confirmação chega sozinha (o servidor recebe o aviso do banco). */
export function PagarPix({ valor, pix, rotulo = 'Valor do Pix' }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(pix.copiaCola)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* navegador sem permissão de clipboard */
    }
  }
  return (
    <div className="text-center">
      <p className="text-xs text-cacau-500 uppercase tracking-[0.2em] font-label">{rotulo}</p>
      <p className="font-display text-5xl font-semibold text-cacau-900 mb-5">{brl(valor)}</p>
      <div className="bg-white p-3 rounded-2xl border border-nude-200 w-fit mx-auto mb-4">
        <QRCodeSVG value={pix.copiaCola} size={184} level="M" fgColor="#111111" />
      </div>
      <p className="text-xs text-cacau-500 mb-2">Abra o app do banco → Pix → Ler QR Code, ou use o copia e cola:</p>
      <div className="flex gap-2 mb-3 min-w-0">
        <div className="flex-1 min-w-0 bg-nude-50 border border-nude-300 rounded-xl px-3 py-2.5 text-xs font-mono text-cacau-600 truncate select-all text-left">{pix.copiaCola}</div>
        <button onClick={copiar} className="btn-primary !px-4 !py-2 shrink-0 !text-[11px] !tracking-wider">
          {copiado ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar</>}
        </button>
      </div>
      {pix.link && (
        <a href={pix.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-cacau-600 hover:text-cacau-900 underline underline-offset-4 mb-4">
          <ExternalLink size={12} /> Abrir a página do Pix
        </a>
      )}
      <div className="flex items-center justify-center gap-2 text-sm text-cacau-600">
        <Loader2 size={16} className="animate-spin text-blush-600" /> Aguardando a confirmação do pagamento...
      </div>
    </div>
  )
}

/**
 * Horário "aguardando" o sinal: pede o Pix ao servidor, mostra o contador e,
 * quando o Pix cai, o banco muda o horário para "agendado" e a tela de confirmado aparece sozinha.
 */
export function AguardandoSinal({ ag, onDesistir, onExpirou }) {
  const { db, pixDoSinal, cancelarAgendamento } = useStore()
  const [erro, setErro] = useState('')
  const [pixLocal, setPixLocal] = useState(null)
  const pedido = useRef(null)
  const agora = useAgora()
  const restaMs = new Date(ag.expiraEm).getTime() - agora
  const pix = ag.pix || pixLocal

  useEffect(() => {
    if (pedido.current === ag.id) return
    pedido.current = ag.id
    pixDoSinal(ag.id).then((r) => {
      if (r?.pix) setPixLocal(r.pix)
      else if (r?.erro) setErro(r.erro)
    })
  }, [ag.id, pixDoSinal])

  useEffect(() => {
    if (restaMs <= 0) onExpirou?.()
  }, [restaMs <= 0]) // eslint-disable-line react-hooks/exhaustive-deps

  const desistir = () => {
    cancelarAgendamento(ag.id, true)
    onDesistir?.()
  }

  return (
    <div className="max-w-md mx-auto bg-superficie border border-nude-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blush-700/5 animate-fade-up">
      <h3 className="font-display text-3xl text-cacau-900 font-semibold text-center mb-1">Falta só o sinal</h3>
      <p className="text-sm text-cacau-600 text-center mb-5">
        {ag.servicoNomes}
        <br />
        {dataLonga(ag.data)}, {ag.hora} às {fromMin(toMin(ag.hora) + ag.duracao)}
      </p>

      <div className={`flex items-center justify-center gap-2 text-sm mb-6 ${restaMs < 3 * 60e3 ? 'text-amber-600' : 'text-cacau-700'}`}>
        <Clock size={15} /> Seu horário fica reservado por <strong className="tabular-nums">{mmss(restaMs)}</strong>
      </div>

      {erro ? (
        <p className="flex items-start gap-2 text-sm text-red-400 mb-4"><AlertCircle size={16} className="shrink-0 mt-0.5" /> {erro}</p>
      ) : pix ? (
        <PagarPix valor={pix.valor} pix={pix} rotulo="Sinal para confirmar" />
      ) : (
        <div className="flex items-center justify-center gap-2 text-sm text-cacau-600 py-16"><Loader2 size={18} className="animate-spin" /> Gerando o Pix...</div>
      )}

      {pix && (
        <p className="text-xs text-cacau-500 text-center mt-5">
          No dia você paga o restante: <strong className="text-cacau-800">{brl(restanteNoDia({ total: ag.total, sinal: { pago: true, valor: pix.valor } }))}</strong>.
          <br />
          {db.config.devolverSinalTardio !== false ? 'Se cancelar, o sinal volta para o seu Pix.' : `Cancelando até ${db.config.antecedenciaCancelHoras}h antes, o sinal volta para o seu Pix.`}
        </p>
      )}
      <button onClick={desistir} className="block mx-auto mt-5 text-xs text-cacau-500 hover:text-red-400 underline underline-offset-4 cursor-pointer">
        Desistir deste horário
      </button>
    </div>
  )
}
