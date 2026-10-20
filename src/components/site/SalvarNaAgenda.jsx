import { CalendarPlus } from 'lucide-react'
import { Telegram } from '../ui/Icones'
import { linkGoogleAgenda, linkTelegram } from '../../lib/lembretes'

/** Botões para a cliente salvar o horário na agenda do celular e ativar lembretes no Telegram. */
export default function SalvarNaAgenda({ ag, config, telegramAtivo = false, compacto = false }) {
  const cls = compacto
    ? 'inline-flex items-center gap-1.5 text-xs text-cacau-600 hover:text-cacau-900 underline-offset-4 hover:underline'
    : 'btn-ghost !py-2.5 !px-4 !text-[11px]'
  return (
    <div className={`flex flex-wrap justify-center ${compacto ? 'gap-x-4 gap-y-1' : 'gap-2'}`}>
      <a href={linkGoogleAgenda(ag, config)} target="_blank" rel="noreferrer" className={cls}>
        <CalendarPlus size={compacto ? 13 : 15} /> Google Agenda
      </a>
      <a href={`/api/ics?id=${ag.id}`} className={cls}>
        <CalendarPlus size={compacto ? 13 : 15} /> iPhone / outros
      </a>
      {!telegramAtivo && (
        <a href={linkTelegram(ag)} target="_blank" rel="noreferrer" className={cls}>
          <Telegram size={compacto ? 13 : 15} /> Lembrete no Telegram
        </a>
      )}
    </div>
  )
}
