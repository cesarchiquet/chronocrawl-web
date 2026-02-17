-- Phase 16: SEO local engine hardening (provider quality + logs + partial status)
-- Run this script in Supabase SQL Editor.

alter table public.seo_local_runs
  add column if not exists provider_requested text,
  add column if not exists provider_fallback_used boolean not null default false,
  add column if not exists keywords_with_results integer not null default 0,
  add column if not exists candidates_count integer not null default 0,
  add column if not exists execution_ms integer;

alter table public.seo_local_runs
  drop constraint if exists seo_local_runs_status_check;

alter table public.seo_local_runs
  add constraint seo_local_runs_status_check
  check (status in ('completed', 'partial', 'failed'));

alter table public.seo_local_runs
  drop constraint if exists seo_local_runs_provider_requested_check;

alter table public.seo_local_runs
  add constraint seo_local_runs_provider_requested_check
  check (
    provider_requested is null
    or provider_requested in ('google_places', 'nominatim')
  );

create table if not exists public.seo_local_engine_logs (
  id bigserial primary key,
  run_id uuid not null references public.seo_local_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  requested_provider text not null check (requested_provider in ('google_places', 'nominatim')),
  used_provider text not null check (used_provider in ('google_places', 'nominatim')),
  used_fallback boolean not null default false,
  candidates_found integer not null default 0,
  results_kept integer not null default 0,
  status text not null check (status in ('ok', 'empty')),
  latency_ms integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_seo_local_engine_logs_user_created
  on public.seo_local_engine_logs(user_id, created_at desc);

create index if not exists idx_seo_local_engine_logs_run_keyword
  on public.seo_local_engine_logs(run_id, keyword);

alter table public.seo_local_engine_logs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_local_engine_logs'
      and policyname = 'seo_local_engine_logs_select_own'
  ) then
    create policy seo_local_engine_logs_select_own
      on public.seo_local_engine_logs
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;
