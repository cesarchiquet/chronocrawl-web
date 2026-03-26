-- Phase 11: decouple automatic monitoring cadence from manual scans
-- Run this script in Supabase SQL Editor.

alter table public.user_monitor_usage
add column if not exists last_auto_run_at timestamptz;
