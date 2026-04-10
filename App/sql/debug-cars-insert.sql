-- Debug SQL for vehicle insert failures on public.cars
-- Run sections one by one in Supabase SQL Editor.

-- =====================================================
-- 1) Quick diagnostics: table, RLS, policies
-- =====================================================
select
  n.nspname as schema,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'cars';

select
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'cars'
order by policyname;

-- Optional: see table columns and nullability
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'cars'
order by ordinal_position;


-- =====================================================
-- 2) Create a controlled test driver in users (if needed)
-- Replace AUTH_USER_ID with a real auth.users.id UUID.
-- =====================================================
-- Example:
-- select id, email from auth.users order by created_at desc limit 20;

-- Quick helper: pick candidate drivers from users
select
  u.id,
  u.auth_id,
  u.email,
  u.user_type,
  u.approved,
  u.blocked
from public.users u
where u.user_type in ('driver', 'admin')
order by u.created_at desc
limit 20;

-- insert into public.users (auth_id, email, first_name, last_name, user_type, approved)
-- values (
--   'AUTH_USER_ID',
--   'driver-test@example.com',
--   'Driver',
--   'Test',
--   'driver',
--   true
-- )
-- on conflict (auth_id) do update
-- set email = excluded.email,
--     user_type = excluded.user_type,
--     approved = excluded.approved
-- returning id, auth_id, user_type, approved;


-- =====================================================
-- 3) Minimal insert test (requires valid driver_id)
-- Replace DRIVER_ID with users.id from previous step.
-- =====================================================
insert into public.cars (
  driver_id,
  make,
  model,
  plate,
  color,
  fuel_type,
  transmission,
  capacity,
  is_active,
  vehicle_number,
  vehicle_model,
  vehicle_make,
  vehicle_color,
  features
)
values (
  'DRIVER_ID',
  'Kia',
  'Picanto',
  'ABC123',
  'Blanco',
  'Gasolina',
  'MECANICO',
  4,
  true,
  'ABC123',
  'Picanto',
  'Kia',
  'Blanco',
  '{"source":"sql_debug"}'::jsonb
)
returning id, driver_id, make, model, plate, created_at;

-- Alternative insert without manual DRIVER_ID replacement.
-- This picks the most recent approved driver.
insert into public.cars (
  driver_id,
  make,
  model,
  plate,
  color,
  fuel_type,
  transmission,
  capacity,
  is_active,
  vehicle_number,
  vehicle_model,
  vehicle_make,
  vehicle_color,
  features
)
select
  u.id,
  'Chevrolet',
  'Onix',
  ('DBG' || lpad((floor(random() * 999))::text, 3, '0')),
  'Negro',
  'Gasolina',
  'MECANICO',
  4,
  true,
  'DBG-AUTO',
  'Onix',
  'Chevrolet',
  'Negro',
  '{"source":"sql_debug_auto"}'::jsonb
from public.users u
where u.user_type = 'driver'
  and u.approved = true
  and coalesce(u.blocked, false) = false
order by u.created_at desc
limit 1
returning id, driver_id, make, model, plate, created_at;


-- =====================================================
-- 4) Temporary permissive policy for debug only
-- Use ONLY in non-production or controlled tests.
-- =====================================================
-- begin;
--
-- drop policy if exists "debug_cars_insert_all" on public.cars;
-- create policy "debug_cars_insert_all"
--   on public.cars
--   for insert
--   to authenticated
--   with check (true);
--
-- -- Re-test insert from app, then remove policy:
-- drop policy if exists "debug_cars_insert_all" on public.cars;
--
-- commit;


-- =====================================================
-- 5) Safer real policy idea (driver must match logged user)
-- =====================================================
-- NOTE: This assumes users.auth_id links to auth.uid() and cars.driver_id links to users.id.
-- Run after validating your current schema and constraints.

-- drop policy if exists "cars_insert_authenticated_driver" on public.cars;
-- create policy "cars_insert_authenticated_driver"
--   on public.cars
--   for insert
--   to authenticated
--   with check (
--     exists (
--       select 1
--       from public.users u
--       where u.id = cars.driver_id
--         and u.auth_id = auth.uid()
--     )
--   );


-- =====================================================
-- 6) Check latest inserted vehicles
-- =====================================================
select
  id,
  driver_id,
  make,
  model,
  plate,
  created_at
from public.cars
order by created_at desc
limit 20;


-- =====================================================
-- 7) Verify driver row used in insert (replace DRIVER_ID)
-- =====================================================
-- If you don't replace DRIVER_ID, this query returns 0 rows without error.
select
  u.id,
  u.auth_id,
  u.user_type,
  u.approved,
  u.blocked,
  u.email
from public.users u
where u.id = nullif('DRIVER_ID', 'DRIVER_ID')::uuid;
