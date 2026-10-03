import { MapPin, Phone } from 'lucide-react'
import { TituloSecao } from '../ui/Ornamento'
import { WhatsApp, Instagram } from '../ui/Icones'
import Logo from '../ui/Logo'
import { useStore } from '../../store/Store'
import { DIAS } from '../../lib/format'

export function Contato() {
  const { config } = useStore().db
  const ordem = [1, 2, 3, 4, 5, 6, 0]
  const hojeDia = new Date().getDay()
  const tel = config.whatsapp.replace(/^55(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')

  return (
    <section id="contato" className="py-24 md:py-32 bg-nude-100 border-t border-nude-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <TituloSecao sobre="Vem me ver" titulo="Horários & contato" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white border border-nude-200 rounded-3xl p-6 sm:p-8">
            <h3 className="font-label uppercase tracking-[0.25em] text-blush-600 text-sm mb-6">Atendimento com hora marcada</h3>
            <ul>
              {ordem.map((d) => {
                const aberto = config.diasAbertos.includes(d)
                return (
                  <li key={d} className="flex justify-between py-3 border-b border-dashed border-nude-300 last:border-0">
                    <span className={d === hojeDia ? 'text-blush-700 font-medium' : 'text-cacau-800'}>
                      {DIAS[d]}{d === hojeDia && <span className="ml-2 text-[10px] font-label uppercase tracking-widest text-blush-600">hoje</span>}
                    </span>
                    <span className={`font-label tracking-wider ${aberto ? 'text-cacau-900' : 'text-cacau-500'}`}>
                      {aberto ? `${config.abre} – ${config.fecha}` : 'Fechado'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="flex flex-col gap-6">
            <ul className="space-y-4">
              <Item icone={MapPin} titulo="Endereço" texto={`${config.endereco}, ${config.cidade}`} />
              <Item icone={Phone} titulo="WhatsApp" texto={tel} href={`https://wa.me/${config.whatsapp}`} />
              <Item icone={Instagram} titulo="Instagram" texto={`@${config.instagram}`} href={`https://www.instagram.com/${config.instagram}`} />
            </ul>
            <iframe
              title="Mapa"
              className="w-full flex-1 min-h-56 rounded-3xl border border-nude-200 sepia-[0.25]"
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(config.cidade)}&output=embed`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

const Item = ({ icone: Icone, titulo, texto, href }) => (
  <li className="flex gap-4 items-start">
    <span className="h-11 w-11 shrink-0 rounded-full bg-white border border-nude-200 flex items-center justify-center text-blush-600"><Icone size={18} /></span>
    <div>
      <div className="font-label uppercase tracking-[0.2em] text-xs text-cacau-500">{titulo}</div>
      {href ? <a href={href} target="_blank" rel="noreferrer" className="text-cacau-900 hover:text-blush-600">{texto}</a> : <div className="text-cacau-900">{texto}</div>}
    </div>
  </li>
)

export function Rodape() {
  const { config } = useStore().db
  return (
    <footer className="bg-cacau-950 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo claro />
        <div className="flex gap-3">
          <a href={`https://www.instagram.com/${config.instagram}`} target="_blank" rel="noreferrer" className="h-10 w-10 rounded-full border border-cacau-700 flex items-center justify-center text-nude-300 hover:text-blush-300 hover:border-blush-400" aria-label="Instagram"><Instagram size={18} /></a>
          <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer" className="h-10 w-10 rounded-full border border-cacau-700 flex items-center justify-center text-nude-300 hover:text-blush-300 hover:border-blush-400" aria-label="WhatsApp"><WhatsApp size={18} /></a>
        </div>
        <p className="text-xs text-cacau-500 text-center md:text-right">
          © {new Date().getFullYear()} {config.marca} {config.slogan} · Todos os direitos reservados
          <br />Desenvolvido por <a href="https://devleao.netlify.app/" target="_blank" rel="noreferrer" className="text-nude-300 hover:text-blush-300">DevLeão</a>
        </p>
      </div>
    </footer>
  )
}
