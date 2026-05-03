-- ═══════════════════════════════════════════════════════════════
-- Caminho do Chazeiro — Gamification / Badges
-- ═══════════════════════════════════════════════════════════════

-- Tabela de badges conquistados por usuário
create table if not exists public.user_badges (
  user_id   uuid    not null references auth.users(id) on delete cascade,
  badge_id  text    not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "user_badges_own_read" on public.user_badges
  for select using (auth.uid() = user_id);

create policy "user_badges_own_insert" on public.user_badges
  for insert with check (auth.uid() = user_id);

create policy "user_badges_own_delete" on public.user_badges
  for delete using (auth.uid() = user_id);

-- Índice para busca por usuário
create index if not exists user_badges_user_idx on public.user_badges(user_id);

-- Comentários
comment on table public.user_badges is 'Badges conquistados no Caminho do Chazeiro';
comment on column public.user_badges.badge_id is 'Identificador do badge (definido em js/caminho.js)';
