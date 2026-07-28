-- ============================================================
-- Cultura da Pausa — captação de newsletter (anônima) · Ervatório
-- ============================================================
-- Diferente de user_profiles.newsletter_optin (opt-in de usuário
-- logado), esta tabela guarda inscrições ANÔNIMAS feitas na landing
-- /pausa.html. A RLS permite INSERT sem autenticação, mas NÃO
-- permite leitura pública — só admin lê os e-mails.
--
-- Este arquivo foi reescrito: a versão original apontava para o
-- projeto `lwzrzztzpklzbmxbqcrx`, que não existe mais, e nunca
-- chegou a ser aplicada em `ejarqinmjlgbqzurctsf` (verificado com
-- `select to_regclass('public.newsletter_subscribers')` → null).
-- Por isso não há banco vivo em que a versão antiga tenha rodado,
-- e reescrever no lugar mantém uma fonte de verdade só.
--
-- O que mudou em relação à original:
--   1. Idempotente — as policies ganham DROP ... IF EXISTS. Antes,
--      reaplicar quebrava com 42710 (duplicate_object).
--   2. `public.is_admin()` no lugar do EXISTS inline sobre
--      user_profiles. O predicado inline é o mesmo que causou a
--      recursão 42P17 corrigida em 20260727030000, e é avaliado
--      uma vez por linha em vez de uma vez por query.
--   3. Prova de consentimento (`consent_at`) em vez de só um
--      boolean com default true, que não comprova nada perante a
--      LGPD. Ver docs/compliance/retencao.md.
--   4. `updated_at` + trigger, como nas demais tabelas.
--   5. Índice útil: o original era ON (active) WHERE active = true
--      — indexava a coluna que o próprio predicado já fixa.
--   6. CHECK em `source` e `locale`, que vêm do cliente.
--
-- LIMITAÇÕES CONHECIDAS (fecham na etapa 2, via Edge Function):
--   - `WITH CHECK (true)` + UNIQUE(email) é um oráculo de
--     enumeração: quem insere um e-mail descobre pelo erro 23505
--     se ele já está inscrito. Não vaza a lista, vaza um bit por
--     tentativa.
--   - Sem rate limit: o INSERT vai direto ao PostgREST. A função
--     public.rate_limit_hit() existe mas só é chamável de dentro
--     de Edge Function.
--   - Sem double opt-in: qualquer um inscreve o e-mail de outra
--     pessoa, e `consent_at` registra o momento do envio do
--     formulário, não a confirmação do titular.
--   - Sem link de descadastro. A coluna `active` existe, mas o
--     inscrito é anônimo e nenhuma policy deixa ele mesmo virá-la.
--     Até a etapa 2, exclusão a pedido do titular (LGPD art. 18)
--     é processo manual do admin — está documentado no runbook.
--
-- Como testar:
--   set local role anon;
--   insert into public.newsletter_subscribers (email) values ('a@b.co');  -- OK
--   select * from public.newsletter_subscribers;   -- 0 linhas (RLS)
--
-- Rollback:
--   drop table if exists public.newsletter_subscribers cascade;
-- Sem perda relevante enquanto a captação não estiver ativa; depois
-- disso, exportar antes (a lista de e-mails é o ativo).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  source      TEXT NOT NULL DEFAULT 'pausa',
  locale      TEXT NOT NULL DEFAULT 'pt',
  consent     BOOLEAN NOT NULL DEFAULT true,
  -- Momento em que o formulário foi enviado. Não é confirmação do
  -- titular — isso só vem com o double opt-in da etapa 2 — mas já
  -- é evidência datada, que o boolean sozinho não era.
  consent_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active      BOOLEAN NOT NULL DEFAULT true,   -- false = descadastrado
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Colunas novas em bases que já tenham a tabela na forma antiga.
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- `source` e `locale` chegam do cliente; sem CHECK, qualquer string
-- entra e depois aparece no painel admin.
ALTER TABLE public.newsletter_subscribers
  DROP CONSTRAINT IF EXISTS newsletter_source_check;
ALTER TABLE public.newsletter_subscribers
  ADD CONSTRAINT newsletter_source_check
  CHECK (source IN ('pausa', 'rodape', 'blog', 'checkout', 'admin'));

ALTER TABLE public.newsletter_subscribers
  DROP CONSTRAINT IF EXISTS newsletter_locale_check;
ALTER TABLE public.newsletter_subscribers
  ADD CONSTRAINT newsletter_locale_check
  CHECK (locale IN ('pt', 'en', 'es'));

-- O índice original era ON (active) WHERE active = true — indexava
-- a constante do próprio predicado. Este serve à consulta real do
-- admin: os inscritos ativos, mais recentes primeiro.
DROP INDEX IF EXISTS idx_newsletter_subscribers_active;
CREATE INDEX IF NOT EXISTS idx_newsletter_active_created
  ON public.newsletter_subscribers (created_at DESC) WHERE active;

DROP TRIGGER IF EXISTS set_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode se inscrever (INSERT), e nada mais.
-- Sem policy de SELECT para anon: a lista de e-mails não é legível
-- publicamente.
DROP POLICY IF EXISTS newsletter_public_insert ON public.newsletter_subscribers;
CREATE POLICY newsletter_public_insert
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Somente admin lê e gerencia a lista.
DROP POLICY IF EXISTS newsletter_admin_all ON public.newsletter_subscribers;
CREATE POLICY newsletter_admin_all
  ON public.newsletter_subscribers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON TABLE public.newsletter_subscribers IS
  'Inscrições anônimas de newsletter (landing /pausa.html). Dado pessoal: '
  'e-mail. Base legal: consentimento (consent_at). Retenção e caminho de '
  'exclusão em docs/compliance/retencao.md.';
