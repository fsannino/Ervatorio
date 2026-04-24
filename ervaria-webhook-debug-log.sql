-- ============================================================
-- ERVARIA — Log de debug do webhook MP
-- ============================================================
-- Tabela auxiliar para diagnosticar por que a assinatura HMAC
-- falha em algumas invocações. A Edge Function mp-webhook escreve
-- aqui a cada request: headers brutos, body, manifests testados,
-- hashes computados e o veredito (valid true/false).
--
-- Consulta de debug:
--   SELECT * FROM public.mp_webhook_log
--   ORDER BY created_at DESC LIMIT 5;
--
-- Depois de resolver a assinatura, pode deletar a tabela se quiser:
--   DROP TABLE public.mp_webhook_log;
-- Mas eh util manter como audit trail.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mp_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method TEXT,
  url TEXT,
  query_type TEXT,
  data_id TEXT,
  headers JSONB,
  body JSONB,
  signature_received TEXT,
  request_id TEXT,
  ts_received TEXT,
  v1_received TEXT,
  secret_configured BOOLEAN,
  secret_length INTEGER,
  secret_is_hex BOOLEAN,
  manifests_tested JSONB,      -- array de strings
  hashes_computed JSONB,        -- array de {manifest, variant, hash}
  signature_valid BOOLEAN,
  order_id UUID,
  response_status INTEGER,
  response_body JSONB
);

CREATE INDEX IF NOT EXISTS idx_mp_webhook_log_created ON public.mp_webhook_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mp_webhook_log_order ON public.mp_webhook_log(order_id);

ALTER TABLE public.mp_webhook_log ENABLE ROW LEVEL SECURITY;

-- So admin le
DROP POLICY IF EXISTS "webhook_log_admin_read" ON public.mp_webhook_log;
CREATE POLICY "webhook_log_admin_read" ON public.mp_webhook_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Escrita vem via service_role (a Edge Function), que pula RLS.

COMMENT ON TABLE public.mp_webhook_log IS 'Debug/auditoria de webhooks MP recebidos. Ajuda a diagnosticar diferencas de assinatura HMAC.';
