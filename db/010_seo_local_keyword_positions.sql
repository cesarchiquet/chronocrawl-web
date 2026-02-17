-- Phase 12: keyword positions + evolution support for SEO local
-- Run this script in Supabase SQL Editor.

create table if not exists public.seo_local_keyword_positions (
  id bigserial primary key,
  run_id uuid not null references public.seo_local_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  city text not null,
  area_km integer not null check (area_km in (5, 10, 25, 50)),
  keyword text not null,
  position integer not null check (position > 0),
  place_name text not null,
  distance_km numeric(8,2) not null,
  source_url text,
  captured_at timestamptz not null default now()
);

create index if not exists idx_seo_local_positions_user_run
  on public.seo_local_keyword_positions(user_id, run_id);

create index if not exists idx_seo_local_positions_user_keyword
  on public.seo_local_keyword_positions(user_id, keyword, captured_at desc);

alter table public.seo_local_keyword_positions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'seo_local_keyword_positions'
      and policyname = 'seo_local_keyword_positions_select_own'
  ) then
    create policy seo_local_keyword_positions_select_own
      on public.seo_local_keyword_positions
      for select
      using (auth.uid() = user_id);
  end if;
end
$$;
