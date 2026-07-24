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

## Como o admin processa (enquanto não há UI de admin)

Até a UI de admin de devoluções (próximo PR), processe via Supabase Studio →
SQL Editor (ou Table Editor), como admin:

```sql
-- Ver pendentes
SELECT r.*, o.order_number, up.email
FROM order_returns r
JOIN orders o ON o.id = r.order_id
JOIN user_profiles up ON up.id = r.user_id
WHERE r.status IN ('solicitada','em_analise')
ORDER BY r.created_at;

-- Aprovar / recusar / concluir (RLS admin permite o UPDATE)
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

UI de admin de devoluções (lista + aprovar/recusar/concluir) e estorno via
API do Mercado Pago quando os pagamentos estiverem ativos.
