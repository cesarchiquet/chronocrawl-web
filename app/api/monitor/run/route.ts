import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { extractSignalsFromHtml } from "@/lib/monitorSignals";
import { renderAlertEmail } from "@/lib/emailTemplates";
import { Resend } from "resend";
import { requireUserFromRequest } from "@/lib/routeAuth";
import { fetchPageHtml } from "@/lib/monitorFetch";
import { dedupeConsecutiveRows } from "@/lib/monitorDedupe";
import {
  buildDiffRows,
  filterDynamicNoiseRows,
  severityAtLeast,
  type DbSnapshot,
} from "@/lib/monitorDiff";
import { parseMonitorRunRequestBody } from "@/lib/monitorRunRequest";
import {
  COOLDOWN_MS,
  DAILY_RUN_LIMIT_BY_PLAN,
  JOB_BATCH_SIZE,
  MAX_URLS_BY_PLAN,
} from "@/lib/monitorRunConfig";

type MonitoredUrl = {
  id: string;
  user_id: string;
  url: string;
};

type MonitorJob = {
  user_id: string;
  monitored_url_id: string;
  status: "queued" | "processing" | "done" | "failed";
  attempt_count: number;
};

type AlertSettings = {
  email_mode: "instant" | "daily" | "off";
  min_email_severity: "medium" | "high";
};
type AlertSettingsRow = {
  email_mode: "instant" | "daily" | "off";
  min_email_severity: "low" | "medium" | "high";
};
type MonitorRunStatus =
  | "completed"
  | "no_urls"
  | "idle_queue"
  | "inactive_subscription"
  | "rate_limited"
  | "failed_internal";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function errorResponse(message: string, status: number, code: string) {
  return NextResponse.json(
    {
      error: message,
      code,
    },
    { status }
  );
}

