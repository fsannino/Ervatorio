-- ============================================================
-- Guest checkout — pedido sem conta
-- Onda 6.3 · backlog #19
-- ============================================================
-- orders.user_id já é anulável (migration 20260716120500). Este
-- passo adiciona guest_email para pedidos de convidado e garante
-- que todo pedido tem um comprador identificável (conta OU e-mail).
-- O cliente nunca escreve em orders direto (create-order usa
-- service_role e recalcula preço no servidor) — o RLS existente
-- permanece: convidado não lê pedidos via PostgREST; o retorno do
-- checkout usa o order_id (UUID aleatório) devolvido pela function.
-- Idempotente.
-- ============================================================

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_email TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_buyer_present'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_buyer_present
      CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_orders_guest_email
  ON public.orders (guest_email) WHERE guest_email IS NOT NULL;

COMMENT ON COLUMN public.orders.guest_email IS
  'E-mail do comprador convidado (checkout sem conta — Onda 6.3). NULL quando o pedido pertence a uma conta (user_id).';

-- ============================================================
-- ROLLBACK: ALTER TABLE public.orders DROP CONSTRAINT orders_buyer_present;
--           (manter a coluna — pode conter dados de pedidos reais)
-- ============================================================
