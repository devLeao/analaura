import { useEffect, useState } from 'react'
import { Save, QrCode, Clock, Receipt, Store, KeyRound, Trash2, Plus, Bell, CheckCircle2, Loader2 } from 'lucide-react'
import { useStore } from '../../store/Store'
import { SUPER_ADMIN } from '../../lib/firebase'
import { Cabecalho, Botao, Secao, Campo, Toggle } from '../../components/admin/ui'
import { Telegram } from '../../components/ui/Icones'
import { DIAS, brl, multaDe } from '../../lib/format'
import { valorSinal } from '../../lib/sinal'

export default function Configuracoes() {
  const { db, salvarConfig, adicionarAdmin, removerAdmin, conectarTelegram, testarAvisos, avisar } = useStore()
  const [teste, setTeste] = useState({ carregando: false, r: null })
  const [telegram, setTelegram] = useState({ carregando: false, link: '' })
  const [f, setF] = useState({ ...db.config })
  const [novoAdmin, setNovoAdmin] = useState('')
  // Quando as configurações chegam do banco (ou mudam em outro aparelho), atualiza o formulário
  useEffect(() => setF({ ...db.config }), [db.config])
  const set = (k, num = false) => (e) => setF({ ...f, [k]: num ? Number(e.target.value) : e.target.value })
  const setHorario = (d, h) => setF({ ...f, horarios: { ...f.horarios, [d]: h } })
  const alterado = JSON.stringify(f) !== JSON.stringify(db.config)
  const ex = db.servicos.find((s) => s.id === 'glamour') || db.servicos[0]

  return (
    <>
      <Cabecalho titulo="Configurações" sub="Regras da agenda, da multa e dados do estúdio">
        <Botao variante="pri" disabled={!alterado} onClick={() => { salvarConfig(f); avisar('Configurações salvas.') }}><Save size={16} /> Salvar alterações</Botao>
      </Cabecalho>
      {alterado && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-5">Você tem alterações não salvas.</p>}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Secao titulo="Dias e horários" icone={Clock} sub="Desligue o dia em que o estúdio não abre">
          <ul className="divide-y divide-nude-200 -mt-1">
            {[2, 3, 4, 5, 6, 0, 1].map((d) => {
              const h = f.horarios?.[d]
              return (
                <li key={d} className="flex items-center gap-3 py-2.5">
                  <span className="w-20 text-sm text-cacau-800">{DIAS[d]}</span>
                  <Toggle ligado={!!h} onChange={(v) => setHorario(d, v ? ['08:00', '18:00'] : null)} />
                  {h ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <input type="time" className="input !w-auto !py-1.5" value={h[0]} onChange={(e) => setHorario(d, [e.target.value, h[1]])} />
                      <span className="text-xs text-cacau-500">às</span>
                      <input type="time" className="input !w-auto !py-1.5" value={h[1]} onChange={(e) => setHorario(d, [h[0], e.target.value])} />
                    </div>
                  ) : (
                    <span className="ml-auto text-sm text-cacau-500">Fechado</span>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Campo rotulo="Pausa de (opcional)"><input type="time" className="input" value={f.almocoInicio} onChange={set('almocoInicio')} /></Campo>
            <Campo rotulo="Pausa até"><input type="time" className="input" value={f.almocoFim} onChange={set('almocoFim')} /></Campo>
            <Campo rotulo="Intervalo entre horários (min)"><input type="number" min="10" step="5" className="input" value={f.slotMin} onChange={set('slotMin', true)} /></Campo>
            <Campo rotulo="Agenda aberta para (dias)"><input type="number" min="1" className="input" value={f.diasAgendaAberta} onChange={set('diasAgendaAberta', true)} /></Campo>
          </div>
          <p className="text-xs text-cacau-500 mt-3">Os horários de início aparecem de {f.slotMin} em {f.slotMin} minutos. Sem pausa preenchida, a agenda corre direto.</p>
        </Secao>

        <Secao titulo="Sinal, cancelamento e multa" icone={Receipt}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-cacau-900">Cobrar sinal no Pix para agendar</p>
              <p className="text-xs text-cacau-500 mt-0.5">O Pix é gerado pelo Mercado Pago e confirmado sozinho.</p>
            </div>
            <Toggle ligado={!!f.sinalAtivo} onChange={(v) => setF({ ...f, sinalAtivo: v })} />
          </div>
          {f.sinalAtivo && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Campo rotulo="Sinal (%)"><input type="number" min="1" max="100" className="input" value={f.sinalPct} onChange={set('sinalPct', true)} /></Campo>
              <Campo rotulo="Multa se faltar (%)" dica="além do sinal"><input type="number" min="0" max="100" className="input" value={f.multaComSinalPct} onChange={set('multaComSinalPct', true)} /></Campo>
              <Campo rotulo="Prazo p/ pagar (min)"><input type="number" min="5" max="30" className="input" value={f.prazoSinalMin} onChange={set('prazoSinalMin', true)} /></Campo>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Cancelamento livre até (horas antes)"><input type="number" min="0" className="input" value={f.antecedenciaCancelHoras} onChange={set('antecedenciaCancelHoras', true)} /></Campo>
            {!f.sinalAtivo && <Campo rotulo="Multa por falta (%)"><input type="number" min="0" max="100" className="input" value={f.multaPct} onChange={set('multaPct', true)} /></Campo>}
          </div>
          {f.sinalAtivo && (
            <div className="flex items-start justify-between gap-4 mt-4">
              <div>
                <p className="text-sm font-medium text-cacau-900">Devolver o sinal mesmo em cima da hora</p>
                <p className="text-xs text-cacau-500 mt-0.5">Desligado: cancelando com menos de {f.antecedenciaCancelHoras}h, você fica com o sinal.</p>
              </div>
              <Toggle ligado={f.devolverSinalTardio !== false} onChange={(v) => setF({ ...f, devolverSinalTardio: v })} />
            </div>
          )}
          <div className="mt-4 bg-nude-50 rounded-2xl p-4 text-xs text-cacau-600 space-y-1.5 leading-relaxed">
            {f.sinalAtivo ? (
              <>
                <p><strong className="text-cacau-900">Como fica:</strong> no {ex.nome} ({brl(ex.preco)}), a cliente paga <strong className="text-cacau-900">{brl(valorSinal(ex.preco, f))}</strong> de sinal no Pix e o restante no dia. Ela tem {f.prazoSinalMin} min para pagar, senão o horário volta a ficar livre.</p>
                <p>Se ela cancelar, o sinal volta sozinho para o Pix dela{f.devolverSinalTardio !== false ? '' : ` (só com mais de ${f.antecedenciaCancelHoras}h de antecedência)`}. Se você cancelar, também volta.</p>
                <p>Se faltar: você fica com o sinal e gera multa de <strong className="text-cacau-900">{brl(multaDe(ex.preco, f.multaComSinalPct))}</strong> ({f.multaComSinalPct}%). Total: {f.sinalPct + f.multaComSinalPct}%.</p>
              </>
            ) : (
              <>
                <p><strong className="text-cacau-900">Como fica:</strong> sem sinal; a cliente paga no dia. Se faltar no {ex.nome} ({brl(ex.preco)}), gera multa de <strong className="text-cacau-900">{brl(multaDe(ex.preco, f.multaPct))}</strong>.</p>
                <p>Faltando menos de {f.antecedenciaCancelHoras}h, ela não consegue cancelar sozinha e o site pede para falar com você.</p>
              </>
            )}
            <p>Com multa em aberto, ela não consegue agendar pelo site até pagar (Pix no próprio site, baixa automática).</p>
          </div>

          <h4 className="text-sm font-semibold text-cacau-900 mt-6 mb-3 flex items-center gap-2"><QrCode size={16} className="text-blush-600" /> Pix reserva (se o Mercado Pago estiver fora do ar)</h4>
          <div className="grid gap-3">
            <Campo rotulo="Chave Pix"><input className="input" value={f.pixChave} onChange={set('pixChave')} /></Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Nome do recebedor"><input className="input" value={f.pixNome} onChange={set('pixNome')} /></Campo>
              <Campo rotulo="Cidade"><input className="input" value={f.pixCidade} onChange={set('pixCidade')} /></Campo>
            </div>
          </div>
        </Secao>

        <Secao titulo="Dados do estúdio" icone={Store} sub="Aparecem no site">
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="Nome"><input className="input" value={f.marca} onChange={set('marca')} /></Campo>
              <Campo rotulo="Subtítulo"><input className="input" value={f.slogan} onChange={set('slogan')} /></Campo>
            </div>
            <Campo rotulo="WhatsApp (com DDI e DDD, só números)"><input className="input" value={f.whatsapp} onChange={set('whatsapp')} /></Campo>
            <Campo rotulo="Instagram (sem @)"><input className="input" value={f.instagram} onChange={set('instagram')} /></Campo>
            <Campo rotulo="Endereço"><input className="input" value={f.endereco} onChange={set('endereco')} /></Campo>
            <Campo rotulo="Cidade"><input className="input" value={f.cidade} onChange={set('cidade')} /></Campo>
          </div>
        </Secao>

        <Secao titulo="Avisos" icone={Bell} sub="Como você fica sabendo dos agendamentos">
          <div className="flex items-start gap-3 mb-4">
            <Telegram size={20} className="text-sky-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="text-cacau-900 font-medium">Telegram</p>
              {db.config.telegramAna ? (
                <p className="text-emerald-700 flex items-center gap-1.5 mt-0.5"><CheckCircle2 size={14} /> Conectado: você recebe cada agendamento, cancelamento e a agenda do dia seguinte.</p>
              ) : (
                <p className="text-cacau-600 mt-0.5">Receba no celular cada agendamento e cancelamento feito pelo site, e todo fim de tarde a agenda do dia seguinte.</p>
              )}
              {telegram.link ? (
                <a href={telegram.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-sky-600 text-white text-sm hover:bg-sky-700">
                  <Telegram size={15} /> Abrir o Telegram e tocar em Iniciar
                </a>
              ) : (
                <Botao
                  className="mt-3"
                  disabled={telegram.carregando}
                  onClick={async () => {
                    setTelegram({ carregando: true, link: '' })
                    const r = await conectarTelegram()
                    if (r?.link) setTelegram({ carregando: false, link: r.link })
                    else {
                      setTelegram({ carregando: false, link: '' })
                      avisar(r?.erro || 'Não foi possível falar com o Telegram agora.', 'erro')
                    }
                  }}
                >
                  {telegram.carregando ? <Loader2 size={15} className="animate-spin" /> : <Telegram size={15} />}
                  {db.config.telegramAna ? 'Conectar de novo' : 'Conectar meu Telegram'}
                </Botao>
              )}
            </div>
          </div>
          <div className="border-t border-nude-200 pt-3 mb-3">
            <Botao
              disabled={teste.carregando}
              onClick={async () => {
                setTeste({ carregando: true, r: null })
                const r = await testarAvisos()
                setTeste({ carregando: false, r: r || { erro: 'O servidor não respondeu.' } })
              }}
            >
              {teste.carregando ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />} Enviar teste
            </Botao>
            {teste.r && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {teste.r.erro ? (
                  <li className="text-red-700">{teste.r.erro}</li>
                ) : (
                  [['telegram', 'Telegram'], ['agenda', 'Google Agenda'], ['email', 'E-mail (para você)']].map(([k, nome]) => (
                    <li key={k} className={teste.r[k] === 'ok' ? 'text-emerald-700' : 'text-red-700'}>
                      <strong>{nome}:</strong> {teste.r[k] === 'ok' ? 'funcionando ✓' : teste.r[k]}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <p className="text-xs text-cacau-500">
            Os agendamentos também entram sozinhos na agenda do Google <strong>lauracelviosalao@gmail.com</strong>, com alarme 1h antes. As clientes recebem confirmação e lembrete por e-mail (e pelo Telegram, se ativarem).
          </p>
        </Secao>

        <Secao titulo="Acesso ao painel" icone={KeyRound} sub="Contas Google que podem abrir o painel">
          <ul className="divide-y divide-nude-200 -mt-1 mb-4">
            {[SUPER_ADMIN, ...db.admins.filter((e) => e !== SUPER_ADMIN)].map((e) => (
              <li key={e} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="text-cacau-800 truncate">{e}</span>
                {e === SUPER_ADMIN ? (
                  <span className="text-[11px] text-cacau-500">desenvolvedor</span>
                ) : (
                  <button onClick={() => { removerAdmin(e); avisar('Acesso removido.') }} className="p-1.5 rounded-full text-cacau-500 hover:text-red-600 hover:bg-red-50 cursor-pointer" aria-label={`Remover ${e}`}>
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!/^\S+@\S+\.\S+$/.test(novoAdmin)) return avisar('Informe um e-mail válido.', 'erro')
              adicionarAdmin(novoAdmin)
              setNovoAdmin('')
              avisar('Acesso liberado.')
            }}
          >
            <input className="input" type="email" value={novoAdmin} onChange={(e) => setNovoAdmin(e.target.value)} placeholder="email@gmail.com" />
            <Botao variante="pri" className="shrink-0"><Plus size={15} /> Liberar</Botao>
          </form>
          <p className="text-xs text-cacau-500 mt-3">A pessoa entra em /admin com essa conta Google. Pagamentos de multa no Pix por enquanto são baixados manualmente em Financeiro.</p>
        </Secao>
      </div>
    </>
  )
}
