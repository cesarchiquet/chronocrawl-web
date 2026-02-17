-- Phase 14: baseline match source traceability
-- Run this script in Supabase SQL Editor.

alter table public.seo_local_keyword_baselines
  add column if not exists target_match_source text;

alter table public.seo_local_keyword_baselines
  drop constraint if exists seo_local_keyword_baselines_target_match_source_check;

alter table public.seo_local_keyword_baselines
  add constraint seo_local_keyword_baselines_target_match_source_check
  check (
    target_match_source is null
    or target_match_source in ('name', 'source_url', 'business_url')
  );
