# Modelo de segurança — Ervatório

## Chaves do Supabase

O Supabase distribui **duas classes** de chave, com papéis muito diferentes:

| Chave | Prefixo | Exposta no frontend? | Quando usar |
|---|---|---|---|
| **Publishable (anon)** | `sb_publishable_...` | ✅ Sim, projetada para isso | SDK no navegador. A proteção vem das **RLS policies**. |
| **Service role** | `sb_secret_...` | ❌ **Nunca** | Apenas em Edge Functions ou backend. Ignora RLS. |

A chave que aparece em `js/config.js` é a **publishable** — expô-la é normal e esperado. A segurança real das tabelas vem das policies declaradas em `ervaria-supabase-migration.sql` e `ervaria-admin-migration.sql`.

## Quando usar Edge Function em vez do cliente?

Regra prática: se a operação exige qualquer uma destas, vai para Edge Function.

- Usar a `service_role` key (ex.: deletar de `auth.users`).
- Recalcular um preço ou total que o servidor precisa garantir (ex.: `create-order`).
- Integrar com um provedor externo que não pode receber a chamada direta do cliente (ex.: webhooks Mercado Pago, e-mail transacional).
- Agregar dados de várias tabelas que não devem ser expostas individualmente.

## Checklist para adicionar Edge Function nova

1. Criar pasta em `supabase/functions/<nome>/index.ts`.
2. Importar `handleCors`, `jsonResponse` de `_shared/cors.ts`.
3. Importar `getUserFromRequest` de `_shared/auth.ts` se exige autenticação.
4. Validar papel (admin vs usuário comum) antes de tocar no banco.
5. Deploy: `supabase functions deploy <nome>`.
6. Chamada no cliente usa `window.ERVATORIO_CONFIG.FUNCTIONS_URL`.

## Rotação de chave publishable

1. Supabase Dashboard → Settings → API → "Roll publishable key".
2. Atualizar `SUPABASE_PUBLISHABLE_KEY` em `js/config.js`.
3. Commit e redeploy do site estático. Não precisa tocar em Edge Functions.

## O que *não* fazer

- **Nunca** colar uma `service_role` key em `js/config.js`, HTML ou qualquer arquivo servido ao navegador.
- **Nunca** fazer `supabase.auth.admin.*` do frontend — essas APIs só funcionam com service_role.
- **Nunca** deletar `auth.users` direto do banco via SQL sem pensar: há dependências em `user_profiles`, `user_favorites`, etc. Use `admin-delete-user`.

## Auditoria de policies

Rode periodicamente no SQL editor do Supabase:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
```

Nenhuma tabela com dados de usuário pode aparecer aqui.
