-- ============================================================
-- Teste da trilha de auditoria (20260802030000_admin_audit_log.sql)
-- ============================================================
-- Roda num Postgres descartável, sem tocar em Supabase nenhum. O
-- arquivo monta um arremedo do ambiente (auth.uid(), is_admin(), as
-- tabelas) e exercita o comportamento que a migration promete.
--
-- Como rodar (Postgres 16 local):
--
--   initdb -D /tmp/pgaudit -U postgres --auth=trust
--   pg_ctl -D /tmp/pgaudit -o "-p 5433 -k /tmp" start
--   psql -h /tmp -p 5433 -U postgres -v ON_ERROR_STOP=1 \
--        -f supabase/tests/20260802_admin_audit_log_test.sql
--
-- Saída esperada: os sete blocos abaixo, com os valores indicados em
-- cada `\echo`. Qualquer divergência é regressão.
-- ============================================================

\set ON_ERROR_STOP on

-- ------------------------------------------------------------
-- Arremedo do ambiente Supabase
-- ------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY, email text);

-- No Supabase, auth.uid() vem do JWT. Aqui vem de um GUC.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.actor', true), '')::uuid;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY, display_name text, avatar_url text,
  is_admin boolean DEFAULT false, updated_at timestamptz DEFAULT now());

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT COALESCE(
    (SELECT up.is_admin FROM public.user_profiles up WHERE up.id = auth.uid()),
    false);
$$;

CREATE TABLE IF NOT EXISTS public.admin_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text, price numeric,
  active boolean DEFAULT true, updated_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, status text,
  total_cents int, shipping_address jsonb, notes text, payment_payload jsonb,
  admin_notes text, updated_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.site_settings (id int PRIMARY KEY, payments_enabled boolean);

-- As demais tabelas da lista ficam ausentes de propósito: a migration
-- deve emitir NOTICE e seguir, em vez de abortar.

\ir ../migrations/20260802030000_admin_audit_log.sql

GRANT USAGE ON SCHEMA public TO authenticated, anon;

INSERT INTO auth.users VALUES ('11111111-1111-1111-1111-111111111111','admin@ervatorio.test')
  ON CONFLICT DO NOTHING;
INSERT INTO public.user_profiles(id,display_name,is_admin)
  VALUES ('11111111-1111-1111-1111-111111111111','Fabiano',true) ON CONFLICT DO NOTHING;
SET request.actor = '11111111-1111-1111-1111-111111111111';

\echo ''
\echo '### 1) INSERT gera registro com autor  → INSERT | admin_products | Fabiano | Camomila'
INSERT INTO public.admin_products(name,price) VALUES ('Camomila', 24.90);
SELECT action, table_name, actor_name, after->>'name' AS nome FROM admin_audit_log;

\echo ''
\echo '### 2) UPDATE grava só as colunas alteradas  → {"price": 24.90} / {"price": 29.90}'
UPDATE public.admin_products SET price = 29.90 WHERE name='Camomila';
SELECT before, after FROM admin_audit_log WHERE action='UPDATE';

\echo ''
\echo '### 3) UPDATE só de updated_at não gera ruído  → as duas contagens iguais'
SELECT count(*) AS antes FROM admin_audit_log;
UPDATE public.admin_products SET updated_at = now() WHERE name='Camomila';
SELECT count(*) AS depois FROM admin_audit_log;

\echo ''
\echo '### 4) PII do cliente não entra na trilha  → [redigido] nas três, total visível'
INSERT INTO public.orders(user_id,status,total_cents,shipping_address,notes,payment_payload)
 VALUES ('11111111-1111-1111-1111-111111111111','pending',5000,
  '{"name":"Maria Silva","street":"Rua Real 123","cep":"01310-100"}'::jsonb,
  'entregar apos 18h', '{"payer":{"email":"maria@x.com"}}'::jsonb);
SELECT after->>'shipping_address' AS endereco, after->>'notes' AS notas,
       after->>'payment_payload' AS payload, after->>'total_cents' AS total
  FROM admin_audit_log WHERE table_name='orders';

\echo ''
\echo '### 5) CRÍTICO: anonimização LGPD não ressuscita o endereço  → [redigido]'
-- A Edge Function user-data-rights anonimiza shipping_address com UPDATE.
-- Sem redação, o endereço original ficaria no `before` deste log —
-- desfazendo a exclusão que o titular pediu.
UPDATE public.orders SET shipping_address='{"name":"[excluido a pedido do titular]"}'::jsonb;
SELECT before->>'shipping_address' AS endereco_antigo_no_log
  FROM admin_audit_log WHERE table_name='orders' AND action='UPDATE';

\echo ''
\echo '### 6) Privilégio: perfil comum não polui, is_admin sempre registra  → 0, depois false→true'
INSERT INTO auth.users VALUES ('22222222-2222-2222-2222-222222222222','novo@x.com')
  ON CONFLICT DO NOTHING;
INSERT INTO public.user_profiles(id,display_name,is_admin)
  VALUES ('22222222-2222-2222-2222-222222222222','Novo',false) ON CONFLICT DO NOTHING;
UPDATE public.user_profiles SET display_name='Novo Nome'
  WHERE id='22222222-2222-2222-2222-222222222222';
SELECT count(*) AS deve_ser_0 FROM admin_audit_log WHERE table_name='user_profiles';
UPDATE public.user_profiles SET is_admin=true
  WHERE id='22222222-2222-2222-2222-222222222222';
SELECT before->>'is_admin' AS de, after->>'is_admin' AS para
  FROM admin_audit_log WHERE table_name='user_profiles';

\echo ''
\echo '### 7) DELETE registra o que existia  → DELETE | Camomila'
DELETE FROM public.admin_products WHERE name='Camomila';
SELECT action, before->>'name' AS nome FROM admin_audit_log WHERE action='DELETE';

\echo ''
\echo '### 8) RLS: admin lê, usuário comum não  → >0, depois 0'
UPDATE public.user_profiles SET is_admin=false WHERE id='22222222-2222-2222-2222-222222222222';
SET ROLE authenticated;
SET request.actor = '11111111-1111-1111-1111-111111111111';
SELECT count(*) AS visivel_para_admin FROM public.admin_audit_log;
SET request.actor = '22222222-2222-2222-2222-222222222222';
SELECT count(*) AS visivel_para_comum FROM public.admin_audit_log;
RESET ROLE;

\echo ''
\echo '### 9) Nem admin altera o histórico  → três "permission denied"'
\set ON_ERROR_STOP off
SET ROLE authenticated;
SET request.actor = '11111111-1111-1111-1111-111111111111';
INSERT INTO public.admin_audit_log(action,table_name) VALUES ('INSERT','falso');
UPDATE public.admin_audit_log SET actor_name='outro';
DELETE FROM public.admin_audit_log;
RESET ROLE;
\set ON_ERROR_STOP on

\echo ''
\echo '### Fim. Nove blocos, todos devem bater com o esperado acima.'
