# Runbook — Controle de estoque

## Como funciona

`admin_products` tem duas colunas de estoque, e a relação entre elas importa:

| coluna | tipo | papel |
|---|---|---|
| `stock_qty` | `integer` | **fonte da verdade**. `NULL` = estoque não controlado |
| `stock` | `text` | `in` / `low` / `out` — **derivada**, alimentada por trigger. É o que a vitrine lê |

O trigger `sync_stock_flag` mantém a flag coerente:

```
qty = 0   → out
qty ≤ 5   → low
qty > 5   → in
```

Em produto **controlado** (`stock_qty NOT NULL`) a flag é derivada de verdade: escrever nela na mão é sobrescrito pelo valor calculado. Em produto **não controlado** (`stock_qty NULL`) o trigger não faz nada e a flag continua manual.

> **Correção (migration `20260730120000`).** A primeira versão criou o trigger como `BEFORE INSERT OR UPDATE OF stock_qty`, e este runbook afirmava que o estado incoerente `qty = 0` com `stock = 'in'` não existia mais. Era falso: o painel admin escreve `stock` sem tocar em `stock_qty`, então o `UPDATE` não disparava o trigger e um produto com zero unidades podia voltar à vitrine como disponível. O trigger agora dispara também em `UPDATE OF stock`. Verificado com fixture: flag manual `'in'` sobre `qty = 0` é revertida para `'out'`.

## `NULL` significa "não controlado"

Os 41 produtos do catálogo nasceram com `stock_qty NULL`, e a reserva **ignora** produto nessa condição. Foi decisão deliberada: preencher um número inventado faria o banco afirmar uma quantidade que ninguém contou.

**Consequência prática: a proteção contra venda a descoberto só vale para produto com quantidade preenchida.** Enquanto `stock_qty` for `NULL`, o comportamento é o antigo — só a flag `stock` protege, e ela é manual.

Para ativar por produto, no painel admin: **Produtos → Editar → Quantidade em estoque**. Campo vazio significa não controlado; qualquer número liga a proteção. Com quantidade preenchida, o seletor "Situação na vitrine" fica desabilitado e mostra o valor derivado — para esgotar um produto controlado, coloque `0` em quantidade, não mexa na situação.

A listagem de produtos mostra a quantidade sob a etiqueta de estoque, ou "sem controle de unidades" para quem ainda está `NULL`.

Por SQL dá no mesmo:

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

### O `REVOKE` de coluna que não revoga

A migration original tem esta linha, com o comentário "A coluna de quantidade não entra no `GRANT` de `UPDATE` do cliente":

```sql
REVOKE UPDATE (stock_qty) ON public.admin_products FROM anon, authenticated;
```

**Ela é um no-op.** O Postgres não subtrai privilégio de coluna de um grant de tabela: com `UPDATE` concedido no nível da tabela — o default do Supabase — revogar a coluna não remove nada e o comando passa em silêncio. Conferido em `information_schema.column_privileges`: `authenticated` continua com `UPDATE` em `stock_qty`, nos dois níveis.

Isso **não** é brecha, e o comentário é que estava errado. Quem autoriza escrita em `admin_products` é a policy `products_admin_all` (`ALL`, `USING is_admin()`, `WITH CHECK is_admin()`) — a mesma que já protege `price`, campo mais sensível que quantidade. O grant é grosso de propósito; a RLS é o portão.

Vale a distinção: o revoke de `EXECUTE` em `reserve_stock`/`release_stock` acima é **real e testado**. Revoke de função não tem o problema de subtração — o de coluna tem.

Para conferir a qualquer momento:

```sql
select grantee, privilege_type
  from information_schema.column_privileges
 where table_schema='public' and table_name='admin_products'
   and column_name='stock_qty' and grantee in ('anon','authenticated');
```

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

### Trigger derivando a flag (migration `20260730120000`)

Mesmo método — fixture `__TESTE_FLAG__`, `active = false`, removido no fim:

| teste | esperado | resultado |
|---|---|---|
| insert com `qty = 10` | `in` | ✅ |
| `stock = 'out'` na mão com `qty = 10` | volta para `in` | ✅ |
| `qty = 0` | `out` | ✅ |
| **`stock = 'in'` na mão com `qty = 0`** | **volta para `out`** | ✅ |
| `qty = 3` | `low` | ✅ |
| `qty = NULL` e depois `stock = 'in'` | fica `in` (manual) | ✅ |

O quarto é o que era o furo: produto com zero unidades marcado como disponível na vitrine. O sexto prova que produto não controlado não foi afetado.

Depois: 41 produtos, 41 ativos, 0 com quantidade, 0 incoerentes, 0 fixtures restantes.
