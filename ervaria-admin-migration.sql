-- ============================================================
-- ERVARIA — Admin Migration
-- Data: 2026-04-13
-- ============================================================
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Flag de admin no user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. NOTÍCIAS / CONTEÚDO
CREATE TABLE IF NOT EXISTS public.admin_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'noticia' CHECK (category IN ('noticia','artigo','dica','novidade')),
  image_url TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUTOS (gerenciáveis pelo admin)
CREATE TABLE IF NOT EXISTS public.admin_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Folhas Secas',
  price DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT '50g',
  icon TEXT DEFAULT '🍃',
  supplier TEXT,
  stock TEXT DEFAULT 'in' CHECK (stock IN ('in','low','out')),
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHÁS E INFUSÕES (gerenciáveis pelo admin)
CREATE TABLE IF NOT EXISTS public.admin_herbs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latin_name TEXT,
  icon TEXT DEFAULT '🍃',
  category TEXT NOT NULL,
  linha TEXT CHECK (linha IN ('Essencial','Global','Funcional')),
  tagline TEXT,
  img TEXT,
  effects TEXT,
  detail TEXT,
  safe_for TEXT[] DEFAULT '{}',
  avoid_for TEXT[] DEFAULT '{}',
  temp TEXT,
  brew_time TEXT,
  dose TEXT,
  frequency TEXT,
  tags TEXT[] DEFAULT '{}',
  momento TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migração idempotente para instâncias já existentes
ALTER TABLE public.admin_herbs
  ADD COLUMN IF NOT EXISTS linha TEXT,
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS img TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_herbs_linha_check'
  ) THEN
    ALTER TABLE public.admin_herbs
      ADD CONSTRAINT admin_herbs_linha_check
      CHECK (linha IS NULL OR linha IN ('Essencial','Global','Funcional'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_admin_herbs_linha ON public.admin_herbs(linha);

-- 5. RLS — somente admins podem gerenciar
ALTER TABLE public.admin_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_herbs ENABLE ROW LEVEL SECURITY;

-- Leitura pública (todos podem ver conteúdo publicado)
CREATE POLICY "news_public_read" ON public.admin_news FOR SELECT USING (published = TRUE);
CREATE POLICY "products_public_read" ON public.admin_products FOR SELECT USING (active = TRUE);
CREATE POLICY "herbs_public_read" ON public.admin_herbs FOR SELECT USING (active = TRUE);

-- Admin: acesso total
CREATE POLICY "news_admin_all" ON public.admin_news FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "products_admin_all" ON public.admin_products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "herbs_admin_all" ON public.admin_herbs FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Admin: pode ver todos os perfis e deletar usuários
CREATE POLICY "profiles_admin_read" ON public.user_profiles FOR SELECT
  USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "profiles_admin_delete" ON public.user_profiles FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Triggers de updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_news_updated ON public.admin_news;
CREATE TRIGGER trg_news_updated BEFORE UPDATE ON public.admin_news FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_products_updated ON public.admin_products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.admin_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_herbs_updated ON public.admin_herbs;
CREATE TRIGGER trg_herbs_updated BEFORE UPDATE ON public.admin_herbs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- IMPORTANTE: Defina seu usuário como admin executando:
-- UPDATE public.user_profiles SET is_admin = TRUE WHERE email = 'SEU_EMAIL_AQUI';
