-- ============================================================
-- Direitos do titular — exclusão de conta com retenção fiscal
-- Auditoria 16/07/2026 · Onda 2.3 · backlog #75/#76
-- ============================================================
-- orders.user_id era ON DELETE RESTRICT: impossível excluir uma
-- conta que já comprou. Para atender LGPD (exclusão) sem violar a
-- retenção fiscal (manter o registro financeiro do pedido):
--   • FK passa a ON DELETE SET NULL e a coluna aceita NULL
--     (pedido órfão = conta excluída; PII do snapshot é
--     anonimizada pela Edge Function user-data-rights antes);
--   • order_status_history.changed_by idem (não pode bloquear a
--     exclusão do usuário).
-- Idempotente.
-- ============================================================

ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_user_id_fkey' AND table_name = 'orders'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_user_id_fkey;
  END IF;
END$$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'order_status_history_changed_by_fkey'
      AND table_name = 'order_status_history'
  ) THEN
    ALTER TABLE public.order_status_history DROP CONSTRAINT order_status_history_changed_by_fkey;
  END IF;
END$$;

ALTER TABLE public.order_status_history
  ADD CONSTRAINT order_status_history_changed_by_fkey
  FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.orders.user_id IS
  'NULL = conta do comprador excluída a pedido do titular (LGPD); o pedido permanece anonimizado por obrigação fiscal.';

-- ============================================================
-- ROLLBACK: recriar as FKs com ON DELETE RESTRICT / sem SET NULL
-- e SET NOT NULL em orders.user_id (só possível se não houver
-- pedidos órfãos).
-- ============================================================
