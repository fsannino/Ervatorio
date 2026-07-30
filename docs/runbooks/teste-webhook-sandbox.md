# Runbook — Teste do webhook de pagamento (sandbox)

## O que este teste prova

`test-checkout-sandbox.mjs` cobre a cadeia até o link de pagamento:

```
create-order → create-payment-preference → init_point
```

Este teste cobre o elo seguinte, que é o que fecha a venda:

```
Mercado Pago → mp-webhook → orders.status sai de 'pending'
```

**Esse elo nunca foi exercitado.** Nenhum pedido saiu de `pending` na vida do projeto. Até este teste passar, o seguinte é hipótese, não fato:

- o MP alcança a URL do webhook
- `mapPaymentStatus()` casa com os status reais que o MP manda
- a sanity de valor (`mp-webhook/index.ts:139`) não rejeita pagamento legítimo por arredondamento
- o e-mail de confirmação dispara
- `release_stock()` roda quando o pagamento é recusado

## Por que pagar pela API e não pelo Checkout Pro

O Checkout Pro é a via do cliente real, e a tentativa pelo navegador travou em `/fatal/` — conta real do MP tentando pagar uma preferência criada com credencial de teste.

A API de pagamentos contorna isso: o cartão de teste é tokenizado direto, sem login em conta nenhuma.

É um caminho diferente do que o cliente percorre — **e esse é o limite deste teste**. Ele não valida a tela do Checkout Pro, nem o retorno do usuário para `MP_RETURN_URL_BASE`. Valida o webhook, que é onde está a dúvida, e o webhook não sabe como o pagamento nasceu: recebe um `payment_id`, busca na API do MP e age (`mp-webhook/index.ts:105`).

## Como rodar

Na sua máquina, com `.env.secrets` preenchido:

```
node scripts/test-webhook-sandbox.mjs         # APRO — aprovado
node scripts/test-webhook-sandbox.mjs OTHE    # recusado
node scripts/test-webhook-sandbox.mjs CONT    # pendente
```

Em ambiente de teste do MP, **o nome do titular do cartão decide o resultado**. O script põe `APRO`/`OTHE`/`CONT` no campo `cardholder.name`.

| argumento | MP devolve | esperado em `orders.status` |
|---|---|---|
| `APRO` | `approved` | `paid` |
| `OTHE` | `rejected` | `failed` |
| `CONT` | `in_process` | `pending` |

Rode `APRO` primeiro. Depois `OTHE` — é ele que exercita `release_stock()` pelo webhook (`mp-webhook/index.ts:183`).

### Não precisa ligar `payments_enabled`

`site_settings.payments_enabled` é trava de **interface**: `js/checkout.js:134` e `js/app.js:1296` a consultam antes de abrir o overlay. Nenhuma Edge Function a lê. O teste roda inteiro por HTTP com a flag desligada, e nenhum visitante vê botão de comprar.

### `MP_WEBHOOK_STRICT`

Com `MP_WEBHOOK_STRICT=true` e o secret de assinatura errado, o webhook responde 401 e o pedido fica em `pending`. Isso **parece** falha do teste mas é a trava funcionando. O script avisa quando detecta a flag ligada. Ver `WEBHOOK_SIGNATURE_DEBT.md`.

Ordem correta: teste com `false`, confirme que o webhook chega, **depois** ligue `true` e repita — se ainda passar, a assinatura está validando de verdade.

## Tokenização: duas vias

`POST /v1/card_tokens` aceita o Access token no header `Authorization`. O script tenta isso primeiro, e nessa via ninguém precisa colar chave nenhuma.

Se o MP recusar, ele cai para `?public_key=TEST-...` e aí precisa de `MP_PUBLIC_KEY_TEST` no `.env.secrets`. A chave fica em **Suas integrações > sua aplicação > Credenciais de teste > Public Key**.

Uma Public Key `APP_USR-` **não serve**: é de produção, e o par de credenciais tem de ser do mesmo ambiente do access token. Misturar ambientes é o que produz "Uma das partes com as quais você está tentando efetuar o pagamento é de teste".

Public Key é pública por natureza (vai no HTML de qualquer loja que use o MP). Colá-la num arquivo local não é exposição de segredo. Access token é o contrário — esse nunca sai do `.env.secrets`.

## Conferindo o resultado

O script não lê `orders`: a chave publicável não passa pela RLS. Ele imprime o SQL. No SQL Editor do Supabase:

```sql
select status, payment_external_id, payment_method,
       payment_payload is not null as tem_payload, admin_notes
  from public.orders where id = '<order_id>';
```

## Quando o status não muda

| sintoma | causa provável |
|---|---|
| **nenhuma** linha `[mp-webhook] recebido` nos logs | o MP não alcançou a URL. Confira `MP_NOTIFICATION_URL` e se `mp-webhook` está deployada com `verify_jwt=false` |
| `assinatura invalida em modo estrito → 401` | `MP_WEBHOOK_SECRET` errado, ou modo estrito ligado antes da validação funcionar |
| `payment sem external_reference` | o pagamento foi criado sem `external_reference`. Sem isso o webhook não acha o pedido |
| `order não encontrado` (404) | o `external_reference` não é um `orders.id` deste banco |
| `VALOR DIVERGENTE` em `admin_notes` | `transaction_amount` não casou com `total_cents/100` dentro de 1 centavo |
| `noop: true` | o pedido já estava no status novo. Notificação repetida — comportamento correto |

Logs: **Supabase > Edge Functions > mp-webhook > Logs**. Procure por `[mp-webhook] recebido`. A ausência dessa linha separa "problema de rede/URL" de "problema de código", e é a primeira coisa a olhar.

## Limpeza

Cada execução deixa um pedido. O e-mail de convidado carrega o resultado no nome (`teste-webhook-apro@exemplo.invalid`), então dá para apagar sem tocar em pedido real. O script imprime o SQL no fim:

```sql
-- libera estoque de pedido que ficou pending (CONT, ou falha no meio)
select public.release_stock(id) from public.orders
 where guest_email like 'teste-webhook-%@exemplo.invalid' and status = 'pending';

delete from public.order_items where order_id in
  (select id from public.orders where guest_email like 'teste-webhook-%@exemplo.invalid');
delete from public.orders where guest_email like 'teste-webhook-%@exemplo.invalid';
```

O `release_stock` só importa se o produto escolhido tiver `stock_qty` preenchido — hoje os 41 estão `NULL`. Ver `docs/runbooks/estoque.md`.

## Antes de vender de verdade

Este teste é pré-requisito, não conclusão. Depois dele:

1. `MP_WEBHOOK_STRICT=true` e repetir o teste (CLAUDE.md proíbe ligar pagamento sem validação de assinatura funcionando ou decisão de risco documentada).
2. Trocar para `MP_MODE=production` e redeployar as functions — `Deno.env.get()` lê o ambiente de boot do isolate, então mudar secret sem redeploy não tem efeito.
3. Um pedido real de valor baixo, com cartão próprio, ponta a ponta pelo navegador — é o único teste que cobre a tela do Checkout Pro e o retorno para o site.
4. `payments_enabled = true` só então.
