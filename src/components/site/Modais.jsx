import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, ShieldCheck, Loader2, AlertTriangle, CheckCircle2, QrCode, CalendarX2 } from 'lucide-react'
import Modal from '../ui/Modal'
import { WhatsApp } from '../ui/Icones'
import { useStore, pendenciasAbertasDe } from '../../store/Store'
import { brl, dataCurta, dataLonga } from '../../lib/format'
import { minutosAte } from '../../lib/schedule'
import { gerarPix } from '../../lib/pix'
import SalvarNaAgenda from './SalvarNaAgenda'
import { PagarPix, AguardandoSinal } from './PagarPix'
import { sinalPago, restanteNoDia, aguardandoValido } from '../../lib/sinal'

// ---------------------------------------------------------------------------
// Pagamento das pendências via Pix, todas de uma vez.
// Por enquanto a Ana dá a baixa no painel ao ver o Pix cair; quando o Pix
// automático entrar, o servidor baixa sozinho e esta tela já percebe e confirma.
// ---------------------------------------------------------------------------
export function PagarPendenciasModal({ pendencias, onFechar }) {
  const { db, pixDasMultas } = useStore()
  const [copiado, setCopiado] = useState(false)
  const [auto, setAuto] = useState({ pix: null, falhou: false })
  const pedido = useRef(false)
  useEffect(() => {
    if (!pendencias?.length || pedido.current) return
    pedido.current = true
    pixDasMultas().then((r) => setAuto(r?.pix ? { pix: r.pix, falhou: false } : { pix: null, falhou: !r?.pago }))
  }, [pendencias, pixDasMultas])
  if (!pendencias?.length) return null
  const total = pendencias.reduce((s, m) => s + m.valor, 0)
  const { config } = db
  const codigo = gerarPix({ chave: config.pixChave, nome: config.pixNome, cidade: config.pixCidade, valor: total, txid: `PEND${pendencias[0].id}` })
  // Pago = nenhuma das pendências continua em aberto no banco
  const pago = pendencias.every((p) => db.pendencias.find((x) => x.id === p.id)?.status !== 'aberta')
  const msg = encodeURIComponent(`Oi, Ana! Paguei a pendência de ${brl(total)} pelo Pix. Segue o comprovante:`)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* navegador sem permissão de clipboard */
    }
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={pago ? 'Pagamento confirmado' : 'Pagar multa / pendência'}>
      {pago ? (
        <div className="text-center py-4 animate-fade-up">
          <CheckCircle2 size={56} className="text-emerald-500 mx-auto mb-4" />
          <p className="text-cacau-900 text-lg font-semibold mb-2">Tudo certo! Agenda liberada.</p>
          <p className="text-sm text-cacau-600 mb-6">Você já pode agendar normalmente.</p>
          <a href="#agendar" onClick={onFechar} className="btn-primary">Agendar agora</a>
        </div>
      ) : auto.pix ? (
        <div>
          <ul className="text-sm text-cacau-600 mb-4 space-y-0.5 text-center">{pendencias.map((m) => <li key={m.id}>{m.descricao}</li>)}</ul>
          <PagarPix valor={auto.pix.valor} pix={auto.pix} rotulo="Total a pagar" />
          <p className="text-xs text-cacau-500 text-center mt-4">Assim que o Pix cair, sua agenda é liberada na hora.</p>
        </div>
      ) : !auto.falhou ? (
        <div className="flex items-center justify-center gap-2 text-sm text-cacau-600 py-16"><Loader2 size={18} className="animate-spin" /> Gerando o Pix...</div>
      ) : (
        <div className="text-center">
          <ul className="text-sm text-cacau-600 mb-1 space-y-0.5">{pendencias.map((m) => <li key={m.id}>{m.descricao}</li>)}</ul>
          <p className="font-display text-5xl font-semibold text-cacau-900 mb-5">{brl(total)}</p>
          <div className="bg-white p-3 rounded-2xl border border-nude-200 w-fit mx-auto mb-4">
            <QRCodeSVG value={codigo} size={184} level="M" fgColor="#111111" />
          </div>
          <p className="text-xs text-cacau-500 mb-2">Abra o app do banco → Pix → Ler QR Code, ou use o copia e cola:</p>
          <div className="flex gap-2 mb-5 min-w-0">
            <div className="flex-1 min-w-0 bg-nude-50 border border-nude-300 rounded-xl px-3 py-2.5 text-xs font-mono text-cacau-600 truncate select-all text-left">{codigo}</div>
            <button onClick={copiar} className="btn-primary !px-4 !py-2 shrink-0 !text-[11px] !tracking-wider">
              {copiado ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar</>}
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-cacau-600 mb-5">
            <Loader2 size={16} className="animate-spin text-blush-600" /> Aguardando a confirmação do pagamento...
          </div>
          <div className="border-t border-nude-200 pt-4 space-y-3">
            <p className="text-xs text-cacau-500">Depois de pagar, envie o comprovante para a Ana liberar sua agenda.</p>
            <a href={`https://wa.me/${config.whatsapp}?text=${msg}`} target="_blank" rel="noreferrer" className="btn bg-white text-black hover:bg-white/85 !py-2.5 !text-[11px]">
              <WhatsApp size={15} /> Enviar comprovante
            </a>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Meus horários (área da cliente)
// ---------------------------------------------------------------------------
const STATUS_INFO = {
  agendado: ['Agendado', 'text-violet-300 border-violet-500/30 bg-violet-500/10'],
  concluido: ['Concluído', 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'],
  cancelado: ['Cancelado', 'text-cacau-600 border-nude-300 bg-nude-100'],
  falta: ['Falta', 'text-red-300 border-red-500/30 bg-red-500/10'],
}

export function MinhaContaModal({ aberto, onFechar, onPagarPendencias }) {
  const { db, usuario, cancelarAgendamento, avisar } = useStore()
  const [confirmar, setConfirmar] = useState(null)
  const [pagarSinal, setPagarSinal] = useState(null)
  if (!aberto || usuario?.tipo !== 'cliente') return null

  const { config } = db
  const meus = db.agendamentos.filter((a) => a.clienteId === usuario.id)
  const futuros = meus.filter((a) => (a.status === 'agendado' || aguardandoValido(a)) && minutosAte(a) > -60).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
  const historico = meus.filter((a) => !futuros.includes(a)).sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora)).slice(0, 8)
  const pendencias = pendenciasAbertasDe(db, usuario.id)
  const limite = config.antecedenciaCancelHoras * 60

  return (
    <Modal aberto onFechar={onFechar} titulo="Meus horários" sub={`Olá, ${usuario.nome.split(' ')[0]}!`} largura="max-w-lg">
      {pendencias.length > 0 && (
        <div className="mb-5 border border-amber-500/30 bg-amber-500/10 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="text-amber-600 shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-sm text-cacau-900 font-medium">Pendência em aberto: {brl(pendencias.reduce((s, m) => s + m.valor, 0))}</p>
            <p className="text-xs text-cacau-600 mt-0.5">{pendencias.map((m) => m.descricao).join(' · ')}. Pague para voltar a agendar.</p>
            <button onClick={() => { onFechar(); onPagarPendencias(pendencias) }} className="btn-primary !py-2 !px-4 !text-[11px] mt-3"><QrCode size={14} /> Pagar com Pix</button>
          </div>
        </div>
      )}

      <h4 className="font-label uppercase tracking-[0.2em] text-xs text-blush-600 mb-3">Próximos</h4>
      {futuros.length === 0 ? (
        <p className="text-sm text-cacau-500 mb-6">Você não tem horários marcados.</p>
      ) : (
        <ul className="space-y-2 mb-6">
          {futuros.map((a) => {
            // com sinal pago ela sempre pode cancelar (o aviso diz se o sinal volta)
            const podeCancelar = minutosAte(a) > limite || sinalPago(a) > 0
            const esperandoPix = a.status === 'aguardando'
            return (
              <li key={a.id} className="bg-nude-50 border border-nude-200 rounded-2xl p-4">
                <div className="flex items-center gap-4">
                <div className="text-center w-12 shrink-0">
                  <div className="font-display text-3xl font-semibold text-cacau-900 leading-none">{a.data.slice(8)}</div>
                  <div className="font-label text-[11px] uppercase text-cacau-500">{dataCurta(a.data).split(' ')[1]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-cacau-900 font-medium">{a.servicoNomes}</div>
                  <div className="text-xs text-cacau-500 mt-0.5">
                    {a.hora} · {sinalPago(a) ? `sinal pago · ${brl(restanteNoDia(a))} no dia` : `${brl(a.total)} no dia`}
                  </div>
                  {esperandoPix && (
                    <button onClick={() => setPagarSinal(a.id)} className="btn-primary !py-1.5 !px-3 !text-[10px] mt-2"><QrCode size={13} /> Pagar sinal para confirmar</button>
                  )}
                </div>
                {podeCancelar ? (
                  <button onClick={() => setConfirmar(a)} className="p-2 text-cacau-500 hover:text-red-400 hover:bg-red-500/10 rounded-full cursor-pointer" title="Cancelar horário">
                    <CalendarX2 size={18} />
                  </button>
                ) : (
                  <a
                    href={`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Oi, Ana! Preciso falar sobre o meu horário de ${dataLonga(a.data)} às ${a.hora} (${a.servicoNomes}).`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-0.5 text-[10px] font-label uppercase tracking-wider text-amber-700 hover:text-amber-600 text-center leading-tight"
                    title={`Menos de ${config.antecedenciaCancelHoras}h para o horário: para desmarcar, fale com a Ana.`}
                  >
                    <WhatsApp size={16} />
                    Fale com<br />a Ana
                  </a>
                )}
                </div>
                {!esperandoPix && (
                  <div className="mt-3 pt-3 border-t border-nude-200">
                    <SalvarNaAgenda ag={a} config={config} telegramAtivo={!!usuario.telegramChatId} compacto />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <h4 className="font-label uppercase tracking-[0.2em] text-xs text-blush-600 mb-3">Histórico</h4>
      {historico.length === 0 ? (
        <p className="text-sm text-cacau-500">Nenhum atendimento ainda.</p>
      ) : (
        <ul className="divide-y divide-nude-200">
          {historico.map((a) => {
            const [txt, cls] = STATUS_INFO[a.status] || STATUS_INFO.agendado
            return (
              <li key={a.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="text-cacau-800 truncate">{a.servicoNomes}</div>
                  <div className="text-xs text-cacau-500">{dataCurta(a.data)} · {a.hora}</div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${cls}`}>{txt}</span>
              </li>
            )
          })}
        </ul>
      )}

      <p className="flex items-start gap-2 text-[11px] text-cacau-500 mt-6">
        <ShieldCheck size={14} className="shrink-0 mt-px" />
        {config.sinalAtivo
          ? `Cancelou, o sinal volta para o seu Pix${config.devolverSinalTardio !== false ? '' : ` (até ${config.antecedenciaCancelHoras}h antes)`}. Falta sem aviso: o sinal fica com a Ana e gera multa de ${config.multaComSinalPct}%.`
          : `Cancelamento grátis aqui até ${config.antecedenciaCancelHoras}h antes; depois disso, fale com a Ana pelo WhatsApp. Faltas sem aviso geram multa de ${config.multaPct}%.`}
      </p>

      <p className="text-[11px] text-cacau-500 mt-3">
        Seus dados: <Link to="/privacidade" onClick={onFechar} className="underline underline-offset-4 hover:text-cacau-900">política de privacidade</Link> ·{' '}
        <a
          href={`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(`Oi! Quero pedir a exclusão dos meus dados do site (conta ${usuario.email}).`)}`}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-cacau-900"
        >
          pedir exclusão
        </a>
      </p>

      <Modal
        aberto={!!confirmar}
        onFechar={() => setConfirmar(null)}
        titulo="Cancelar horário?"
        rodape={
          <>
            <button onClick={() => setConfirmar(null)} className="btn-ghost !py-2.5 !px-5 !text-xs">Voltar</button>
            <button
              onClick={() => { cancelarAgendamento(confirmar.id, true); setConfirmar(null); avisar('Horário cancelado.') }}
              className="btn !py-2.5 !px-5 !text-xs bg-red-600 text-white hover:bg-red-700"
            >
              Sim, cancelar
            </button>
          </>
        }
      >
        {confirmar && (
          <p className="text-sm text-cacau-600">
            {confirmar.servicoNomes} em {dataLonga(confirmar.data)} às {confirmar.hora}.{' '}
            {sinalPago(confirmar) > 0
              ? minutosAte(confirmar) > limite || config.devolverSinalTardio !== false
                ? `O sinal de ${brl(sinalPago(confirmar))} volta para o seu Pix em alguns minutos.`
                : `Como faltam menos de ${config.antecedenciaCancelHoras}h, o sinal de ${brl(sinalPago(confirmar))} não é devolvido.`
              : `Como faltam mais de ${config.antecedenciaCancelHoras}h, não há nenhuma cobrança.`}{' '}
            O horário fica livre para outra cliente.
          </p>
        )}
      </Modal>

      <Modal aberto={!!pagarSinal} onFechar={() => setPagarSinal(null)} titulo="Pagar sinal">
        {pagarSinal && (() => {
          const ag = db.agendamentos.find((x) => x.id === pagarSinal)
          if (!ag || ag.status !== 'aguardando') {
            return <p className="text-sm text-cacau-600 text-center py-6">{ag?.status === 'agendado' ? 'Pago! Seu horário está confirmado.' : 'O tempo para pagar acabou e o horário foi liberado.'}</p>
          }
          return <AguardandoSinal ag={ag} onDesistir={() => setPagarSinal(null)} />
        })()}
      </Modal>
    </Modal>
  )
}
