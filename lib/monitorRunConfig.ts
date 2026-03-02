export const JOB_BATCH_SIZE = 8;
export const COOLDOWN_MS = 15_000;

export const DAILY_RUN_LIMIT_BY_PLAN: Record<string, number> = {
  starter: 50,
  pro: 300,
  agency: 1200,
};

export const MAX_URLS_BY_PLAN: Record<string, number> = {
  starter: 10,
  pro: 50,
  agency: 200,
};
