-- Phase 12: manual scan quota tracking separate from automatic monitoring

alter table public.user_monitor_usage
add column if not exists manual_window_started_at timestamptz;

alter table public.user_monitor_usage
add column if not exists manual_run_count integer not null default 0 check (manual_run_count >= 0);
