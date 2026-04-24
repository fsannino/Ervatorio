-- ============================================================
-- ERVARIA — Migration: Marketplace orders
-- Projeto: lwzrzztzpklzbmxbqcrx
-- Data: 2026-04-24
-- ============================================================
-- Cria o schema completo de pedidos, itens, endereços e tracking
-- de pagamento. Idempotente (IF NOT EXISTS, CREATE POLICY com DROP).
--
-- Convenções adotadas:
--   • Valores monetários em CENTAVOS (integer) — evita float errors.
--   • Status como ENUM — type-safe e eficiente em índice.
--   • shipping_address em JSONB — endereço congela no momento do pedido,
--     não liga por FK a um "perfil de endereço" (que o usuário pode mudar).
--   • Preços dos itens também congelam em order_items.unit_price_cents —
--     um ajuste futuro em admin_products NÃO reescreve o histórico.
--   • RLS: usuário vê apenas os próprios pedidos; admin vê tudo.
-- ============================================================

-- 1. ENUM de status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'pending',       -- criado, aguardando pagamento
      'paid',          -- pagamento confirmado pelo provider
      'processing',    -- fornecedor separando o pedido
      'shipped',       -- enviado, com código de rastreio
      'delivered',     -- entregue ao destinatário
      'cancelled',     -- cancelado (pelo cliente ou admin antes do envio)
      'refunded',      -- reembolsado total ou parcial após pagamento
      'failed'         -- pagamento recusado ou expirou
    );
  END IF;
END$$;

-- 2. PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  -- Código curto legível para humanos (ex.: "ERV-2A4F8B"). Populado por trigger.
  order_number TEXT UNIQUE,
  status order_status NOT NULL DEFAULT 'pending',
  -- Totais em centavos (BRL por padrão)
  subtotal_cents INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  shipping_cents INTEGER NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL' CHECK (char_length(currency) = 3),
  -- Snapshot do endereço no momento da compra
  shipping_address JSONB NOT NULL,
  -- Dados de rastreio
  shipping_carrier TEXT,
  shipping_tracking_code TEXT,
  -- Integração com provedor de pagamento (Mercado Pago, Stripe, etc.)
  payment_provider TEXT,             -- 'mercadopago' | 'stripe' | 'pix_manual' | ...
  payment_external_id TEXT,          -- id do pagamento no provider
  payment_method TEXT,               -- 'pix' | 'credit_card' | 'boleto'
  payment_payload JSONB,             -- payload bruto do último webhook, para auditoria
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  -- Metadados
  notes TEXT,                        -- notas do cliente ("entregar após 18h")
  admin_notes TEXT,                  -- notas internas
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.admin_products(id) ON DELETE SET NULL,
  -- Snapshots para preservar histórico mesmo que o produto seja editado/excluído
  product_name TEXT NOT NULL,
  product_unit TEXT,
  qty INTEGER NOT NULL CHECK (qty > 0 AND qty <= 999),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  line_total_cents INTEGER NOT NULL CHECK (line_total_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ENDEREÇOS SALVOS DO USUÁRIO (opcional — reutilizar em checkouts futuros)
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,                        -- "Casa", "Trabalho"
  recipient_name TEXT NOT NULL,
  phone TEXT,
  zip TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Brasil',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. HISTÓRICO DE STATUS (trilha de auditoria)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),  -- NULL = sistema/webhook
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_external ON public.orders(payment_external_id) WHERE payment_external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history(order_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- ORDERS — usuário vê e cria os próprios; update fica proibido no cliente
-- (só Edge Functions com service_role mudam status).
DROP POLICY IF EXISTS "orders_owner_read" ON public.orders;
CREATE POLICY "orders_owner_read" ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all" ON public.orders FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- NÃO criamos policy de INSERT para cliente: create-order Edge Function
-- usa service_role e pula RLS. Cliente nunca escreve direto em orders.

-- ORDER_ITEMS — leitura vinculada à posse do pedido
DROP POLICY IF EXISTS "order_items_owner_read" ON public.order_items;
CREATE POLICY "order_items_owner_read" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));

