-- ============================================================
-- Remoção da tabela de debug mp_webhook_log
-- Auditoria 16/07/2026 · Onda 1.4 · backlog #18
-- ============================================================
-- A tabela gravava headers e body de TODA requisição ao endpoint
-- público mp-webhook (verify_jwt=false), inclusive não
-- autenticadas — vetor de write-amplification / log-poisoning e
-- retenção desnecessária de dados. O diagnóstico de assinatura
-- passou a ser feito por logs estruturados da própria função
-- (console → Supabase Logs, com retenção gerenciada).
--
-- Antes de aplicar em produção: se quiser preservar o histórico
-- de diagnóstico, exporte:
--   COPY (SELECT * FROM public.mp_webhook_log ORDER BY created_at)
--   TO STDOUT WITH CSV HEADER;
-- ============================================================

DROP TABLE IF EXISTS public.mp_webhook_log;

-- ============================================================
-- ROLLBACK: recriar via ervaria-webhook-debug-log.sql (raiz do
-- repo) — apenas se uma nova sessão de diagnóstico exigir, e
-- removendo de novo ao terminar.
-- ============================================================
