-- ============================================================
-- Trilha de auditoria do painel admin
-- ============================================================
-- Hoje o Ervatório não registra nada do que o admin faz. Quem mudou o
-- preço de um produto, quem aprovou uma devolução, quem virou admin —
-- nada disso deixa rastro. Este migration cria a trilha.
--
-- Por que trigger e não chamada no código: o padrão "chame a função de
-- log em toda ação sensível" depende de ninguém esquecer. No Solaris
-- (mesmo time, mesma disciplina) a cobertura ficou em 7 de 10 arquivos
-- até alguém auditar. Trigger cobre 100% por construção — inclusive
-- alterações feitas direto no SQL Editor do Supabase.
--
-- ── PII: por que o log redige colunas ────────────────────────
-- `orders` guarda `shipping_address`, `notes` e `payment_payload`.
-- Copiar a linha inteira para o log duplicaria dado pessoal numa tabela
-- que o caminho de exclusão LGPD não conhece.
--
-- O caso concreto: a Edge Function `user-data-rights` atende pedido de
-- exclusão anonimizando `orders.shipping_address` com um UPDATE. Um
-- trigger ingênuo gravaria o endereço ORIGINAL no `before` desse mesmo
-- UPDATE — ou seja, a trilha desfaria a exclusão que o titular pediu.
--
-- Por isso colunas sensíveis entram no log como '[redigido]'. O log
-- registra QUE mudou e QUEM mudou, não o conteúdo pessoal.
--
-- ── Retenção ─────────────────────────────────────────────────
-- Sem expurgo automático nesta migration — definir prazo é decisão de
-- negócio/jurídico, não técnica. Quando houver prazo, um cron de
-- `DELETE FROM admin_audit_log WHERE at < now() - interval 'N meses'`
-- resolve. Registrado como pendência no PR.
--
-- Rollback: ver bloco no fim do arquivo.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Tabela
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          BIGSERIAL PRIMARY KEY,
  -- Quem. `actor_id` pode ser NULL em ação de service_role (Edge
  -- Function/webhook), onde não há auth.uid().
  actor_id    UUID,
  -- Snapshot do nome no momento da ação: se o perfil for excluído
  -- depois, a atribuição não se perde.
  actor_name  TEXT,
  action      TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name  TEXT NOT NULL,
  -- PK como texto: as tabelas auditadas têm PKs de tipos diferentes.
  row_id      TEXT,
  before      JSONB,
  after       JSONB,
  at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin_audit_log IS
  'Trilha de auditoria das ações do painel. Escrita só por trigger '
  '(SECURITY DEFINER); nenhuma policy de INSERT/UPDATE/DELETE — log '
  'que se edita não é log. Colunas com dado pessoal entram redigidas.';

