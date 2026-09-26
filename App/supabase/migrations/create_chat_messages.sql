-- ============================================================
-- chat_messages — chat cliente <-> conductor por booking
-- Ajustado a bookings con: id, customer, driver, customer_id, driver_id (uuid)
-- Participante: auth.uid() OR users.id ligado por users.auth_id
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid null references auth.users(id) on delete set null,
  sender_role text not null check (sender_role in ('customer', 'driver', 'admin')),
  sender_name text null,
  message text not null check (char_length(trim(message)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_booking_id_created_at_idx
  on public.chat_messages (booking_id, created_at asc);

alter table public.chat_messages enable row level security;

-- Quitar policies viejas si existen (para poder recrear)
drop policy if exists "chat_messages_select_participants" on public.chat_messages;
drop policy if exists "chat_messages_insert_participants" on public.chat_messages;

-- SELECT: auth.uid() directo O users.id donde auth_id = auth.uid()
create policy "chat_messages_select_participants"
  on public.chat_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      where b.id = chat_messages.booking_id
        and (
          auth.uid() in (b.customer, b.driver, b.customer_id, b.driver_id)
          or exists (
            select 1
            from public.users u
            where u.auth_id = auth.uid()
              and u.id in (b.customer, b.driver, b.customer_id, b.driver_id)
          )
        )
    )
  );

-- INSERT: mismo check de participante + sender_id válido
create policy "chat_messages_insert_participants"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    (
      sender_id is null
      or sender_id = auth.uid()
      or exists (
        select 1
        from public.users u
        where u.auth_id = auth.uid()
          and u.id = sender_id
      )
    )
    and exists (
      select 1
      from public.bookings b
      where b.id = chat_messages.booking_id
        and (
          auth.uid() in (b.customer, b.driver, b.customer_id, b.driver_id)
          or exists (
            select 1
            from public.users u
            where u.auth_id = auth.uid()
              and u.id in (b.customer, b.driver, b.customer_id, b.driver_id)
          )
        )
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;
