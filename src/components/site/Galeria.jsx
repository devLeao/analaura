import { TituloSecao } from '../ui/Ornamento'
import { Instagram } from '../ui/Icones'
import { FotoPlaceholder } from '../ui/Ilustracoes'
import { useStore } from '../../store/Store'

// Trocar pelos antes/depois reais quando a Ana mandar as fotos
const FOTOS = [
  ['Efeito Fox', 3],
  ['Volume Brasileiro', 2],
  ['Volume Glamour', 4],
  ['Efeito Sirena', 2],
  ['Volume Luxo', 5],
  ['Cílios marrom', 3],
]

export default function Galeria() {
  const { config } = useStore().db
  const insta = `https://www.instagram.com/${config.instagram}`
  return (
    <section id="galeria" className="py-24 md:py-32 bg-nude-100 border-y border-nude-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <TituloSecao sobre={`@${config.instagram}`} titulo="Resultados" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {FOTOS.map(([legenda, leque], i) => (
            <a key={legenda} href={insta} target="_blank" rel="noreferrer" className={`relative overflow-hidden group rounded-3xl ${i === 0 ? 'md:row-span-2' : ''}`}>
              <FotoPlaceholder legenda={legenda} leque={leque} className={`w-full h-full group-hover:scale-105 transition-transform duration-700 ${i === 0 ? 'aspect-square md:aspect-auto' : 'aspect-square'}`} />
              <div className="absolute inset-0 bg-cacau-900/0 group-hover:bg-cacau-900/40 transition-colors flex items-center justify-center">
                <Instagram size={32} className="text-nude-50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
        <div className="text-center mt-10">
          <a href={insta} target="_blank" rel="noreferrer" className="btn-ghost"><Instagram size={16} /> Ver mais no Instagram</a>
        </div>
      </div>
    </section>
  )
}
