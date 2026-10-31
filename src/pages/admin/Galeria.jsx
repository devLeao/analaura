import { useRef, useState } from 'react'
import { ImagePlus, Trash2, ChevronLeft, ChevronRight, Loader2, Images, ExternalLink } from 'lucide-react'
import { useStore } from '../../store/Store'
import { Cabecalho, Botao, Vazio } from '../../components/admin/ui'
import Modal from '../../components/ui/Modal'
import { comprimirFoto } from '../../lib/fotos'

const MAXIMO = 30

/** Fotos da seção "Resultados" do site: enviar, tirar, reordenar e legendar. */
export default function Galeria() {
  const { db, adicionarFotos, removerFoto, moverFoto, legendaFoto, avisar } = useStore()
  const fotos = db.galeria
  const [enviando, setEnviando] = useState(0)
  const [apagar, setApagar] = useState(null)
  const entrada = useRef(null)
  const cheia = fotos.length >= MAXIMO

  const enviar = async (arquivos) => {
    const lista = [...arquivos].slice(0, MAXIMO - fotos.length)
    if (!lista.length) return
    setEnviando(lista.length)
    const prontas = []
    for (const arq of lista) {
      try {
        prontas.push({ src: await comprimirFoto(arq), alt: '' })
      } catch (e) {
        avisar(`${arq.name}: ${e.message}`, 'erro')
      }
      setEnviando((n) => n - 1)
    }
    if (prontas.length) {
      await adicionarFotos(prontas)
      avisar(prontas.length === 1 ? 'Foto adicionada ao site.' : `${prontas.length} fotos adicionadas ao site.`)
    }
    setEnviando(0)
  }

  return (
    <>
      <Cabecalho titulo="Galeria" sub={`Fotos da seção "Resultados" do site · ${fotos.length} de ${MAXIMO}`}>
        <a href="/#galeria" target="_blank" rel="noreferrer"><Botao><ExternalLink size={15} /> Ver no site</Botao></a>
        <Botao variante="pri" disabled={cheia || enviando > 0} onClick={() => entrada.current?.click()}>
          {enviando > 0 ? <><Loader2 size={16} className="animate-spin" /> Enviando {enviando}...</> : <><ImagePlus size={16} /> Adicionar fotos</>}
        </Botao>
        <input ref={entrada} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { enviar(e.target.files); e.target.value = '' }} />
      </Cabecalho>

      <p className="text-sm text-cacau-600 bg-nude-50 border border-nude-200 rounded-2xl px-4 py-3 mb-5">
        Pode enviar direto do celular. As fotos são ajustadas sozinhas para carregar rápido. No site elas aparecem em preto e branco e ganham cor ao passar o dedo ou o mouse.
        {cheia && <strong className="block mt-1 text-amber-800">Chegou ao limite de {MAXIMO} fotos: tire alguma para adicionar outra.</strong>}
      </p>

      {fotos.length === 0 ? (
        <div className="card"><Vazio icone={Images} texto='Nenhuma foto ainda. Toque em "Adicionar fotos".' /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {fotos.map((g, i) => (
            <div key={g.id} className="card overflow-hidden p-0">
              <div className="relative aspect-square bg-nude-100">
                <img src={g.src} alt={g.alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute top-2 left-2 h-6 min-w-6 px-1.5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center tabular-nums">{i + 1}</span>
              </div>
              <div className="p-2 space-y-2">
                <input
                  className="input !py-1.5 !text-xs"
                  defaultValue={g.alt}
                  placeholder="Legenda (opcional)"
                  onBlur={(e) => e.target.value !== (g.alt || '') && legendaFoto(g.id, e.target.value.trim())}
                />
                <div className="flex items-center justify-between">
                  <div className="flex">
                    <button onClick={() => moverFoto(g.id, -1)} disabled={i === 0} className="p-1.5 rounded-full text-cacau-500 hover:bg-nude-100 disabled:opacity-30 cursor-pointer" aria-label="Mover para antes"><ChevronLeft size={16} /></button>
                    <button onClick={() => moverFoto(g.id, 1)} disabled={i === fotos.length - 1} className="p-1.5 rounded-full text-cacau-500 hover:bg-nude-100 disabled:opacity-30 cursor-pointer" aria-label="Mover para depois"><ChevronRight size={16} /></button>
                  </div>
                  <button onClick={() => setApagar(g)} className="p-1.5 rounded-full text-cacau-500 hover:text-red-600 hover:bg-red-50 cursor-pointer" aria-label="Tirar do site"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        aberto={!!apagar}
        onFechar={() => setApagar(null)}
        titulo="Tirar esta foto do site?"
        rodape={<><Botao onClick={() => setApagar(null)}>Voltar</Botao><Botao variante="perigo" onClick={() => { removerFoto(apagar.id); setApagar(null); avisar('Foto removida do site.') }}><Trash2 size={15} /> Tirar</Botao></>}
      >
        {apagar && <img src={apagar.src} alt="" className="w-40 h-40 object-cover rounded-2xl mx-auto" />}
      </Modal>
    </>
  )
}
