-- ============================================================
-- Avaliações de produto (reviews)
-- Onda 7.2 · backlog #47, #48
-- ============================================================
-- Regra central (RLS): SÓ QUEM COMPROU AVALIA — o INSERT exige um
-- pedido do próprio usuário contendo o produto, em status pago ou
-- posterior. Leitura pública apenas de reviews 'published';
-- moderação (ocultar) é admin. Uma avaliação por usuário/produto.
-- Idempotente. Testar em staging antes de produção.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.admin_products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT CHECK (char_length(title) <= 120),
  body TEXT CHECK (char_length(body) <= 2000),
  display_name TEXT,               -- snapshot do nome na publicação
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product
  ON public.product_reviews (product_id) WHERE status = 'published';

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Leitura: reviews publicadas são públicas; dono vê a própria
-- mesmo oculta; admin vê tudo.
DROP POLICY IF EXISTS "reviews_public_read" ON public.product_reviews;
CREATE POLICY "reviews_public_read" ON public.product_reviews
  FOR SELECT USING (
    status = 'published'
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- INSERT: autenticado, na própria identidade, e COMPRADOR do
-- produto (pedido pago/processando/enviado/entregue com o item).
DROP POLICY IF EXISTS "reviews_buyer_insert" ON public.product_reviews;
CREATE POLICY "reviews_buyer_insert" ON public.product_reviews
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND status = 'published'
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      WHERE o.user_id = auth.uid()
        AND oi.product_id = product_reviews.product_id
        AND o.status IN ('paid','processing','shipped','delivered')
    )
  );

-- UPDATE: dono edita a própria review (sem trocar product/user);
-- admin pode tudo (moderação: status → hidden).
DROP POLICY IF EXISTS "reviews_owner_update" ON public.product_reviews;
CREATE POLICY "reviews_owner_update" ON public.product_reviews
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "reviews_admin_all" ON public.product_reviews;
CREATE POLICY "reviews_admin_all" ON public.product_reviews
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "reviews_owner_delete" ON public.product_reviews;
CREATE POLICY "reviews_owner_delete" ON public.product_reviews
  FOR DELETE USING (user_id = auth.uid());

-- Colunas de privilégio protegidas por trigger (padrão C-1): o dono
-- não pode trocar product_id/user_id/status da própria review.
CREATE OR REPLACE FUNCTION public.protect_review_columns()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF current_user IN ('anon','authenticated')
     AND NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE)
  THEN
    IF NEW.product_id IS DISTINCT FROM OLD.product_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'campos protegidos de review' USING ERRCODE = '42501';
    END IF;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_review_columns ON public.product_reviews;
CREATE TRIGGER trg_protect_review_columns
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.protect_review_columns();

-- ============================================================
-- ROLLBACK: DROP TABLE public.product_reviews;
--           DROP FUNCTION public.protect_review_columns();
-- ============================================================
