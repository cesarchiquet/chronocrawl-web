-- Phase 5: Stripe source of truth + webhook idempotency
-- Run this script in Supabase SQL Editor.

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'agency')),
  status text not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_user_subscriptions_customer
  on public.user_subscriptions(stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists idx_user_subscriptions_subscription
  on public.user_subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

alter table public.user_subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_subscriptions'
      and policyname = 'user_subscriptions_select_own'
  ) then
    create policy user_subscriptions_select_own
      on public.user_subscriptions
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_subscriptions'
      and policyname = 'user_subscriptions_insert_own'
  ) then
    create policy user_subscriptions_insert_own
      on public.user_subscriptions
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_subscriptions'
      and policyname = 'user_subscriptions_update_own'
  ) then
    create policy user_subscriptions_update_own
      on public.user_subscriptions
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  error_message text
);
