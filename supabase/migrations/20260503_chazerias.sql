-- Guia Global de Chazerias — Ervatório
-- Rodar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.chazerias (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  address       TEXT,
  city          TEXT NOT NULL,
  country       TEXT NOT NULL,
  continent     TEXT DEFAULT 'América do Sul',
  lat           NUMERIC(10,7),
  lng           NUMERIC(10,7),
  type          TEXT DEFAULT 'chazeria',   -- chazeria | ervateiro | mercado | spa | restaurante | hotel | outro
  description   TEXT,
  quote         TEXT,
  quote_author  TEXT,
  opening_hours TEXT,
  payment       TEXT,
  style         TEXT,
  website       TEXT,
  phone         TEXT,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chazerias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chazerias_public_read"
  ON public.chazerias FOR SELECT USING (active = true);

CREATE POLICY "chazerias_admin_all"
  ON public.chazerias FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Exemplo de inserção para testar:
-- INSERT INTO public.chazerias (name, address, city, country, continent, lat, lng, type, description, quote, quote_author, opening_hours, payment, style)
-- VALUES (
--   'Ateliê do Chá', 'R. Oscar Freire, 540', 'São Paulo', 'Brasil', 'América do Sul',
--   -23.5616, -46.6674, 'chazeria',
--   'Espaço íntimo de curadoria botânica com mais de 80 blends autorais.',
--   'O lugar onde o chá vira arte.', 'Revista VEJA SP',
--   'Ter–Sex 10h–19h / Sáb 10h–18h', 'Cartão e PIX', 'Chá + pequenos-almoços'
-- );
