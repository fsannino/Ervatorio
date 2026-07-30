# Runbook — Controle de estoque

## Como funciona

`admin_products` tem duas colunas de estoque, e a relação entre elas importa:

| coluna | tipo | papel |
|---|---|---|
| `stock_qty` | `integer` | **fonte da verdade**. `NULL` = estoque não controlado |
| `stock` | `text` | `in` / `low` / `out` — **derivada**, alimentada por trigger. É o que a vitrine lê |

O trigger `sync_stock_flag` mantém a flag coerente sempre que `stock_qty` muda:

```
qty = 0   → out
qty ≤ 5   → low
qty > 5   → in
```

Não existe mais o estado incoerente de `qty = 0` com `stock = 'in'`.

## `NULL` significa "não controlado"

Os 41 produtos do catálogo nasceram com `stock_qty NULL`, e a reserva **ignora** produto nessa condição. Foi decisão deliberada: preencher um número inventado faria o banco afirmar uma quantidade que ninguém contou.

**Consequência prática: a proteção contra venda a descoberto só vale para produto com quantidade preenchida.** Enquanto `stock_qty` for `NULL`, o comportamento é o antigo — só a flag `stock` protege, e ela é manual.

Para ativar por produto, no painel admin ou por SQL:

```sql
update public.admin_products set stock_qty = 24 where name = 'Camomila Orgânica';
```

Para saber quantos já estão protegidos:

```sql
select count(*) filter (where stock_qty is not null) as controlados,
       count(*) as total
  from public.admin_products;
```

## Quando a baixa acontece

**Na criação do pedido**, não no pagamento — `create-order` chama `reserve_stock()` antes de inserir em `orders`.

A alternativa (baixar no pagamento) permitiria duas pessoas pagarem pela última unidade. O custo desta escolha é o oposto: **checkout abandonado segura estoque**.

Fluxo completo:

| evento | efeito no estoque |
|---|---|
| pedido criado | `reserve_stock()` decrementa |
| pagamento aprovado | nada — a reserva vira venda |
| pagamento recusado (`failed`) | `release_stock()` devolve |
| reembolso (`refunded`) | **nada** — ver abaixo |
| pedido `pending` abandonado | **nada automático** — ver abaixo |

### Por que reembolso não repõe

`mp-webhook` só chama `release_stock()` em `failed`. Reembolso fica de fora de propósito: pode ser de pedido já enviado, e nesse caso a mercadoria não está de volta na prateleira. Reposição após devolução é decisão de quem recebe o produto de volta, e passa pelo fluxo de `create-return`.

### Pedido pending abandonado

Não há expiração automática. Pedido que ficou `pending` e nunca foi pago mantém as unidades reservadas indefinidamente.

Para achar e liberar os antigos:

```sql
-- candidatos: pending há mais de 24h
select o.id, o.order_number, o.created_at, o.total_cents
  from public.orders o
 where o.status = 'pending'
   and o.created_at < now() - interval '24 hours'
 order by o.created_at;

-- liberar um deles (confira antes que não foi pago no painel do MP)
select public.release_stock('<order_id>');
update public.orders set status = 'failed',
       admin_notes = coalesce(admin_notes,'') || ' [estoque liberado por abandono]'
 where id = '<order_id>';
```

Rode como `service_role`. **Confira no painel do Mercado Pago antes** — um pedido pode estar `pending` por boleto ou PIX ainda no prazo, e liberar estoque aí é errado.

Automatizar isso é trabalho futuro (cron + janela configurável).

## Quem pode mexer

`reserve_stock()` e `release_stock()` são `SECURITY DEFINER` e só `service_role` executa. `EXECUTE` foi revogado explicitamente de `anon` e `authenticated` — não só de `PUBLIC`.

Isso importa: `REVOKE ALL ... FROM PUBLIC` **não** remove o grant que o Supabase concede direto a esses papéis por default privileges. Sem o revoke explícito, um usuário logado chamaria `/rest/v1/rpc/reserve_stock` e, por ser `SECURITY DEFINER`, drenaria o estoque com privilégio de dono. O bug existiu na primeira versão desta migration e foi pego no teste.

`UPDATE` na coluna `stock_qty` também está revogado de `anon`/`authenticated`.

## Testes

Executados com um produto fixture (`__TESTE_ESTOQUE__`, `active = false`, removido no fim), sem tocar no catálogo:

| teste | esperado | resultado |
|---|---|---|
| flag derivada de `qty = 3` | `low` | ✅ |
| reservar 2 de 3 | sobra 1 | ✅ |
| reservar 5 de 1 | recusa, `qty` intacta | ✅ |
| zerar | flag vira `out` | ✅ |
| lote com produto inexistente | recusa e **não** decrementa o item válido | ✅ |
| `reserve_stock` como `authenticated` | negado | ✅ |
| `reserve_stock` como `anon` | negado | ✅ |
| `release_stock` devolve o exato | 10 → 7 → 10 | ✅ |

O quinto é o que prova atomicidade; o sexto e o sétimo só passaram depois do revoke explícito.
