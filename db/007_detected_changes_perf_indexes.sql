-- Phase 9: performance indexes for alert filtering and read-state queries
-- Run this script in Supabase SQL Editor.

create index if not exists idx_detected_changes_user_is_read_detected_at
  on public.detected_changes(user_id, is_read, detected_at desc);

create index if not exists idx_detected_changes_user_metadata_url_detected_at
  on public.detected_changes(user_id, ((metadata ->> 'url')), detected_at desc);

create index if not exists idx_detected_changes_user_unread_detected_at
  on public.detected_changes(user_id, detected_at desc)
  where is_read = false;
