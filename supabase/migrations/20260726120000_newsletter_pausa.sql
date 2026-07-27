-- Cultura da Pausa — captação de newsletter anônima · Ervatório
-- Projeto Supabase: ejarqinmjlgbqzurctsf
--
-- Diferente de user_profiles.newsletter_optin (usuário autenticado),
-- esta tabela armazena inscrições anônimas feitas em /pausa.html.

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'pausa',
  locale      TEXT NOT NULL DEFAULT 'pt',
  consent     BOOLEAN NOT NULL DEFAULT true,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT newsletter_subscribers_email_normalized
    CHECK (email = lower(btrim(email))),
  CONSTRAINT newsletter_subscribers_email_valid
    CHECK (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  CONSTRAINT newsletter_subscribers_consent_required
    CHECK (consent = true)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscribers_email
  ON public.newsletter_subscribers (lower(email));

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active
  ON public.newsletter_subscribers (active)
  WHERE active = true;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- A migration pode ser reaplicada com segurança.
DROP POLICY IF EXISTS newsletter_public_insert
  ON public.newsletter_subscribers;
DROP POLICY IF EXISTS newsletter_admin_all
  ON public.newsletter_subscribers;

-- Visitantes podem somente inserir inscrições válidas e consentidas.
CREATE POLICY newsletter_public_insert
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    consent = true
    AND active = true
    AND source IN ('pausa', 'landing', 'rodape')
    AND locale IN ('pt', 'en')
  );

-- Somente administradores autenticados podem consultar e gerenciar a lista.
CREATE POLICY newsletter_admin_all
  ON public.newsletter_subscribers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE id = auth.uid()
        AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE id = auth.uid()
        AND is_admin = true
    )
  );

REVOKE ALL ON TABLE public.newsletter_subscribers FROM anon, authenticated;
GRANT INSERT (email, source, locale, consent, active)
  ON TABLE public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.newsletter_subscribers TO authenticated;

-- BIGSERIAL usa uma sequence; INSERT anônimo precisa poder gerar o id.
GRANT USAGE, SELECT
  ON SEQUENCE public.newsletter_subscribers_id_seq TO anon, authenticated;

COMMENT ON TABLE public.newsletter_subscribers IS
  'Inscrições anônimas na newsletter Cultura da Pausa.';
