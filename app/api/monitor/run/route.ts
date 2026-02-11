import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { extractSignalsFromHtml } from "@/lib/monitorSignals";
import { renderAlertEmail } from "@/lib/emailTemplates";
import { Resend } from "resend";

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

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
    afterValue: unknown,
    severity: ChangeRow["severity"]
  ) => {
    const beforeText = asText(beforeValue);
    const afterText = asText(afterValue);
    if (beforeText === afterText) return;
    rows.push({
      user_id: userId,
      monitored_url_id: monitoredUrlId,
      snapshot_before_id: before.id,
      snapshot_after_id: after.id,
      domain,
      field_key: fieldKey,
      before_value: beforeText || null,
      after_value: afterText || null,
      severity,
      metadata: {
        url: monitoredUrl,
        summary: `[${domainLabel(domain)}] ${fieldLabel(fieldKey)} modifie`,
        before_short: shortValue(beforeText),
        after_short: shortValue(afterText),
      },
    });
  };

  push("seo", "title", before.title, after.title, "high");
  push(
    "seo",
    "meta_description",
    before.meta_description,
    after.meta_description,
    "high"
  );
  push("seo", "h1", before.h1, after.h1, "medium");
  push(
    "seo",
    "canonical_url",
    before.canonical_url,
    after.canonical_url,
    "medium"
  );
  push(
    "seo",
    "robots_directive",
    before.robots_directive,
    after.robots_directive,
    "high"
  );
  push(
    "pricing",
    "pricing_json",
    normalizeJson(before.pricing_json),
    normalizeJson(after.pricing_json),
    "high"
  );
  push(
    "cta",
    "cta_json",
    normalizeJson(before.cta_json),
    normalizeJson(after.cta_json),
    "medium"
  );
  push(
    "content",
    "content_fingerprint",
    before.content_fingerprint,
    after.content_fingerprint,
    "low"
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ChronoCrawlBot/1.0 (+https://chronocrawl.com)",
      },
    });

    const html = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      html,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const { userId } = (await request.json()) as { userId?: string };

  if (!userId) {
    return NextResponse.json({ error: "Utilisateur manquant." }, { status: 400 });
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(userId);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 400 });
  }

  const plan = (userData.user.user_metadata?.plan as string | undefined) || "starter";
  const status =
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
    return NextResponse.json(
      { error: "Abonnement inactif. Analyse bloquee." },
      { status: 403 }
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
    return NextResponse.json({ error: monitoredUrlsError.message }, { status: 500 });
  }

  const urls = (monitoredUrls || []) as MonitoredUrl[];
  if (urls.length === 0) {
    return NextResponse.json({
      checked: 0,
      changes: 0,
      message: "Aucune URL a analyser.",
    });
  }

  let checked = 0;
  let changes = 0;
  let deduped = 0;
  let noiseFiltered = 0;
  const failed: string[] = [];
  const highSeverityAlerts: string[] = [];
  const userEmail = userData.user.email || "";

  for (const item of urls) {
    try {
      const page = await fetchPageHtml(item.url);

      if (!page.ok) {
        failed.push(item.url);
        await supabaseAdmin
          .from("monitored_urls")
          .update({
            status: `HTTP_${page.status}`,
            last_checked_at: new Date().toISOString(),
          })
          .eq("id", item.id)
          .eq("user_id", userId);
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

      checked += 1;
    } catch {
      failed.push(item.url);
      await supabaseAdmin
        .from("monitored_urls")
        .update({
          status: "ERROR",
          last_checked_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("user_id", userId);
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

  return NextResponse.json({
    checked,
    changes,
    deduped,
    noiseFiltered,
    failed,
  });
}
