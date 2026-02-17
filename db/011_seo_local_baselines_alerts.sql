-- Phase 13: SEO local baselines, alerts and provider traceability
-- Run this script in Supabase SQL Editor.

alter table public.seo_local_runs
  add column if not exists provider text not null default 'nominatim';

create table if not exists public.seo_local_keyword_baselines (
  id bigserial primary key,
  run_id uuid not null references public.seo_local_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  target_position integer,
  target_detected boolean not null default false,
  competitor_best_position integer,
  competitors_detected integer not null default 0,
  top_position integer,
  top_place_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_seo_local_baselines_user_run
  on public.seo_local_keyword_baselines(user_id, run_id);

create index if not exists idx_seo_local_baselines_user_keyword_created
  on public.seo_local_keyword_baselines(user_id, keyword, created_at desc);

create table if not exists public.seo_local_position_alerts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null references public.seo_local_runs(id) on delete cascade,
  keyword text not null,
  previous_position integer not null check (previous_position > 0),
  current_position integer not null check (current_position > 0),
  delta integer not null check (delta > 0),
  severity text not null check (severity in ('medium', 'high')),
  created_at timestamptz not null default now()
);

create index if not exists idx_seo_local_alerts_user_created
  on public.seo_local_position_alerts(user_id, created_at desc);

create index if not exists idx_seo_local_alerts_user_keyword
  on public.seo_local_position_alerts(user_id, keyword, created_at desc);

alter table public.seo_local_keyword_baselines enable row level security;
alter table public.seo_local_position_alerts enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_local_keyword_baselines'
      and policyname = 'seo_local_keyword_baselines_select_own'
  ) then
    create policy seo_local_keyword_baselines_select_own
      on public.seo_local_keyword_baselines
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_local_position_alerts'
      and policyname = 'seo_local_position_alerts_select_own'
  ) then
    create policy seo_local_position_alerts_select_own
      on public.seo_local_position_alerts
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;
