export const JOB_BATCH_SIZE = 8;
export const COOLDOWN_MS = 15_000;

export const DAILY_RUN_LIMIT_BY_PLAN: Record<string, number> = {
  starter: 50,
  pro: 300,
  agency: 1200,
};

export const MANUAL_RUN_LIMIT_BY_PLAN: Record<string, number | null> = {
  starter: 10,
  pro: null,
  agency: null,
};

export const MAX_URLS_BY_PLAN: Record<string, number> = {
  starter: 10,
  pro: 50,
  agency: 200,
};

function featureFlagEnabled(value: string | undefined, defaultValue = true) {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

export const FEATURE_FLAGS = {
  monitorConfidenceV1: featureFlagEnabled(process.env.MONITOR_CONFIDENCE_V1, true),
  monitorRulesV1: featureFlagEnabled(process.env.MONITOR_RULES_V1, false),
  groupedAlertsV1: featureFlagEnabled(process.env.GROUPED_ALERTS_V1, true),
} as const;
