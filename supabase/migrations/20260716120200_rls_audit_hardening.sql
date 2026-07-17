-- ============================================================
-- Auditoria RLS · site_settings + WITH CHECK explícito
-- Auditoria 16/07/2026 · Onda 1.3 · backlog #72
-- Relatório: docs/security/rls-audit.md
-- ============================================================
-- 1) site_settings: tabela usada pelo app (js/ervaria.js:70 lê
--    payments_enabled; js/admin.js:87 faz UPDATE) mas SEM DDL
--    versionado no repositório — criada à mão no SQL Editor, com
--    RLS não verificado. Esta migration versiona a tabela e
--    garante RLS: leitura pública (o front precisa saber se
--    pagamentos estão ligados antes do login), escrita só admin.
--
-- 2) Policies de UPDATE de "dono" sem WITH CHECK explícito:
--    o Postgres usa o USING como fallback para o WITH CHECK,
--    então não há brecha ativa — mas a regra do projeto
--    (CLAUDE.md) exige WITH CHECK explícito. Recriamos as
--    policies de UPDATE das tabelas de dados de usuário.
--
-- Idempotente. Testar em staging (ver rls-audit.md).
-- ============================================================

-- ── 1) site_settings versionada + RLS ────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY,
  payments_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Linha padrão usada pelo app (id=1). Não sobrescreve a existente.
INSERT INTO public.site_settings (id, payments_enabled)
VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Leitura: pública (flag de operação, não é dado sensível).
DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read" ON public.site_settings
  FOR SELECT USING (TRUE);

-- Escrita: somente admin, com WITH CHECK.
DROP POLICY IF EXISTS "site_settings_admin_update" ON public.site_settings;
CREATE POLICY "site_settings_admin_update" ON public.site_settings
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Sem policy de INSERT/DELETE para cliente: linhas de config são
-- gerenciadas por migration/service_role.

-- ── 2) WITH CHECK explícito nas policies de UPDATE de dono ───
-- (sem mudança de comportamento; formaliza a regra do projeto)

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own journal entries" ON public.tasting_journal;
CREATE POLICY "Users can update own journal entries"
  ON public.tasting_journal FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "recipes_owner_update" ON public.saved_recipes;
CREATE POLICY "recipes_owner_update" ON public.saved_recipes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_owner_update" ON public.user_addresses;
CREATE POLICY "addresses_owner_update" ON public.user_addresses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- ROLLBACK: recriar as policies anteriores (sem WITH CHECK) e,
-- para site_settings, apenas DROP das policies criadas aqui
-- (não dropar a tabela — pode conter config de produção).
-- ============================================================
