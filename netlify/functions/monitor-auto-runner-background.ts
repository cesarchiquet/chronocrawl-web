import type { Handler } from "@netlify/functions";

const MAX_AUTO_BATCHES_PER_INVOCATION = 6;
const NON_FATAL_CODES = new Set([
  "SUBSCRIPTION_INACTIVE",
  "RATE_LIMIT_COOLDOWN",
  "RATE_LIMIT_DAILY",
]);

export const handler: Handler = async (event) => {
  const scheduleSecret = process.env.MONITOR_SCHEDULE_SECRET?.trim();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.URL?.trim() ||
    process.env.DEPLOY_PRIME_URL?.trim();
  const requestSecret =
    event.headers["x-monitor-schedule-secret"] ||
    event.headers["X-Monitor-Schedule-Secret"] ||
    "";

  if (!scheduleSecret || requestSecret !== scheduleSecret) {
    return {
      statusCode: 401,
      body: JSON.stringify({ ok: false, message: "Unauthorized" }),
    };
  }

  if (!siteUrl) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        message: "NEXT_PUBLIC_SITE_URL manquant pour le worker monitoring.",
      }),
    };
  }

  const body = JSON.parse(event.body || "{}");
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  let continueQueue = body.continueQueue === true;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, message: "userId manquant." }),
    };
  }

  const runUrl = new URL("/api/monitor/run", siteUrl).toString();
  let totalChecked = 0;
  let totalChanges = 0;
  let finalQueuedRemaining = 0;

  for (let batchIndex = 0; batchIndex < MAX_AUTO_BATCHES_PER_INVOCATION; batchIndex += 1) {
    const response = await fetch(runUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-monitor-schedule-secret": scheduleSecret,
      },
      body: JSON.stringify({
        userId,
        continueQueue,
        minSeverity: "all",
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          checked?: number;
          changes?: number;
          queuedRemaining?: number;
          code?: string;
          error?: string;
          message?: string;
        }
      | null;

    if (!response.ok) {
      const code = payload?.code || "AUTO_RUN_FAILED";
      if (NON_FATAL_CODES.has(code)) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            ok: true,
            userId,
            skipped: true,
            code,
            message: payload?.error || payload?.message || "Run skipped.",
          }),
        };
      }

      return {
        statusCode: response.status,
        body: JSON.stringify({
          ok: false,
          userId,
          code,
          message: payload?.error || payload?.message || "Run failed.",
        }),
      };
    }

    totalChecked += Number(payload?.checked || 0);
    totalChanges += Number(payload?.changes || 0);
    finalQueuedRemaining = Number(payload?.queuedRemaining || 0);

    if (finalQueuedRemaining <= 0) {
      break;
    }

    continueQueue = true;
  }

  return {
    statusCode: 202,
    body: JSON.stringify({
      ok: true,
      userId,
      checked: totalChecked,
      changes: totalChanges,
      queuedRemaining: finalQueuedRemaining,
      maxBatches: MAX_AUTO_BATCHES_PER_INVOCATION,
    }),
  };
};
