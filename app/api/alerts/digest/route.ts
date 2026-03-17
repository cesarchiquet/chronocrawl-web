import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { renderAlertEmail } from "@/lib/emailTemplates";
import { requireUserFromRequest } from "@/lib/routeAuth";
import { appLogger } from "@/lib/appLogger";

type AlertSettingRow = {
  user_id: string;
  email_mode: "instant" | "daily" | "off";
  min_email_severity: "low" | "medium" | "high";
};

type ChangeRow = {
  id: string;
  domain: "seo" | "pricing" | "cta";
  severity: "medium" | "high";
  confidence_score: number;
  metadata: { summary?: string; url?: string } | null;
  detected_at: string | null;
};

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const UUID_V4_LOOSE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function errorResponse(
  message: string,
  status: number,
  code: string
) {
  return NextResponse.json(
    {
      error: message,
      code,
    },
    { status }
  );
}

function severitiesFromThreshold(threshold: "low" | "medium" | "high") {
  if (threshold === "high") return ["high"];
  return ["medium", "high"];
}

function actionSuggestion(domain: ChangeRow["domain"]) {
  if (domain === "pricing") return "Comparer les prix, l'offre affichée et le message de valeur.";
  if (domain === "cta") return "Vérifier le CTA visible, sa promesse et sa place dans la page.";
  return "Relire title, H1 et meta pour comprendre le nouvel angle SEO.";
}

