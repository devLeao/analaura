import { useState } from 'react'
import { Plus, Pencil, Trash2, Clock, ChevronUp, ChevronDown, EyeOff, RefreshCw } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Cabecalho, Botao, Toggle, Campo, Etiqueta } from '../../components/admin/ui'
import { Pilulas } from '../../components/admin/Escolhas'
import { Olho, Sobrancelha } from '../../components/ui/Ilustracoes'
import { Intensidade, Cores } from '../../components/site/Servicos'
import Modal from '../../components/ui/Modal'
import { CATEGORIAS, prazoLabel } from '../../lib/catalogo'
import { brl, duracaoLabel } from '../../lib/format'

const NOVO = { nome: '', categoria: 'cilios', preco: 0, duracao: 120, desc: '', ativo: true, intensidade: 3, leque: 3, marrom: false, manutencao: { preco: 0, duracao: 90, dias: 21, diasMin: null }, desenho: 'design' }

const Desenho = ({ s, className }) =>
  s.categoria === 'sobrancelhas' ? <Sobrancelha variante={s.desenho || 'design'} className={className} /> : <Olho leque={s.leque || 1} className={className} />

export default function Servicos() {
  const { db, moverServico, salvarServico, avisar } = useStore()
  const [editando, setEditando] = useState(null)
  const servicos = db.servicos.slice().sort((a, b) => a.ordem - b.ordem)

  return (
    <>
      <Cabecalho titulo="Serviços" sub="O que aparece no site e na agenda. Cada modelo de cílios tem a sua manutenção.">
        <Botao variante="pri" onClick={() => setEditando({ ...NOVO })}><Plus size={16} /> Novo serviço</Botao>
      </Cabecalho>

      <div className="space-y-8">
        {CATEGORIAS.map(([cat, nome]) => {
          const lista = servicos.filter((s) => s.categoria === cat)
          if (!lista.length) return null
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
                    <span className="hidden sm:flex h-14 w-20 rounded-xl bg-gradient-to-b from-blush-100 to-nude-50 items-center justify-center shrink-0">
                      <Desenho s={s} className="w-14 text-cacau-800" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-cacau-900 font-medium">{s.nome}</span>
                        {s.marrom && <Cores marrom />}
                        {!s.ativo && <Etiqueta><EyeOff size={11} /> oculto no site</Etiqueta>}
                      </div>
                      <div className="text-xs text-cacau-500 mt-0.5 flex flex-wrap gap-x-3">
                        <span className="flex items-center gap-1"><Clock size={12} /> {duracaoLabel(s.duracao)}</span>
                      </div>
                    </div>
                    {/* Aplicação e manutenção lado a lado */}
                    <div className="flex items-center gap-4 sm:gap-6 text-right">
                      <div>
                        <div className="text-[10px] text-cacau-500">{s.manutencao ? 'Aplicação' : 'Valor'}</div>
                        <div className="text-base sm:text-lg font-semibold text-cacau-900 tabular-nums">{brl(s.preco)}</div>
                      </div>
                      {s.manutencao && (
                        <div className="border-l border-nude-200 pl-4 sm:pl-6">
                          <div className="text-[10px] text-cacau-500 flex items-center justify-end gap-1"><RefreshCw size={10} /> Manutenção</div>
                          <div className="text-base sm:text-lg font-semibold text-cacau-900 tabular-nums">{brl(s.manutencao.preco)}</div>
                          <div className="text-[10px] text-cacau-500">{prazoLabel(s.manutencao)}</div>
                        </div>
                      )}
                    </div>
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
  const { salvarServico, removerServico, avisar } = useStore()
  const [f, setF] = useState({ ...NOVO, ...item, manutencao: item.manutencao ? { ...item.manutencao } : null })
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const setM = (k) => (e) => setF({ ...f, manutencao: { ...f.manutencao, [k]: e.target.value } })
  const cilios = f.categoria === 'cilios'

  const salvar = () => {
    if (!f.nome.trim()) return avisar('Informe o nome.', 'erro')
    const m = cilios && f.manutencao
      ? { preco: Number(f.manutencao.preco), duracao: Number(f.manutencao.duracao), dias: Number(f.manutencao.dias), diasMin: f.manutencao.diasMin ? Number(f.manutencao.diasMin) : null }
      : null
    salvarServico({
      ...f,
      nome: f.nome.trim(),
      preco: Number(f.preco),
      duracao: Number(f.duracao),
      intensidade: cilios ? Number(f.intensidade) : null,
      leque: Number(f.leque) || 1,
      marrom: cilios && !!f.marrom,
      manutencao: m,
    })
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
          <Campo rotulo="Nome"><input className="input" value={f.nome} onChange={set('nome')} /></Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo rotulo={cilios ? 'Preço da aplicação (R$)' : 'Preço (R$)'}><input className="input tabular-nums" type="number" step="0.01" min="0" value={f.preco} onChange={set('preco')} /></Campo>
            <Campo rotulo="Duração (min)" dica={duracaoLabel(Number(f.duracao) || 0)}><input className="input" type="number" step="5" min="5" value={f.duracao} onChange={set('duracao')} /></Campo>
          </div>
          <Campo rotulo="Descrição (aparece no site)"><textarea className="input min-h-20" value={f.desc} onChange={set('desc')} /></Campo>

          {cilios && (
            <>
              {/* Manutenção do próprio modelo */}
              <div className="rounded-2xl border border-nude-200 p-4 space-y-3">
                <Toggle ligado={!!f.manutencao} onChange={(v) => setF({ ...f, manutencao: v ? { ...NOVO.manutencao } : null })} rotulo="Tem manutenção (preço e prazo próprios)" />
                {f.manutencao && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Campo rotulo="Preço (R$)"><input className="input tabular-nums" type="number" min="0" step="0.01" value={f.manutencao.preco} onChange={setM('preco')} /></Campo>
                    <Campo rotulo="Duração" dica="minutos"><input className="input" type="number" min="5" step="5" value={f.manutencao.duracao} onChange={setM('duracao')} /></Campo>
                    <Campo rotulo="Prazo: de" dica="opcional"><input className="input" type="number" min="1" value={f.manutencao.diasMin ?? ''} onChange={setM('diasMin')} placeholder="—" /></Campo>
                    <Campo rotulo="até" dica="dias"><input className="input" type="number" min="1" value={f.manutencao.dias} onChange={setM('dias')} /></Campo>
                  </div>
                )}
              </div>
              <Toggle ligado={!!f.marrom} onChange={(v) => setF({ ...f, marrom: v })} rotulo="Também fazemos em marrom (mesmo preço)" />
              <Campo rotulo="Régua natural → cheio">
                <Pilulas valor={String(f.intensidade)} onChange={(v) => setF({ ...f, intensidade: Number(v) })} opcoes={[['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5']]} />
              </Campo>
              <Campo rotulo="Fios por cílio no desenho"><Pilulas valor={String(f.leque || 1)} onChange={(v) => setF({ ...f, leque: Number(v) })} opcoes={[['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6']]} /></Campo>
            </>
          )}
          {f.categoria === 'sobrancelhas' && (
            <Campo rotulo="Desenho"><Pilulas valor={f.desenho || 'design'} onChange={(v) => setF({ ...f, desenho: v })} opcoes={[['design', 'Design'], ['henna', 'Preenchida'], ['lamination', 'Fios penteados']]} /></Campo>
          )}
          <Toggle ligado={f.ativo} onChange={(v) => setF({ ...f, ativo: v })} rotulo="Visível no site" />
        </div>

        {/* Prévia de como fica no site */}
        <div>
          <p className="label">Prévia no site</p>
          <div className="bg-white border border-nude-200 rounded-3xl overflow-hidden">
            <div className="h-28 bg-gradient-to-b from-blush-100 to-nude-50 flex items-center justify-center relative">
              <Desenho s={f} className="w-28 text-cacau-800" />
              {cilios && <Cores marrom={f.marrom} className="absolute bottom-2 left-2 bg-white/80 pl-2 pr-2.5 py-0.5 rounded-full" />}
            </div>
            <div className="p-4">
              <h3 className="font-display text-xl font-semibold text-cacau-900 leading-tight">{f.nome || 'Nome do serviço'}</h3>
              {cilios && <Intensidade nivel={f.intensidade} className="mt-2" />}
              <p className="text-[11px] text-cacau-600 mt-2 line-clamp-3">{f.desc || 'Descrição do serviço.'}</p>
              <div className={`mt-3 pt-3 border-t border-dashed border-nude-300 grid ${cilios && f.manutencao ? 'grid-cols-2' : ''} gap-2`}>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-cacau-500">{cilios && f.manutencao ? 'Aplicação' : 'Valor'}</div>
                  <div className="font-display text-lg font-semibold text-cacau-900">{brl(Number(f.preco) || 0)}</div>
                </div>
                {cilios && f.manutencao && (
                  <div className="border-l border-nude-200 pl-2">
                    <div className="text-[9px] uppercase tracking-widest text-cacau-500">Manutenção</div>
                    <div className="font-display text-lg font-semibold text-cacau-900">{brl(Number(f.manutencao.preco) || 0)}</div>
                    <div className="text-[10px] text-cacau-500">até {prazoLabel({ dias: f.manutencao.dias, diasMin: f.manutencao.diasMin })}</div>
                  </div>
                )}
              </div>
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
