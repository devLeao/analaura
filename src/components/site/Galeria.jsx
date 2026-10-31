import { TituloSecao } from '../ui/Ornamento'
import { Instagram } from '../ui/Icones'
import { useStore } from '../../store/Store'

// Fotos reais dos trabalhos. A Ana envia, tira e reordena em Painel → Galeria.
export default function Galeria() {
  const { config, galeria: FOTOS } = useStore().db
  const insta = `https://www.instagram.com/${config.instagram}`
  return (
    <section id="galeria" className="py-24 md:py-32 bg-nude-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <TituloSecao sobre={`@${config.instagram}`} titulo="Resultados" />
        <div className="columns-2 md:columns-3 gap-3 sm:gap-4 [&>*]:mb-3 sm:[&>*]:mb-4">
          {FOTOS.map((f) => (
            <a
              key={f.id}
              href={insta}
              target="_blank"
              rel="noreferrer"
              className="block break-inside-avoid relative overflow-hidden group rounded-3xl bg-black"
            >
              <img
                src={f.src}
                alt={f.alt || 'Trabalho do estúdio'}
                loading="lazy"
                className="w-full block transition-all duration-700 grayscale group-hover:grayscale-0 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Instagram size={30} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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
