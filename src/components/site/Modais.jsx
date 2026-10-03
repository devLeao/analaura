import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check, ShieldCheck, Loader2, AlertTriangle, CheckCircle2, UserPlus, Crown, QrCode, Wallet, CalendarX2 } from 'lucide-react'
import Modal from '../ui/Modal'
import { useStore, pendenciasAbertasDe } from '../../store/Store'
import { brl, dataCurta, dataLonga, iniciais } from '../../lib/format'
import { minutosAte } from '../../lib/schedule'
import { gerarPix } from '../../lib/pix'

// ---------------------------------------------------------------------------
// Login: no esboço simula o seletor de contas do Google.
// Na fase 2 vira signInWithPopup(auth, new GoogleAuthProvider()).
// ---------------------------------------------------------------------------
export function LoginModal({ aberto, onFechar }) {
  const { db, entrarComoCliente, entrarComoNovoCliente, entrarComoAdmin } = useStore()
  const [novo, setNovo] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const demo = db.clientes.find((c) => c.id === 'demo')
  const devedora = db.clientes.find((c) => c.id === 'devedora')

  const fechar = () => { setNovo(false); onFechar() }
  const Conta = ({ onClick, avatar, titulo, sub, destaque }) => (
    <button onClick={() => { onClick(); fechar() }} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-nude-100 text-left cursor-pointer">
      <span className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${destaque || 'bg-blush-100 text-blush-700'}`}>{avatar}</span>
      <span className="min-w-0">
        <span className="block text-cacau-900 text-sm font-medium truncate">{titulo}</span>
        <span className="block text-cacau-500 text-xs truncate">{sub}</span>
      </span>
    </button>
  )

  return (
    <Modal aberto={aberto} onFechar={fechar} titulo="Entrar com Google" sub="Para agendar e acompanhar seus horários">
      <div className="mb-4 text-xs bg-blush-100/70 border border-blush-200 text-blush-700 rounded-xl px-3 py-2">
        Esboço: o login real com Google entra na fase 2. Escolha uma conta de teste.
      </div>
      {!novo ? (
        <div className="space-y-1">
          {demo && <Conta onClick={() => entrarComoCliente(demo.id)} avatar={iniciais(demo.nome)} titulo={demo.nome} sub={`${demo.email} · tem crédito e histórico`} />}
          {devedora && (
            <Conta onClick={() => entrarComoCliente(devedora.id)} avatar={iniciais(devedora.nome)} titulo={devedora.nome} sub={`${devedora.email} · tem pendência em aberto`} destaque="bg-amber-50 text-amber-800" />
          )}
          <Conta onClick={entrarComoAdmin} avatar={<Crown size={16} />} titulo="Ana Laura (administradora)" sub="Acesso ao painel" destaque="bg-cacau-900 text-blush-200" />
          <button onClick={() => setNovo(true)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-nude-100 text-left text-cacau-600 text-sm cursor-pointer">
            <span className="h-10 w-10 rounded-full border border-dashed border-nude-400 flex items-center justify-center"><UserPlus size={16} /></span>
            Usar outra conta
          </button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (nome && email) { entrarComoNovoCliente(nome, email); fechar() } }}>
          <div><label className="label">Nome</label><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
          <div><label className="label">E-mail Google</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setNovo(false)} className="btn-ghost !py-2.5 !px-5 !text-xs">Voltar</button>
            <button className="btn-primary !py-2.5 !px-5 !text-xs">Entrar</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Pagamento das pendências via Pix, todas de uma vez
// ---------------------------------------------------------------------------
export function PagarPendenciasModal({ pendencias, onFechar }) {
  const { db, pagarPendencias } = useStore()
  const [copiado, setCopiado] = useState(false)
  const [pago, setPago] = useState(false)
  if (!pendencias?.length) return null
  const total = pendencias.reduce((s, m) => s + m.valor, 0)
  const { config } = db
  const codigo = gerarPix({ chave: config.pixChave, nome: config.pixNome, cidade: config.pixCidade, valor: total, txid: `PEND${pendencias[0].id}` })

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* navegador sem permissão de clipboard */
    }
  }
  const fechar = () => { setPago(false); onFechar() }

  return (
    <Modal aberto onFechar={fechar} titulo={pago ? 'Pagamento confirmado' : 'Pagar pendência'}>
      {pago ? (
        <div className="text-center py-4 animate-fade-up">
          <CheckCircle2 size={56} className="text-emerald-600 mx-auto mb-4" />
          <p className="text-cacau-900 text-lg font-semibold mb-2">Tudo certo! Agenda liberada.</p>
          <p className="text-sm text-cacau-600 mb-6">A Ana foi avisada do pagamento. Você já pode agendar normalmente.</p>
          <a href="#agendar" onClick={fechar} className="btn-primary">Agendar agora</a>
        </div>
      ) : (
        <div className="text-center">
          <ul className="text-sm text-cacau-600 mb-1 space-y-0.5">{pendencias.map((m) => <li key={m.id}>{m.descricao}</li>)}</ul>
          <p className="font-display text-5xl font-semibold text-cacau-900 mb-5">{brl(total)}</p>
          <div className="bg-white p-3 rounded-2xl border border-nude-200 w-fit mx-auto mb-4">
            <QRCodeSVG value={codigo} size={184} level="M" fgColor="#2a201d" />
          </div>
          <p className="text-xs text-cacau-500 mb-2">Abra o app do banco → Pix → Ler QR Code, ou use o copia e cola:</p>
          <div className="flex gap-2 mb-5 min-w-0">
            <div className="flex-1 min-w-0 bg-nude-50 border border-nude-300 rounded-xl px-3 py-2.5 text-xs font-mono text-cacau-600 truncate select-all text-left">{codigo}</div>
            <button onClick={copiar} className="btn-primary !px-4 !py-2 shrink-0 !text-[11px] !tracking-wider">
              {copiado ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar</>}
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-cacau-600 mb-5">
            <Loader2 size={16} className="animate-spin text-blush-600" /> Aguardando pagamento...
          </div>
          <div className="border-t border-nude-200 pt-4">
            <button onClick={() => { pagarPendencias(pendencias.map((m) => m.id), 'pix'); setPago(true) }} className="text-xs text-blush-700 hover:text-blush-600 underline underline-offset-4 cursor-pointer">
              [Esboço] Simular pagamento confirmado
            </button>
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
  aguardando_sinal: ['Aguardando sinal', 'text-amber-800 border-amber-200 bg-amber-50'],
  confirmado: ['Confirmado', 'text-violet-800 border-violet-200 bg-violet-50'],
  concluido: ['Concluído', 'text-emerald-800 border-emerald-200 bg-emerald-50'],
  cancelado: ['Cancelado', 'text-cacau-600 border-nude-300 bg-nude-100'],
  falta: ['Falta', 'text-red-700 border-red-200 bg-red-50'],
}

export function MinhaContaModal({ aberto, onFechar, onPagarPendencias }) {
  const { db, usuario, cancelarAgendamento, avisar } = useStore()
  const [confirmar, setConfirmar] = useState(null)
  if (!aberto || usuario?.tipo !== 'cliente') return null

  const { config } = db
  const meus = db.agendamentos.filter((a) => a.clienteId === usuario.id)
  const futuros = meus
    .filter((a) => ['confirmado', 'aguardando_sinal'].includes(a.status) && minutosAte(a) > -60)
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
  const historico = meus.filter((a) => !futuros.includes(a) && a.status !== 'aguardando_sinal').sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora)).slice(0, 8)
  const pendencias = pendenciasAbertasDe(db, usuario.id)
  const limite = config.remarcarHoras * 60
  const comAntecedencia = confirmar && minutosAte(confirmar) > limite

  return (
    <Modal aberto onFechar={onFechar} titulo="Meus horários" sub={`Olá, ${usuario.nome.split(' ')[0]}!`} largura="max-w-lg">
      {pendencias.length > 0 && (
        <div className="mb-5 border border-amber-200 bg-amber-50 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="text-amber-600 shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-sm text-cacau-900 font-medium">Pendência em aberto: {brl(pendencias.reduce((s, m) => s + m.valor, 0))}</p>
            <p className="text-xs text-cacau-600 mt-0.5">{pendencias.map((m) => m.descricao).join(' · ')}. Pague para voltar a agendar.</p>
            <button onClick={() => { onFechar(); onPagarPendencias(pendencias) }} className="btn-primary !py-2 !px-4 !text-[11px] mt-3"><QrCode size={14} /> Pagar com Pix</button>
          </div>
        </div>
      )}
      {usuario.credito > 0 && (
        <div className="mb-5 border border-emerald-200 bg-emerald-50 rounded-2xl p-4 flex gap-3 items-center">
          <Wallet className="text-emerald-700 shrink-0" size={20} />
          <p className="text-sm text-cacau-800">
            Você tem <strong className="text-emerald-800">{brl(usuario.credito)}</strong> de crédito. Ele é usado automaticamente no sinal do próximo agendamento.
          </p>
        </div>
      )}

      <h4 className="font-label uppercase tracking-[0.2em] text-xs text-blush-600 mb-3">Próximos</h4>
      {futuros.length === 0 ? (
        <p className="text-sm text-cacau-500 mb-6">Você não tem horários marcados.</p>
      ) : (
        <ul className="space-y-2 mb-6">
          {futuros.map((a) => {
            const [txt, cls] = STATUS_INFO[a.status]
            return (
              <li key={a.id} className="bg-nude-50 border border-nude-200 rounded-2xl p-4 flex items-center gap-4">
                <div className="text-center w-12 shrink-0">
                  <div className="font-display text-3xl font-semibold text-cacau-900 leading-none">{a.data.slice(8)}</div>
                  <div className="font-label text-[11px] uppercase text-cacau-500">{dataCurta(a.data).split(' ')[1]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-cacau-900 font-medium truncate">{a.servicoNomes}</div>
                  <div className="text-xs text-cacau-500 flex items-center gap-2 flex-wrap mt-0.5">
                    {a.hora} · sinal {a.sinal.pago ? `pago (${brl(a.sinal.valor)})` : 'pendente'}
                    <span className={`text-[10px] px-1.5 py-px rounded-full border ${cls}`}>{txt}</span>
                  </div>
                </div>
                <button onClick={() => setConfirmar(a)} className="p-2 text-cacau-500 hover:text-red-600 hover:bg-red-50 rounded-full cursor-pointer" title="Cancelar horário">
                  <CalendarX2 size={18} />
                </button>
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
            const [txt, cls] = STATUS_INFO[a.status] || STATUS_INFO.confirmado
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
        <ShieldCheck size={14} className="shrink-0 mt-px" /> Cancelando com {config.remarcarHoras}h de antecedência, o sinal vira crédito. Em cima da hora ou falta, o sinal fica retido.
      </p>

      <Modal
        aberto={!!confirmar}
        onFechar={() => setConfirmar(null)}
        titulo="Cancelar horário?"
        rodape={
          <>
            <button onClick={() => setConfirmar(null)} className="btn-ghost !py-2.5 !px-5 !text-xs">Voltar</button>
            <button
              onClick={() => {
                cancelarAgendamento(confirmar.id, comAntecedencia ? 'credito' : 'retido', true)
                setConfirmar(null)
                avisar(confirmar.sinal.pago && comAntecedencia ? `Horário cancelado. ${brl(confirmar.sinal.valor)} viraram crédito.` : 'Horário cancelado.')
              }}
              className="btn !py-2.5 !px-5 !text-xs bg-red-600 text-white hover:bg-red-700"
            >
              Sim, cancelar
            </button>
          </>
        }
      >
        {confirmar && (
          <div className="text-sm text-cacau-600 space-y-3">
            <p>{confirmar.servicoNomes} em {dataLonga(confirmar.data)} às {confirmar.hora}.</p>
            {!confirmar.sinal.pago ? (
              <p>O sinal ainda não foi pago, então nada é cobrado.</p>
            ) : comAntecedencia ? (
              <p className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-3 py-2">
                Faltam mais de {config.remarcarHoras}h: o sinal de <strong>{brl(confirmar.sinal.valor)}</strong> vira crédito para o próximo agendamento.
              </p>
            ) : (
              <p className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3 py-2">
                Faltam menos de {config.remarcarHoras}h: pela política do estúdio, o sinal de <strong>{brl(confirmar.sinal.valor)}</strong> não é devolvido.
              </p>
            )}
          </div>
        )}
      </Modal>
    </Modal>
  )
}
