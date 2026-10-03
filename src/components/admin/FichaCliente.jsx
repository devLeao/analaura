import { useMemo, useState } from 'react'
import { AlertTriangle, Wallet, CalendarPlus, Save, Cake, Sparkles, Plus, Minus } from 'lucide-react'
import Modal from '../ui/Modal'
import { WhatsApp } from '../ui/Icones'
import { Avatar, Abas, Botao, Status, Vazio, Campo, Etiqueta } from './ui'
import { Pilulas } from './Escolhas'
import ModalEncaixe from './ModalEncaixe'
import ModalDebito from './ModalDebito'
import { useStore } from '../../store/Store'
import { resumoClientes } from '../../lib/stats'
import { brl, dataBR, dataCurta, diasEntreISO, toISO, telefoneMask, waNumero } from '../../lib/format'

const ESTILOS = ['Fio a Fio', 'Volume Brasileiro', 'Volume Egípcio', 'Volume Russo', 'Lash Lifting']
const CURVATURAS = ['B', 'C', 'CC', 'D', 'L', 'M']
const ESPESSURAS = ['0.05', '0.07', '0.10', '0.12', '0.15']

export default function FichaCliente({ clienteId, onFechar }) {
  const { db, salvarCliente, ajustarCredito, avisar } = useStore()
  const c = useMemo(() => resumoClientes(db).find((x) => x.id === clienteId), [db, clienteId])
  const [aba, setAba] = useState('ficha')
  const [ficha, setFicha] = useState({ ...(c?.ficha || {}) })
  const [dados, setDados] = useState({ nome: c?.nome || '', telefone: c?.telefone || '', email: c?.email || '', aniversario: c?.aniversario || '', notas: c?.notas || '' })
  const [agendar, setAgendar] = useState(false)
  const [debito, setDebito] = useState(false)
  if (!c) return null

  const ags = db.agendamentos.filter((a) => a.clienteId === c.id).sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora))
  const pendencias = db.pendencias.filter((m) => m.clienteId === c.id)
  const hoje = toISO(new Date())
  const diasExt = c.ultimaExtensao ? diasEntreISO(c.ultimaExtensao, hoje) : null
  const fichaAlterada = JSON.stringify(ficha) !== JSON.stringify(c.ficha || {})
  const dadosAlterados = ['nome', 'telefone', 'email', 'aniversario', 'notas'].some((k) => (dados[k] || '') !== (c[k] || ''))
  const setF = (k) => (v) => setFicha({ ...ficha, [k]: typeof v === 'string' ? v : v.target.value })
  const setD = (k) => (e) => setDados({ ...dados, [k]: k === 'telefone' ? telefoneMask(e.target.value) : e.target.value })

  // Serviço favorito
  const cont = {}
  ags.filter((a) => a.status === 'concluido').forEach((a) => (cont[a.servicoNomes] = (cont[a.servicoNomes] || 0) + 1))
  const favorito = Object.entries(cont).sort((a, b) => b[1] - a[1])[0]?.[0]

  return (
    <Modal aberto onFechar={onFechar} titulo="Ficha da cliente" largura="max-w-2xl">
      <div className="flex items-center gap-4 mb-5">
        <Avatar nome={c.nome} className="!h-14 !w-14 !text-base" />
        <div className="flex-1 min-w-0">
          <div className="font-display text-3xl font-semibold text-cacau-900 leading-tight">{c.nome}</div>
          <div className="text-sm text-cacau-500 truncate">{c.telefone || 'sem telefone'} · {c.email || 'sem e-mail'}</div>
          <div className="text-xs text-cacau-500 mt-0.5 flex flex-wrap gap-x-3">
            <span>Cliente desde {dataBR(c.criadoEm)}</span>
            {c.aniversario && <span className="flex items-center gap-1"><Cake size={12} /> {c.aniversario.split('-').reverse().join('/')}</span>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {c.telefone && (
            <a href={`https://wa.me/${waNumero(c.telefone)}`} target="_blank" rel="noreferrer" className="h-10 w-10 rounded-full bg-[#25D366]/15 text-[#1fa855] hover:bg-[#25D366]/25 flex items-center justify-center" title="WhatsApp">
              <WhatsApp size={19} />
            </a>
          )}
          <Botao variante="pri" onClick={() => setAgendar(true)} className="!px-3.5"><CalendarPlus size={16} /> <span className="hidden sm:inline">Agendar</span></Botao>
        </div>
      </div>

      {/* Alertas: o que a Ana precisa ver antes de atender */}
      <div className="space-y-2 mb-5">
        {c.ficha?.alergias && <Alerta cor="red" icone={AlertTriangle}>{c.ficha.alergias}</Alerta>}
        {c.devendo > 0 && <Alerta cor="amber" icone={AlertTriangle}>Bloqueada para agendar pelo site: {brl(c.devendo)} em aberto.</Alerta>}
        {c.credito > 0 && <Alerta cor="emerald" icone={Wallet}>Tem {brl(c.credito)} de crédito, usado automaticamente no próximo sinal.</Alerta>}
        {diasExt != null && !c.proximo && diasExt >= db.config.manutencaoDias - 7 && (
          <Alerta cor="violet" icone={Sparkles}>Última extensão há {diasExt} dias ({dataCurta(c.ultimaExtensao)}) e nenhum horário marcado.</Alerta>
        )}
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {[
          ['Atendimentos', c.visitas],
          ['Total gasto', brl(c.gasto)],
          ['Ticket médio', brl(c.visitas ? c.gasto / c.visitas : 0)],
          ['Faltas', c.faltas],
        ].map(([k, v]) => (
          <div key={k} className="bg-nude-50 rounded-2xl p-3">
            <dt className="text-[11px] text-cacau-500">{k}</dt>
            <dd className="text-cacau-900 font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-cacau-500 mb-5 flex flex-wrap gap-x-4 gap-y-1">
        {favorito && <span>Mais faz: <span className="text-cacau-800">{favorito}</span></span>}
        {c.proximo && <span>Próximo: <span className="text-cacau-800">{dataCurta(c.proximo.data)} às {c.proximo.hora}</span></span>}
      </p>

      <Abas valor={aba} onChange={setAba} abas={[['ficha', 'Ficha técnica'], ['historico', 'Histórico', ags.length], ['financeiro', 'Financeiro'], ['dados', 'Dados']]} />

      <div className="mt-4">
        {aba === 'ficha' && (
          <div className="space-y-4">
            <p className="text-xs text-cacau-500">O "mapa" dela, para repetir a aplicação igualzinha na manutenção.</p>
            <Campo rotulo="Estilo atual"><Pilulas valor={ficha.estilo} onChange={setF('estilo')} opcoes={ESTILOS.map((e) => [e, e])} /></Campo>
            <div className="grid sm:grid-cols-2 gap-4">
              <Campo rotulo="Curvatura"><Pilulas valor={ficha.curvatura} onChange={setF('curvatura')} opcoes={CURVATURAS.map((e) => [e, e])} /></Campo>
              <Campo rotulo="Espessura (mm)"><Pilulas valor={ficha.espessura} onChange={setF('espessura')} opcoes={ESPESSURAS.map((e) => [e, e])} /></Campo>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Campo rotulo="Mapping (tamanhos)" dica="Do canto interno ao externo, ex.: 8-9-10-11-12">
                <input className="input" value={ficha.mapping || ''} onChange={setF('mapping')} />
              </Campo>
              <Campo rotulo="Cola"><input className="input" value={ficha.cola || ''} onChange={setF('cola')} /></Campo>
            </div>
            <Campo rotulo="Alergias / sensibilidades" dica="Aparece em destaque na agenda.">
              <input className="input" value={ficha.alergias || ''} onChange={setF('alergias')} placeholder="Nenhuma" />
            </Campo>
            <Campo rotulo="Observações">
              <textarea className="input min-h-16" value={ficha.observacoes || ''} onChange={setF('observacoes')} placeholder="Ex.: olhos lacrimejam, prefere conversar pouco" />
            </Campo>
            <div className="flex justify-end">
              <Botao variante="pri" disabled={!fichaAlterada} onClick={() => { salvarCliente({ id: c.id, ficha }); avisar('Ficha técnica salva.') }}><Save size={15} /> Salvar ficha</Botao>
            </div>
          </div>
        )}

        {aba === 'historico' && (
          ags.length === 0 ? <Vazio texto="Nenhum atendimento ainda." /> : (
            <ul className="divide-y divide-nude-200">
              {ags.map((a) => (
                <li key={a.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="text-cacau-800 truncate">{a.servicoNomes}</div>
                    <div className="text-xs text-cacau-500">{dataCurta(a.data)} {a.data.slice(0, 4)} · {a.hora} · {brl(a.total)}{a.nota ? ` · ${a.nota}` : ''}</div>
                  </div>
                  <Status s={a.status} />
                </li>
              ))}
            </ul>
          )
        )}

        {aba === 'financeiro' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 bg-nude-50 rounded-2xl p-4">
              <div>
                <div className="text-xs text-cacau-500">Crédito disponível</div>
                <div className="text-xl font-semibold text-cacau-900 tabular-nums">{brl(c.credito || 0)}</div>
              </div>
              <div className="flex gap-1">
                <Botao variante="sec" className="!px-3" title="Tirar R$ 10" onClick={() => ajustarCredito(c.id, -10)} disabled={!c.credito}><Minus size={14} /> 10</Botao>
                <Botao variante="sec" className="!px-3" title="Dar R$ 10" onClick={() => ajustarCredito(c.id, 10)}><Plus size={14} /> 10</Botao>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-cacau-900">Pendências</h4>
                <Botao className="!py-1.5" onClick={() => setDebito(true)}>+ Lançar débito</Botao>
              </div>
              {pendencias.length === 0 ? <Vazio texto="Nenhuma pendência. Cliente em dia." /> : (
                <ul className="divide-y divide-nude-200">
                  {pendencias.map((m) => (
                    <li key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                      <div>
                        <div className="text-cacau-900">{brl(m.valor)}</div>
                        <div className="text-xs text-cacau-500">{m.descricao}{m.pagaEm ? ` · resolvida em ${dataCurta(m.pagaEm)}` : ''}</div>
                      </div>
                      <Status s={m.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-cacau-500 flex flex-wrap gap-2 items-center">
              Sinais desta cliente:
              <Etiqueta cls="text-amber-800 bg-amber-50 border-amber-200">{ags.filter((a) => a.sinal?.destino === 'retido').length} retido(s)</Etiqueta>
              <Etiqueta cls="text-emerald-800 bg-emerald-50 border-emerald-200">{ags.filter((a) => a.sinal?.destino === 'credito').length} viraram crédito</Etiqueta>
              <Etiqueta>{ags.filter((a) => a.sinal?.destino === 'devolvido').length} devolvido(s)</Etiqueta>
            </p>
          </div>
        )}

        {aba === 'dados' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Campo rotulo="Nome"><input className="input" value={dados.nome} onChange={setD('nome')} /></Campo>
              <Campo rotulo="WhatsApp"><input className="input" value={dados.telefone} onChange={setD('telefone')} /></Campo>
              <Campo rotulo="E-mail"><input className="input" value={dados.email} onChange={setD('email')} /></Campo>
              <Campo rotulo="Aniversário (dia/mês)">
                <input className="input" type="date" value={dados.aniversario ? `2000-${dados.aniversario}` : ''} onChange={(e) => setDados({ ...dados, aniversario: e.target.value.slice(5) })} />
              </Campo>
            </div>
            <Campo rotulo="Anotações"><textarea className="input min-h-20" value={dados.notas} onChange={setD('notas')} placeholder="Ex.: veio por indicação da Júlia" /></Campo>
            <div className="flex justify-end">
              <Botao variante="pri" disabled={!dadosAlterados || !dados.nome.trim()} onClick={() => { salvarCliente({ id: c.id, ...dados }); avisar('Dados salvos.') }}><Save size={15} /> Salvar dados</Botao>
            </div>
          </div>
        )}
      </div>

      {agendar && <ModalEncaixe clienteFixo={c} onFechar={() => setAgendar(false)} />}
      {debito && <ModalDebito cliente={c} onFechar={() => setDebito(false)} />}
    </Modal>
  )
}

const CORES = {
  red: 'text-red-800 bg-red-50 border-red-200',
  amber: 'text-amber-900 bg-amber-50 border-amber-200',
  emerald: 'text-emerald-900 bg-emerald-50 border-emerald-200',
  violet: 'text-violet-900 bg-violet-50 border-violet-200',
}
const Alerta = ({ cor, icone: Icone, children }) => (
  <div className={`flex items-center gap-2 text-sm border rounded-xl px-3 py-2 ${CORES[cor]}`}><Icone size={16} className="shrink-0" /> {children}</div>
)
