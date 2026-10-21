# Laura Célvio · Lash Designer

Site + painel administrativo do estúdio de extensão de cílios e sobrancelhas da Ana Laura.
No ar em **https://analaura.vercel.app** (deploy automático do Vercel a cada push na `main`).

- **Site** (`/`): serviços, agendamento online com login Google, sinal no Pix, "Meus horários".
- **Painel** (`/admin`): agenda, clientes e fichas, financeiro, serviços, configurações.
- **Privacidade** (`/privacidade`): política de privacidade (LGPD).

## Tecnologias

React 19 + Vite + Tailwind v4 no site; **Firebase** (login Google + Firestore) como banco;
**funções do Vercel** (`api/`) para o que precisa de chave secreta: Mercado Pago, Telegram, Google Agenda e e-mail.

## Rodar local

```
npm install
npm run dev        # http://localhost:5173
npm run build
```

> No PowerShell, se aparecer "execução de scripts foi desabilitada", use `npm.cmd run dev`.

Local, o site usa o mesmo Firebase de produção, mas as funções de `api/` **não rodam** (só no Vercel):
agendar funciona, mas Pix, avisos e e-mails só em `analaura.vercel.app`.

## Como funciona o agendamento

1. A cliente entra com Google, escolhe serviços, dia e horário (o site mostra o intervalo inteiro que o serviço ocupa).
2. **Com sinal ligado** (padrão): o horário nasce `aguardando` e fica segurado por 15 min. O site pede o Pix a
   `api/pix` (valor calculado no servidor), mostra QR + copia e cola e espera.
3. Quando o Pix cai, o Mercado Pago chama `api/mercadopago`. A função **consulta a order na API** (não confia no aviso),
   muda o horário para `agendado` e dispara os avisos. Pagou depois do prazo e o horário já foi pego, ou desistiu: o Pix volta sozinho.
4. Avisos (`api/avisos`): Telegram da Ana, evento na Google Agenda do estúdio, e-mail para a cliente (com .ics) e
   Telegram da cliente, se ela ativou no bot.
5. **Cancelou:** o sinal volta pelo Pix (opção no painel para reter em cima da hora). **Faltou:** a Ana fica com o sinal
   e o site gera multa de 20% (sem sinal, a multa é 50%). Com multa em aberto, a cliente só agenda depois de pagar
   (Pix automático também).
6. Todo dia às 18h (`api/lembretes`, Cron do Vercel): lembrete para as clientes de amanhã, agenda do dia seguinte
   para a Ana e limpeza dos horários que esperaram Pix e venceram.

Regras do sinal em `src/lib/sinal.js`; valores (%, prazo) em Painel → Configurações.

## Banco (Firestore)

| Coleção | Quem lê / escreve |
| --- | --- |
| `config/estudio`, `servicos` | público lê; admin escreve |
| `ocupados` | público lê (só data/hora, sem dados pessoais); espelha os agendamentos |
| `agendamentos` | cliente lê os dela e cria/cancela; admin tudo; servidor confirma o sinal |
| `clientes`, `pendencias` | cliente os dela; admin tudo |
| `fichas`, `notificacoes`, `admins` | admin |
| `privado`, `cobrancas` | só o servidor (Telegram da Ana, cobranças Pix) |

Regras em [`firestore.rules`](firestore.rules). **Ao mudar, publicar no Console do Firebase** (Firestore → Regras).
Administradoras: `leandrofls16@gmail.com` + os e-mails em Painel → Configurações → Acesso ao painel.

## Variáveis de ambiente (Vercel, nunca no código)

| Variável | O quê |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | JSON da conta de serviço do Firebase (também escreve na Google Agenda) |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token de produção da aplicação no Mercado Pago |
| `MERCADOPAGO_WEBHOOK_SECRET` | Assinatura secreta do webhook (evento "Order (Mercado Pago)" → `/api/mercadopago`) |
| `TELEGRAM_BOT_TOKEN` | token do @LauraCelvioBot |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | `lauracelviosalao@gmail.com` + senha de app (envio de e-mails) |
| `GOOGLE_CALENDAR_ID` | opcional; padrão = `GMAIL_USER` (agenda compartilhada com a conta de serviço) |
| `CRON_SECRET` | protege `/api/lembretes` (o Vercel envia sozinho no Cron) |

Depois de mudar uma variável: **Redeploy**. A chave web do Firebase em `src/lib/firebase.js` é pública por natureza.

## Segurança

- Regras do Firestore por coleção e por campo (cliente não escolhe status, não grava campos internos, prazo de reserva ≤ 30 min).
- Funções conferem o login (token do Firebase) e recalculam valores no servidor; webhooks conferem a origem
  (assinatura do Telegram; Mercado Pago consultado na API).
- Cabeçalhos em `vercel.json`: CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy.
- `/admin` e `/api` fora do Google (`robots.txt` + `X-Robots-Tag`).

## Estrutura

```
api/
  _lib/servidor.js      Firebase Admin, login, Telegram, Google Agenda, e-mail (Gmail)
  _lib/mercadopago.js   Pix: criar, consultar, devolver
  avisos.js             avisos de novo/cancelado/alterado, devolução do sinal, Telegram da Ana, teste
  pix.js                Pix do sinal e das multas
  mercadopago.js        webhook do Mercado Pago
  telegram.js           webhook do bot
  lembretes.js          Cron diário
  ics.js                arquivo de agenda (iPhone)
src/
  data/seed.js          config padrão + serviços (semeados no 1º login de admin)
  store/Store.jsx       estado (Firestore em tempo real) e todas as ações
  lib/                  catalogo (variações), schedule (agenda), sinal, stats, lembretes (links de agenda), pix (Pix reserva)
  components/site/      seções do site, agendamento, Pix, modais da cliente
  components/admin/     card de atendimento, ficha da cliente, gráficos
  pages/                Site, Privacidade, admin/*
```

## A confirmar com a Ana

Marcado com `A CONFIRMAR` em `src/data/seed.js`: bairro/cidade, preço da manutenção do Volume Brasileiro, Angel,
Luxo e Power (estimados), duração das manutenções (90 min) e da Tintura.
