-- ============================================================
-- REPARO DE HISTÓRICO — tabelas do catálogo que nunca foram versionadas
-- ============================================================
-- PROBLEMA
-- Nenhuma migration cria estas seis tabelas:
--
--   admin_products   admin_herbs                  admin_news
--   admin_blends     admin_recommendation_vectors admin_herb_fichas
--
-- Elas existem em produção porque foram criadas à mão pelos .sql soltos
-- na raiz do repositório, antes de o histórico ser formalizado. As
-- migrations `base_*` foram escritas para consolidar um banco que já
-- existia — e assumem que essas tabelas já estão lá.
--
-- Consequência: o histórico não replica do zero. Todo Supabase branch
-- novo morre em `base_03`, na primeira linha que mexe numa delas:
--
--   ERROR: relation "public.admin_products" does not exist
--     em: ALTER TABLE public.admin_products ADD COLUMN IF NOT EXISTS is_test
--
-- Isso torna impossível cumprir a regra do CLAUDE.md ("teste a migration
-- em um Supabase branch antes de aplicar em produção") e significa que o
-- schema real só existe dentro do banco de produção — não há de onde
-- reconstruí-lo.
--
-- SOLUÇÃO
-- Esta migration entra ANTES de `base_03` (versão 20260727011800, entre
-- base_02 e base_03) e cria as seis tabelas. Em produção é inócua: todo
-- comando é `IF NOT EXISTS` e as tabelas já existem. Num branch novo,
-- ela desbloqueia o restante do histórico.
--
-- FONTE DO DDL
-- O catálogo de produção (pg_attribute/pg_constraint/pg_indexes), não os
-- .sql da raiz — que divergiram: eles declaram CHECKs em `stock`,
-- `category` e `linha` que o banco real não tem.
--
-- COLUNAS DELIBERADAMENTE AUSENTES em admin_products:
--   supplier_id  → base_03 cria, com a FK para admin_suppliers
--   is_test      → base_03
--   weight_grams → sec_04
--   stock_qty    → stock_control
-- Criá-las aqui faria o `ADD COLUMN IF NOT EXISTS` daquelas migrations
-- virar no-op e as CHECKs que vêm junto se perderiam no replay.
--
-- Rollback: no fim do arquivo.
-- ============================================================

-- ------------------------------------------------------------
-- Conteúdo editorial
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_news (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  category   TEXT DEFAULT 'noticia'::text,
  image_url  TEXT,
  published  BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- Catálogo de chás
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_herbs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  latin_name      TEXT,
  icon            TEXT DEFAULT '🍃'::text,
  category        TEXT NOT NULL,
  effects         TEXT,
  detail          TEXT,
  safe_for        TEXT[] DEFAULT '{}'::text[],
  avoid_for       TEXT[] DEFAULT '{}'::text[],
  temp            TEXT,
  brew_time       TEXT,
  dose            TEXT,
  frequency       TEXT,
  tags            TEXT[] DEFAULT '{}'::text[],
  momento         TEXT[] DEFAULT '{}'::text[],
  active          BOOLEAN DEFAULT true,
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  linha           TEXT,
  tagline         TEXT,
  img             TEXT,
  bioma           TEXT,
  usos            TEXT[],
  restricoes_pais TEXT[]
);

CREATE INDEX IF NOT EXISTS admin_herbs_bioma_idx
  ON public.admin_herbs USING btree (bioma);

-- ------------------------------------------------------------
-- Produtos da loja
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  description         TEXT,
  category            TEXT DEFAULT 'Folhas Secas'::text,
  price               NUMERIC NOT NULL,
  unit                TEXT DEFAULT '50g'::text,
  icon                TEXT DEFAULT '🍃'::text,
  supplier            TEXT,
  stock               TEXT DEFAULT 'in'::text,
  image_url           TEXT,
  active              BOOLEAN DEFAULT true,
  created_by          UUID,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  source              TEXT DEFAULT 'legacy'::text,
  slug_ficha          TEXT,
  fornecedor_id_ref   TEXT,
  certificacoes       TEXT[] DEFAULT '{}'::text[],
  origem_geografica   TEXT,
  observacao_cultural TEXT,
  images              TEXT[] DEFAULT '{}'::text[],
  -- Coluna sem a FK de propósito: `base_03` adiciona a constraint
  -- (ADD CONSTRAINT ... FOREIGN KEY (supplier_id)) e nunca cria a
  -- coluna — assumia que ela já existia, criada pelo .sql solto do
  -- marketplace v2. Criar a FK aqui faria o ADD CONSTRAINT de base_03
  -- falhar com "already exists".
  supplier_id         UUID
);

