-- ============================================================
-- Endurecimento das funções da trilha de auditoria
-- ============================================================
-- A migration 20260802030000_admin_audit_log.sql foi mergeada em main
-- mas nunca aplicada ao banco. Ao aplicá-la, o linter do Supabase
-- passou a acusar três coisas que ela deixou em aberto.
--
-- ── 1) search_path mutável em audit_is_sensitive e audit_redact ──
-- As duas são `LANGUAGE sql IMMUTABLE` sem `SET search_path`. Elas são
-- chamadas de dentro de audit_row(), que é SECURITY DEFINER e roda com
-- privilégio do dono. Uma função sem search_path fixo, alcançada por
-- essa cadeia, é o padrão clássico de escalonamento: quem controla o
-- search_path da sessão pode plantar um objeto de mesmo nome num
-- esquema que venha antes e ser executado com o privilégio errado.
--
-- Aqui o risco concreto é baixo — nenhuma das duas chama objeto não
-- qualificado, só operadores e ARRAY. Mas o custo de fechar é zero, e
-- "baixo hoje" vira "alto" na primeira vez que alguém editar a função
-- sem lembrar disso.
--
-- ── 2) audit_row() exposta em /rest/v1/rpc/audit_row ──
-- Ela é SECURITY DEFINER e anon/authenticated tinham EXECUTE por
-- default privilege do Supabase.
--
-- Testei antes de escrever isto, porque a diferença importa: chamar
-- audit_row() fora de um trigger é RECUSADO pelo próprio Postgres com
-- `0A000 — trigger functions can only be called as triggers`. Ou seja,
-- NÃO era explorável, e seria desonesto descrever isto como correção
-- de brecha.
--
-- Revogo mesmo assim. A garantia hoje vem do Postgres recusar a
-- chamada, não de uma decisão nossa; um endpoint público que existe
-- sem motivo é superfície que ninguém precisa manter.
--
-- Lição já aprendida em 20260730120000: revoke de FUNÇÃO funciona.
-- O que não funciona é revoke de COLUNA sobre grant de tabela — aquele
-- é no-op silencioso.
--
-- Como testar:
--   select public.audit_row();          -- 0A000, antes e depois
--   -- e o log continua sendo escrito pelos triggers:
--   update public.admin_products set name = name where id = '<uuid>';
--   select count(*) from public.admin_audit_log;
--
-- Rollback:
--   ALTER FUNCTION public.audit_is_sensitive(text) RESET search_path;
--   ALTER FUNCTION public.audit_redact(jsonb) RESET search_path;
--   GRANT EXECUTE ON FUNCTION public.audit_row() TO anon, authenticated;
-- Devolve os três avisos do linter. Nenhum dado é afetado.
-- ============================================================

-- pg_catalog primeiro: as duas só usam operadores e construtores do
-- catálogo. public não entra porque elas não precisam dele — quanto
-- menor o caminho, menos lugar para plantar homônimo.
ALTER FUNCTION public.audit_is_sensitive(text) SET search_path = pg_catalog, pg_temp;
ALTER FUNCTION public.audit_redact(jsonb)      SET search_path = pg_catalog, pg_temp;

-- audit_row() é chamada só como trigger. Ninguém precisa de EXECUTE.
REVOKE ALL ON FUNCTION public.audit_row() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_row() FROM anon, authenticated;
