-- ═══════════════════════════════════════════════════════════════
-- Ervas: localidade, formas de uso e restrições por país
-- ═══════════════════════════════════════════════════════════════

-- Bioma / região de origem (Amazônia, Cerrado, Europa, Ásia, etc.)
alter table public.admin_herbs
  add column if not exists bioma text;

-- Formas de uso: chá, medicinal, culinária, aromaterapia, coquetel, cosméticos, suplemento, energético
alter table public.admin_herbs
  add column if not exists usos text[];

-- Restrições regulatórias por país / organismo (ex.: proibições, alertas)
alter table public.admin_herbs
  add column if not exists restricoes_pais text[];

-- Comentários
comment on column public.admin_herbs.bioma is 'Bioma ou região de origem da erva (Amazônia, Cerrado, Europa, Ásia, etc.)';
comment on column public.admin_herbs.usos is 'Formas de uso principais: chá, medicinal, culinária, aromaterapia, coquetel, cosméticos, suplemento, energético';
comment on column public.admin_herbs.restricoes_pais is 'Restrições regulatórias por país ou organismo (proibições, alertas de segurança, uso restrito)';

-- Índice para buscas por bioma
create index if not exists admin_herbs_bioma_idx on public.admin_herbs(bioma);
