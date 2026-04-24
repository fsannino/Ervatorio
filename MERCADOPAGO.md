# Integração Mercado Pago — Ervatório

Guia operacional completo para configurar e testar o checkout. Pré-requisito: Edge Functions já deployadas e migration `ervaria-orders-migration.sql` rodada.

## Visão geral do fluxo

```
Carrinho (cliente)
    │
    │ 1) clica "Finalizar pedido →"
    ▼
js/checkout.js  ──► overlay com formulário de endereço
    │
    │ 2) submit  ─► POST /functions/v1/create-order
    │              (Edge Function recalcula preços, cria orders + order_items)
    │ 3) recebe order_id
    │
    │ 4) POST /functions/v1/create-payment-preference { order_id }
    │              (cria preferência no Mercado Pago)
    │ 5) recebe init_point (URL do checkout MP)
    │
    │ 6) window.location = init_point
    ▼
Mercado Pago Checkout Pro (página do MP)
    │
    │ 7) cliente paga (PIX / cartão / boleto)
    │
    ├─► back_urls.success/failure/pending  (cliente volta ao app)
    │       │
    │       ▼
    │   js/checkout.js handleReturn()
    │   mostra modal de confirmação, limpa carrinho se success
    │
    └─► notification_url  (servidor MP → mp-webhook)
            │
            ▼
        Edge Function mp-webhook
            • valida assinatura
            • busca payment na API MP (NÃO confia no payload)
            • atualiza orders.status → 'paid' | 'failed' | ...
            • salva payload em orders.payment_payload
```

A `back_url` é só UI (cliente pode fechar o navegador). A **verdade** sobre status é o webhook.

## 1. Configurar credenciais no Mercado Pago

### Onde achar

https://www.mercadopago.com.br/developers/panel/app → escolha sua aplicação

- Aba **Credenciais de teste**: copie `Access Token` (começa com `TEST-...`)
- Aba **Credenciais de produção**: copie `Access Token` (começa com `APP_USR-...`)
- Aba **Webhooks** (configurada mais abaixo): copie a `Chave secreta` (assinatura)

### Setar nos Supabase secrets

```powershell
# Substitua pelos valores reais. NUNCA cole as chaves em commit ou chat.
supabase secrets set MP_ACCESS_TOKEN_TEST=TEST-1234567890-...
supabase secrets set MP_ACCESS_TOKEN_PROD=APP_USR-1234567890-...
supabase secrets set MP_WEBHOOK_SECRET=sua_chave_secreta_de_assinatura
supabase secrets set MP_MODE=test
supabase secrets set MP_RETURN_URL_BASE=https://ervatorio.com.br
supabase secrets set MP_NOTIFICATION_URL=https://lwzrzztzpklzbmxbqcrx.supabase.co/functions/v1/mp-webhook

# Confira
supabase secrets list
```

| Variável | Obrigatória | Default | O que é |
|---|---|---|---|
| `MP_MODE` | sim | `test` | `test` ou `production` — chave usada nas chamadas |
| `MP_ACCESS_TOKEN_TEST` | sim (em test) | — | token sandbox |
| `MP_ACCESS_TOKEN_PROD` | sim (em prod) | — | token produção |
| `MP_WEBHOOK_SECRET` | recomendada | — | assinatura HMAC do webhook |
| `MP_RETURN_URL_BASE` | sim | `https://ervatorio.com.br` | base das back_urls |
| `MP_NOTIFICATION_URL` | opcional | `${SUPABASE_URL}/functions/v1/mp-webhook` | URL do webhook (sobrescreve auto) |

Para **virar de test → prod** depois:

```powershell
supabase secrets set MP_MODE=production
# Não precisa redeploy — a função lê env a cada request.
```

## 2. Configurar webhook no painel Mercado Pago

1. Painel MP → sua aplicação → **Webhooks** → **Configurar notificações**
2. **URL**: `https://lwzrzztzpklzbmxbqcrx.supabase.co/functions/v1/mp-webhook`
3. **Eventos**: marque **"Pagamentos"** (`payment`). Os outros são opcionais.
4. **Modo**: marque **Modo produtivo** E **Modo de teste** (a função lida com os dois).
5. Salvar e copiar a **Chave secreta** que aparece — essa é o `MP_WEBHOOK_SECRET`.

Para testar manualmente sem fazer um pagamento real, o painel tem um botão "Simular notificação". Use depois do deploy pra validar que a função responde 200.

## 3. Deploy das Edge Functions novas

```powershell
cd D:\Ervatorio_GIT\ervatorio
git pull origin claude/project-audit-analysis-7MCND
supabase functions deploy create-payment-preference
supabase functions deploy mp-webhook
```

Ou só `supabase functions deploy` que sobe tudo.

## 4. Rodar a migration de orders (se ainda não rodou)

Dashboard Supabase → SQL Editor → New query → cole `ervaria-orders-migration.sql` → Run.

Confirme em Table Editor: `orders`, `order_items`, `user_addresses`, `order_status_history`.

## 5. Testar em sandbox

