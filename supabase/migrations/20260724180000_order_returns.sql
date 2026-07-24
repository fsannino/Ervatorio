-- Onda 8.2 (pós-venda): solicitações de troca/devolução (CDC).
-- O cliente solicita, o admin processa. Escrita SÓ via Edge Function
-- create-return (service_role), que valida posse do pedido, status
-- retornável e o prazo de 7 dias (direito de arrependimento, CDC).
-- Idempotente.

CREATE TABLE IF NOT EXISTS public.order_returns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo        text NOT NULL CHECK (tipo IN ('devolucao','troca')),
  motivo      text NOT NULL,
  status      text NOT NULL DEFAULT 'solicitada'
               CHECK (status IN ('solicitada','em_analise','aprovada','recusada','concluida','cancelada')),
  admin_notes text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_returns_user ON public.order_returns(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_returns_order ON public.order_returns(order_id);

ALTER TABLE public.order_returns ENABLE ROW LEVEL SECURITY;

-- Dono lê as próprias solicitações (a UI de "Meus pedidos" mostra o status).
DROP POLICY IF EXISTS "returns_owner_read" ON public.order_returns;
CREATE POLICY "returns_owner_read" ON public.order_returns FOR SELECT
  USING (auth.uid() = user_id);

-- Admin lê e processa todas (aprovar/recusar/concluir).
DROP POLICY IF EXISTS "returns_admin_all" ON public.order_returns;
CREATE POLICY "returns_admin_all" ON public.order_returns FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- NÃO há policy de INSERT/UPDATE para o dono: criar e cancelar passam pela
-- Edge Function create-return (service_role), que aplica as regras de negócio.
-- Assim o cliente não consegue forjar status nem burlar o prazo.

DROP TRIGGER IF EXISTS trg_order_returns_updated ON public.order_returns;
CREATE TRIGGER trg_order_returns_updated BEFORE UPDATE ON public.order_returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE public.order_returns IS
  'Solicitações de troca/devolução (Onda 8.2). Escrita só via Edge Function create-return; leitura: dono (own) + admin.';
