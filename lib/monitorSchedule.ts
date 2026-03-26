import { supabaseAdmin } from "./supabaseAdmin";

export const AUTO_MONITOR_INTERVAL_MS: Record<string, number> = {
  starter: 6 * 60 * 60 * 1000,
  pro: 60 * 60 * 1000,
  agency: 15 * 60 * 1000,
};

export const AUTO_MONITOR_USER_BATCH = 12;

export type AutoMonitorUser = {
  userId: string;
  plan: "starter" | "pro" | "agency";
  lastRunAt: string | null;
  urlCount: number;
  pendingQueueCount: number;
  resumeQueue: boolean;
  nextRunAt: string | null;
};

type SubscriptionRow = {
  user_id: string;
  plan: string;
  status: string;
};

type UsageRow = {
  user_id: string;
  last_run_at: string | null;
  last_auto_run_at?: string | null;
};

type UrlRow = {
  user_id: string;
};

type JobRow = {
  user_id: string;
  status: "queued" | "processing" | "done" | "failed";
};

function normalizePlan(plan: string | null | undefined): "starter" | "pro" | "agency" {
  if (plan === "pro" || plan === "agency") return plan;
  return "starter";
}

export function getAutoMonitorIntervalMs(plan: string | null | undefined) {
  return AUTO_MONITOR_INTERVAL_MS[normalizePlan(plan)] || AUTO_MONITOR_INTERVAL_MS.starter;
}

export async function getDueAutoMonitorUsers(limit = AUTO_MONITOR_USER_BATCH) {
  const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
    .from("user_subscriptions")
    .select("user_id,plan,status")
    .or("status.eq.active,status.eq.trialing")
    .returns<SubscriptionRow[]>();

  if (subscriptionsError) {
    throw new Error(`Echec lecture user_subscriptions: ${subscriptionsError.message}`);
  }

  const activeSubscriptions = (subscriptions || []).filter((row) =>
    ["active", "trialing"].includes(row.status)
  );

  if (activeSubscriptions.length === 0) {
    return [] as AutoMonitorUser[];
  }

  const userIds = activeSubscriptions.map((row) => row.user_id);

  const [{ data: urlRows, error: urlError }, { data: jobRows, error: jobError }] =
    await Promise.all([
      supabaseAdmin
        .from("monitored_urls")
        .select("user_id")
        .in("user_id", userIds)
        .returns<UrlRow[]>(),
      supabaseAdmin
        .from("monitor_jobs")
        .select("user_id,status")
        .in("user_id", userIds)
        .in("status", ["queued", "processing"])
        .returns<JobRow[]>(),
    ]);

  let usageRows: UsageRow[] | null = null;
  let usageError: { message: string } | null = null;

  const extendedUsage = await supabaseAdmin
    .from("user_monitor_usage")
    .select("user_id,last_run_at,last_auto_run_at")
    .in("user_id", userIds)
    .returns<UsageRow[]>();

  if (extendedUsage.error) {
    const legacyUsage = await supabaseAdmin
      .from("user_monitor_usage")
      .select("user_id,last_run_at")
      .in("user_id", userIds)
      .returns<UsageRow[]>();
    usageRows = legacyUsage.data;
    usageError = legacyUsage.error;
  } else {
    usageRows = extendedUsage.data;
  }

  if (usageError) {
    throw new Error(`Echec lecture user_monitor_usage: ${usageError.message}`);
  }
  if (urlError) {
    throw new Error(`Echec lecture monitored_urls: ${urlError.message}`);
  }
  if (jobError) {
    throw new Error(`Echec lecture monitor_jobs: ${jobError.message}`);
  }

  const usageMap = new Map((usageRows || []).map((row) => [row.user_id, row]));
  const urlCountByUser = new Map<string, number>();
  for (const row of urlRows || []) {
    urlCountByUser.set(row.user_id, (urlCountByUser.get(row.user_id) || 0) + 1);
  }
  const pendingQueueByUser = new Map<string, number>();
  for (const row of jobRows || []) {
    pendingQueueByUser.set(row.user_id, (pendingQueueByUser.get(row.user_id) || 0) + 1);
  }

  const now = Date.now();
  const dueUsers = activeSubscriptions
    .map<AutoMonitorUser | null>((row) => {
      const plan = normalizePlan(row.plan);
      const usage = usageMap.get(row.user_id);
      const lastRunAt =
        "last_auto_run_at" in (usage || {})
          ? usage?.last_auto_run_at || null
          : usage?.last_run_at || null;
      const urlCount = urlCountByUser.get(row.user_id) || 0;
      const pendingQueueCount = pendingQueueByUser.get(row.user_id) || 0;
      const resumeQueue = pendingQueueCount > 0;
      const intervalMs = getAutoMonitorIntervalMs(plan);
      const nextRunAt = lastRunAt ? new Date(new Date(lastRunAt).getTime() + intervalMs).toISOString() : null;
      const dueByTime = !lastRunAt || now - new Date(lastRunAt).getTime() >= intervalMs;

      if (urlCount === 0) return null;
      if (!resumeQueue && !dueByTime) return null;

      return {
        userId: row.user_id,
        plan,
        lastRunAt,
        urlCount,
        pendingQueueCount,
        resumeQueue,
        nextRunAt,
      };
    })
    .filter((row): row is AutoMonitorUser => Boolean(row))
    .sort((a, b) => {
      if (a.resumeQueue !== b.resumeQueue) return a.resumeQueue ? -1 : 1;
      const aTime = a.nextRunAt ? new Date(a.nextRunAt).getTime() : 0;
      const bTime = b.nextRunAt ? new Date(b.nextRunAt).getTime() : 0;
      return aTime - bTime;
    })
    .slice(0, limit);

  return dueUsers;
}
