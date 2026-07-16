-- ============================================================
-- Rate limiting das Edge Functions
-- Auditoria 16/07/2026 · Onda 1.5 · backlog #69
-- ============================================================
-- Contador de janela fixa por chave (user id / IP), usado pelo
-- helper supabase/functions/_shared/ratelimit.ts via RPC.
-- Acesso exclusivo do service_role: RLS ligado sem policies e
-- EXECUTE revogado de anon/authenticated.
-- Idempotente.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hits INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;
-- Sem policies: apenas service_role (que ignora RLS) acessa.
REVOKE ALL ON public.edge_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.rate_limit_hit(
  p_key TEXT,
  p_window_seconds INTEGER,
  p_max INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_hits INTEGER;
BEGIN
  INSERT INTO public.edge_rate_limits AS r (key, window_start, hits)
  VALUES (p_key, v_now, 1)
  ON CONFLICT (key) DO UPDATE SET
    hits = CASE
      WHEN r.window_start < v_now - make_interval(secs => p_window_seconds)
      THEN 1 ELSE r.hits + 1 END,
    window_start = CASE
      WHEN r.window_start < v_now - make_interval(secs => p_window_seconds)
      THEN v_now ELSE r.window_start END
  RETURNING r.hits INTO v_hits;

  -- Higiene ocasional: descarta chaves paradas há mais de 1 dia.
  IF random() < 0.01 THEN
    DELETE FROM public.edge_rate_limits
    WHERE window_start < v_now - INTERVAL '1 day';
  END IF;

  RETURN v_hits <= p_max;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, INTEGER) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, INTEGER) TO service_role;

-- ============================================================
-- ROLLBACK:
--   DROP FUNCTION public.rate_limit_hit(TEXT, INTEGER, INTEGER);
--   DROP TABLE public.edge_rate_limits;
-- (o helper ratelimit.ts é fail-open — remover a função não
--  derruba as Edge Functions)
-- ============================================================
