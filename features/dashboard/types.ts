export type MonitoredUrl = {
  id: string;
  url: string;
  status: string | null;
  last_checked_at: string | null;
  created_at: string;
};

export type ChangeEvent = {
  id: string;
  monitored_url_id: string;
  domain: "seo" | "pricing" | "cta";
  severity: "medium" | "high";
  confidence_score?: number | null;
  noise_flags?: string[] | null;
  change_group_id?: string | null;
  is_group_root?: boolean | null;
  field_key: string;
  metadata: {
    summary?: string;
    url?: string;
    before_short?: string;
    after_short?: string;
    priority_score?: number;
    priority_reason?: string;
    grouped_changes_count?: number;
  } | null;
  detected_at: string | null;
  is_read: boolean | null;
};

export type MonitorRule = {
  id: string;
  monitored_url_id: string;
  rule_type: "css" | "text_pattern" | "attribute";
  selector: string;
  label: string | null;
  is_active: boolean;
  created_at: string;
};

export type SubscriptionState = {
  plan: "starter" | "pro" | "agency";
  status: string;
  trial_end: string | null;
};

export type MonitorRunLog = {
  status: string;
  checked: number;
  changes: number;
  failed_count: number;
  queued_remaining: number;
  duration_ms: number;
  started_at: string;
};

export type UrlMeta = {
  favorite?: boolean;
  tag?: string;
};

export const EVENTS_PAGE_SIZE = 1000;
