# Runbook — Troca / Devolução (Onda 8.2)

Fluxo de pós-venda para o cliente solicitar troca ou devolução (CDC).

## Como funciona

```
Cliente (Meus pedidos)
   │  "Solicitar troca / devolução" (pedido pago/enviado/entregue,
   │   dentro de 7 dias da entrega, sem solicitação ativa)
   ▼
POST /functions/v1/create-return  { action:'create', order_id, tipo, motivo }
   │  a função VALIDA no servidor: posse do pedido, status retornável,
   │  prazo de 7 dias (CDC), e ausência de solicitação ativa
   ▼
order_returns (status 'solicitada')  ──►  admin processa
```

- **Escrita só via Edge Function** `create-return` (service_role). O cliente
  não escreve direto em `order_returns` (RLS bloqueia) — não dá para forjar
  status nem burlar o prazo.
- **Leitura**: dono vê as próprias (`returns_owner_read`); admin vê todas
  (`returns_admin_all`).

## Estados (`order_returns.status`)

`solicitada` → `em_analise` → `aprovada` → `concluida`
(ou `recusada`, ou `cancelada` pelo cliente enquanto solicitada/em_analise).

## Regras (no servidor)

- Elegível: `orders.status` ∈ {paid, processing, shipped, delivered}.
- Prazo: até **7 dias** após `delivered_at`. Sem data de entrega (ainda a
  caminho), a solicitação é permitida.
- Uma solicitação ativa por pedido (solicitada/em_analise/aprovada) bloqueia
  abrir outra.

## Como o admin processa

No **painel admin → Devoluções** (`admin.html`): lista as solicitações com
filtro por status; "Gerenciar" abre o detalhe (motivo, cliente, pedido) com
seletor de **status** (solicitada → em análise → aprovada → concluída, ou
recusada) e **notas internas**. Salvar aplica a mudança (RLS `returns_admin_all`).

Alternativa (via SQL, se preciso):

```sql
UPDATE order_returns
SET status = 'aprovada', admin_notes = 'Autorizado. Enviar etiqueta.'
WHERE id = '<return_id>';
```

- **Estorno (devolução):** por ora manual — reembolse pelo painel do Mercado
  Pago e marque a `order` como `refunded` quando concluir. Automatizar o
  estorno via API MP é um passo futuro (depende do webhook validado).

## Deploy

1. Rodar a migration `20260724180000_order_returns.sql` (staging → prod).
2. `supabase functions deploy create-return`.
3. Sem secrets novos.

## Verificação (QA)

- [ ] Pedido entregue há < 7 dias mostra "Solicitar troca / devolução".
- [ ] Enviar solicitação cria `order_returns` com status `solicitada`.
- [ ] Segunda solicitação no mesmo pedido → 409.
- [ ] Pedido `pending`/`failed` não mostra o botão (e a função recusa).
- [ ] Cliente cancela enquanto `solicitada` → status `cancelada`.
- [ ] Usuário A não enxerga solicitação de B (RLS).

## Rollback

- Reverter o PR (front + função). A tabela `order_returns` é aditiva; pode
  ficar (sem uso) ou ser removida com `DROP TABLE public.order_returns;`.

## Próximo passo

Estorno automático via API do Mercado Pago (hoje manual pelo painel MP)
quando os pagamentos estiverem ativos e o webhook validado.
