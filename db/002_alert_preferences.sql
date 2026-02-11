-- Phase 4: alert center preferences + daily digest bookkeeping
-- Run this script in Supabase SQL Editor.

-- 1) Per-user alert preferences
create table if not exists public.user_alert_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_mode text not null default 'instant' check (email_mode in ('instant', 'daily', 'off')),
  min_email_severity public.change_severity not null default 'high',
  digest_hour smallint not null default 8 check (digest_hour between 0 and 23),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_alert_settings_email_mode
  on public.user_alert_settings(email_mode);

alter table public.user_alert_settings enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_alert_settings'
      and policyname = 'user_alert_settings_select_own'
  ) then
    create policy user_alert_settings_select_own
      on public.user_alert_settings
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_alert_settings'
      and policyname = 'user_alert_settings_insert_own'
  ) then
    create policy user_alert_settings_insert_own
      on public.user_alert_settings
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_alert_settings'
      and policyname = 'user_alert_settings_update_own'
  ) then
    create policy user_alert_settings_update_own
      on public.user_alert_settings
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- 2) Digest tracking on change events
alter table public.detected_changes
  add column if not exists digest_sent_at timestamptz;

create index if not exists idx_detected_changes_user_id_digest_sent_at
  on public.detected_changes(user_id, digest_sent_at);

