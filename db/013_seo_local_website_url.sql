-- Phase 15: explicit business website URL for SEO local configuration
-- Run this script in Supabase SQL Editor.

alter table public.seo_local_profiles
  add column if not exists website_url text;

