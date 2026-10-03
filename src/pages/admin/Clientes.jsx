import { useMemo, useState } from 'react'
import { Search, ArrowUpDown, UserPlus, AlertTriangle } from 'lucide-react'
import { useStore } from '../../store/Store'
import FichaCliente from '../../components/admin/FichaCliente'
import { Cabecalho, Avatar, Abas, Vazio, Botao, Etiqueta, Campo } from '../../components/admin/ui'
import Modal from '../../components/ui/Modal'
import { resumoClientes } from '../../lib/stats'
import { brl, dataCurta, toISO, diasEntreISO, telefoneMask } from '../../lib/format'

const ORDENS = [
  ['nome', 'Nome (A–Z)'],
  ['ultima', 'Visita mais recente'],
  ['gasto', 'Quem mais gasta'],
  ['visitas', 'Mais atendimentos'],
]

export default function Clientes() {
  const { db, criarCliente, avisar } = useStore()
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState('nome')
  const [filtro, setFiltro] = useState('todas')
  const [aberta, setAberta] = useState(null)
  const [nova, setNova] = useState(false)

  const hoje = toISO(new Date())
  const todas = useMemo(() => resumoClientes(db), [db])
  const prazo = db.config.manutencaoDias
  const situacao = (c) => ({
    devendo: c.devendo > 0,
    credito: c.credito > 0,
    agendada: !!c.proximo,
    manutencao: !!c.ultimaExtensao && !c.proximo && diasEntreISO(c.ultimaExtensao, hoje) >= prazo - 7 && diasEntreISO(c.ultimaExtensao, hoje) <= prazo + 7,
    sumida: !!c.ultima && !c.proximo && diasEntreISO(c.ultima, hoje) > 45,
  })
  const conta = (k) => todas.filter((c) => situacao(c)[k]).length

  const termo = busca.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const lista = todas
    .filter((c) => !busca || c.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(termo) || (c.telefone || '').replace(/\D/g, '').includes(busca.replace(/\D/g, '') || '§'))
    .filter((c) => filtro === 'todas' || situacao(c)[filtro])
    .sort((a, b) => (ordem === 'nome' ? a.nome.localeCompare(b.nome) : ordem === 'ultima' ? (b.ultima || '').localeCompare(a.ultima || '') : b[ordem] - a[ordem]))

  return (
    <>
      <Cabecalho titulo="Clientes" sub={`${todas.length} clientes cadastradas`}>
        <Botao variante="pri" onClick={() => setNova(true)}><UserPlus size={16} /> Nova cliente</Botao>
      </Cabecalho>

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cacau-500" />
            <input className="input !pl-10" placeholder="Buscar por nome ou telefone" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <label className="relative">
            <ArrowUpDown size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cacau-500 pointer-events-none" />
            <select className="input !pl-9 sm:!w-56" value={ordem} onChange={(e) => setOrdem(e.target.value)}>
              {ORDENS.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
            </select>
          </label>
        </div>
        <Abas
          valor={filtro}
          onChange={setFiltro}
          abas={[
            ['todas', 'Todas', todas.length],
            ['agendada', 'Com horário', conta('agendada')],
            ['manutencao', 'Manutenção', conta('manutencao')],
            ['devendo', 'Devendo', conta('devendo')],
            ['credito', 'Com crédito', conta('credito')],
            ['sumida', 'Sumidas', conta('sumida')],
          ]}
        />
      </div>

      <div className="card overflow-hidden">
        {lista.length === 0 ? (
          <Vazio texto="Nenhuma cliente encontrada." />
        ) : (
          <>
            {/* Tabela (computador) */}
            <table className="w-full text-sm hidden md:table">
              <thead className="text-xs text-cacau-500 border-b border-nude-200 bg-nude-50/60">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Cliente</th>
                  <th className="text-left font-medium px-4 py-3">Estilo / mapping</th>
                  <th className="text-left font-medium px-4 py-3">Última visita</th>
                  <th className="text-left font-medium px-4 py-3">Próximo horário</th>
                  <th className="text-right font-medium px-4 py-3">Gasto total</th>
                  <th className="text-left font-medium px-4 py-3">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nude-200">
                {lista.map((c) => (
                  <tr key={c.id} onClick={() => setAberta(c.id)} className="hover:bg-nude-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar nome={c.nome} />
                        <div className="min-w-0">
                          <div className="text-cacau-900 flex items-center gap-1.5">{c.nome}{c.ficha?.alergias && <AlertTriangle size={13} className="text-red-500" aria-label="Tem alergia" />}</div>
                          <div className="text-xs text-cacau-500">{c.telefone || c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-cacau-800">{c.ficha?.estilo || '—'}</div>
                      <div className="text-xs text-cacau-500">{[c.ficha?.curvatura, c.ficha?.espessura, c.ficha?.mapping?.split(' · ')[0]].filter(Boolean).join(' · ')}</div>
                    </td>
                    <td className="px-4 py-3 text-cacau-600">{c.ultima ? <>{dataCurta(c.ultima)} <span className="text-cacau-500 text-xs">· há {diasEntreISO(c.ultima, hoje)}d</span></> : '—'}</td>
                    <td className="px-4 py-3 text-cacau-600">{c.proximo ? `${dataCurta(c.proximo.data)} · ${c.proximo.hora}` : '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-cacau-900">{brl(c.gasto)}<div className="text-xs text-cacau-500">{c.visitas} atend.</div></td>
                    <td className="px-4 py-3"><Situacao s={situacao(c)} c={c} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Lista (celular) */}
            <ul className="md:hidden divide-y divide-nude-200">
              {lista.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setAberta(c.id)} className="w-full flex items-center gap-3 p-4 text-left cursor-pointer">
                    <Avatar nome={c.nome} />
                    <div className="flex-1 min-w-0">
                      <div className="text-cacau-900 truncate">{c.nome}</div>
                      <div className="text-xs text-cacau-500 truncate">{c.ficha?.estilo || 'sem ficha'} · {c.visitas} atend. · {brl(c.gasto)}</div>
                      <div className="mt-1"><Situacao s={situacao(c)} c={c} ocultarVazio /></div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {aberta && <FichaCliente clienteId={aberta} onFechar={() => setAberta(null)} />}
      {nova && <NovaCliente onFechar={() => setNova(false)} onCriar={(dados) => { const c = criarCliente(dados); avisar('Cliente cadastrada.'); setNova(false); setAberta(c.id) }} />}
    </>
  )
}

function Situacao({ s, c, ocultarVazio = false }) {
  const tags = []
  if (s.devendo) tags.push(<Etiqueta key="d" cls="text-red-700 bg-red-50 border-red-200">Deve {brl(c.devendo)}</Etiqueta>)
  if (s.agendada) tags.push(<Etiqueta key="a" cls="text-violet-800 bg-violet-50 border-violet-200">Agendada</Etiqueta>)
  if (s.manutencao) tags.push(<Etiqueta key="m" cls="text-amber-800 bg-amber-50 border-amber-200">Manutenção</Etiqueta>)
  if (s.credito) tags.push(<Etiqueta key="c" cls="text-emerald-800 bg-emerald-50 border-emerald-200">Crédito {brl(c.credito)}</Etiqueta>)
  if (s.sumida) tags.push(<Etiqueta key="s">Sumida</Etiqueta>)
  if (!tags.length) return ocultarVazio ? null : <span className="text-xs text-cacau-500">—</span>
  return <div className="flex flex-wrap gap-1">{tags}</div>
}

function NovaCliente({ onFechar, onCriar }) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  return (
    <Modal aberto onFechar={onFechar} titulo="Nova cliente"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao variante="pri" disabled={!nome.trim()} onClick={() => onCriar({ nome: nome.trim(), telefone, email })}>Cadastrar</Botao></>}>
      <div className="space-y-4">
        <Campo rotulo="Nome"><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus /></Campo>
        <Campo rotulo="WhatsApp"><input className="input" value={telefone} onChange={(e) => setTelefone(telefoneMask(e.target.value))} placeholder="(31) 99999-9999" /></Campo>
        <Campo rotulo="E-mail (opcional)"><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Campo>
        <p className="text-xs text-cacau-500">Depois de cadastrar, a ficha abre para você preencher a ficha técnica.</p>
      </div>
    </Modal>
  )
}