### Cartões de teste do Mercado Pago

| Bandeira | Número | CVV | Validade | Resultado |
|---|---|---|---|---|
| Mastercard | `5031 4332 1540 6351` | 123 | 11/30 | aprovado |
| Visa | `4509 9535 6623 3704` | 123 | 11/30 | aprovado |
| Amex | `3711 803032 57522` | 1234 | 11/30 | aprovado |
| Visa | `4013 5406 8274 6260` | 123 | 11/30 | recusado |

Nome do titular: `APRO` (aprova) ou `OTHE` (rejeita por outro motivo).
CPF de teste: `12345678909`.

### PIX de teste

Aparece um QR Code. Para simular pagamento PIX em sandbox:
1. Painel MP (modo teste) → **Atividade** → encontre o pagamento → "Aprovar pagamento de teste"
2. O webhook dispara automaticamente.

### Roteiro completo de teste

1. Logue no app (ou crie conta)
2. Adicione 1-2 produtos ao carrinho
3. Clique "Finalizar pedido →"
4. Preencha endereço (CEP autopreenche o resto)
5. Clique "Pagar com Mercado Pago →" → redireciona pra sandbox
6. Pague com cartão de teste
7. MP redireciona de volta com `?checkout=success&order=ERV-XXXXXX`
8. Modal "Pedido confirmado!" aparece
9. **Verificação**: Dashboard Supabase → Table Editor → `orders` → linha nova com status `paid`

Se status ficou `pending` em vez de `paid`, o webhook não chegou — veja seção de debug.

## 6. Virar pra produção

1. ✅ Migration rodada
2. ✅ Edge Functions deployadas
3. ✅ `MP_ACCESS_TOKEN_PROD` configurado
4. ✅ Webhook em **modo produtivo** marcado no painel MP
5. `supabase secrets set MP_MODE=production`
6. Faça um pedido real de R$ 1,00 com cartão próprio para validar end-to-end
7. Confira que `orders.status = 'paid'` e que o dinheiro caiu na sua conta MP

## 7. Debug e logs

### Ver logs em tempo real

```powershell
supabase functions logs create-payment-preference --tail
supabase functions logs mp-webhook --tail
```

### Webhook não chega

Sintoma: pedido fica `pending` mesmo após pagamento.

Causas comuns:
- **URL errada no painel MP** — confira que tem `/functions/v1/mp-webhook` no final
- **MP_WEBHOOK_SECRET errado** — função retorna 401 e MP retenta. Logs vão mostrar "Assinatura inválida"
- **Função não deployada** — `supabase functions list` precisa mostrar `mp-webhook`

Manualmente: `supabase functions logs mp-webhook --tail` enquanto faz um pagamento. Se não aparece **nada**, o MP nunca chamou — problema é na config do painel MP. Se aparecer "Assinatura inválida", problema é no secret.

### Pagamento aprovado mas status fica pending

A função `mp-webhook` faz uma sanity check de valor: se o `transaction_amount` do MP diferir do `order.total_cents` em mais de 1 centavo, marca como `pending` e escreve em `admin_notes` em vez de aprovar. Investigue o pedido manualmente no Supabase.

### Teste do webhook sem fazer compra

Use o botão "Simular notificação" no painel MP, ou via curl:

```bash
curl -X POST https://lwzrzztzpklzbmxbqcrx.supabase.co/functions/v1/mp-webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"123456789"}}'
```

(Vai retornar 401 sem assinatura válida, mas confirma que a função está acessível.)

## 8. Próximos passos pós-MVP

- **Frete real**: integrar Melhor Envio ou Correios SIGEP via Edge Function `calculate-shipping`. Hoje `shipping_cents = 0`.
- **Email transacional**: Edge Function `send-order-email` chamada quando `orders.status` muda pra `paid`. Usa Resend ou SendGrid.
- **Página "Meus pedidos"**: dentro do app, lista `SELECT * FROM orders WHERE user_id = auth.uid()` ordenado por data.
- **Cancelamento pelo cliente**: novo Edge Function `cancel-order` que valida regras (só `pending`, dentro de janela X) e chama API MP de estorno se já pago.
- **Reembolso parcial**: estender `mp-webhook` para tratar `refunded` e atualizar status.
- **Antifraude reforçado**: adicionar device fingerprinting via `MercadoPago.deviceProfile.session()` no frontend.
- **Multi-fornecedor (split)**: migrar pra Mercado Pago **Marketplace** quando houver >1 seller, com split automático.

## 9. Custos esperados

Por pedido em sandbox: R$ 0 (sandbox é grátis e ilimitado).

Por pedido em produção (ticket médio R$ 80, MP padrão sem antecipação):

| Método | Taxa | R$ |
|---|---|---|
| PIX | 0,99% | 0,79 |
| Débito | 1,99% | 1,59 |
| Crédito 1x | 3,79% | 3,03 |
| Crédito 12x | 4,98% | 3,98 |

Recebimento em D+14 (padrão) ou D+1 com antecipação (custo extra ~3%/mês).