export async function POST(request: Request) {
  if (!resend) {
    return errorResponse("RESEND_API_KEY manquante.", 500, "RESEND_NOT_CONFIGURED");
  }

  const digestSecret = process.env.ALERT_DIGEST_SECRET;
  const payload = (await request.json().catch(() => ({}))) as {
    userId?: string;
  };
  const userId = payload.userId?.trim();
  if (userId && !UUID_V4_LOOSE_REGEX.test(userId)) {
    return errorResponse("Format userId invalide.", 400, "INVALID_USER_ID");
  }
  const hasBearer = request.headers.get("authorization")?.startsWith("Bearer ");

  if (hasBearer) {
    const auth = await requireUserFromRequest(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    if (userId && userId !== auth.user.id) {
      return errorResponse("Utilisateur invalide.", 403, "USER_FORBIDDEN");
    }
  } else {
    if (!digestSecret) {
      return errorResponse(
        "Mode cron non configuré (ALERT_DIGEST_SECRET).",
        401,
        "CRON_NOT_CONFIGURED"
      );
    }
    const provided = request.headers.get("x-digest-secret");
    if (!provided || provided !== digestSecret) {
      return errorResponse("Non autorisé.", 401, "UNAUTHORIZED");
    }
  }

  const settingsQuery = supabaseAdmin
    .from("user_alert_settings")
    .select("user_id,email_mode,min_email_severity")
    .eq("email_mode", "daily");

  const { data: settingsRows, error: settingsError } = userId
    ? await settingsQuery.eq("user_id", userId)
    : await settingsQuery;

  if (settingsError) {
    return errorResponse(settingsError.message, 500, "SETTINGS_QUERY_FAILED");
  }

  const settings = (settingsRows || []) as AlertSettingRow[];
  if (settings.length === 0) {
    appLogger.info("digest:no_settings");
    return NextResponse.json({ sent: 0, processed: 0 });
  }

  let processed = 0;
  let sent = 0;

  for (const setting of settings) {
    processed += 1;
    const userResponse = await supabaseAdmin.auth.admin.getUserById(
      setting.user_id
    );
    const email = userResponse.data.user?.email;
    if (!email) continue;

    const severities = severitiesFromThreshold(setting.min_email_severity);
    const { data: changes, error: changesError } = await supabaseAdmin
      .from("detected_changes")
      .select("id,domain,severity,confidence_score,metadata,detected_at")
      .eq("user_id", setting.user_id)
      .eq("is_read", false)
      .is("digest_sent_at", null)
      .in("severity", severities)
      .in("domain", ["seo", "pricing", "cta"])
      .order("detected_at", { ascending: false })
      .limit(40);

    if (changesError) continue;

    const rows = (changes || []) as ChangeRow[];
    if (rows.length === 0) continue;

    const rankedRows = [...rows].sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "high" ? -1 : 1;
      return (b.confidence_score || 0) - (a.confidence_score || 0);
    });

    const highCount = rankedRows.filter((row) => row.severity === "high").length;
    const mediumCount = rows.filter((row) => row.severity === "medium").length;
    const coveredUrls = new Set(
      rows.map((row) => row.metadata?.url).filter(Boolean)
    ).size;
    const domainCounts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.domain] = (acc[row.domain] || 0) + 1;
      return acc;
    }, {});
    const topDomain =
      Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "seo";

    const { data: usage } = await supabaseAdmin
      .from("user_monitor_usage")
      .select("run_count")
      .eq("user_id", setting.user_id)
      .maybeSingle<{ run_count: number }>();
    const runCount = usage?.run_count || 0;
    const relanceNote =
      runCount < 2
        ? "Relance usage : lance une analyse manuelle aujourd'hui pour garder les alertes à jour."
        : "Usage OK : le moteur tourne régulièrement.";

    try {
      const headlineItems = [
        `Résumé actionnable : ${highCount} HIGH, ${mediumCount} MEDIUM, domaine prioritaire ${topDomain.toUpperCase()}.`,
        `Action prioritaire du jour : ${actionSuggestion(topDomain as ChangeRow["domain"])}`,
        relanceNote,
      ];

      const alertItems = rankedRows.slice(0, 17).map((row) => {
        const summary = row.metadata?.summary || `${row.domain} change`;
        const url = row.metadata?.url ? ` — ${row.metadata.url}` : "";
        return `[${row.severity.toUpperCase()}] ${summary}${url} | Verification: ${actionSuggestion(row.domain)}`;
      });
      const items = [...headlineItems, ...alertItems];
      const subject =
        highCount > 0
          ? `ChronoCrawl — ${highCount} alerte(s) prioritaire(s) aujourd'hui`
          : "ChronoCrawl — Digest quotidien des alertes";
      const { html, text } = renderAlertEmail({
        title: "Digest quotidien des alertes",
        intro: `Voici le résumé des alertes non lues à revoir aujourd'hui. Seuil appliqué : ${setting.min_email_severity.toUpperCase()}.`,
        items,
        ctaUrl: "https://chronocrawl.com/dashboard",
        ctaLabel: "Ouvrir le dashboard",
        metaChips: [
          `${rows.length} alertes non lues`,
          `${coveredUrls} URL(s) couvertes`,
          `${highCount} priorité(s) haute(s)`,
        ],
        highlightTitle: "Action à prendre aujourd'hui",
        highlightBody: actionSuggestion(topDomain as ChangeRow["domain"]),
        footerNote:
          "Tu peux modifier ce mode depuis le dashboard ChronoCrawl. Objectif : revenir vite sur les alertes qui méritent une vérification.",
      });

      await resend.emails.send({
        from: "ChronoCrawl <hello@chronocrawl.com>",
        to: email,
        subject,
        html,
        text,
      });

      await supabaseAdmin
        .from("detected_changes")
        .update({ digest_sent_at: new Date().toISOString() })
        .in(
          "id",
          rows.map((r) => r.id)
        )
        .eq("user_id", setting.user_id);

      sent += 1;
      appLogger.info("digest:sent", {
        userId: setting.user_id,
        rows: rows.length,
        highCount,
        mediumCount,
        topDomain,
      });
    } catch {
      appLogger.warn("digest:send_failed", {
        userId: setting.user_id,
      });
    }
  }

  appLogger.info("digest:completed", { sent, processed });
  return NextResponse.json({ sent, processed, code: "OK" });
}
