-- Phase 10: SEO local setup profile (functional configuration)
-- Run this script in Supabase SQL Editor.

create table if not exists public.seo_local_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  city text,
  area text,
  keywords text[] not null default '{}',
  competitors text[] not null default '{}',
  priority_pages text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists idx_seo_local_profiles_updated_at
  on public.seo_local_profiles(updated_at desc);

alter table public.seo_local_profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_local_profiles'
      and policyname = 'seo_local_profiles_select_own'
  ) then
    create policy seo_local_profiles_select_own
      on public.seo_local_profiles
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_local_profiles'
      and policyname = 'seo_local_profiles_insert_own'
  ) then
    create policy seo_local_profiles_insert_own
      on public.seo_local_profiles
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_local_profiles'
      and policyname = 'seo_local_profiles_update_own'
  ) then
    create policy seo_local_profiles_update_own
      on public.seo_local_profiles
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;
