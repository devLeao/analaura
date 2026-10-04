import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { lerVid, montarVid, prazoLabel, resolver, TEMAS_CILIOS, TEMA_NEUTRO } from '../../lib/catalogo'
import { brl } from '../../lib/format'

/** Em qual "parte" do agendamento cada serviço entra: remoção fica junto de cílios. */
export const parteDe = (servicos, vid) => (resolver(servicos, vid)?.categoria === 'sobrancelhas' ? 'sobrancelhas' : 'cilios')

/**
 * Escolha de serviços (site e painel) em duas partes, sempre visíveis:
 *  - Cílios: primeiro o tipo (Aplicação / Manutenção / Remoção), depois o modelo
 *  - Sobrancelhas: uma opção
 * Ao escolher, a parte fecha e mostra só o que foi escolhido (com Trocar / remover).
 * A cor (preto/marrom) não entra aqui: é combinada na hora do atendimento.
 * `sel` é a lista de ids de variação (ver lib/catalogo.js).
 */
export default function SeletorServicos({ servicos, sel, onChange, compacto = false }) {
  const ciliosVid = sel.find((v) => parteDe(servicos, v) === 'cilios')
  const sobVid = sel.find((v) => parteDe(servicos, v) === 'sobrancelhas')
  const [trocando, setTrocando] = useState({ cilios: false, sobrancelhas: false })
  const [modo, setModo] = useState(() =>
    !ciliosVid ? 'aplicacao' : resolver(servicos, ciliosVid)?.categoria === 'remocao' ? 'remocao' : lerVid(ciliosVid).manutencao ? 'manutencao' : 'aplicacao'
  )

  /** Troca o item de uma parte mantendo a outra. */
  const definir = (parte, atual, novo) => {
    onChange([...sel.filter((v) => v !== atual), ...(novo ? [novo] : [])])
    setTrocando((t) => ({ ...t, [parte]: false }))
  }

  const opcoesCilios =
    modo === 'remocao'
      ? servicos.filter((s) => s.categoria === 'remocao').map((s) => ({ vid: s.id, nome: s.nome, preco: s.preco, cores: TEMA_NEUTRO }))
      : servicos
          .filter((s) => s.categoria === 'cilios' && (modo === 'aplicacao' || s.manutencao))
          .map((s) =>
            modo === 'manutencao'
              ? { vid: montarVid(s.id, { manutencao: true }), nome: s.nome, preco: s.manutencao.preco, obs: `até ${prazoLabel(s.manutencao)}`, cores: TEMAS_CILIOS[s.id] || TEMA_NEUTRO }
              : { vid: s.id, nome: s.nome, preco: s.preco, cores: TEMAS_CILIOS[s.id] || TEMA_NEUTRO }
          )
  const opcoesSob = servicos.filter((s) => s.categoria === 'sobrancelhas').map((s) => ({ vid: s.id, nome: s.nome, preco: s.preco }))

  return (
    <div className={compacto ? 'space-y-3' : 'space-y-4'}>
      <Parte
        titulo="Cílios"
        escolhido={ciliosVid && resolver(servicos, ciliosVid)}
        aberta={!ciliosVid || trocando.cilios}
        onTrocar={() => setTrocando((t) => ({ ...t, cilios: true }))}
        onManter={() => setTrocando((t) => ({ ...t, cilios: false }))}
        onRemover={() => definir('cilios', ciliosVid, null)}
        compacto={compacto}
      >
        <div className="inline-flex bg-nude-100 rounded-full p-1 gap-1 mb-3">
          {[['aplicacao', 'Aplicação'], ['manutencao', 'Manutenção'], ['remocao', 'Remoção']].map(([id, nome]) => (
            <button
              key={id}
              type="button"
              onClick={() => setModo(id)}
              className={`px-3.5 py-1.5 rounded-full text-sm cursor-pointer transition-colors ${modo === id ? 'bg-white text-cacau-900 shadow-sm font-medium' : 'text-cacau-600 hover:text-cacau-900'}`}
            >
              {nome}
            </button>
          ))}
        </div>
        <Lista opcoes={opcoesCilios} atual={ciliosVid} onEscolher={(vid) => definir('cilios', ciliosVid, vid)} compacto={compacto} />
      </Parte>

      <Parte
        titulo="Sobrancelhas"
        escolhido={sobVid && resolver(servicos, sobVid)}
        aberta={!sobVid || trocando.sobrancelhas}
        onTrocar={() => setTrocando((t) => ({ ...t, sobrancelhas: true }))}
        onManter={() => setTrocando((t) => ({ ...t, sobrancelhas: false }))}
        onRemover={() => definir('sobrancelhas', sobVid, null)}
        compacto={compacto}
      >
        <Lista opcoes={opcoesSob} atual={sobVid} onEscolher={(vid) => definir('sobrancelhas', sobVid, vid)} compacto={compacto} />
      </Parte>
    </div>
  )
}

