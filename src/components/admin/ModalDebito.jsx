import { useState } from 'react'
import { Search } from 'lucide-react'
import Modal from '../ui/Modal'
import { Botao, Toggle, Campo, Avatar } from './ui'
import { EscolhaServicos } from './Escolhas'
import { useStore } from '../../store/Store'
import { brl } from '../../lib/format'
import { itensDe } from '../../lib/catalogo'

/** Lança um débito manual na conta da cliente (ex.: restante não pago). */
export default function ModalDebito({ cliente: clienteFixo, onFechar }) {
  const { db, lancarDebito, avisar } = useStore()
  const [cliente, setCliente] = useState(clienteFixo || null)
  const [busca, setBusca] = useState('')
  const [sel, setSel] = useState([])
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [bloqueia, setBloqueia] = useState(true)

  const sugestoes = busca.length >= 2 ? db.clientes.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase())).slice(0, 5) : []
  const nomesSel = itensDe(db.servicos, sel).nomes

  const escolher = (novo) => {
    setSel(novo)
    setValor(String(itensDe(db.servicos, novo).total))
  }

  const salvar = () => {
    const v = Number(valor)
    if (!cliente) return avisar('Escolha a cliente.', 'erro')
    if (!(v > 0)) return avisar('Informe um valor.', 'erro')
    lancarDebito({ clienteId: cliente.id, clienteNome: cliente.nome, valor: v, descricao: descricao.trim() || `${nomesSel || 'Serviço'} não pago`, bloqueia })
    avisar(`Débito de ${brl(v)} lançado para ${cliente.nome}.`)
    onFechar()
  }

  return (
    <Modal aberto onFechar={onFechar} titulo="Lançar débito" sub="Valor que a cliente ficou devendo" largura="max-w-lg"
      rodape={<><Botao onClick={onFechar}>Cancelar</Botao><Botao variante="pri" onClick={salvar}>Lançar débito</Botao></>}>
      <div className="space-y-5">
        <div className="relative">
          <label className="label">Cliente</label>
          {cliente ? (
            <div className="input flex items-center gap-3">
              <Avatar nome={cliente.nome} className="!h-7 !w-7 !text-[10px]" />
              <span className="flex-1">{cliente.nome}</span>
              {!clienteFixo && <button onClick={() => { setCliente(null); setBusca('') }} className="text-xs text-blush-700 cursor-pointer">trocar</button>}
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cacau-500" />
                <input className="input !pl-10" placeholder="Buscar cliente" value={busca} onChange={(e) => setBusca(e.target.value)} autoFocus />
              </div>
              {sugestoes.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 mt-1 card shadow-xl overflow-hidden">
                  {sugestoes.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => setCliente(c)} className="w-full text-left px-3 py-2 hover:bg-nude-50 text-sm cursor-pointer">
                        {c.nome} <span className="text-cacau-500">{c.telefone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <Campo rotulo="O que ficou devendo (opcional, preenche o valor)"><EscolhaServicos sel={sel} onChange={escolher} /></Campo>

        <div className="grid grid-cols-[130px_1fr] gap-3">
          <Campo rotulo="Valor (R$)"><input className="input tabular-nums" type="number" min="0" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} /></Campo>
          <Campo rotulo="Descrição (a cliente vê)"><input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder={`${nomesSel || 'Serviço'} não pago`} /></Campo>
        </div>

        <Toggle ligado={bloqueia} onChange={setBloqueia} rotulo="Bloquear novos agendamentos até pagar" />
      </div>
    </Modal>
  )
}
