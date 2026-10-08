import { useState } from 'react'
import { Search } from 'lucide-react'
import Modal from '../ui/Modal'
import { Botao, Campo, Avatar } from './ui'
import { EscolhaServicos } from './Escolhas'
import { useStore } from '../../store/Store'
import { brl, toMin, fromMin, telefoneMask, duracaoLabel, toISO } from '../../lib/format'
import { itensDe } from '../../lib/catalogo'
import { gerarSlots, intervalosOcupados, slotLivre } from '../../lib/schedule'

/** Agendar uma cliente pelo painel (encaixe, remarcação pelo WhatsApp, cliente nova...). */
export default function ModalEncaixe({ dataInicial, horaInicial = '', clienteFixo = null, onFechar }) {
  const { db, criarAgendamentoAdmin, criarCliente, avisar } = useStore()
  const { config } = db
  const [busca, setBusca] = useState('')
  const [cliente, setCliente] = useState(clienteFixo)
  const [novoTel, setNovoTel] = useState('')
  const [sel, setSel] = useState([])
  const [data, setData] = useState(dataInicial || toISO(new Date()))
  const [hora, setHora] = useState(horaInicial)
  const [nota, setNota] = useState('')

  const { nomes, total, duracao } = itensDe(db.servicos, sel)
  const ocupados = intervalosOcupados(db.agendamentos, data)
  const horas = gerarSlots(config, data).filter((h) => slotLivre(config, data, h, duracao || config.slotMin, ocupados, true))
  const sugestoes = busca.length >= 2 ? db.clientes.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.telefone || '').includes(busca)).slice(0, 5) : []

  const salvar = () => {
    let c = cliente
    if (!c) {
      if (!busca.trim()) return avisar('Informe a cliente.', 'erro')
      c = criarCliente({ nome: busca.trim(), telefone: novoTel })
    }
    criarAgendamentoAdmin({
      clienteId: c.id,
      clienteNome: c.nome,
      clienteTelefone: c.telefone || novoTel,
      servicoIds: sel,
      servicoNomes: nomes,
      total,
      duracao,
      data,
      hora,
      nota,
    })
    avisar('Cliente agendada.')
    onFechar()
  }

  return (
    <Modal aberto onFechar={onFechar} titulo="Agendar cliente" sub="O horário aparece na agenda e some do site na hora" largura="max-w-lg"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao variante="pri" disabled={!sel.length || !hora || !horas.includes(hora) || (!cliente && !busca.trim())} onClick={salvar}>Agendar</Botao></>}>
      <div className="space-y-5">
        <div className="relative">
          <label className="label">Cliente</label>
          {cliente ? (
            <div className="flex items-center gap-3 input">
              <Avatar nome={cliente.nome} className="!h-7 !w-7 !text-[10px]" />
              <span className="flex-1 min-w-0 truncate">{cliente.nome} <span className="text-cacau-500 text-sm">{cliente.telefone}</span></span>
              {!clienteFixo && <button onClick={() => { setCliente(null); setBusca('') }} className="text-xs text-blush-700 cursor-pointer">trocar</button>}
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cacau-500" />
                <input className="input !pl-10" placeholder="Buscar pelo nome/telefone ou digitar cliente nova" value={busca} onChange={(e) => setBusca(e.target.value)} autoFocus />
              </div>
              {sugestoes.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 mt-1 card shadow-xl overflow-hidden">
                  {sugestoes.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => setCliente(c)} className="w-full text-left px-3 py-2 hover:bg-nude-50 text-sm cursor-pointer flex items-center gap-2">
                        <Avatar nome={c.nome} className="!h-7 !w-7 !text-[10px]" /> {c.nome} <span className="text-cacau-500">{c.telefone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {busca.trim() && !sugestoes.some((c) => c.nome.toLowerCase() === busca.toLowerCase()) && (
                <div className="mt-3">
                  <label className="label">WhatsApp da cliente nova (opcional)</label>
                  <input className="input" value={novoTel} onChange={(e) => setNovoTel(telefoneMask(e.target.value))} placeholder="(31) 99999-9999" />
                </div>
              )}
            </>
          )}
          {cliente?.ficha?.alergias && <p className="text-xs text-red-700 mt-2">⚠ {cliente.ficha.alergias}</p>}
        </div>

        <Campo rotulo="Serviços"><EscolhaServicos sel={sel} onChange={setSel} /></Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Data"><input type="date" className="input" value={data} onChange={(e) => e.target.value && setData(e.target.value)} /></Campo>
          <Campo rotulo="Horário">
            <select className="input" value={hora} onChange={(e) => setHora(e.target.value)}>
              <option value="">Selecione</option>
              {horas.map((h) => <option key={h} value={h}>{h} – {fromMin(toMin(h) + (duracao || config.slotMin))}</option>)}
            </select>
            {hora && !horas.includes(hora) && <p className="text-xs text-red-600 mt-1">Não cabe {duracaoLabel(duracao)} nesse horário.</p>}
          </Campo>
        </div>

        <div className="bg-nude-50 rounded-2xl p-4 flex justify-between text-sm">
          <span className="text-cacau-600">{duracao ? duracaoLabel(duracao) : '—'} · pago no dia</span>
          <span className="font-semibold text-cacau-900 tabular-nums">{brl(total)}</span>
        </div>

        <Campo rotulo="Observação (só você vê)">
          <input className="input" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ex.: veio por indicação, quer curvatura L" />
        </Campo>
      </div>
    </Modal>
  )
}
