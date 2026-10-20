import { useEffect, useState } from 'react'
import { Save, QrCode, Clock, Receipt, Store, KeyRound, Trash2, Plus } from 'lucide-react'
import { useStore } from '../../store/Store'
import { SUPER_ADMIN } from '../../lib/firebase'
import { Cabecalho, Botao, Secao, Campo, Toggle } from '../../components/admin/ui'
import { DIAS, brl, multaDe } from '../../lib/format'

export default function Configuracoes() {
  const { db, salvarConfig, adicionarAdmin, removerAdmin, avisar } = useStore()
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

        <Secao titulo="Cancelamento e multa" icone={Receipt}>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Cliente cancela pelo site até (horas antes)"><input type="number" min="0" className="input" value={f.antecedenciaCancelHoras} onChange={set('antecedenciaCancelHoras', true)} /></Campo>
            <Campo rotulo="Multa por falta (%)"><input type="number" min="0" max="100" className="input" value={f.multaPct} onChange={set('multaPct', true)} /></Campo>
          </div>
          <div className="mt-4 bg-nude-50 rounded-2xl p-4 text-xs text-cacau-600 space-y-1.5 leading-relaxed">
            <p><strong className="text-cacau-900">Como fica:</strong> sem sinal; a cliente paga no dia. Se faltar no {ex.nome} ({brl(ex.preco)}), gera multa de <strong className="text-cacau-900">{brl(multaDe(ex.preco, f.multaPct))}</strong>.</p>
            <p>Com multa em aberto, ela não consegue agendar pelo site até pagar (Pix no próprio site).</p>
            <p>Faltando menos de {f.antecedenciaCancelHoras}h, ela não consegue cancelar sozinha e o site pede para falar com você.</p>
            <p>O prazo de manutenção de cada modelo fica em Serviços.</p>
          </div>

          <h4 className="text-sm font-semibold text-cacau-900 mt-6 mb-3 flex items-center gap-2"><QrCode size={16} className="text-blush-600" /> Pix para pagamento de multas</h4>
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