export async function POST(request: Request) {
  const requestStartedAtMs = Date.now();
  const rawBody = (await request.json().catch(() => ({}))) as {
    continueQueue?: unknown;
    severities?: unknown;
    minSeverity?: unknown;
  };
  const parsedBody = parseMonitorRunRequestBody(rawBody);
  if ("code" in parsedBody) {
    return errorResponse(parsedBody.message, 400, parsedBody.code);
  }
  const continueQueue = parsedBody.continueQueue;
  const selectedSeverities = parsedBody.selectedSeverities;

  const auth = await requireUserFromRequest(request);
  if ("error" in auth) {
    return errorResponse(
      auth.error || "Session invalide.",
      auth.status || 401,
      "UNAUTHORIZED"
    );
  }
  const userId = auth.user.id;
  const runStartedAtIso = new Date(requestStartedAtMs).toISOString();
  const writeRunLog = async (params: {
    status: MonitorRunStatus;
    checked?: number;
    changes?: number;
    failedCount?: number;
    queuedRemaining?: number;
  }) => {
    try {
      await supabaseAdmin.from("monitor_run_logs").insert({
        user_id: userId,
        status: params.status,
        checked: params.checked ?? 0,
        changes: params.changes ?? 0,
        failed_count: params.failedCount ?? 0,
        queued_remaining: params.queuedRemaining ?? 0,
        duration_ms: Date.now() - requestStartedAtMs,
        started_at: runStartedAtIso,
      });
    } catch {
      // Non-blocking: logging should never break monitor execution.
    }
  };

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(userId);
  if (userError || !userData.user) {
    return errorResponse("Utilisateur introuvable.", 400, "USER_NOT_FOUND");
  }

  const { data: subscriptionRow } = await supabaseAdmin
    .from("user_subscriptions")
    .select("plan,status")
    .eq("user_id", userId)
    .maybeSingle<{ plan: string; status: string }>();

  const plan =
    subscriptionRow?.plan ||
    (userData.user.user_metadata?.plan as string | undefined) ||
    "starter";
  const rawStatus =
    subscriptionRow?.status ||
    (userData.user.user_metadata?.subscription_status as string | undefined) ||
    "inactive";
  const metadataStatus = userData.user.user_metadata?.subscription_status as
    | string
    | undefined;
  const status =
    rawStatus === "pending_checkout" ? metadataStatus || "inactive" : rawStatus;
  let alertSettings: AlertSettings = {
    email_mode: "instant",
    min_email_severity: "high",
  };

  const { data: alertSettingsRow } = await supabaseAdmin
    .from("user_alert_settings")
    .select("email_mode,min_email_severity")
    .eq("user_id", userId)
    .maybeSingle<AlertSettingsRow>();

  if (alertSettingsRow) {
    const minEmailSeverity =
      alertSettingsRow.min_email_severity === "high" ? "high" : "medium";
    alertSettings = {
      email_mode: alertSettingsRow.email_mode ?? "instant",
      min_email_severity: minEmailSeverity,
    };
  }

  if (!["active", "trialing"].includes(status)) {
    await writeRunLog({
      status: "inactive_subscription",
    });
    return errorResponse(
      "Abonnement inactif. Analyse bloquee.",
      403,
      "SUBSCRIPTION_INACTIVE"
    );
  }

  const nowIso = new Date().toISOString();
  const { data: usageRow } = await supabaseAdmin
    .from("user_monitor_usage")
    .select("window_started_at,run_count,last_run_at")
    .eq("user_id", userId)
    .maybeSingle<{
      window_started_at: string;
      run_count: number;
      last_run_at: string | null;
    }>();

  const dailyLimit = DAILY_RUN_LIMIT_BY_PLAN[plan] || DAILY_RUN_LIMIT_BY_PLAN.starter;

  const now = Date.now();
  const windowStartedAt = usageRow?.window_started_at
    ? new Date(usageRow.window_started_at).getTime()
    : now;
  const windowExpired = now - windowStartedAt >= 24 * 60 * 60 * 1000;
  const runCount = windowExpired ? 0 : usageRow?.run_count || 0;
  const lastRunAt = usageRow?.last_run_at
    ? new Date(usageRow.last_run_at).getTime()
    : null;

  if (!continueQueue) {
    if (lastRunAt && now - lastRunAt < COOLDOWN_MS) {
      await writeRunLog({
        status: "rate_limited",
      });
      return errorResponse(
        "Analyse trop frequente. Attends 15 secondes avant de relancer.",
        429,
        "RATE_LIMIT_COOLDOWN"
      );
    }

    if (runCount >= dailyLimit) {
      await writeRunLog({
        status: "rate_limited",
      });
      return errorResponse(
        `Limite journaliere atteinte (${dailyLimit} analyses). Reviens demain ou upgrade ton plan.`,
        429,
        "RATE_LIMIT_DAILY"
      );
    }

    await supabaseAdmin.from("user_monitor_usage").upsert(
      {
        user_id: userId,
        window_started_at:
          windowExpired ? nowIso : usageRow?.window_started_at || nowIso,
        run_count: runCount + 1,
        last_run_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "user_id" }
    );
  }

  const maxUrls = MAX_URLS_BY_PLAN[plan] || MAX_URLS_BY_PLAN.starter;

  const { data: monitoredUrls, error: monitoredUrlsError } = await supabaseAdmin
    .from("monitored_urls")
    .select("id,user_id,url")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(maxUrls);

  if (monitoredUrlsError) {
    await writeRunLog({
      status: "failed_internal",
    });
    return errorResponse(
      monitoredUrlsError.message,
      500,
      "MONITORED_URLS_QUERY_FAILED"
    );
  }

  const urls = (monitoredUrls || []) as MonitoredUrl[];
  if (urls.length === 0) {
    await writeRunLog({
      status: "no_urls",
    });
    return NextResponse.json({
      checked: 0,
      changes: 0,
      message: "Aucune URL a analyser.",
    });
  }

  const queueNowIso = new Date().toISOString();

  if (!continueQueue) {
    const queuePayload = urls.map((item) => ({
      user_id: userId,
      monitored_url_id: item.id,
      status: "queued" as const,
      scheduled_at: queueNowIso,
      last_error: null,
      updated_at: queueNowIso,
    }));

    await supabaseAdmin.from("monitor_jobs").upsert(queuePayload, {
      onConflict: "user_id,monitored_url_id",
    });
  }

  const { data: queuedJobs } = await supabaseAdmin
    .from("monitor_jobs")
    .select("user_id,monitored_url_id,status,attempt_count")
    .eq("user_id", userId)
    .eq("status", "queued")
    .order("scheduled_at", { ascending: true })
    .limit(JOB_BATCH_SIZE);

  const jobs = (queuedJobs || []) as MonitorJob[];
  if (jobs.length === 0) {
    await writeRunLog({
      status: "idle_queue",
    });
    return NextResponse.json({
      checked: 0,
      changes: 0,
      deduped: 0,
      noiseFiltered: 0,
      failed: [],
      queuedRemaining: 0,
      message: "Aucun job en attente.",
    });
  }

  const jobIds = jobs.map((job) => job.monitored_url_id);
  await supabaseAdmin
    .from("monitor_jobs")
    .update({
      status: "processing",
      started_at: queueNowIso,
      updated_at: queueNowIso,
    })
    .eq("user_id", userId)
    .in("monitored_url_id", jobIds)
    .eq("status", "queued");

  const urlById = new Map(urls.map((item) => [item.id, item]));

  let checked = 0;
  let changes = 0;
  let deduped = 0;
  let noiseFiltered = 0;
  const failed: string[] = [];
  const highSeverityAlerts: string[] = [];
  const userEmail = userData.user.email || "";

  for (const job of jobs) {
    const item = urlById.get(job.monitored_url_id);
    if (!item) {
      await supabaseAdmin
        .from("monitor_jobs")
        .update({
          status: "failed",
          last_error: "URL introuvable",
          finished_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("monitored_url_id", job.monitored_url_id);
      continue;
    }

    try {
      const page = await fetchPageHtml(item.url);

      if (!page.ok) {
        const statusLabel = page.status ? `HTTP_${page.status}` : page.failureCode;
        const lastError = `${statusLabel} after ${page.attempts} attempt(s)`;
        failed.push(`${item.url} (${statusLabel})`);
        await supabaseAdmin
          .from("monitored_urls")
          .update({
            status: statusLabel,
            last_checked_at: new Date().toISOString(),
          })
          .eq("id", item.id)
          .eq("user_id", userId);
        await supabaseAdmin
          .from("monitor_jobs")
          .update({
            status: "failed",
            last_error: lastError,
            finished_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("monitored_url_id", item.id);
        continue;
      }

      const extracted = extractSignalsFromHtml(page.html, item.url);

      const { data: previousSnapshot } = await supabaseAdmin
        .from("url_snapshots")
        .select(
          "id,title,meta_description,h1,canonical_url,robots_directive,pricing_json,cta_json,content_fingerprint"
        )
        .eq("user_id", userId)
        .eq("monitored_url_id", item.id)
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle<DbSnapshot>();

      const { data: insertedSnapshot, error: insertSnapshotError } =
        await supabaseAdmin
          .from("url_snapshots")
          .insert({
            user_id: userId,
            monitored_url_id: item.id,
            status_code: page.status,
            page_hash: extracted.pageHash,
            title: extracted.title || null,
            meta_description: extracted.metaDescription || null,
            h1: extracted.h1 || null,
            canonical_url: extracted.canonicalUrl || null,
            robots_directive: extracted.robotsDirective || null,
            pricing_json: extracted.pricingJson,
            cta_json: extracted.ctaJson,
            content_fingerprint: extracted.contentFingerprint,
            raw_extract: extracted.rawExtract,
          })
          .select(
            "id,title,meta_description,h1,canonical_url,robots_directive,pricing_json,cta_json,content_fingerprint"
          )
          .single<DbSnapshot>();

      if (insertSnapshotError || !insertedSnapshot) {
        failed.push(item.url);
        await supabaseAdmin
          .from("monitor_jobs")
          .update({
            status: "failed",
            last_error: "Snapshot insert error",
            finished_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("monitored_url_id", item.id);
        continue;
      }

      const diffRows = buildDiffRows({
        userId,
        monitoredUrlId: item.id,
        monitoredUrl: item.url,
        before: previousSnapshot ?? null,
        after: insertedSnapshot,
      });

      const dynamicNoiseScore = Number(
        (extracted.rawExtract?.dynamic_noise_score as number | undefined) || 0
      );
      const noiseFilter = filterDynamicNoiseRows({
        rows: diffRows,
        dynamicNoiseScore,
      });
      noiseFiltered += noiseFilter.filtered;

      const dedupedRows = await dedupeConsecutiveRows({
        userId,
        monitoredUrlId: item.id,
        rows: noiseFilter.kept,
      });
      deduped += noiseFilter.kept.length - dedupedRows.length;

      const rowsToStore = dedupedRows.filter((row) =>
        selectedSeverities.includes(row.severity)
      );

      if (rowsToStore.length > 0) {
        const { error: insertChangesError } = await supabaseAdmin
          .from("detected_changes")
          .insert(rowsToStore);

        if (!insertChangesError) {
          changes += rowsToStore.length;
          for (const row of rowsToStore) {
            if (
              row.severity &&
              severityAtLeast(row.severity, alertSettings.min_email_severity)
            ) {
              const summary = (row.metadata.summary as string) || row.field_key;
              highSeverityAlerts.push(`${summary} sur ${item.url}`);
            }
          }
        }
      }

      await supabaseAdmin
        .from("monitored_urls")
        .update({
          status: "OK",
          last_checked_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("user_id", userId);
      await supabaseAdmin
        .from("monitor_jobs")
        .update({
          status: "done",
          last_error: null,
          finished_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("monitored_url_id", item.id);

      checked += 1;
    } catch {
      failed.push(`${item.url} (RUNTIME_ERROR)`);
      await supabaseAdmin
        .from("monitored_urls")
        .update({
          status: "ERROR",
          last_checked_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("user_id", userId);
      await supabaseAdmin
        .from("monitor_jobs")
        .update({
          status: "failed",
          last_error: "Runtime error",
          finished_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("monitored_url_id", item.id);
    }
  }

  if (
    resend &&
    userEmail &&
    alertSettings.email_mode === "instant" &&
    highSeverityAlerts.length > 0
  ) {
    try {
      const uniqueAlerts = Array.from(new Set(highSeverityAlerts)).slice(0, 12);
      const { html, text } = renderAlertEmail({
        title: "Alertes detectees",
        intro: `Voici les changements detectes lors de la derniere analyse (seuil: ${alertSettings.min_email_severity.toUpperCase()}).`,
        items: uniqueAlerts,
        ctaUrl: "https://chronocrawl.com/dashboard",
        ctaLabel: "Ouvrir le dashboard",
        footerNote: "Tu recois cet email car les alertes instantanees sont actives sur ton compte.",
      });
      await resend.emails.send({
        from: "ChronoCrawl <hello@chronocrawl.com>",
        to: userEmail,
        subject: "ChronoCrawl — Alertes detectees",
        html,
        text,
      });
    } catch {
      // Non-blocking: monitoring result must still be returned even if email fails.
    }
  }

  const { count: queuedRemaining } = await supabaseAdmin
    .from("monitor_jobs")
    .select("monitored_url_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "queued");

  const responsePayload = {
    checked,
    changes,
    deduped,
    noiseFiltered,
    failed,
    queuedRemaining: queuedRemaining || 0,
    processedBatch: jobs.length,
  };

  await writeRunLog({
    status: "completed",
    checked,
    changes,
    failedCount: failed.length,
    queuedRemaining: queuedRemaining || 0,
  });

  return NextResponse.json(responsePayload);
}
