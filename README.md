# Ana Laura · Lash & Brow — esboço

Site + painel administrativo do estúdio de extensão de cílios e sobrancelhas.
**Esboço:** textos, preços, fotos, contato, login e pagamento são fictícios. Tudo fica salvo
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
  - **Cliente Demo**: tem histórico, R$ 30 de crédito e manutenção vencendo
  - **Bianca Pendente**: deve o restante de um Volume Russo, fica bloqueada até pagar
  - **Ana Laura (administradora)**: acesso ao painel
- Para recriar os dados de exemplo: Painel → Configurações → Recriar dados de exemplo.

## Regras do sinal

1. A cliente precisa entrar com Google para agendar.
2. Escolhe serviço(s), dia e horário → o site gera um Pix com **50% do total** (`sinalPct`).
3. O horário fica segurado por 15 min (`reservaMin`). Sem pagamento, ele volta para a agenda.
4. Pago o sinal → horário confirmado. O restante é pago no dia (Pix, cartão ou dinheiro).
5. Cancelou com 24h de antecedência (`remarcarHoras`) → o sinal vira **crédito** e abate o próximo sinal.
   Em cima da hora ou falta → o sinal fica retido.
6. Cliente com pendência (débito lançado pela Ana) não agenda até pagar pelo Pix do site.

## Painel

| Página | O que tem |
| --- | --- |
| Início | Agenda do dia, recebido no mês, ocupação da semana e **"Precisa da sua atenção"**: sinais pendentes, clientes devendo, manutenções vencendo e aniversariantes, com mensagem de WhatsApp pronta |
| Agenda | Semana, linha do tempo do dia com horários livres agrupados e almoço; concluir (com forma de pagamento), falta, cancelar (crédito/devolver/reter), remarcar, bloquear horário ou dia |
| Clientes | Busca e filtros (com horário, manutenção, devendo, com crédito, sumidas) e **ficha da cliente**: ficha técnica (estilo, curvatura, espessura, mapping, cola, alergias), histórico, crédito e dados |
| Financeiro | Resumo com gráficos, **entradas e saídas** (cada sinal, restante e pendência; exporta planilha) e pendências |
| Serviços | Preço, duração, ordem no site, régua natural → cheio e prévia do card |
| Configurações | Horários, regras do sinal, Pix e dados do estúdio |

## Estrutura

```
src/
  data/seed.js          dados fictícios + config padrão + serviços
  store/Store.jsx       "backend" do esboço: todas as ações (reservar, sinal, crédito, falta...)
  lib/schedule.js       horários, conflitos, reserva expirada
  lib/stats.js          métricas, livro-caixa, manutenção vencendo, aniversariantes
  lib/pix.js            Pix copia e cola (BR Code + CRC16)
  components/site/      seções do site e modais da cliente
  components/admin/     card de atendimento, ficha da cliente, gráficos, modais
  pages/admin/          Início, Agenda, Clientes, Financeiro, Serviços, Configurações
```

## A confirmar com a Ana

Tudo marcado com `A CONFIRMAR` em `src/data/seed.js`: nome do estúdio, WhatsApp, Instagram,
endereço, chave Pix, serviços/preços/durações, horário de funcionamento e regras do sinal.
Os desenhos de cílios (`FotoPlaceholder`) viram fotos reais.

## Fase 2

- Login com Google de verdade + banco de dados (Firebase/Supabase), mantendo as ações do `Store.jsx`.
- Pix com confirmação automática (Mercado Pago/Asaas/Efí + webhook).
