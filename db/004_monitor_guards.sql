-- Phase 6: monitoring guardrails (cooldown + daily quota counters)
-- Run this script in Supabase SQL Editor.

create table if not exists public.user_monitor_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  run_count integer not null default 0 check (run_count >= 0),
  last_run_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_monitor_usage enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_monitor_usage'
      and policyname = 'user_monitor_usage_select_own'
  ) then
    create policy user_monitor_usage_select_own
      on public.user_monitor_usage
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;
