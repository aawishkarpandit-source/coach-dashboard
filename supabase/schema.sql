-- Coach Dashboard — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor (once per project).
-- Tables mirror the local data so ANY installed computer sees the same
-- students, marks and book catalogue. Presentations stay LOCAL (by design).

-- ---------- students ----------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class text not null,
  roll int not null,
  name text not null,
  updated_at timestamptz not null default now(),
  unique (class, roll)
);

-- ---------- marks (one row per student × subject) ----------
create table if not exists public.marks (
  id uuid primary key default gen_random_uuid(),
  class text not null,
  roll int not null,
  subject text not null,
  score int not null default 0 check (score >= 0 and score <= 100),
  updated_at timestamptz not null default now(),
  unique (class, roll, subject)
);

-- ---------- book catalogue (files live in Storage bucket "books") ----------
create table if not exists public.book_meta (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_ne text default '',
  class text not null default 'all',
  type text not null default 'govt' check (type in ('govt','pvt')),
  file_path text not null,
  updated_at timestamptz not null default now(),
  unique (file_path)
);

-- ---------- storage bucket for PDFs ----------
insert into storage.buckets (id, name, public)
values ('books', 'books', true)
on conflict (id) do nothing;

-- ---------- simple open policies (classroom use) ----------
-- Tighten these if the project is public-facing.
alter table public.students enable row level security;
alter table public.marks enable row level security;
alter table public.book_meta enable row level security;

drop policy if exists "open all students" on public.students;
create policy "open all students" on public.students
  for all using (true) with check (true);

drop policy if exists "open all marks" on public.marks;
create policy "open all marks" on public.marks
  for all using (true) with check (true);

drop policy if exists "open all book_meta" on public.book_meta;
create policy "open all book_meta" on public.book_meta
  for all using (true) with check (true);

drop policy if exists "open books storage" on storage.objects;
create policy "open books storage" on storage.objects
  for all using (bucket_id = 'books') with check (bucket_id = 'books');
