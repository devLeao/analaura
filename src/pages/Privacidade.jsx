import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { useStore } from '../store/Store'

const ATUALIZADA_EM = '21 de outubro de 2026'
const CNPJ = '60.294.908/0001-87'
const EMAIL = 'lauracelviosalao@gmail.com'

/** Política de privacidade (LGPD, Lei 13.709/2018). */
export default function Privacidade() {
  const { config } = useStore().db
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = `Política de privacidade · ${config.marca}`
  }, [config.marca])
  const endereco = [config.endereco, config.cidade].filter(Boolean).join(', ')
  const whats = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent('Oi! Quero falar sobre os meus dados pessoais (LGPD).')}`

  return (
    <div className="tema-escuro min-h-screen bg-nude-50">
      <header className="border-b border-nude-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <Link to="/" aria-label="Voltar ao site"><Logo claro /></Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-cacau-600 hover:text-cacau-900"><ArrowLeft size={15} /> Voltar</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-14 text-cacau-700 leading-relaxed">
        <p className="font-label uppercase tracking-[0.3em] text-xs text-cacau-500 mb-3">LGPD</p>
        <h1 className="font-display text-5xl md:text-6xl text-cacau-900 font-light mb-3">Política de privacidade</h1>
        <p className="text-sm text-cacau-500 mb-12">Atualizada em {ATUALIZADA_EM}</p>

        <Bloco titulo="Quem cuida dos seus dados">
          <p>
            O estúdio <strong className="text-cacau-900">{config.marca}</strong>, CNPJ {CNPJ}{endereco ? `, ${endereco}` : ''}, é o responsável (controlador) pelos dados pessoais
            tratados neste site. Para qualquer assunto sobre seus dados, fale com a gente pelo e-mail{' '}
            <a href={`mailto:${EMAIL}`} className="underline underline-offset-4 text-cacau-900">{EMAIL}</a> ou pelo{' '}
            <a href={whats} target="_blank" rel="noreferrer" className="underline underline-offset-4 text-cacau-900">WhatsApp</a>.
          </p>
        </Bloco>

        <Bloco titulo="Quais dados coletamos">
          <ul>
            <li><strong className="text-cacau-900">Conta Google:</strong> nome e e-mail, quando você entra para agendar. Não temos acesso à sua senha.</li>
            <li><strong className="text-cacau-900">Contato:</strong> seu WhatsApp, informado no agendamento.</li>
            <li><strong className="text-cacau-900">Agendamentos:</strong> serviços, datas, horários, valores e histórico de atendimentos, cancelamentos e faltas.</li>
            <li><strong className="text-cacau-900">Pagamentos pelo site:</strong> valor, data e o código da transação Pix do sinal ou de multas. Os dados bancários ficam com o Mercado Pago; nós não os recebemos.</li>
            <li><strong className="text-cacau-900">Ficha técnica:</strong> informações que você passa no atendimento, como alergias ou sensibilidades. São dados de saúde, guardados só para a segurança do procedimento e vistos só pela profissional.</li>
            <li><strong className="text-cacau-900">Telegram:</strong> se você ativar os lembretes, guardamos o identificador da conversa com o nosso bot.</li>
          </ul>
        </Bloco>

        <Bloco titulo="Para que usamos">
          <ul>
            <li>Marcar, confirmar, remarcar e cancelar seus horários, e enviar confirmações e lembretes (e-mail e, se você quiser, Telegram).</li>
            <li>Cobrar e devolver o sinal e cobrar multas por falta, conforme as regras mostradas antes de agendar.</li>
            <li>Atender você com segurança (ficha técnica) e cumprir obrigações legais e fiscais.</li>
          </ul>
          <p>
            As bases legais são a execução do serviço que você contratou (art. 7º, V, da LGPD), o cumprimento de obrigação legal (art. 7º, II) e,
            para a ficha técnica, o seu consentimento e a proteção da sua saúde no procedimento (art. 11). Não usamos seus dados para publicidade e não os vendemos.
          </p>
        </Bloco>

        <Bloco titulo="Com quem compartilhamos">
          <p>Só com os serviços necessários para o site funcionar, que tratam os dados em nosso nome:</p>
          <ul>
            <li><strong className="text-cacau-900">Google</strong> (Firebase): login e banco de dados; Gmail e Google Agenda, para e-mails e a agenda da profissional.</li>
            <li><strong className="text-cacau-900">Vercel:</strong> hospedagem do site.</li>
            <li><strong className="text-cacau-900">Mercado Pago:</strong> cobrança e devolução dos Pix.</li>
            <li><strong className="text-cacau-900">Telegram:</strong> só se você ativar os lembretes por lá.</li>
          </ul>
          <p>Alguns desses serviços guardam dados em servidores fora do Brasil, com as proteções exigidas pela LGPD.</p>
        </Bloco>

        <Bloco titulo="Por quanto tempo guardamos">
          <p>
            Enquanto você tiver cadastro com a gente. Se pedir a exclusão, apagamos seus dados, exceto os registros de pagamentos e atendimentos que a lei
            obriga a manter (por exemplo, para fins fiscais, por até 5 anos).
          </p>
        </Bloco>

        <Bloco titulo="Seus direitos">
          <p>A qualquer momento você pode pedir:</p>
          <ul>
            <li>confirmação e acesso aos seus dados;</li>
            <li>correção de dados incompletos ou errados;</li>
            <li>exclusão dos seus dados ou do seu cadastro;</li>
            <li>cópia dos seus dados (portabilidade);</li>
            <li>informação sobre com quem compartilhamos;</li>
            <li>revogação do consentimento (por exemplo, da ficha técnica).</li>
          </ul>
          <p>
            É só mandar mensagem pelo <a href={whats} target="_blank" rel="noreferrer" className="underline underline-offset-4 text-cacau-900">WhatsApp</a> ou
            para <a href={`mailto:${EMAIL}`} className="underline underline-offset-4 text-cacau-900">{EMAIL}</a>. Respondemos em até 15 dias. Você também pode
            reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
          </p>
        </Bloco>

        <Bloco titulo="Segurança">
          <p>
            O site usa conexão criptografada (HTTPS), login pelo Google e regras de acesso no banco de dados: cada cliente só vê os próprios horários, e só a
            profissional acessa o painel. Chaves e senhas dos serviços ficam guardadas fora do código.
          </p>
        </Bloco>

        <Bloco titulo="Cookies">
          <p>
            Não usamos cookies de publicidade nem de rastreamento. O navegador guarda apenas o necessário para manter você logada; o mapa da seção de contato é
            carregado do Google Maps.
          </p>
        </Bloco>

        <Bloco titulo="Menores de idade">
          <p>Menores de 18 anos só devem agendar com autorização e acompanhamento do responsável.</p>
        </Bloco>

        <Bloco titulo="Mudanças nesta política">
          <p>Se esta política mudar, a data no topo é atualizada. Mudanças importantes também serão avisadas no site.</p>
        </Bloco>
      </main>
    </div>
  )
}

const Bloco = ({ titulo, children }) => (
  <section className="mb-10 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-3 [&_p]:my-3">
    <h2 className="font-display text-2xl text-cacau-900 mb-2">{titulo}</h2>
    {children}
  </section>
)
