import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { renderAlertEmail } from "@/lib/emailTemplates";
import { requireUserFromRequest } from "@/lib/routeAuth";

type AlertSettingRow = {
  user_id: string;
  email_mode: "instant" | "daily" | "off";
  min_email_severity: "low" | "medium" | "high";
};

type ChangeRow = {
  id: string;
  domain: "seo" | "pricing" | "cta" | "content";
  severity: "low" | "medium" | "high";
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
  if (threshold === "medium") return ["medium", "high"];
  return ["low", "medium", "high"];
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
        "Mode cron non configure (ALERT_DIGEST_SECRET).",
        401,
        "CRON_NOT_CONFIGURED"
      );
    }
    const provided = request.headers.get("x-digest-secret");
    if (!provided || provided !== digestSecret) {
      return errorResponse("Non autorise.", 401, "UNAUTHORIZED");
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
      .select("id,domain,severity,metadata,detected_at")
      .eq("user_id", setting.user_id)
      .eq("is_read", false)
      .is("digest_sent_at", null)
      .in("severity", severities)
      .order("detected_at", { ascending: false })
      .limit(40);

    if (changesError) continue;

    const rows = (changes || []) as ChangeRow[];
    if (rows.length === 0) continue;

    try {
      const items = rows.slice(0, 20).map((row) => {
        const summary = row.metadata?.summary || `${row.domain} change`;
        const url = row.metadata?.url ? ` — ${row.metadata.url}` : "";
        return `[${row.severity.toUpperCase()}] ${summary}${url}`;
      });
      const { html, text } = renderAlertEmail({
        title: "Digest quotidien des alertes",
        intro: `Seuil applique: ${setting.min_email_severity.toUpperCase()}. Voici les derniers changements non lus.`,
        items,
        ctaUrl: "https://chronocrawl.com/dashboard",
        ctaLabel: "Ouvrir le dashboard",
        footerNote: "Tu peux modifier ce mode depuis le dashboard ChronoCrawl.",
      });

      await resend.emails.send({
        from: "ChronoCrawl <hello@chronocrawl.com>",
        to: email,
        subject: "ChronoCrawl — Digest quotidien des alertes",
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
    } catch {
      // Keep loop resilient if one email fails.
    }
  }

  return NextResponse.json({ sent, processed, code: "OK" });
}
