-- Phase 7: internal queue for monitor runs (batch processing, anti-timeout)
-- Run this script in Supabase SQL Editor.

create table if not exists public.monitor_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  monitored_url_id uuid not null references public.monitored_urls(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'done', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, monitored_url_id)
);

create index if not exists idx_monitor_jobs_user_status
  on public.monitor_jobs(user_id, status, scheduled_at);

alter table public.monitor_jobs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'monitor_jobs'
      and policyname = 'monitor_jobs_select_own'
  ) then
    create policy monitor_jobs_select_own
      on public.monitor_jobs
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;

