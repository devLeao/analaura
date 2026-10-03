import { useState } from 'react'
import { Plus, Pencil, Trash2, Clock, ChevronUp, ChevronDown, EyeOff } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Cabecalho, Botao, Toggle, Campo, Etiqueta } from '../../components/admin/ui'
import { Pilulas } from '../../components/admin/Escolhas'
import { Olho, Sobrancelha } from '../../components/ui/Ilustracoes'
import { Intensidade } from '../../components/site/Servicos'
import Modal from '../../components/ui/Modal'
import { CATEGORIAS } from '../../data/seed'
import { brl, duracaoLabel, sinalDe } from '../../lib/format'

export default function Servicos() {
  const { db, moverServico, salvarServico, avisar } = useStore()
  const [editando, setEditando] = useState(null)
  const servicos = db.servicos.slice().sort((a, b) => a.ordem - b.ordem)

  return (
    <>
      <Cabecalho titulo="Serviços" sub="O que aparece no site e na agenda. As setas mudam a ordem no site.">
        <Botao variante="pri" onClick={() => setEditando({ nome: '', apelido: '', categoria: 'cilios', preco: 0, duracao: 60, desc: '', ativo: true, intensidade: 2, leque: 2, extra: false })}>
          <Plus size={16} /> Novo serviço
        </Botao>
      </Cabecalho>

      <div className="space-y-8">
        {CATEGORIAS.map(([cat, nome]) => {
          const lista = servicos.filter((s) => s.categoria === cat)
          return (
            <section key={cat}>
              <h2 className="text-sm font-semibold text-cacau-900 mb-3">{nome} <span className="text-cacau-500 font-normal">· {lista.length}</span></h2>
              <div className="card divide-y divide-nude-200">
                {lista.map((s, i) => (
                  <div key={s.id} className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 ${s.ativo ? '' : 'opacity-60'}`}>
                    <div className="flex flex-col">
                      <button onClick={() => moverServico(s.id, -1)} disabled={i === 0} className="p-0.5 rounded text-cacau-500 hover:text-cacau-900 disabled:opacity-20 cursor-pointer" aria-label="Subir"><ChevronUp size={16} /></button>
                      <button onClick={() => moverServico(s.id, 1)} disabled={i === lista.length - 1} className="p-0.5 rounded text-cacau-500 hover:text-cacau-900 disabled:opacity-20 cursor-pointer" aria-label="Descer"><ChevronDown size={16} /></button>
                    </div>
                    <span className="h-14 w-20 rounded-xl bg-gradient-to-b from-blush-100 to-nude-50 flex items-center justify-center shrink-0">
                      {cat === 'cilios' ? <Olho leque={s.leque || 1} className="w-14 text-cacau-800" /> : <Sobrancelha className="w-14 text-cacau-800" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-cacau-900 font-medium">{s.nome}</span>
                        {s.apelido && <span className="text-xs text-cacau-500">{s.apelido}</span>}
                        {s.extra && <Etiqueta>complementar</Etiqueta>}
                        {!s.ativo && <Etiqueta><EyeOff size={11} /> oculto no site</Etiqueta>}
                      </div>
                      <div className="text-xs text-cacau-500 mt-0.5 flex flex-wrap gap-x-3">
                        <span className="flex items-center gap-1"><Clock size={12} /> {duracaoLabel(s.duracao)}</span>
                        <span>sinal {brl(sinalDe(s.preco, db.config.sinalPct))}</span>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-cacau-900 tabular-nums">{brl(s.preco)}</span>
                    <Toggle ligado={s.ativo} onChange={(v) => { salvarServico({ ...s, ativo: v }); avisar(v ? 'Serviço visível no site.' : 'Serviço oculto do site.') }} />
                    <button onClick={() => setEditando(s)} className="p-2 rounded-full text-cacau-500 hover:text-cacau-900 hover:bg-nude-100 cursor-pointer" aria-label="Editar"><Pencil size={16} /></button>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {editando && <Editor item={editando} onFechar={() => setEditando(null)} />}
    </>
  )
}

function Editor({ item, onFechar }) {
  const { db, salvarServico, removerServico, avisar } = useStore()
  const [f, setF] = useState({ ...item })
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const cilios = f.categoria === 'cilios'

  const salvar = () => {
    if (!f.nome.trim()) return avisar('Informe o nome.', 'erro')
    salvarServico({ ...f, preco: Number(f.preco), duracao: Number(f.duracao), intensidade: f.intensidade == null ? null : Number(f.intensidade), leque: Number(f.leque) || 1 })
    avisar('Serviço salvo.')
    onFechar()
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={item.id ? 'Editar serviço' : 'Novo serviço'} largura="max-w-2xl"
      rodape={
        <div className="flex justify-between w-full">
          {item.id ? <Botao variante="fantasma" className="!text-red-600" onClick={() => setConfirmarExclusao(true)}><Trash2 size={15} /> Excluir</Botao> : <span />}
          <div className="flex gap-2"><Botao onClick={onFechar}>Cancelar</Botao><Botao variante="pri" onClick={salvar}>Salvar</Botao></div>
        </div>
      }>
      <div className="grid md:grid-cols-[1fr_220px] gap-6">
        <div className="space-y-4">
          <Campo rotulo="Categoria"><Pilulas valor={f.categoria} onChange={(v) => setF({ ...f, categoria: v })} opcoes={CATEGORIAS} /></Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo="Nome"><input className="input" value={f.nome} onChange={set('nome')} /></Campo>
            <Campo rotulo="Subtítulo" dica="Ex.: Fios em Y"><input className="input" value={f.apelido || ''} onChange={set('apelido')} /></Campo>
            <Campo rotulo="Preço (R$)" dica={`Sinal de ${brl(sinalDe(Number(f.preco) || 0, db.config.sinalPct))}`}><input className="input tabular-nums" type="number" step="0.01" min="0" value={f.preco} onChange={set('preco')} /></Campo>
            <Campo rotulo="Duração (min)" dica={duracaoLabel(Number(f.duracao) || 0)}><input className="input" type="number" step="5" min="5" value={f.duracao} onChange={set('duracao')} /></Campo>
          </div>
          <Campo rotulo="Descrição (aparece no site)"><textarea className="input min-h-20" value={f.desc} onChange={set('desc')} /></Campo>
          {cilios && (
            <>
              <Campo rotulo="Régua natural → cheio">
                <Pilulas valor={f.intensidade == null ? 'nat' : String(f.intensidade)} onChange={(v) => setF({ ...f, intensidade: v === 'nat' ? null : Number(v) })}
                  opcoes={[['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['nat', 'Sem extensão']]} />
              </Campo>
              <Campo rotulo="Fios por cílio no desenho"><Pilulas valor={String(f.leque || 1)} onChange={(v) => setF({ ...f, leque: Number(v) })} opcoes={[['1', '1'], ['2', '2'], ['3', '3'], ['5', '5']]} /></Campo>
            </>
          )}
          <div className="flex flex-col gap-3 pt-1">
            <Toggle ligado={f.ativo} onChange={(v) => setF({ ...f, ativo: v })} rotulo="Visível no site" />
            <Toggle ligado={!!f.extra} onChange={(v) => setF({ ...f, extra: v })} rotulo="Serviço complementar (aparece menor, ex.: manutenção)" />
          </div>
        </div>

        {/* Prévia de como fica no site */}
        <div>
          <p className="label">Prévia no site</p>
          <div className="bg-white border border-nude-200 rounded-3xl overflow-hidden">
            <div className="h-28 bg-gradient-to-b from-blush-100 to-nude-50 flex items-center justify-center">
              {cilios ? <Olho leque={f.leque || 1} className="w-28 text-cacau-800" /> : <Sobrancelha className="w-28 text-cacau-800" />}
            </div>
            <div className="p-4">
              <p className="font-label uppercase tracking-[0.25em] text-[9px] text-blush-600">{f.apelido || ' '}</p>
              <h3 className="font-display text-xl font-semibold text-cacau-900 leading-tight">{f.nome || 'Nome do serviço'}</h3>
              {cilios && <Intensidade nivel={f.intensidade} className="mt-2" />}
              <p className="text-[11px] text-cacau-600 mt-2 line-clamp-3">{f.desc || 'Descrição do serviço.'}</p>
              <p className="font-display text-lg font-semibold text-cacau-900 mt-2">{brl(Number(f.preco) || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <Modal aberto={confirmarExclusao} onFechar={() => setConfirmarExclusao(false)} titulo="Excluir serviço?"
        rodape={<><Botao onClick={() => setConfirmarExclusao(false)}>Voltar</Botao><Botao variante="perigo" onClick={() => { removerServico(item.id); avisar('Serviço excluído.'); onFechar() }}>Excluir</Botao></>}>
        <p className="text-sm text-cacau-600">"{item.nome}" sai do site e da agenda. Os atendimentos antigos continuam no histórico. Se for só uma pausa, prefira ocultar do site.</p>
      </Modal>
    </Modal>
  )
}