-- ------------------------------------------------------------
-- Fichas editoriais das ervas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_herb_fichas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL,
  herb_id         UUID,
  herb_latin_name TEXT,
  schema_version  TEXT NOT NULL DEFAULT '1.1'::text,
  ficha           JSONB NOT NULL,
  status          TEXT DEFAULT 'published'::text,
  active          BOOLEAN DEFAULT true,
  created_by      UUID,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_herb_fichas_slug_idx
  ON public.admin_herb_fichas USING btree (slug);
CREATE INDEX IF NOT EXISTS admin_herb_fichas_latin_idx
  ON public.admin_herb_fichas USING btree (herb_latin_name);
CREATE INDEX IF NOT EXISTS admin_herb_fichas_active_idx
  ON public.admin_herb_fichas USING btree (active) WHERE (active = true);
CREATE INDEX IF NOT EXISTS admin_herb_fichas_ficha_gin
  ON public.admin_herb_fichas USING gin (ficha);

-- ------------------------------------------------------------
-- Blends editoriais
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_blends (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT NOT NULL,
  blend_id            INTEGER,
  nome                TEXT NOT NULL,
  proposito           TEXT,
  momento             TEXT,
  evidencia           TEXT,
  fonte               TEXT,
  conteudo_markdown   TEXT NOT NULL,
  ervas_referenciadas TEXT[] DEFAULT '{}'::text[],
  schema_version      TEXT NOT NULL DEFAULT '1.0'::text,
  status              TEXT DEFAULT 'published'::text,
  active              BOOLEAN DEFAULT true,
  created_by          UUID,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- Vetores de recomendação
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_recommendation_vectors (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT NOT NULL,
  nome_popular        TEXT NOT NULL,
  nome_cientifico     TEXT,
  tagline             TEXT,
  vec_ansiedade       SMALLINT DEFAULT 0,
  vec_sono            SMALLINT DEFAULT 0,
  vec_digestao        SMALLINT DEFAULT 0,
  vec_hepatico        SMALLINT DEFAULT 0,
  vec_respiratorio    SMALLINT DEFAULT 0,
  vec_inflamacao      SMALLINT DEFAULT 0,
  vec_frescor         SMALLINT DEFAULT 0,
  vec_calor           SMALLINT DEFAULT 0,
  vec_energia         SMALLINT DEFAULT 0,
  vec_imunidade       SMALLINT DEFAULT 0,
  vec_pele            SMALLINT DEFAULT 0,
  vec_ginecologico    SMALLINT DEFAULT 0,
  vec_urinario        SMALLINT DEFAULT 0,
  vec_cardiovascular  SMALLINT DEFAULT 0,
  vec_metabolico      SMALLINT DEFAULT 0,
  vec_oral            SMALLINT DEFAULT 0,
  vec_antiespasmodico SMALLINT DEFAULT 0,
  vec_hemorroidas     SMALLINT DEFAULT 0,
  gestantes_ok        BOOLEAN DEFAULT false,
  lactantes_ok        BOOLEAN DEFAULT false,
  criancas_ok         BOOLEAN DEFAULT false,
  tem_alerta_critico  BOOLEAN DEFAULT false,
  intensidade         TEXT,
  cor_infusao         TEXT,
  tem_frescor         BOOLEAN DEFAULT false,
  tem_calor           BOOLEAN DEFAULT false,
  eixo_botanico       TEXT,
  schema_version      TEXT DEFAULT '1.0'::text,
  active              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
-- Toda tabela nasce com RLS (CLAUDE.md). As policies vêm de `base_03` e
-- de `fix_rls_infinite_recursion`, que já existem no histórico — aqui só
-- garantimos que a tabela não fique um instante sequer sem RLS.
ALTER TABLE public.admin_news                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_herbs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_herb_fichas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_blends                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_recommendation_vectors ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- Em produção não há o que reverter: a migration é inócua lá (as tabelas
-- já existiam). Remover o registro do histórico volta ao estado anterior:
--
--   DELETE FROM supabase_migrations.schema_migrations
--    WHERE version = '20260727011800';
--
-- NÃO derrube as tabelas: elas contêm o catálogo em produção.
-- ============================================================
