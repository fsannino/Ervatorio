-- ============================================================
-- ERVARIA — Fichas Editoriais (conteúdo rico das ervas)
-- Data: 2026-04-20
-- ============================================================
-- Tabela versionada para fichas editoriais (schema v1.1).
-- Uma linha por (slug, schema_version). Permite coexistência
-- de versões e histórico editorial.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_herb_fichas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  herb_id UUID REFERENCES public.admin_herbs(id) ON DELETE SET NULL,
  herb_latin_name TEXT,
  schema_version TEXT NOT NULL DEFAULT '1.1',
  ficha JSONB NOT NULL,
  status TEXT DEFAULT 'published'
    CHECK (status IN ('draft','in_review','published','archived')),
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slug, schema_version)
);

CREATE INDEX IF NOT EXISTS idx_herb_fichas_slug   ON public.admin_herb_fichas(slug);
CREATE INDEX IF NOT EXISTS idx_herb_fichas_latin  ON public.admin_herb_fichas(herb_latin_name);
CREATE INDEX IF NOT EXISTS idx_herb_fichas_herb   ON public.admin_herb_fichas(herb_id);
CREATE INDEX IF NOT EXISTS idx_herb_fichas_status ON public.admin_herb_fichas(status)
  WHERE active = TRUE;

ALTER TABLE public.admin_herb_fichas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fichas_public_read" ON public.admin_herb_fichas;
CREATE POLICY "fichas_public_read" ON public.admin_herb_fichas FOR SELECT
  USING (active = TRUE AND status = 'published');

DROP POLICY IF EXISTS "fichas_admin_all" ON public.admin_herb_fichas;
CREATE POLICY "fichas_admin_all" ON public.admin_herb_fichas FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  ));

DROP TRIGGER IF EXISTS trg_herb_fichas_updated ON public.admin_herb_fichas;
CREATE TRIGGER trg_herb_fichas_updated BEFORE UPDATE ON public.admin_herb_fichas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger para religar herb_id quando houver match por latin_name
-- (roda no insert/update; NULL se não encontrar — fica só o latin_name como referência).
CREATE OR REPLACE FUNCTION public.link_ficha_to_herb()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.herb_id IS NULL AND NEW.herb_latin_name IS NOT NULL THEN
    SELECT id INTO NEW.herb_id
    FROM public.admin_herbs
    WHERE latin_name ILIKE NEW.herb_latin_name || '%'
       OR NEW.herb_latin_name ILIKE latin_name || '%'
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_herb_fichas_link ON public.admin_herb_fichas;
CREATE TRIGGER trg_herb_fichas_link BEFORE INSERT OR UPDATE ON public.admin_herb_fichas
  FOR EACH ROW EXECUTE FUNCTION public.link_ficha_to_herb();

-- ============================================================
-- Erva-Mate (ausente em admin_herbs) — inserida aqui para
-- poder casar com a ficha "erva-mate" assim que ela for importada.
-- ============================================================
INSERT INTO public.admin_herbs (
  name, latin_name, icon, category, linha, tagline,
  effects, detail, safe_for, avoid_for,
  temp, brew_time, dose, frequency, tags, momento
)
SELECT
  'Erva-Mate','Ilex paraguariensis','🧉','Estimulante','Essencial',
  'Chimarrão, tererê e chá-mate — estímulo brasileiro por excelência',
  'Estimulante, antioxidante, termogênico, diurético',
  'Xantinas (cafeína + teobromina) e polifenóis. Ritual comunitário do Sul. Evitar muito quente (IARC 2A).',
  ARRAY['hipertensos (moderado)']::TEXT[],
  ARRAY['gestantes','insônia','crianças','após 16h']::TEXT[],
  '70°C','4 min','1 col. sopa / 200ml','manhã-tarde',
  ARRAY['energia','foco','termogênico','antioxidante','tradição']::TEXT[],
  ARRAY['manha','tarde']::TEXT[]
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_herbs WHERE latin_name ILIKE 'Ilex paraguariensis%'
);
