-- Phase 8: monitor rules + confidence/grouping columns for detected changes

create table if not exists public.monitor_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monitored_url_id uuid not null references public.monitored_urls(id) on delete cascade,
  rule_type text not null check (rule_type in ('css', 'text_pattern', 'attribute')),
  selector text not null,
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_monitor_rules_user_id
  on public.monitor_rules(user_id);

create index if not exists idx_monitor_rules_monitored_url_id
  on public.monitor_rules(monitored_url_id);

alter table public.detected_changes
  add column if not exists confidence_score integer not null default 50,
  add column if not exists noise_flags jsonb not null default '[]'::jsonb,
  add column if not exists change_group_id uuid,
  add column if not exists is_group_root boolean not null default false;

create index if not exists idx_detected_changes_monitored_url_id_detected_at_v2
  on public.detected_changes(monitored_url_id, detected_at desc);

create index if not exists idx_detected_changes_change_group_id
  on public.detected_changes(change_group_id);

create index if not exists idx_detected_changes_confidence_score
  on public.detected_changes(confidence_score desc);

alter table public.monitor_rules enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'monitor_rules'
      and policyname = 'monitor_rules_select_own'
  ) then
    create policy monitor_rules_select_own
      on public.monitor_rules
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'monitor_rules'
      and policyname = 'monitor_rules_insert_own'
  ) then
    create policy monitor_rules_insert_own
      on public.monitor_rules
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'monitor_rules'
      and policyname = 'monitor_rules_update_own'
  ) then
    create policy monitor_rules_update_own
      on public.monitor_rules
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'monitor_rules'
      and policyname = 'monitor_rules_delete_own'
  ) then
    create policy monitor_rules_delete_own
      on public.monitor_rules
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;
