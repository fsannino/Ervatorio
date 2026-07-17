# Auditoria de RLS — 16/07/2026 (Onda 1.3)

Escopo: todas as tabelas/views do schema `public` definidas nos SQL do repositório, mais objetos referenciados pelo código do cliente. Método: análise estática dos arquivos `ervaria-*.sql`, `supabase/migrations/*.sql` e do uso em `js/`. A verificação dinâmica (queries abaixo) deve ser repetida **no banco real** (staging e produção) ao aplicar as migrations da Onda 1 — o MCP/CLI desta sessão não tinha acesso ao projeto `lwzrzztzpklzbmxbqcrx`.

## Query de verificação (rodar em staging e produção)

```sql
-- Tabelas sem RLS no schema public (deve retornar ZERO linhas sensíveis):
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = FALSE;

-- Views sem security_invoker (candidatas a vazamento tipo C-2):
SELECT c.relname AS view,
       COALESCE((SELECT option_value FROM pg_options_to_table(c.reloptions)
                 WHERE option_name = 'security_invoker'), 'false') AS security_invoker
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'v';

-- Policies de UPDATE/INSERT sem WITH CHECK explícito:
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND cmd IN ('UPDATE','INSERT','ALL')
  AND with_check IS NULL;
```

## Resultado por tabela (análise estática)

| Objeto | RLS | Policies | Veredito |
|---|---|---|---|
| `user_profiles` | ✅ | own read/insert/update + admin read/delete | 🔴 **C-1**: UPDATE sem WITH CHECK e sem restrição de coluna → escalonamento a admin. **Corrigido em `20260716120000`** (WITH CHECK + column grants + trigger). |
| `orders_with_items` (view) | n/a | — | 🔴 **C-2**: view sem `security_invoker`, exposta a `authenticated` → vaza PII de todos. **Corrigido em `20260716120100`**. |
| `site_settings` | ❓ | **sem DDL no repositório** | 🟠 Criada à mão no painel; RLS não verificável no repo; admin faz UPDATE do cliente. **Versionada + RLS garantido em `20260716120200`** (leitura pública, escrita admin). Rodar a query acima em produção para confirmar estado anterior. |
| `mp_webhook_log` | ✅ (leitura admin) | sem policy de INSERT (service_role grava) | 🟠 Grava headers/body de requisições **não autenticadas** (write-amplification / retenção de dados). **Removida em `20260716120300`** (Onda 1.4). |
| `orders` | ✅ | owner read; admin ALL; sem INSERT de cliente (Edge Function) | 🟢 Correto. |
| `order_items` | ✅ | owner read (via order); admin ALL | 🟢 Correto. |
| `order_status_history` | ✅ | owner read; admin ALL; escrita via trigger | 🟢 Correto. |
| `user_addresses` | ✅ | owner CRUD | 🟡 UPDATE sem WITH CHECK explícito (fallback do USING cobre) → explicitado em `20260716120200`. |
| `user_preferences` | ✅ | owner CRUD | 🟡 idem → explicitado. |
| `saved_recipes` | ✅ | owner CRUD | 🟡 idem → explicitado. |
| `tasting_journal` | ✅ | owner CRUD | 🟡 idem → explicitado. |
| `user_favorites` | ✅ | owner read/insert/delete (sem UPDATE) | 🟢 OK. |
| `user_inventory` | ✅ | owner (conferir política no banco) | 🟢 OK na análise estática. |
| `tea_wheel_history` | ✅ | owner read/insert | 🟢 OK. |
| `admin_news` | ✅ | leitura pública (published) + admin ALL | 🟢 OK (FOR ALL usa USING como check). |
| `admin_products` | ✅ | leitura pública (active) + admin ALL | 🟢 OK. |
| `admin_herbs` | ✅ | leitura pública (active) + admin ALL | 🟢 OK. |
| `admin_herb_fichas` | ✅ | leitura pública + admin ALL | 🟢 OK. |
| `admin_suppliers` | ✅ | admin ALL | 🟢 OK. |
| `chazerias` | ✅ | leitura pública + admin ALL | 🟢 OK. |

## Observações

1. **WITH CHECK ausente ≠ brecha automática**: quando omitido, o Postgres aplica o `USING` também à linha nova. O caso C-1 era grave por outro motivo — o `USING (auth.uid() = id)` continua satisfeito quando o usuário altera `is_admin` da própria linha. A defesa correta é restrição **de coluna** (grants) + trigger, aplicada na migration da Onda 1.1.
2. **Nenhuma promoção a admin pelo cliente**: após a Onda 1.1, `is_admin` só muda via `service_role` (SQL Editor/Edge Function).
3. **Views**: qualquer view nova deve nascer com `WITH (security_invoker = true)` (regra no CLAUDE.md). A query 2 acima detecta regressões.
4. **Pendência**: rodar as três queries em produção após aplicar as migrations e colar o resultado neste arquivo (seção "Execução em produção").

## Execução em produção

_Pendente — preencher com a saída das queries após aplicar as migrations da Onda 1 em staging e produção._

## Teste de abuso (staging) — roteiro

Com uma conta **comum** autenticada (publishable key):

```js
// 1. deve FALHAR (42501 / permission denied):
await sb.from('user_profiles').update({ is_admin: true }).eq('id', user.id);
// 2. deve PASSAR:
await sb.from('user_profiles').update({ display_name: 'Teste' }).eq('id', user.id);
// 3. deve retornar SOMENTE os próprios pedidos (ou nada):
await sb.from('orders_with_items').select('*');
// 4. deve FALHAR (sem policy de UPDATE para não-admin):
await sb.from('site_settings').update({ payments_enabled: true }).eq('id', 1);
```

Com uma conta **admin**: `select count(*) from orders_with_items` deve continuar retornando todos os pedidos (painel `js/admin-orders.js` intacto).
