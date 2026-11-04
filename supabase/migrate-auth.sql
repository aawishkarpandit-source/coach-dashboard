-- ============================================================
-- Coach Dashboard — account profiles (uuid → name)
-- Run ONCE in Supabase → SQL Editor. Safe to run again.
-- ============================================================
-- Every teacher signs in with an email + password account that YOU create
-- in Supabase (Dashboard → Authentication → Add user → "Auto Confirm User").
-- This table stores the display name shown as "Hello, {name}" on the
-- teacher's screen. After creating an account, set the real name here:
--
--     update public.coach_users set name = 'Sita Sharma'
--     where id = (select id from auth.users where email = 'sita@school.com');
-- ============================================================

-- 1) Profile table
create table if not exists public.coach_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coach_users enable row level security;

-- 2) A signed-in teacher may read/update only their own profile
drop policy if exists "coach_users select own" on public.coach_users;
create policy "coach_users select own" on public.coach_users
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists "coach_users update own" on public.coach_users;
create policy "coach_users update own" on public.coach_users
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3) Auto-create a profile row whenever a new account appears
--    (name starts as the part before the @; rename it any time)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.coach_users (id, name)
  values (
    new.id,
    coalesce(nullif(trim(split_part(new.email, '@', 1)), ''), 'Teacher')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Backfill profiles for accounts that already exist
insert into public.coach_users (id, name)
select id, coalesce(nullif(trim(split_part(email, '@', 1)), ''), 'Teacher')
from auth.users
on conflict (id) do nothing;
