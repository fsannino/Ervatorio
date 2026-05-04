-- ═══════════════════════════════════════════════════════════════
-- Fichas âncora editoriais — Schema v1.1
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.admin_herb_fichas (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null,
  herb_latin_name text,
  schema_version  text not null default '1.1',
  ficha           jsonb not null,
  status          text not null default 'published' check (status in ('draft','published','archived')),
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (slug, schema_version)
);

comment on table public.admin_herb_fichas is 'Fichas editoriais completas de ervas no formato Schema v1.1';
comment on column public.admin_herb_fichas.slug is 'Identificador único da erva (ex: guarana, erva-mate)';
comment on column public.admin_herb_fichas.ficha is 'Ficha completa no Schema v1.1 (JSONB)';

-- Índices para buscas frequentes
create index if not exists admin_herb_fichas_slug_idx    on public.admin_herb_fichas(slug);
create index if not exists admin_herb_fichas_latin_idx   on public.admin_herb_fichas(herb_latin_name);
create index if not exists admin_herb_fichas_active_idx  on public.admin_herb_fichas(active) where active = true;
create index if not exists admin_herb_fichas_ficha_gin   on public.admin_herb_fichas using gin(ficha);

-- Atualiza updated_at automaticamente
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_updated_at on public.admin_herb_fichas;
create trigger set_updated_at
  before update on public.admin_herb_fichas
  for each row execute function public.touch_updated_at();

-- RLS: leitura pública, escrita restrita a admins
alter table public.admin_herb_fichas enable row level security;

drop policy if exists "fichas_public_read" on public.admin_herb_fichas;
create policy "fichas_public_read"
  on public.admin_herb_fichas for select
  using (active = true and status = 'published');

drop policy if exists "fichas_admin_all" on public.admin_herb_fichas;
create policy "fichas_admin_all"
  on public.admin_herb_fichas for all
  using (auth.role() = 'service_role');
