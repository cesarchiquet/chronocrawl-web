-- Phase 1: data model for multi-signal web surveillance
-- Run this script in Supabase SQL Editor.

-- 1) Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'change_domain') then
    create type public.change_domain as enum ('content', 'seo', 'pricing', 'cta');
  end if;

  if not exists (select 1 from pg_type where typname = 'change_severity') then
    create type public.change_severity as enum ('low', 'medium', 'high');
  end if;
end
$$;

-- 2) Snapshots table: one extracted snapshot per URL check
create table if not exists public.url_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monitored_url_id uuid not null references public.monitored_urls(id) on delete cascade,
  fetched_at timestamptz not null default now(),
  status_code integer,
  page_hash text,
  title text,
  meta_description text,
  h1 text,
  canonical_url text,
  robots_directive text,
  pricing_json jsonb not null default '{}'::jsonb,
  cta_json jsonb not null default '[]'::jsonb,
  content_fingerprint text,
  raw_extract jsonb not null default '{}'::jsonb
);

create index if not exists idx_url_snapshots_user_id
  on public.url_snapshots(user_id);

create index if not exists idx_url_snapshots_monitored_url_id_fetched_at
  on public.url_snapshots(monitored_url_id, fetched_at desc);

-- 3) Detected changes table: normalized event log for timeline and alerts
create table if not exists public.detected_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monitored_url_id uuid not null references public.monitored_urls(id) on delete cascade,
  snapshot_before_id uuid references public.url_snapshots(id) on delete set null,
  snapshot_after_id uuid references public.url_snapshots(id) on delete set null,
  domain public.change_domain not null,
  field_key text not null,
  before_value text,
  after_value text,
  severity public.change_severity not null default 'medium',
  detected_at timestamptz not null default now(),
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_detected_changes_user_id_detected_at
  on public.detected_changes(user_id, detected_at desc);

create index if not exists idx_detected_changes_monitored_url_id_detected_at
  on public.detected_changes(monitored_url_id, detected_at desc);

create index if not exists idx_detected_changes_domain
  on public.detected_changes(domain);

-- 4) Optional compatibility view for current dashboard/event queries
create or replace view public.change_events_v2 as
select
  dc.id,
  dc.monitored_url_id as url_id,
  concat(
    '[',
    upper(dc.domain::text),
    '] ',
    dc.field_key,
    ' changed'
  ) as summary,
  dc.detected_at
from public.detected_changes dc;

-- 5) RLS
alter table public.url_snapshots enable row level security;
alter table public.detected_changes enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'url_snapshots'
      and policyname = 'url_snapshots_select_own'
  ) then
    create policy url_snapshots_select_own
      on public.url_snapshots
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'url_snapshots'
      and policyname = 'url_snapshots_insert_own'
  ) then
    create policy url_snapshots_insert_own
      on public.url_snapshots
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'url_snapshots'
      and policyname = 'url_snapshots_update_own'
  ) then
    create policy url_snapshots_update_own
      on public.url_snapshots
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'url_snapshots'
      and policyname = 'url_snapshots_delete_own'
  ) then
    create policy url_snapshots_delete_own
      on public.url_snapshots
      for delete
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'detected_changes'
      and policyname = 'detected_changes_select_own'
  ) then
    create policy detected_changes_select_own
      on public.detected_changes
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'detected_changes'
      and policyname = 'detected_changes_insert_own'
  ) then
    create policy detected_changes_insert_own
      on public.detected_changes
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'detected_changes'
      and policyname = 'detected_changes_update_own'
  ) then
    create policy detected_changes_update_own
      on public.detected_changes
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'detected_changes'
      and policyname = 'detected_changes_delete_own'
  ) then
    create policy detected_changes_delete_own
      on public.detected_changes
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;

