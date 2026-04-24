# Email transacional — Ervatório

Email de confirmação disparado automaticamente quando `orders.status` vira `paid` (via webhook do Mercado Pago).

Arquitetura:
```
MP webhook → mp-webhook (atualiza status) → sendOrderPaidEmail() → Resend API → cliente
```

## 1. Criar conta no Resend

https://resend.com → **Sign up** (grátis até 3.000 emails/mês, 100/dia, sem cartão).

## 2. Verificar domínio (obrigatório para produção)

Resend exige domínio verificado. Em sandbox/dev, pode usar o remetente `onboarding@resend.dev` sem config.

Para produção:

1. Dashboard Resend → **Domains** → **Add domain** → `ervatorio.com.br`
2. Adicione os 3 DNS records que aparecerem no seu provedor (CloudFlare, Registro.br, etc.):
   - `MX` record apontando para Resend
   - 2 `TXT` records (SPF + DKIM)
3. Clique **Verify** no painel Resend
4. Propagação leva de alguns minutos a 48h

Enquanto o domínio não estiver verificado, use `onboarding@resend.dev` — funciona para testes mas vai pra spam em Gmail/Outlook.

## 3. Criar API Key

Dashboard Resend → **API Keys** → **Create API Key**:
- Nome: `Ervatorio production` (ou `Ervatorio test`)
- Permissão: **Full access** (ou `Sending access` se preferir limitar)
- Copie o valor — começa com `re_...`

**Não recarregue a página** — Resend só mostra a chave uma vez.

## 4. Configurar no Supabase

```powershell
supabase secrets set RESEND_API_KEY=re_seu_token_aqui
supabase secrets set EMAIL_FROM="Ervatório <pedidos@ervatorio.com.br>"
```

Para testes sem domínio verificado:

```powershell
supabase secrets set EMAIL_FROM="Ervatório <onboarding@resend.dev>"
```

Opcional — copia oculta pra admin acompanhar cada pedido pago:

```powershell
supabase secrets set EMAIL_BCC=admin@ervatorio.com.br
```

## 5. Redeploy do webhook

O código de email mora em `supabase/functions/_shared/email.ts` e é importado por `mp-webhook`. Qualquer mudança exige redeploy:

```powershell
supabase functions deploy mp-webhook
```

## 6. Testar

Faça um pagamento em sandbox como sempre. Cheque:

1. **Resend Dashboard → Logs** — deve aparecer a entrega com status "delivered"
2. **Email do usuário de teste** — se for um email real, vai cair na caixa. Se é `test_user_xxx@testuser.com` (fake), o MP não entrega no inbox real.

Para testar o email de verdade em sandbox, crie um usuário de teste MP com o seu **email real pessoal** em vez de usar o fictício do MP. Ou ignore e valide só pela UI do Resend.

## 7. Logs e debug

O webhook loga toda tentativa:

```
[email] enviado { to: 'test_user_xxx@testuser.com', order: 'ERV-ABC123', id: 're_xxxxxxxxxx' }
```

ou

```
[email] Resend respondeu erro { status: 401, data: { message: 'Invalid API key' } }
[email] RESEND_API_KEY nao configurado — email nao enviado
```

Veja em: Dashboard Supabase → Functions → `mp-webhook` → Logs.

## 8. Quando o email é enviado

Somente quando:
- `mp-webhook` atualiza `orders.status` de algo-não-pago para **`paid`**
- Não há reenvio em caso de refresh do pagamento (idempotência)

Situações que **NÃO** disparam email:
- Pedido criado mas nunca pago
- Pagamento recusado/cancelado
- Usuário abandona o checkout
- Status já estava `paid` antes do webhook (idempotência impede email duplicado)

## 9. Customizar o template

Os templates HTML + plain text estão em `supabase/functions/_shared/email.ts`, funções `renderHtml` e `renderText`. Edite direto. Depois:

```powershell
supabase functions deploy mp-webhook
```

## 10. Fallback se o email falhar

O envio é **fire-and-forget**: se o Resend der erro ou estiver fora do ar, o webhook continua e o pedido fica `paid` normalmente. Você perde o email, mas o pedido está lá pra ser processado.

Para reenviar manualmente um email de pedido já pago (recurso futuro), dá pra criar uma Edge Function `resend-order-email` acessível pelo admin. Hoje não existe.

## 11. Custos

Resend:
- 3.000 emails/mês grátis (limite atual)
- 100 emails/dia grátis
- Acima disso: $20/mês para 50k
- Alternativas: SendGrid (100/dia grátis), Postmark, Amazon SES

Para volume pequeno (< 1000 pedidos/mês), Resend cobre de sobra sem custo.
