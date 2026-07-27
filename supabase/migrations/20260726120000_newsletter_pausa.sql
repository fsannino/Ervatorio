-- Cultura da Pausa — captação de newsletter (anônima) · Ervatório
-- Rodar no Supabase SQL Editor (projeto lwzrzztzpklzbmxbqcrx)
--
-- Diferente de user_profiles.newsletter_optin (opt-in de usuário logado),
-- esta tabela guarda inscrições ANÔNIMAS feitas na landing /pausa.html.
-- Por isso a RLS permite INSERT sem autenticação, mas NÃO permite leitura
-- pública — só o admin lê os e-mails.

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  source      TEXT DEFAULT 'pausa',        -- origem da inscrição (landing, rodapé, etc.)
  locale      TEXT DEFAULT 'pt',           -- idioma no momento da inscrição
  consent     BOOLEAN DEFAULT true,        -- consentimento explícito (LGPD)
  active      BOOLEAN DEFAULT true,        -- false = descadastrado
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active
  ON public.newsletter_subscribers (active) WHERE active = true;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode se inscrever (INSERT), mas nada mais.
CREATE POLICY "newsletter_public_insert"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Somente admin lê / gerencia a lista de e-mails.
CREATE POLICY "newsletter_admin_all"
  ON public.newsletter_subscribers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true)
  );