CREATE INDEX IF NOT EXISTS admin_audit_log_at_idx
  ON public.admin_audit_log (at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_table_at_idx
  ON public.admin_audit_log (table_name, at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_at_idx
  ON public.admin_audit_log (actor_id, at DESC);

-- ------------------------------------------------------------
-- 2) RLS — leitura só para admin, escrita por ninguém
-- ------------------------------------------------------------
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_admin_read ON public.admin_audit_log;
CREATE POLICY audit_log_admin_read ON public.admin_audit_log
  FOR SELECT USING (public.is_admin());

-- Sem policy de INSERT/UPDATE/DELETE de propósito: RLS nega por padrão.
-- O trigger escreve porque roda SECURITY DEFINER (dono da função), que
-- não passa por RLS. Nem admin altera o histórico pelo PostgREST.
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;

-- ------------------------------------------------------------
-- 3) Redação de colunas sensíveis
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_is_sensitive(col text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT col = ANY (ARRAY[
           'shipping_address',   -- endereço completo do cliente
           'payment_payload',    -- payload bruto do provedor
           'payment_external_id',
           'notes',              -- texto livre escrito pelo cliente
           'avatar_url'
         ])
      OR col ~* '(cpf|cnpj|phone|telefone|celular|email|senha|password|token|secret)';
$$;

COMMENT ON FUNCTION public.audit_is_sensitive(text) IS
  'Colunas cujo conteúdo não vai para a trilha. Casar por nome cobre '
  'colunas futuras com nomes previsíveis sem precisar editar a função.';

CREATE OR REPLACE FUNCTION public.audit_redact(payload jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN payload IS NULL THEN NULL
    WHEN payload = '{}'::jsonb THEN payload
    ELSE COALESCE(
      (SELECT jsonb_object_agg(
                e.key,
                CASE WHEN public.audit_is_sensitive(e.key)
                     THEN to_jsonb('[redigido]'::text)
                     ELSE e.value END)
         FROM jsonb_each(payload) AS e),
      '{}'::jsonb)
  END;
$$;

-- ------------------------------------------------------------
-- 4) Função do trigger
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_old    jsonb;
  v_new    jsonb;
  v_before jsonb;
  v_after  jsonb;
  v_row_id text;
  v_keys   text[];
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old    := to_jsonb(OLD);
    v_before := public.audit_redact(v_old);
    v_row_id := v_old ->> 'id';

  ELSIF TG_OP = 'INSERT' THEN
    v_new   := to_jsonb(NEW);
    v_after := public.audit_redact(v_new);
    v_row_id := v_new ->> 'id';

  ELSE -- UPDATE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_row_id := v_new ->> 'id';

    -- Só as colunas que de fato mudaram. Reduz ruído e, junto com a
    -- redação, mantém o log enxuto.
    SELECT array_agg(e.key)
      INTO v_keys
      FROM jsonb_each(v_new) AS e
     WHERE v_old -> e.key IS DISTINCT FROM e.value;

    -- Nada mudou, ou só o carimbo de tempo: não registra.
    IF v_keys IS NULL OR v_keys = ARRAY['updated_at'] THEN
      RETURN NULL;
    END IF;

    v_before := public.audit_redact(
      (SELECT jsonb_object_agg(k, COALESCE(v_old -> k, 'null'::jsonb))
         FROM unnest(v_keys) AS k));
    v_after := public.audit_redact(
      (SELECT jsonb_object_agg(k, v_new -> k) FROM unnest(v_keys) AS k));
  END IF;

  INSERT INTO public.admin_audit_log
    (actor_id, actor_name, action, table_name, row_id, before, after)
  VALUES (
    auth.uid(),
    (SELECT up.display_name FROM public.user_profiles up WHERE up.id = auth.uid()),
    TG_OP,
    TG_TABLE_NAME,
    v_row_id,
    v_before,
    v_after
  );

  RETURN NULL; -- AFTER trigger: o retorno é ignorado
END;
$$;

COMMENT ON FUNCTION public.audit_row() IS
  'Trigger genérica de auditoria. AFTER INSERT/UPDATE/DELETE. Em UPDATE '
  'grava só as colunas alteradas; colunas sensíveis saem redigidas.';

-- ------------------------------------------------------------
-- 5) Triggers
-- ------------------------------------------------------------
DO $$
DECLARE
  t text;
  alvos text[] := ARRAY[
    -- Conteúdo e catálogo administrados pelo painel
    'admin_blends',
    'admin_herb_fichas',
    'admin_herbs',
    'admin_news',
    'admin_products',
    'admin_recommendation_vectors',
    'admin_suppliers',
    'chazerias',
    -- Operação de loja
    'orders',
    'order_items',
    'order_returns',
    'order_status_history',
    'product_reviews',
    -- Configuração (inclui a flag de pagamentos)
    'site_settings'
  ];
BEGIN
  FOREACH t IN ARRAY alvos LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$I ON public.%1$I', t);
      EXECUTE format(
        'CREATE TRIGGER audit_%1$I
           AFTER INSERT OR UPDATE OR DELETE ON public.%1$I
           FOR EACH ROW EXECUTE FUNCTION public.audit_row()', t);
    ELSE
      RAISE NOTICE '[audit] tabela public.% não existe — trigger não criada', t;
    END IF;
  END LOOP;
END $$;

-- `user_profiles` é caso à parte. Auditar toda alteração de perfil
-- geraria ruído (onboarding, avatar) sobre dado de usuário comum. O que
-- importa aqui é a mudança de PRIVILÉGIO — e essa é registrada sempre.
DROP TRIGGER IF EXISTS audit_user_profiles_privilege ON public.user_profiles;
CREATE TRIGGER audit_user_profiles_privilege
  AFTER UPDATE OF is_admin ON public.user_profiles
  FOR EACH ROW
  WHEN (OLD.is_admin IS DISTINCT FROM NEW.is_admin)
  EXECUTE FUNCTION public.audit_row();

-- ============================================================
-- ROLLBACK
-- ============================================================
-- Remove a trilha sem tocar em nenhum dado de negócio:
--
--   DO $$ DECLARE t text; BEGIN
--     FOREACH t IN ARRAY ARRAY['admin_blends','admin_herb_fichas',
--       'admin_herbs','admin_news','admin_products',
--       'admin_recommendation_vectors','admin_suppliers','chazerias',
--       'orders','order_items','order_returns','order_status_history',
--       'product_reviews','site_settings'] LOOP
--       EXECUTE format('DROP TRIGGER IF EXISTS audit_%1$I ON public.%1$I', t);
--     END LOOP;
--   END $$;
--   DROP TRIGGER IF EXISTS audit_user_profiles_privilege ON public.user_profiles;
--   DROP FUNCTION IF EXISTS public.audit_row();
--   DROP FUNCTION IF EXISTS public.audit_redact(jsonb);
--   DROP FUNCTION IF EXISTS public.audit_is_sensitive(text);
--   DROP TABLE IF EXISTS public.admin_audit_log;
--
-- Derrubar só os triggers já para a escrita e preserva o histórico.
-- ============================================================
