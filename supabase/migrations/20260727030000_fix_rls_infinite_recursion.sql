-- ============================================================
-- Corrige recursão infinita nas policies de RLS (42P17)
-- ============================================================
-- Sintoma: QUALQUER leitura pública falhava com
--   "infinite recursion detected in policy for relation user_profiles"
-- e o app inteiro (catálogo de ervas, chazerias, roda funcional,
-- loja) ficava sem dados — inclusive para anon.
--
-- Causa: as policies de admin usavam o predicado inline
--     EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid()
--             AND is_admin = true)
-- Esse SELECT interno em user_profiles é ele próprio submetido ao
-- RLS de user_profiles. E a policy `profiles_admin_read` de
-- user_profiles contém exatamente o mesmo EXISTS sobre
-- user_profiles → o planner entra em recursão e aborta a query.
-- Como as policies permissivas são avaliadas em OR, bastava a
-- policy de admin existir na tabela para derrubar a leitura
-- pública, mesmo sem usuário logado.
--
-- Correção: extrair o teste para uma função SECURITY DEFINER.
-- Rodando como dona da função, `public.is_admin()` lê
-- user_profiles fora do RLS — o ciclo se fecha e o predicado passa
-- a ser avaliado uma única vez por query em vez de por linha.
--
-- Superfície exposta: a função só responde sobre o PRÓPRIO
-- chamador (auth.uid()), devolve boolean e não aceita argumento.
-- Não há como consultar o is_admin de terceiros por ela.
--
-- Como testar (deve devolver 110 e não erro):
--   set local role anon;
--   select count(*) from public.admin_herb_fichas
--    where active and status = 'published';
--
-- Rollback: as policies antigas estão no corpo deste arquivo, no
-- comentário de cada bloco. Recriá-las restaura o estado anterior
-- (que é o estado quebrado — rollback só faz sentido se a função
-- causar problema inesperado).
-- ============================================================

-- ------------------------------------------------------------
-- 1) Função canônica de checagem de privilégio
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT up.is_admin FROM public.user_profiles up WHERE up.id = auth.uid()),
    false
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Retorna true se o chamador (auth.uid()) for admin. SECURITY DEFINER '
  'para escapar do RLS de user_profiles e evitar recursão nas policies. '
  'Só responde sobre o próprio chamador.';

-- Policies são avaliadas com o papel do chamador: anon/authenticated
-- precisam poder executar. service_role já executa tudo.
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 2) user_profiles — origem do ciclo
-- ------------------------------------------------------------
-- Antes: qual = (id = auth.uid()) OR EXISTS (SELECT 1 FROM user_profiles up ...)
DROP POLICY IF EXISTS profiles_admin_read ON public.user_profiles;
CREATE POLICY profiles_admin_read ON public.user_profiles
  FOR SELECT
  USING (id = (SELECT auth.uid()) OR public.is_admin());

-- Antes: qual = EXISTS (SELECT 1 FROM user_profiles up ...)
DROP POLICY IF EXISTS profiles_admin_delete ON public.user_profiles;
CREATE POLICY profiles_admin_delete ON public.user_profiles
  FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 3) Tabelas de conteúdo — admin faz tudo, público lê o ativo
-- ------------------------------------------------------------
-- Todas tinham qual = EXISTS (SELECT 1 FROM user_profiles ...)
DROP POLICY IF EXISTS blends_admin_all ON public.admin_blends;
CREATE POLICY blends_admin_all ON public.admin_blends
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS fichas_admin_all ON public.admin_herb_fichas;
CREATE POLICY fichas_admin_all ON public.admin_herb_fichas
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS herbs_admin_all ON public.admin_herbs;
CREATE POLICY herbs_admin_all ON public.admin_herbs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS news_admin_all ON public.admin_news;
CREATE POLICY news_admin_all ON public.admin_news
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS products_admin_all ON public.admin_products;
CREATE POLICY products_admin_all ON public.admin_products
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS recvectors_admin_all ON public.admin_recommendation_vectors;
CREATE POLICY recvectors_admin_all ON public.admin_recommendation_vectors
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS suppliers_admin_all ON public.admin_suppliers;
CREATE POLICY suppliers_admin_all ON public.admin_suppliers
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS chazerias_admin_all ON public.chazerias;
CREATE POLICY chazerias_admin_all ON public.chazerias
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- 4) Pedidos e derivados
-- ------------------------------------------------------------
DROP POLICY IF EXISTS orders_admin_all ON public.orders;
CREATE POLICY orders_admin_all ON public.orders
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS order_items_admin_all ON public.order_items;
CREATE POLICY order_items_admin_all ON public.order_items
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS order_history_admin_all ON public.order_status_history;
CREATE POLICY order_history_admin_all ON public.order_status_history
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS returns_admin_all ON public.order_returns;
CREATE POLICY returns_admin_all ON public.order_returns
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- 5) Reviews — a leitura pública também carregava o EXISTS
-- ------------------------------------------------------------
DROP POLICY IF EXISTS reviews_admin_all ON public.product_reviews;
CREATE POLICY reviews_admin_all ON public.product_reviews
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Antes: (status='published') OR (user_id=auth.uid()) OR EXISTS (...)
DROP POLICY IF EXISTS reviews_public_read ON public.product_reviews;
CREATE POLICY reviews_public_read ON public.product_reviews
  FOR SELECT
  USING (
    status = 'published'
    OR user_id = (SELECT auth.uid())
    OR public.is_admin()
  );

-- ------------------------------------------------------------
-- 6) site_settings
-- ------------------------------------------------------------
DROP POLICY IF EXISTS site_settings_admin_update ON public.site_settings;
CREATE POLICY site_settings_admin_update ON public.site_settings
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
