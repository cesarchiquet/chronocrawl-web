import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { extractSignalsFromHtml } from "@/lib/monitorSignals";
import { renderAlertEmail } from "@/lib/emailTemplates";
import { Resend } from "resend";
import { requireUserFromRequest } from "@/lib/routeAuth";

type DbSnapshot = {
  id: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  canonical_url: string | null;
  robots_directive: string | null;
  pricing_json: Record<string, unknown> | null;
  cta_json: string[] | null;
  content_fingerprint: string | null;
};

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

type ChangeRow = {
  user_id: string;
  monitored_url_id: string;
  snapshot_before_id: string | null;
  snapshot_after_id: string;
  domain: "content" | "seo" | "pricing" | "cta";
  field_key: string;
  before_value: string | null;
  after_value: string | null;
  severity: "low" | "medium" | "high";
  metadata: Record<string, unknown>;
};

type LastChange = {
  domain: "content" | "seo" | "pricing" | "cta";
  field_key: string;
  after_value: string | null;
};

type AlertSettings = {
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
const JOB_BATCH_SIZE = 8;
const FETCH_TIMEOUT_MS = 15000;
const FETCH_MAX_ATTEMPTS = 3;
const FETCH_RETRY_BACKOFF_MS = [0, 700, 1600];

type FetchResult =
  | {
      ok: true;
      status: number;
      html: string;
      attempts: number;
    }
  | {
      ok: false;
      status: number | null;
      html: "";
      attempts: number;
      failureCode: string;
      failureDetail: string;
    };

function asText(input: unknown) {
  if (input === null || input === undefined) return "";
  return String(input);
}

function normalizeJson(input: unknown) {
  return JSON.stringify(input ?? {});
}

function shortValue(input: unknown, max = 140) {
  const value = asText(input);
  if (!value) return "vide";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function tokenChangeRatio(beforeValue: string, afterValue: string) {
  const beforeTokens = new Set(tokenize(beforeValue));
  const afterTokens = new Set(tokenize(afterValue));

  if (beforeTokens.size === 0 && afterTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of beforeTokens) {
    if (afterTokens.has(token)) intersection += 1;
  }

  const union = new Set([...beforeTokens, ...afterTokens]).size || 1;
  return 1 - intersection / union;
}

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => asText(item).toLowerCase()).filter(Boolean);
    }
  } catch {
    return [];
  }
  return [];
}

function parseNumericValues(value: string) {
  const matches = value.match(/-?\d+(?:[.,]\d+)?/g) || [];
  return matches
    .map((raw) => Number(raw.replace(",", ".")))
    .filter((num) => Number.isFinite(num));
}

function fieldLabel(fieldKey: string) {
  const labels: Record<string, string> = {
    title: "Title",
    meta_description: "Meta description",
    h1: "H1",
    canonical_url: "Canonical",
    robots_directive: "Robots",
    pricing_json: "Prix",
    cta_json: "CTA",
    content_fingerprint: "Contenu",
  };
  return labels[fieldKey] || fieldKey;
}

function domainLabel(domain: ChangeRow["domain"]) {
  const labels: Record<ChangeRow["domain"], string> = {
    seo: "SEO",
    pricing: "Pricing",
    cta: "CTA",
    content: "Content",
  };
  return labels[domain];
}

function severityAtLeast(
  value: ChangeRow["severity"],
  threshold: ChangeRow["severity"]
) {
  const rank: Record<ChangeRow["severity"], number> = {
    low: 0,
    medium: 1,
    high: 2,
  };
  return rank[value] >= rank[threshold];
}

