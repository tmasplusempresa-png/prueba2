-- Approve specific driver user by email
-- Target: andresfelipecristancho2014@gmail.com
-- Run in Supabase SQL Editor.

begin;

-- 1) Preview current state
select
  id,
  auth_id,
  email,
  user_type,
  approved,
  blocked,
  updated_at
from public.users
where lower(email) = lower('andresfelipecristancho2014@gmail.com');

-- 2) Approve and unblock (if blocked)
update public.users
set
  approved = true,
  blocked = false,
  updated_at = now()
where lower(email) = lower('andresfelipecristancho2014@gmail.com')
returning
  id,
  auth_id,
  email,
  user_type,
  approved,
  blocked,
  updated_at;

-- 3) Final verification
select
  id,
  auth_id,
  email,
  user_type,
  approved,
  blocked,
  updated_at
from public.users
where lower(email) = lower('andresfelipecristancho2014@gmail.com');

commit;
