# Dívida técnica — Assinatura HMAC do webhook MP

**Status**: não resolvida. Modo relaxado em `MP_MODE=test` aceita assinatura inválida; em produção idem (consideração abaixo).

## O problema

A Edge Function `mp-webhook` computa HMAC-SHA256 do manifest `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` usando a chave secreta configurada no painel MP (variável `MP_WEBHOOK_SECRET`). O hash computado **não bate** com o `v1=...` que o MP envia no header `x-signature`.

Tentamos 34 variantes de manifest × 2 encodings do secret (UTF-8 string vs hex-decoded para bytes brutos). Nenhuma casou.

Dados do teste (registrados em `public.mp_webhook_log`):

- `data.id`: `156247631728`
- `request-id`: `ae32e0dc-77ed-4848-a3c1-0de0827cc30a`
- `ts`: `1777047206`
- `v1` recebido: `bb46ed14aeeb72e693adf3b79197773fa12ed1ab845a782cd0e921a3836e7310`
- Hash computado (formato padrão): `e7b4ab5b...` — NÃO bate

## Hipóteses não eliminadas

1. **Body normalization**: JSONB do Postgres perdeu whitespace/ordem original. MP pode assinar o body bruto byte-a-byte. Solução: logar `body_raw TEXT` (`await req.text()`) antes de parsear.

2. **Formato exótico**: MP pode usar `user-agent` ou outro campo no manifest. Nenhuma das 34 variantes testou isso.

3. **Algoritmo diferente**: docs falam de HMAC-SHA256 mas pode ser SHA-1 legado em algumas contas.

## Mitigações ativas (segurança real)

Mesmo sem validação estrita de assinatura, o webhook tem 4 camadas:

1. **fetchPayment via Access Token**: servidor busca o pagamento na API do MP. Atacante não consegue spoofar sem comprometer o token.
2. **external_reference**: precisa corresponder a um order UUID real no banco (combinações impossíveis de adivinhar).
3. **Sanity check de valor**: `transaction_amount` do MP tem que bater com `order.total_cents/100`. Spoofer não consegue inflar.
4. **Idempotência**: processar a mesma notificação 2× não duplica.

Para ataques de fraude real, essas camadas já barram. O único vetor teórico: alguém descobrir um payment_id real de outra loja MP e replay aqui — mas a checagem `external_reference in our orders` barra, porque ele não tem um order_id nosso.

## Risco residual

- Um bot aleatório pode bater no endpoint sem assinatura válida. Vai receber 200 (modo relaxado em test) ou 401 (prod estrito). Custo: ~200ms de processamento + 1 roundtrip à API MP.
- Em produção com modo relaxado: cada spoof custa ~$0.0001 em recursos do Supabase + a chamada MP. Irrelevante em escala humana.

## Quando resolver

Prioridade BAIXA. Resolver quando:
- Volume de webhook spoof atingir >100/dia (logs terão evidência)
- Contato no MP puder confirmar o formato exato do manifest
- Tiver 2h contínuas pra testar hipótese de `body_raw`

## Como prosseguir

Código atual em `supabase/functions/_shared/mercadopago.ts` tem:

```ts
export async function verifyWebhookSignature(req, dataId): Promise<SignatureVerifyResult>
```

que já testa 4 variantes. Para estender:

1. Adicionar `body_raw` na tabela `mp_webhook_log`
2. Modificar `mp-webhook/index.ts` para clonar req antes de parsear e chamar `await clone.text()` → gravar
3. Reproduzir HMAC localmente com os bytes exatos (com e sem trailing newline, etc.)
4. Quando encontrar o formato, remover modo relaxado e documentar

## Configuração atual

- `MP_MODE` = `test` — modo relaxado ativo
- Quando virar `production`, a falha em assinatura retornará 401 e o pedido ficará `pending` até ser atualizado manualmente. Alternativa: manter modo relaxado mesmo em prod (ver arquivo).
