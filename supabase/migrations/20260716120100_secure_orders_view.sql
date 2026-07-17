-- ============================================================
-- C-2 · Fechar vazamento de PII na view orders_with_items
-- Auditoria 16/07/2026 · Onda 1.2 · backlog #2
-- ============================================================
-- PROBLEMA: a view public.orders_with_items (ervaria-orders-
-- migration.sql:258) foi criada sem security_invoker, portanto
-- executa com o privilégio do DONO (postgres) e IGNORA o RLS de
-- orders/order_items/user_profiles. Como está exposta ao papel
-- authenticated via PostgREST, QUALQUER usuário logado lê todos
-- os pedidos, totais, endereços, nomes e e-mails de todos os
-- clientes. Incidente de LGPD em potencial.
--
-- CORREÇÃO: recriar a view com WITH (security_invoker = true).
-- O RLS das tabelas subjacentes passa a valer para o chamador:
--   * cliente comum  → vê apenas os próprios pedidos
--     (policy orders_owner_read / order_items_owner_read);
--   * admin          → continua vendo tudo
--     (policies orders_admin_all / order_items_admin_all /
--      profiles_admin_read já existem) — o painel js/admin-orders.js
--     segue funcionando sem alteração;
--   * anon           → sem acesso (REVOKE abaixo).
--
-- Requer Postgres 15+ (Supabase atual). Idempotente.
-- Teste em staging:
--   * conta comum:  SELECT * FROM orders_with_items;
--       → apenas os próprios pedidos (0 linhas se não tem pedido)
--   * conta admin:  SELECT count(*) FROM orders_with_items;
--       → todos os pedidos
-- ============================================================

DROP VIEW IF EXISTS public.orders_with_items;

CREATE VIEW public.orders_with_items
WITH (security_invoker = true)
AS
SELECT
  o.*,
  up.display_name AS customer_name,
  up.email AS customer_email,
  (SELECT COALESCE(json_agg(
      json_build_object(
        'id', oi.id,
        'product_id', oi.product_id,
        'product_name', oi.product_name,
        'product_unit', oi.product_unit,
        'qty', oi.qty,
        'unit_price_cents', oi.unit_price_cents,
        'line_total_cents', oi.line_total_cents
      ) ORDER BY oi.created_at
  ), '[]'::json)
  FROM public.order_items oi WHERE oi.order_id = o.id) AS items
FROM public.orders o
LEFT JOIN public.user_profiles up ON up.id = o.user_id;

COMMENT ON VIEW public.orders_with_items IS
  'Pedido + itens + dados do cliente. security_invoker=true: o RLS de orders/order_items/user_profiles é aplicado ao chamador — dono vê os próprios pedidos, admin vê tudo.';

-- Acesso: somente usuários autenticados (o RLS decide o quê).
REVOKE ALL ON public.orders_with_items FROM anon;
GRANT SELECT ON public.orders_with_items TO authenticated;

-- ============================================================
-- Observação sobre o LEFT JOIN em user_profiles: para o dono do
-- pedido, a policy de SELECT de user_profiles permite ler o próprio
-- perfil (auth.uid() = id), então customer_name/customer_email do
-- próprio pedido continuam preenchidos. Para admin, a policy
-- profiles_admin_read cobre todos os perfis.
--
-- ROLLBACK (documentado — NÃO aplicar: reabre a falha C-2):
--   recriar a view sem security_invoker (definição anterior em
--   ervaria-orders-migration.sql:258).
-- ============================================================