function computeSeverity(params: {
  domain: ChangeRow["domain"];
  fieldKey: string;
  beforeValue: string;
  afterValue: string;
}) {
  const { domain, fieldKey, beforeValue, afterValue } = params;

  const beforeEmpty = beforeValue.trim().length === 0;
  const afterEmpty = afterValue.trim().length === 0;
  const becameEmpty = !beforeEmpty && afterEmpty;
  const becameFilled = beforeEmpty && !afterEmpty;
  const ratio = tokenChangeRatio(beforeValue, afterValue);

  if (fieldKey === "robots_directive" || fieldKey === "canonical_url") {
    return {
      severity: "high" as const,
      score: 90,
      reason: "Signal SEO structurel critique.",
    };
  }

  if (fieldKey === "title" || fieldKey === "meta_description") {
    if (becameEmpty || becameFilled) {
      return {
        severity: "high" as const,
        score: 90,
        reason: "Ajout/suppression d'un champ SEO principal.",
      };
    }
    if (ratio >= 0.55) {
      return {
        severity: "high" as const,
        score: 80,
        reason: "Forte variation de texte SEO principal.",
      };
    }
    return {
      severity: "medium" as const,
      score: 60,
      reason: "Variation moderee de texte SEO principal.",
    };
  }

  if (fieldKey === "h1") {
    if (becameEmpty || becameFilled) {
      return {
        severity: "high" as const,
        score: 75,
        reason: "Ajout/suppression du H1.",
      };
    }
    if (ratio >= 0.6) {
      return {
        severity: "medium" as const,
        score: 55,
        reason: "Forte variation du H1.",
      };
    }
    return {
      severity: "low" as const,
      score: 30,
      reason: "Variation mineure du H1.",
    };
  }

  if (fieldKey === "pricing_json") {
    const beforeNums = parseNumericValues(beforeValue);
    const afterNums = parseNumericValues(afterValue);
    const maxLen = Math.max(beforeNums.length, afterNums.length);

    if (maxLen === 0) {
      return {
        severity: "medium" as const,
        score: 65,
        reason: "Structure pricing modifiee.",
      };
    }

    let majorNumericShift = false;
    for (let i = 0; i < maxLen; i += 1) {
      const b = beforeNums[i] ?? 0;
      const a = afterNums[i] ?? 0;
      const base = Math.max(Math.abs(b), 1);
      if (Math.abs(a - b) / base >= 0.1) {
        majorNumericShift = true;
        break;
      }
    }

    if (majorNumericShift) {
      return {
        severity: "high" as const,
        score: 92,
        reason: "Variation de prix >= 10%.",
      };
    }

    return {
      severity: "medium" as const,
      score: 68,
      reason: "Variation pricing faible ou structurelle.",
    };
  }

  if (fieldKey === "cta_json") {
    const beforeCtas = parseStringArray(beforeValue);
    const afterCtas = parseStringArray(afterValue);
    const ctaKeywords = ["essai", "demo", "contact", "acheter", "devis", "signup"];

    const beforeImportant = beforeCtas.some((cta) =>
      ctaKeywords.some((keyword) => cta.includes(keyword))
    );
    const afterImportant = afterCtas.some((cta) =>
      ctaKeywords.some((keyword) => cta.includes(keyword))
    );

    if (beforeImportant && !afterImportant) {
      return {
        severity: "high" as const,
        score: 88,
        reason: "Disparition d'un CTA commercial important.",
      };
    }

    const countDelta = Math.abs(beforeCtas.length - afterCtas.length);
    if (countDelta >= 2) {
      return {
        severity: "medium" as const,
        score: 58,
        reason: "Variation notable du volume de CTA.",
      };
    }

    return {
      severity: "medium" as const,
      score: 50,
      reason: "Variation de CTA detectee.",
    };
  }

  if (domain === "content") {
    return {
      severity: "low" as const,
      score: 20,
      reason: "Changement de contenu brut.",
    };
  }

  return {
    severity: "low" as const,
    score: 25,
    reason: "Changement detecte.",
  };
}

