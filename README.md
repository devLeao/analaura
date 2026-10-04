# Ana Laura · Lash & Brow — esboço

Site + painel administrativo do estúdio de extensão de cílios e sobrancelhas.
**Esboço:** os serviços e preços são os da Ana; contato, fotos, login e clientes ainda são fictícios. Tudo fica salvo
no navegador (localStorage); nada vai para servidor.

## Rodar

```
npm install
npm run dev        # http://localhost:5173
npm run build      # gera /dist (vercel.json já configurado)
```

> No PowerShell, se aparecer "execução de scripts foi desabilitada", use `npm.cmd run dev`.

- Site: `/` · Painel: `/admin`
- Login simulado (botão **Entrar**):
  - **Cliente Demo**: tem histórico e a manutenção do Volume Brasileiro vencendo
  - **Bianca Pendente**: faltou numa manutenção e tem multa em aberto, fica bloqueada até pagar
  - **Ana Laura (administradora)**: acesso ao painel
- Para recriar os dados de exemplo: Painel → Configurações → Recriar dados de exemplo.

## Serviços e manutenção

- **Cílios:** 8 modelos. Cada um tem a **própria manutenção** (preço e prazo) e alguns também são feitos em **marrom** (mesmo preço).
  No site é um card por modelo, com aplicação e manutenção lado a lado; ao agendar, a cliente escolhe
  o modelo e depois "Aplicação/Manutenção" e "Preto/Marrom".
- **Sobrancelhas:** Design Personalizado, Henna, Tintura e Brow Lamination.
- **Remoção Química.**
- Internamente o agendamento guarda um id de variação (`fox.marrom.manutencao`), veja `src/lib/catalogo.js`.

## Regras de agendamento (igual ao Arian)

1. A cliente precisa entrar com Google para agendar. Não tem sinal: o horário é confirmado na hora e o pagamento é no dia.
2. Ela pode cancelar sozinha até 24h antes (`antecedenciaCancelHoras`). Depois disso, o site pede para falar com a Ana.
3. Falta sem aviso gera **multa de 50%** (`multaPct`). Com multa em aberto ela não agenda até pagar pelo Pix do site.
4. A Ana também pode cancelar com ou sem multa e lançar débitos manuais.

## Painel

| Página | O que tem |
| --- | --- |
| Início | Agenda do dia, faturamento do mês, ocupação da semana e **"Precisa da sua atenção"**: lembrar as clientes de amanhã, multas em aberto, manutenções vencendo (pelo prazo de cada modelo) e aniversariantes, com mensagem de WhatsApp pronta |
| Agenda | Semana, linha do tempo do dia com horários livres agrupados e almoço; atendida (com forma de pagamento), falta (gera multa), cancelar com ou sem multa, remarcar, bloquear horário ou dia |
| Clientes | Busca e filtros (com horário, manutenção, devendo, sumidas) e **ficha da cliente**: ficha técnica (modelo, cor, curvatura, espessura, mapping, cola, alergias), histórico, multas e dados |
| Financeiro | Resumo com gráficos (inclusive aplicação × manutenção), **entradas** (cada atendimento e multa paga; exporta planilha) e multas/débitos |
| Serviços | Preço da aplicação, manutenção (preço, duração e prazo), marrom, ordem no site e prévia do card |
| Configurações | Horários, cancelamento e multa, Pix e dados do estúdio |

## Estrutura

```
src/
  data/seed.js          dados fictícios + config padrão + serviços
  store/Store.jsx       "backend" do esboço: todas as ações (agendar, falta, multa, pagar...)
  lib/catalogo.js       variações dos serviços (aplicação/manutenção, preto/marrom)
  lib/schedule.js       horários e conflitos da agenda
  lib/stats.js          métricas, livro-caixa, manutenção vencendo, aniversariantes
  lib/pix.js            Pix copia e cola (BR Code + CRC16)
  components/site/      seções do site e modais da cliente
  components/admin/     card de atendimento, ficha da cliente, gráficos, modais
  pages/admin/          Início, Agenda, Clientes, Financeiro, Serviços, Configurações
```

## A confirmar com a Ana

Tudo marcado com `A CONFIRMAR` em `src/data/seed.js`: nome do estúdio, WhatsApp, Instagram,
endereço, chave Pix, durações dos serviços, preço da manutenção do Volume Brasileiro, Angel, Luxo e Power
(estimados), descrições completas, horário de funcionamento e regras de cancelamento/multa.
Os desenhos de cílios (`FotoPlaceholder`) viram fotos reais.

## Fase 2

- Login com Google de verdade + banco de dados (Firebase/Supabase), mantendo as ações do `Store.jsx`.
- Pix com confirmação automática para multas (Mercado Pago/Asaas/Efí + webhook).
- Fotos reais de cada modelo nos cards (as das prints dela).
