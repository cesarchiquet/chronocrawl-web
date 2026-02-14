-- Phase 8: lightweight monitoring run logs for product observability
-- Run this script in Supabase SQL Editor.

create table if not exists public.monitor_run_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (
    status in (
      'completed',
      'no_urls',
      'idle_queue',
      'inactive_subscription',
      'rate_limited',
      'failed_internal'
    )
  ),
  checked integer not null default 0 check (checked >= 0),
  changes integer not null default 0 check (changes >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  queued_remaining integer not null default 0 check (queued_remaining >= 0),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_monitor_run_logs_user_started_at
  on public.monitor_run_logs(user_id, started_at desc);

alter table public.monitor_run_logs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'monitor_run_logs'
      and policyname = 'monitor_run_logs_select_own'
  ) then
    create policy monitor_run_logs_select_own
      on public.monitor_run_logs
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;