function buildDiffRows(params: {
  userId: string;
  monitoredUrlId: string;
  monitoredUrl: string;
  before: DbSnapshot | null;
  after: DbSnapshot;
}): ChangeRow[] {
  const { userId, monitoredUrlId, monitoredUrl, before, after } = params;
  if (!before) return [];

  const rows: ChangeRow[] = [];
  const push = (
    domain: ChangeRow["domain"],
    fieldKey: string,
    beforeValue: unknown,
    afterValue: unknown
  ) => {
    const beforeText = asText(beforeValue);
    const afterText = asText(afterValue);
    if (beforeText === afterText) return;
    const computed = computeSeverity({
      domain,
      fieldKey,
      beforeValue: beforeText,
      afterValue: afterText,
    });
    rows.push({
      user_id: userId,
      monitored_url_id: monitoredUrlId,
      snapshot_before_id: before.id,
      snapshot_after_id: after.id,
      domain,
      field_key: fieldKey,
      before_value: beforeText || null,
      after_value: afterText || null,
      severity: computed.severity,
      metadata: {
        url: monitoredUrl,
        summary: `[${domainLabel(domain)}] ${fieldLabel(fieldKey)} modifie`,
        before_short: shortValue(beforeText),
        after_short: shortValue(afterText),
        priority_score: computed.score,
        priority_reason: computed.reason,
      },
    });
  };

  push("seo", "title", before.title, after.title);
  push(
    "seo",
    "meta_description",
    before.meta_description,
    after.meta_description
  );
  push("seo", "h1", before.h1, after.h1);
  push(
    "seo",
    "canonical_url",
    before.canonical_url,
    after.canonical_url
  );
  push(
    "seo",
    "robots_directive",
    before.robots_directive,
    after.robots_directive
  );
  push(
    "pricing",
    "pricing_json",
    normalizeJson(before.pricing_json),
    normalizeJson(after.pricing_json)
  );
  push(
    "cta",
    "cta_json",
    normalizeJson(before.cta_json),
    normalizeJson(after.cta_json)
  );
  push(
    "content",
    "content_fingerprint",
    before.content_fingerprint,
    after.content_fingerprint
  );

  return rows;
}

function filterDynamicNoiseRows(params: {
  rows: ChangeRow[];
  dynamicNoiseScore: number;
}) {
  const { rows, dynamicNoiseScore } = params;
  if (rows.length === 0) return { kept: rows, filtered: 0 };

  const hasPrioritySignal = rows.some((row) =>
    ["seo", "pricing", "cta"].includes(row.domain)
  );
  if (hasPrioritySignal) return { kept: rows, filtered: 0 };

  if (dynamicNoiseScore < 2) return { kept: rows, filtered: 0 };

  const kept = rows.filter(
    (row) => !(row.domain === "content" && row.severity === "low")
  );

  return {
    kept,
    filtered: rows.length - kept.length,
  };
}

async function dedupeConsecutiveRows(params: {
  userId: string;
  monitoredUrlId: string;
  rows: ChangeRow[];
}) {
  const { userId, monitoredUrlId, rows } = params;
  if (rows.length === 0) return rows;

  const { data: lastChanges } = await supabaseAdmin
    .from("detected_changes")
    .select("domain,field_key,after_value")
    .eq("user_id", userId)
    .eq("monitored_url_id", monitoredUrlId)
    .order("detected_at", { ascending: false })
    .limit(100);

  const latestByField = new Map<string, LastChange>();
  for (const row of (lastChanges || []) as LastChange[]) {
    const key = `${row.domain}:${row.field_key}`;
    if (!latestByField.has(key)) {
      latestByField.set(key, row);
    }
  }

  return rows.filter((row) => {
    const key = `${row.domain}:${row.field_key}`;
    const latest = latestByField.get(key);
    if (!latest) return true;
    return (latest.after_value || "") !== (row.after_value || "");
  });
}

