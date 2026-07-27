# Runbook — Teste de checkout em sandbox

Valida a cadeia de compra ponta a ponta contra o ambiente de teste do Mercado Pago, **sem expor o checkout a visitantes reais**.

## Por que dá para testar com os pagamentos desligados

O botão de compra é controlado por `site_settings.payments_enabled` — uma trava de **interface**. Quem a consulta é o cliente:

- `js/checkout.js:134` — bloqueia a abertura do overlay
- `js/app.js:1296` — esconde o botão no carrinho

As Edge Functions **não olham para ela**. Verificado: nenhuma referência a `payments_enabled` ou `site_settings` em `supabase/functions/`.

Consequência prática: a cadeia inteira (`create-order` → `create-payment-preference` → webhook) é exercitável por HTTP com a flag desligada. Nenhum visitante vê botão de comprar enquanto o teste roda.

Ligue `payments_enabled` só quando o teste passar **e** você quiser vender de verdade.

## Pré-requisitos

- [ ] `supabase secrets list` mostra as 13 variáveis
- [ ] `MP_MODE=test` e `MP_ACCESS_TOKEN_TEST` preenchido com um token que começa em `TEST-`
- [ ] `MP_NOTIFICATION_URL` apontando para `https://ejarqinmjlgbqzurctsf.supabase.co/functions/v1/mp-webhook`
- [ ] Mesma URL cadastrada no painel do Mercado Pago, em Webhooks

`ALLOWED_ORIGIN` não afeta este teste — CORS é regra de navegador, e o script roda em Node.

## Execução

```bash
node scripts/test-checkout-sandbox.mjs
```

### Fase 1 — validação do servidor (automática)

O script tenta abusar da API antes de fazer o pedido de verdade:

| teste | esperado |
|---|---|
| produto inexistente | HTTP 400 |
| `product_id` malformado | HTTP 400 |
| convidado sem e-mail | HTTP 4xx |
| item com `price: 0.01` embutido | servidor ignora e cobra o preço do banco |
| `qty: 99999` | limitado a 999 |
| `qty: -5` | vira 1 |

O quarto é o mais importante: prova que o total sai do banco, não do cliente — a regra de integridade de pagamento do `CLAUDE.md`.

Se qualquer um falhar, o script sai com código 1 e **não** oferece o link de pagamento.

### Fase 2 — pagamento (manual)

Passando a fase 1, o script imprime um `init_point`. Abra no navegador e pague com um cartão de teste.

**Pegue os cartões no painel**, em Suas integrações → sua aplicação → Contas de teste. A lista de lá é a autoritativa; cartão decorado de tutorial envelhece.

O nome do titular controla o desfecho:

| nome | resultado |
|---|---|
| `APRO` | aprovado |
| `OTHE` | recusado |
| `CONT` | pendente |

Faça pelo menos **APRO** e **OTHE** — o caminho de recusa é o que costuma ficar sem teste.

### Fase 3 — verificação (banco)

Depois de pagar, confira se o webhook chegou e mudou o status:

```sql
select id, status, total_cents, guest_email, created_at, updated_at
  from public.orders
 where guest_email = 'teste-checkout@exemplo.invalid'
 order by created_at desc;
```

Com `APRO`, o status tem que sair de `pending`. Se ficar em `pending`, o webhook não chegou — investigue em Supabase → Edge Functions → `mp-webhook` → Logs, e no painel do Mercado Pago, em Webhooks → Entregas.

## Limpeza

O script cria pedidos reais na tabela. Todos com o mesmo `guest_email`, para dar para apagar de uma vez:

```sql
delete from public.order_items where order_id in
  (select id from public.orders where guest_email = 'teste-checkout@exemplo.invalid');
delete from public.orders where guest_email = 'teste-checkout@exemplo.invalid';
```

Rode como `service_role`. Faça a limpeza antes de ligar as vendas, para o painel admin não abrir com pedido de mentira.

## Depois que passar

1. Validar a assinatura do webhook e virar `MP_WEBHOOK_STRICT=true` — ver `WEBHOOK_SIGNATURE_DEBT.md`. O `CLAUDE.md` proíbe ligar pagamento em produção antes disso.
2. Trocar `MP_MODE` para `production` e conferir que `MP_ACCESS_TOKEN_PROD` está preenchido.
3. Só então `site_settings.payments_enabled = true`.

O passo 3 é o único que fica visível para o cliente, e é reversível por um `update`.