/** Um bloco (Cílios ou Sobrancelhas): aberto mostra as opções; com algo escolhido, mostra só o escolhido. */
function Parte({ titulo, escolhido, aberta, onTrocar, onManter, onRemover, compacto, children }) {
  return (
    <section className={`rounded-3xl border ${escolhido && !aberta ? 'border-blush-300 bg-blush-100/40' : 'border-nude-200 bg-white/60'} ${compacto ? 'p-3' : 'p-4 sm:p-5'}`}>
      <div className="flex items-center justify-between gap-3">
        <h4 className={`font-medium text-cacau-900 ${compacto ? 'text-sm' : ''}`}>{titulo}</h4>
        {!escolhido && <span className="text-xs text-cacau-500">opcional</span>}
        {escolhido && aberta && (
          <button type="button" onClick={onManter} className="text-xs text-blush-700 hover:underline underline-offset-4 cursor-pointer">Manter o atual</button>
        )}
      </div>

      {escolhido && !aberta ? (
        <div className="flex items-center gap-3 mt-3 animate-fade-up">
          <span className="h-6 w-6 shrink-0 rounded-full bg-cacau-900 text-nude-50 flex items-center justify-center"><Check size={13} strokeWidth={3} /></span>
          <span className="flex-1 min-w-0 text-sm text-cacau-900">{escolhido.nome}</span>
          <span className="text-sm text-cacau-700 tabular-nums whitespace-nowrap">{brl(escolhido.preco)}</span>
          <button type="button" onClick={onTrocar} className="text-xs text-blush-700 hover:underline underline-offset-4 cursor-pointer px-1">Trocar</button>
          <button type="button" onClick={onRemover} className="p-1.5 rounded-full text-cacau-500 hover:text-red-600 hover:bg-red-50 cursor-pointer" aria-label={`Remover ${titulo.toLowerCase()}`}>
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className="mt-3">{children}</div>
      )}
    </section>
  )
}

function Lista({ opcoes, atual, onEscolher, compacto }) {
  // compara sem a cor: um agendamento antigo "x.marrom" continua aparecendo marcado
  const semCor = (v) => v && montarVid(lerVid(v).baseId, { manutencao: lerVid(v).manutencao })
  return (
    <div className={`grid gap-2 ${compacto ? '' : 'sm:grid-cols-2'}`}>
      {opcoes.map((o) => {
        const on = semCor(atual) === o.vid
        return (
          <button
            key={o.vid}
            type="button"
            onClick={() => onEscolher(o.vid)}
            className={`relative overflow-hidden flex items-center gap-3 text-left rounded-2xl border px-4 ${o.cores ? 'pl-7' : ''} ${compacto ? 'py-2' : 'py-3'} cursor-pointer transition-colors ${on ? 'border-cacau-900 bg-white ring-1 ring-cacau-900' : 'border-nude-300 bg-white hover:border-blush-400'}`}
          >
            {/* Listras do tema do modelo, na borda esquerda */}
            {o.cores && (
              <span className="absolute inset-y-0 left-0 flex" aria-hidden="true">
                {o.cores.map((c, i) => <span key={i} className="w-[5px] h-full" style={{ background: c }} />)}
              </span>
            )}
            <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${on ? 'border-cacau-900 bg-cacau-900 shadow-[inset_0_0_0_2px_white]' : 'border-nude-400'}`} />
            <span className="flex-1 min-w-0">
              <span className="block text-sm text-cacau-900">{o.nome}</span>
              {o.obs && <span className="block text-[11px] text-cacau-500">{o.obs}</span>}
            </span>
            <span className="text-sm text-cacau-700 tabular-nums whitespace-nowrap">{brl(o.preco)}</span>
          </button>
        )
      })}
    </div>
  )
}
