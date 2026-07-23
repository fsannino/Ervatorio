# Runbook — Frete (Onda 6.4)

Cálculo de frete no checkout. **Faseado**: começa com tabela fixa por
região × peso (sem dependência externa) e tem o Melhor Envio pronto
atrás de flag para cotação real.

## Arquitetura

```
checkout.js  ── POST /calculate-shipping {items, zip} ──►  Edge Function
   (mostra opções, usuário escolhe)                         (peso vem de
        │                                                     admin_products)
        │ escolhe uma opção (key)
        ▼
checkout.js  ── POST /create-order {..., shipping_service: key} ──►  create-order
                                             (REVALIDA a opção e recalcula
                                              o preço no servidor — nunca
                                              confia no valor do cliente)
```

Fonte única da lógica: `supabase/functions/_shared/shipping.ts`
(usada tanto por `calculate-shipping` quanto por `create-order`).

## Flags (precisam estar ligadas nos DOIS lados)

| Onde | Chave | Default | Efeito |
|---|---|---|---|
| Cliente (`js/config.js`) | `SHIPPING_ENABLED` | `false` | Mostra o seletor de frete no checkout |
| Servidor (Supabase secret) | `SHIPPING_ENABLED` | `false` | `create-order`/`calculate-shipping` calculam frete |

Com qualquer um dos dois `false`, o comportamento é o de piloto
("frete grátis"), sem quebrar o checkout. **Kill-switch:** volte
qualquer um para `false`.

## Secrets da Edge Function

```powershell
# Liga o cálculo (fase 1 — tabela fixa, sem mais nada):
supabase secrets set SHIPPING_ENABLED=true

# (Opcional) frete grátis acima de um limite, em centavos. 0 = desligado.
supabase secrets set SHIPPING_FREE_ABOVE_CENTS=0

# --- Fase 2: cotação real via Melhor Envio (quando a conta existir) ---
supabase secrets set SHIPPING_PROVIDER=melhor_envio
supabase secrets set SHIPPING_ORIGIN_CEP=00000000        # CEP de origem (de onde envia)
supabase secrets set MELHOR_ENVIO_TOKEN=...              # token OAuth do Melhor Envio
supabase secrets set MELHOR_ENVIO_SANDBOX=true           # true em teste, false em produção
```

Se `SHIPPING_PROVIDER=melhor_envio` e a API falhar, cai automaticamente
para a tabela fixa (registrado no log da função) — o checkout nunca trava.

## Peso dos produtos

`admin_products.weight_grams` (migration `20260723170000_product_weight.sql`),
default **100g**. Ajuste por produto no painel admin para cotação correta.

## Como ativar (passo a passo)

1. Rodar a migration `20260723170000_product_weight.sql` (staging → prod).
2. `supabase functions deploy calculate-shipping create-order`.
3. `supabase secrets set SHIPPING_ENABLED=true`.
4. No preview Vercel, editar `js/config.js` → `SHIPPING_ENABLED: true` e validar:
   - CEP válido cota e mostra opção(ões);
   - o total soma o frete;
   - criar pedido em sandbox grava `orders.shipping_cents` > 0 e `shipping_carrier`.
5. Só então mergear para `main`.

## Verificação (QA)

- [ ] CEP válido → aparece opção de frete com preço e prazo.
- [ ] Total = subtotal + frete.
- [ ] CEP inválido → sem opção, sem quebrar o checkout.
- [ ] `create-order` grava `shipping_cents` igual ao mostrado e `shipping_carrier`.
- [ ] Adulterar a `key` no cliente → `create-order` responde 400 (opção inválida).
- [ ] `SHIPPING_ENABLED=false` → volta ao comportamento de piloto.

## Rollback

- Emergência: `supabase secrets set SHIPPING_ENABLED=false` (efeito imediato,
  sem redeploy) e/ou `SHIPPING_ENABLED: false` em `js/config.js`.
- A coluna `weight_grams` é aditiva e inofensiva; não precisa reverter.
