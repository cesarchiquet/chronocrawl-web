-- Phase 11: SEO local engine runs + results
-- Run this script in Supabase SQL Editor.

create table if not exists public.seo_local_runs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  city text not null,
  area_km integer not null check (area_km in (5, 10, 25, 50)),
  status text not null check (status in ('completed', 'failed')),
  keywords_count integer not null default 0,
  results_count integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text
);

create index if not exists idx_seo_local_runs_user_started_at
  on public.seo_local_runs(user_id, started_at desc);

create table if not exists public.seo_local_results (
  id bigserial primary key,
  run_id uuid not null references public.seo_local_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  place_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  distance_km numeric(8,2) not null,
  source_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_seo_local_results_run_keyword
  on public.seo_local_results(run_id, keyword);

alter table public.seo_local_runs enable row level security;
alter table public.seo_local_results enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_local_runs'
      and policyname = 'seo_local_runs_select_own'
  ) then
    create policy seo_local_runs_select_own
      on public.seo_local_runs
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_local_results'
      and policyname = 'seo_local_results_select_own'
  ) then
    create policy seo_local_results_select_own
      on public.seo_local_results
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;