async function fetchPageHtml(url: string) {
  const shouldRetryStatus = (status: number) =>
    [408, 425, 429, 500, 502, 503, 504, 522, 524].includes(status);

  const classifyFetchError = (error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "TIMEOUT";
    }

    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (
      message.includes("enotfound") ||
      message.includes("eai_again") ||
      message.includes("dns")
    ) {
      return "DNS_ERROR";
    }
    if (
      message.includes("ssl") ||
      message.includes("tls") ||
      message.includes("certificate")
    ) {
      return "SSL_ERROR";
    }
    return "NETWORK_ERROR";
  };

  let lastFailure: FetchResult = {
    ok: false,
    status: null,
    html: "",
    attempts: 0,
    failureCode: "UNKNOWN_ERROR",
    failureDetail: "Erreur reseau inconnue.",
  };

  for (let attempt = 1; attempt <= FETCH_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, FETCH_RETRY_BACKOFF_MS[attempt - 1] || 2000)
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "ChronoCrawlBot/1.0 (+https://chronocrawl.com)",
        },
      });

      const html = await response.text();
      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          html,
          attempts: attempt,
        };
      }

      lastFailure = {
        ok: false,
        status: response.status,
        html: "",
        attempts: attempt,
        failureCode: `HTTP_${response.status}`,
        failureDetail: `HTTP_${response.status}`,
      };

      if (!shouldRetryStatus(response.status)) {
        return lastFailure;
      }
    } catch (error: unknown) {
      const failureCode = classifyFetchError(error);
      lastFailure = {
        ok: false,
        status: null,
        html: "",
        attempts: attempt,
        failureCode,
        failureDetail: error instanceof Error ? error.message : "Fetch error",
      };
      if (attempt >= FETCH_MAX_ATTEMPTS) {
        return lastFailure;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  return lastFailure;
}

export async function POST(request: Request) {
  const requestStartedAtMs = Date.now();
  let continueQueue = false;
  try {
    const body = (await request.json()) as { continueQueue?: boolean };
    continueQueue = !!body?.continueQueue;
  } catch {
    continueQueue = false;
  }

  const auth = await requireUserFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 400 });
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
  const status =
    subscriptionRow?.status ||
    (userData.user.user_metadata?.subscription_status as string | undefined) ||
    "inactive";
  let alertSettings: AlertSettings = {
    email_mode: "instant",
    min_email_severity: "high",
  };

  const { data: alertSettingsRow } = await supabaseAdmin
    .from("user_alert_settings")
    .select("email_mode,min_email_severity")
    .eq("user_id", userId)
    .maybeSingle<AlertSettings>();

  if (alertSettingsRow) {
    alertSettings = {
      email_mode: alertSettingsRow.email_mode ?? "instant",
      min_email_severity: alertSettingsRow.min_email_severity ?? "high",
    };
  }

  if (!["active", "trialing"].includes(status)) {
    await writeRunLog({
      status: "inactive_subscription",
    });
    return NextResponse.json(
      { error: "Abonnement inactif. Analyse bloquee." },
      { status: 403 }
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

  const dailyRunLimitByPlan: Record<string, number> = {
    starter: 50,
    pro: 300,
    agency: 1200,
  };
  const dailyLimit = dailyRunLimitByPlan[plan] || dailyRunLimitByPlan.starter;
  const cooldownMs = 15_000;

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
    if (lastRunAt && now - lastRunAt < cooldownMs) {
      await writeRunLog({
        status: "rate_limited",
      });
      return NextResponse.json(
        {
          error:
            "Analyse trop frequente. Attends 15 secondes avant de relancer.",
        },
        { status: 429 }
      );
    }

    if (runCount >= dailyLimit) {
      await writeRunLog({
        status: "rate_limited",
      });
      return NextResponse.json(
        {
          error: `Limite journaliere atteinte (${dailyLimit} analyses). Reviens demain ou upgrade ton plan.`,
        },
        { status: 429 }
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

  const limitByPlan: Record<string, number> = {
    starter: 10,
    pro: 50,
    agency: 200,
  };
  const maxUrls = limitByPlan[plan] || limitByPlan.starter;

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
    return NextResponse.json({ error: monitoredUrlsError.message }, { status: 500 });
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

      if (dedupedRows.length > 0) {
        const { error: insertChangesError } = await supabaseAdmin
          .from("detected_changes")
          .insert(dedupedRows);

        if (!insertChangesError) {
          changes += dedupedRows.length;
          for (const row of dedupedRows) {
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
