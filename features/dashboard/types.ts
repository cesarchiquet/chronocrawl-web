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
  field_key: string;
  metadata: {
    summary?: string;
    url?: string;
    before_short?: string;
    after_short?: string;
    priority_score?: number;
    priority_reason?: string;
  } | null;
  detected_at: string | null;
  is_read: boolean | null;
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

export type AlertFilterPreset = {
  alertFilter: "all" | "unread" | "read";
  alertUrlFilter: string;
  alertSeverityFilter: "all" | "medium" | "high";
  alertDateFilter: "all" | "24h" | "7d" | "30d";
  alertSearchQuery: string;
};

export const EVENTS_PAGE_SIZE = 1000;
export const ANALYSIS_SEVERITY_LEVELS: Array<ChangeEvent["severity"]> = [
  "medium",
  "high",
];
