-- ============================================================
-- C-1 · Fechar escalonamento de privilégio em user_profiles
-- Auditoria 16/07/2026 · Onda 1.1 · backlog #1
-- ============================================================
-- PROBLEMA: a policy de UPDATE ("Users can update own profile")
-- usa apenas USING (auth.uid() = id), sem WITH CHECK e sem
-- restrição de coluna. Como is_admin vive nesta tabela, qualquer
-- usuário autenticado consegue, via PostgREST com a chave
-- publishable:
--     update user_profiles set is_admin = true where id = auth.uid();
-- e assumir o painel admin.
--
-- CORREÇÃO (defesa em 3 camadas):
--   1) Policy de UPDATE recriada com WITH CHECK explícito.
--   2) Privilégio de coluna: REVOKE UPDATE/INSERT da tabela para
--      anon/authenticated e GRANT apenas nas colunas seguras do
--      perfil (is_admin fica de fora). Colunas novas nascem
--      protegidas por padrão.
--   3) Trigger que rejeita alteração de is_admin quando o papel
--      atuante é anon/authenticated (cinto e suspensório caso um
--      grant amplo seja reintroduzido no futuro).
--
-- Nota: a coluna `role` de user_profiles é o perfil de chá do
-- usuário (iniciante, tea_master, …), editável pelo dono via
-- formulário (js/ervaria.js:831). Ela NÃO é coluna de privilégio;
-- a única coluna de privilégio é is_admin.
--
-- Promoção a admin passa a ser feita SOMENTE via service_role
-- (SQL Editor do painel ou Edge Function):
--     UPDATE public.user_profiles SET is_admin = TRUE WHERE email = '...';
--
-- Idempotente. Testar no branch de staging antes de produção:
--   * conta comum: UPDATE ... SET is_admin=true  → deve FALHAR
--   * conta comum: UPDATE ... SET display_name   → deve passar
-- ============================================================

-- ── 1) Policy de UPDATE com WITH CHECK ───────────────────────
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── 2) Privilégio por coluna ─────────────────────────────────
-- Remove o UPDATE/INSERT irrestrito herdado dos GRANTs padrão do
-- Supabase e concede somente as colunas de perfil editáveis.
REVOKE UPDATE ON public.user_profiles FROM anon, authenticated;
REVOKE INSERT ON public.user_profiles FROM anon, authenticated;

GRANT UPDATE (
  display_name, avatar_url, onboarding_completed,
  email, extra_emails, phone, city, state, country,
  role, role_other, main_interest, referral_source,
  newsletter_optin, lgpd_accepted, lgpd_accepted_at, profile_completed
) ON public.user_profiles TO authenticated;

-- INSERT do próprio perfil (normalmente feito pelo trigger de signup,
-- mas a policy "Users can insert own profile" existe — mantemos o
-- caminho sem permitir semear is_admin).
GRANT INSERT (
  id, display_name, avatar_url, onboarding_completed,
  email, extra_emails, phone, city, state, country,
  role, role_other, main_interest, referral_source,
  newsletter_optin, lgpd_accepted, lgpd_accepted_at, profile_completed
) ON public.user_profiles TO authenticated;

-- ── 3) Trigger anti-escalonamento (defesa em profundidade) ───
CREATE OR REPLACE FUNCTION public.protect_user_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- PostgREST executa como 'anon' ou 'authenticated'. service_role,
  -- postgres (SQL Editor) e jobs internos não passam por aqui.
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     AND current_user IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'is_admin só pode ser alterado via service_role'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.user_profiles;
CREATE TRIGGER trg_protect_profile_privileges
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_profile_privileges();

-- ============================================================
-- ROLLBACK (documentado — NÃO aplicar salvo emergência):
--   DROP TRIGGER trg_protect_profile_privileges ON public.user_profiles;
--   DROP FUNCTION public.protect_user_profile_privileges();
--   GRANT UPDATE, INSERT ON public.user_profiles TO authenticated;
--   (e recriar a policy antiga sem WITH CHECK)
-- Atenção: o rollback REABRE a falha C-1.
-- ============================================================