DROP POLICY IF EXISTS "order_items_admin_all" ON public.order_items;
CREATE POLICY "order_items_admin_all" ON public.order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- USER_ADDRESSES — usuário gerencia os próprios endereços
DROP POLICY IF EXISTS "addresses_owner_read" ON public.user_addresses;
CREATE POLICY "addresses_owner_read" ON public.user_addresses FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "addresses_owner_insert" ON public.user_addresses;
CREATE POLICY "addresses_owner_insert" ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "addresses_owner_update" ON public.user_addresses;
CREATE POLICY "addresses_owner_update" ON public.user_addresses FOR UPDATE
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "addresses_owner_delete" ON public.user_addresses;
CREATE POLICY "addresses_owner_delete" ON public.user_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- ORDER_STATUS_HISTORY — somente leitura para o dono do pedido; escrita via trigger
DROP POLICY IF EXISTS "order_history_owner_read" ON public.order_status_history;
CREATE POLICY "order_history_owner_read" ON public.order_status_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_status_history.order_id AND o.user_id = auth.uid()));

DROP POLICY IF EXISTS "order_history_admin_all" ON public.order_status_history;
CREATE POLICY "order_history_admin_all" ON public.order_status_history FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================================
-- TRIGGERS
-- ============================================================

-- updated_at universal (usa a função já criada em migration anterior)
DROP TRIGGER IF EXISTS trg_orders_updated ON public.orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_addresses_updated ON public.user_addresses;
CREATE TRIGGER trg_addresses_updated BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Gera order_number curto (ERV-<6-hex>) no INSERT
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ERV-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', '') FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_number ON public.orders;
CREATE TRIGGER trg_orders_number BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Registra mudança de status em order_status_history + timestamps específicos
CREATE OR REPLACE FUNCTION public.track_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());

    IF NEW.status = 'paid' AND NEW.paid_at IS NULL THEN
      NEW.paid_at := NOW();
    ELSIF NEW.status = 'shipped' AND NEW.shipped_at IS NULL THEN
      NEW.shipped_at := NOW();
    ELSIF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN
      NEW.delivered_at := NOW();
    ELSIF NEW.status = 'cancelled' AND NEW.cancelled_at IS NULL THEN
      NEW.cancelled_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_status_track ON public.orders;
CREATE TRIGGER trg_orders_status_track BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.track_order_status_change();

-- Garante 1 único endereço default por usuário
CREATE OR REPLACE FUNCTION public.enforce_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.user_addresses
       SET is_default = FALSE
     WHERE user_id = NEW.user_id
       AND id <> NEW.id
       AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_addresses_single_default ON public.user_addresses;
CREATE TRIGGER trg_addresses_single_default
  AFTER INSERT OR UPDATE OF is_default ON public.user_addresses
  FOR EACH ROW WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION public.enforce_single_default_address();

-- ============================================================
-- VIEW auxiliar: pedido + itens + resumo para dashboards
-- ============================================================
CREATE OR REPLACE VIEW public.orders_with_items AS
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

-- RLS da view herda das tabelas subjacentes.

-- ============================================================
-- COMENTÁRIOS (documentação viva no banco)
-- ============================================================
COMMENT ON TABLE public.orders IS 'Pedidos do marketplace. Valores em centavos. Status é enum.';
COMMENT ON COLUMN public.orders.shipping_address IS 'JSONB com snapshot do endereço no momento da compra; não referencia user_addresses por FK.';
COMMENT ON COLUMN public.orders.payment_payload IS 'Payload bruto do último webhook de pagamento; útil para auditoria e replay.';
COMMENT ON TABLE public.order_items IS 'Itens do pedido com snapshot de preço e nome — imune a alterações posteriores em admin_products.';
COMMENT ON TABLE public.order_status_history IS 'Trilha de auditoria — quem mudou status de quê, quando.';

-- ============================================================
-- FIM
-- ============================================================
-- Próximos passos pós-migration:
--   1. Deploy de supabase/functions/create-order
--   2. Criar função separada para integrar Mercado Pago (PIX + cartão)
--   3. Webhook handler em supabase/functions/payment-webhook
--   4. Email transacional de confirmação (Resend ou SendGrid via Edge Function)
-- ============================================================
