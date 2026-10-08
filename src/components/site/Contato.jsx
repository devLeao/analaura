import { MapPin, Phone } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'
import { WhatsApp, Instagram } from '../ui/Icones'
import { LogoCompleto } from '../ui/Logo'
import { useStore } from '../../store/Store'
import { DIAS } from '../../lib/format'
import { horarioDaSemana } from '../../lib/schedule'

const fmtHora = (h) => h.replace(':00', 'h').replace(':', 'h')

export function Contato() {
  const { config } = useStore().db
  const ordem = [2, 3, 4, 5, 6, 0, 1]
  const hojeDia = new Date().getDay()
  const tel = config.whatsapp.replace(/^55(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  const endereco = [config.endereco, config.cidade].filter(Boolean).join(', ')

  return (
    <section id="contato" className="py-24 md:py-32 bg-nude-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <TituloSecao sobre="Vem me ver" titulo="Horários & contato" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-superficie border border-nude-200 rounded-3xl p-6 sm:p-8">
            <h3 className="font-label uppercase tracking-[0.25em] text-blush-600 text-xs mb-6">Atendimento com hora marcada</h3>
            <ul>
              {ordem.map((d) => {
                const h = horarioDaSemana(config, d)
                return (
                  <li key={d} className="flex justify-between py-3 border-b border-nude-300 last:border-0">
                    <span className={d === hojeDia ? 'text-cacau-950 font-medium' : 'text-cacau-700'}>
                      {DIAS[d]}{d === hojeDia && <span className="ml-2 text-[10px] font-label uppercase tracking-widest text-blush-600">hoje</span>}
                    </span>
                    <span className={`font-label tracking-wider ${h ? 'text-cacau-900' : 'text-cacau-500'}`}>
                      {h ? `${fmtHora(h.abre)} às ${fmtHora(h.fecha)}` : 'Fechado'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="flex flex-col gap-6">
            <ul className="space-y-4">
              <Item icone={MapPin} titulo="Endereço" texto={endereco} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`} />
              <Item icone={Phone} titulo="WhatsApp" texto={tel} href={`https://wa.me/${config.whatsapp}`} />
              <Item icone={Instagram} titulo="Instagram" texto={`@${config.instagram}`} href={`https://www.instagram.com/${config.instagram}`} />
            </ul>
            {/* Mapa em tons de cinza para combinar com o site */}
            <iframe
              title="Mapa"
              className="w-full flex-1 min-h-56 rounded-3xl border border-nude-200 grayscale invert-[0.9] contrast-[0.9]"
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

const Item = ({ icone: Icone, titulo, texto, href }) => (
  <li className="flex gap-4 items-start">
    <span className="h-11 w-11 shrink-0 rounded-full border border-nude-300 flex items-center justify-center text-cacau-900"><Icone size={17} strokeWidth={1.6} /></span>
    <div>
      <div className="font-label uppercase tracking-[0.2em] text-xs text-cacau-500">{titulo}</div>
      {href ? <a href={href} target="_blank" rel="noreferrer" className="text-cacau-900 hover:underline underline-offset-4">{texto}</a> : <div className="text-cacau-900">{texto}</div>}
    </div>
  </li>
)

export function Rodape() {
  const { config } = useStore().db
  return (
    <footer className="bg-black border-t border-white/10 py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        <LogoCompleto className="w-36" />
        <p className="font-display italic text-lg text-white/70 text-center max-w-sm">{config.fraseServicos}</p>
        <div className="flex flex-col items-center md:items-end gap-4">
          <div className="flex gap-3">
            <a href={`https://www.instagram.com/${config.instagram}`} target="_blank" rel="noreferrer" className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white" aria-label="Instagram"><Instagram size={18} /></a>
            <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer" className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white" aria-label="WhatsApp"><WhatsApp size={18} /></a>
          </div>
          <p className="text-xs text-white/40 text-center md:text-right">
            © {new Date().getFullYear()} {config.marca} · {config.slogan}
            <br />Desenvolvido por <a href="https://devleao.netlify.app/" target="_blank" rel="noreferrer" className="text-white/70 hover:text-white">DevLeão</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
