-- Add fields to admin_products
ALTER TABLE public.admin_products ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;
ALTER TABLE public.admin_products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.admin_products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.admin_suppliers(id) ON DELETE SET NULL;

-- Add fields to admin_suppliers
ALTER TABLE public.admin_suppliers ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.admin_suppliers ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Link existing products to suppliers by name match
UPDATE public.admin_products p
SET supplier_id = s.id
FROM public.admin_suppliers s
WHERE p.supplier = s.name AND p.supplier_id IS NULL;

-- Create Supabase Storage bucket for product images (run separately in Storage dashboard if needed)
-- Bucket name: product-images, public: true
