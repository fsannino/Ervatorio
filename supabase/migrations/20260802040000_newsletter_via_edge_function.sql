-- ============================================================
-- Newsletter etapa 2 — escrita só pela Edge Function
-- ============================================================
-- A migration 20260726120000 criou esta policy:
--
--   CREATE POLICY newsletter_public_insert
--     ON public.newsletter_subscribers FOR INSERT
--     WITH CHECK (true);
--
-- Ela permitia que qualquer visitante gravasse a linha inteira, não
-- só o e-mail. O linter do Supabase sinaliza como
-- `rls_policy_always_true` (WARN), e o problema concreto é maior que
-- o rótulo sugere:
--
--   • `consent_at` era escrivível pelo cliente. Essa coluna é a
--     evidência datada de consentimento que a LGPD pede. Evidência
--     que o titular do dado pode forjar não é evidência.
--   • `active` também. Dava para nascer descadastrado, ou — pior —
--     reinscrever alguém que havia saído.
--   • `id` (BIGSERIAL) podia vir explícito, sem avançar a sequência,
--     plantando uma colisão de chave para o futuro.
--   • `created_at` / `updated_at` idem.
--
-- Somado ao UNIQUE(email), o INSERT direto ainda era um oráculo de
-- enumeração: o erro 23505 respondia "este e-mail já está na lista",
-- um bit por tentativa, sem rate limit — o PostgREST não passa por
-- rate_limit_hit().
--
-- A partir daqui a captação passa pela Edge Function
-- newsletter-subscribe, que roda como service_role (portanto ignora
-- RLS), aceita só e-mail/origem/idioma, aplica rate limit por IP e
-- devolve resposta IDÊNTICA para e-mail novo e já inscrito.
--
-- ── ORDEM DE APLICAÇÃO (importa) ──
-- Aplicar isto antes de a nova /pausa.html estar no ar QUEBRA a
-- captação em produção: o formulário antigo insere direto no
-- PostgREST e passaria a receber 42501.
--
--   1. deploy da function newsletter-subscribe   (aditivo)
--   2. merge + deploy do site com a nova pausa.html
--   3. só então esta migration
--
-- ── O que continua em aberto ──
-- Sem double opt-in e sem link de descadastro. `active` existe, mas
-- o inscrito é anônimo e nenhuma policy deixa ele mesmo virá-la —
-- exclusão a pedido (LGPD art. 18) segue manual, pelo runbook. Os
-- dois exigem e-mail transacional e uma página pública de
-- confirmação; ficam para a etapa 3. Escopo cortado de propósito.
--
-- Como testar (depois de aplicar):
--   set local role anon;
--   insert into public.newsletter_subscribers (email) values ('x@y.co');
--   -- esperado: ERRO 42501 (a policy sumiu)
--   -- e a landing continua funcionando, porque ela não passa mais aqui
--
-- Rollback:
--   CREATE POLICY newsletter_public_insert
--     ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
-- Devolve a captação direta — e devolve junto o oráculo e a escrita
-- livre de colunas. Só faz sentido se a Edge Function estiver fora
-- do ar e a captação for mais importante que o risco.
-- ============================================================

DROP POLICY IF EXISTS newsletter_public_insert ON public.newsletter_subscribers;

COMMENT ON TABLE public.newsletter_subscribers IS
  'Inscrições anônimas de newsletter (landing /pausa.html). Escrita '
  'EXCLUSIVAMENTE pela Edge Function newsletter-subscribe (service_role): '
  'não há policy de INSERT para anon/authenticated. Dado pessoal: e-mail. '
  'Base legal: consentimento (consent_at, definido pelo servidor). '
  'Retenção e caminho de exclusão em docs/compliance/retencao.md.';
