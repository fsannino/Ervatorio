-- Onda 6.4 (frete): peso do produto para cotação de frete.
-- admin_products não tinha peso; sem ele nenhuma transportadora coteia.
-- Default 100g (editável pelo admin no painel, por produto).
-- Idempotente: pode rodar mais de uma vez sem erro.

ALTER TABLE public.admin_products
  ADD COLUMN IF NOT EXISTS weight_grams INTEGER NOT NULL DEFAULT 100;

-- Sanidade: peso positivo e teto de 100kg (evita valor absurdo que quebra a cotação).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_products_weight_grams_check'
  ) THEN
    ALTER TABLE public.admin_products
      ADD CONSTRAINT admin_products_weight_grams_check
      CHECK (weight_grams > 0 AND weight_grams <= 100000);
  END IF;
END $$;

COMMENT ON COLUMN public.admin_products.weight_grams IS
  'Peso unitário em gramas usado para cotar frete (Onda 6.4). Default 100g; admin ajusta por produto.';
