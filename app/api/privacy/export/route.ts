import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/routeAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { appLogger } from "@/lib/appLogger";

type ExportBundle = {
  generated_at: string;
  account: {
    id: string;
    email: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
  };
  monitored_urls: unknown[];
  detected_changes: unknown[];
  url_snapshots: unknown[];
  user_alert_settings: unknown | null;
  user_subscriptions: unknown | null;
  user_monitor_usage: unknown | null;
  monitor_run_logs: unknown[];
};

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const userId = auth.user.id;
  try {
    const [urlsRes, changesRes, snapshotsRes, settingsRes, subRes, usageRes, logsRes] =
      await Promise.all([
        supabaseAdmin
          .from("monitored_urls")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("detected_changes")
          .select("*")
          .eq("user_id", userId)
          .order("detected_at", { ascending: false }),
        supabaseAdmin
          .from("url_snapshots")
          .select("*")
          .eq("user_id", userId)
          .order("fetched_at", { ascending: false }),
        supabaseAdmin
          .from("user_alert_settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("user_monitor_usage")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("monitor_run_logs")
          .select("*")
          .eq("user_id", userId)
          .order("started_at", { ascending: false }),
      ]);

    const errors = [
      urlsRes.error,
      changesRes.error,
      snapshotsRes.error,
      settingsRes.error,
      subRes.error,
      usageRes.error,
      logsRes.error,
    ].filter(Boolean);
    if (errors.length > 0) {
      appLogger.error("privacy_export:query_failed", {
        userId,
        errors: errors.map((entry) => String(entry?.message || entry)),
      });
      return NextResponse.json(
        { error: "Export impossible pour le moment." },
        { status: 500 }
      );
    }

    const payload: ExportBundle = {
      generated_at: new Date().toISOString(),
      account: {
        id: auth.user.id,
        email: auth.user.email || null,
        created_at: auth.user.created_at || null,
        last_sign_in_at: auth.user.last_sign_in_at || null,
      },
      monitored_urls: urlsRes.data || [],
      detected_changes: changesRes.data || [],
      url_snapshots: snapshotsRes.data || [],
      user_alert_settings: settingsRes.data || null,
      user_subscriptions: subRes.data || null,
      user_monitor_usage: usageRes.data || null,
      monitor_run_logs: logsRes.data || [],
    };

    appLogger.info("privacy_export:success", {
      userId,
      monitoredUrls: (payload.monitored_urls || []).length,
      changes: (payload.detected_changes || []).length,
      snapshots: (payload.url_snapshots || []).length,
    });

    return NextResponse.json({ export: payload, code: "OK" });
  } catch (error: unknown) {
    appLogger.error("privacy_export:unexpected_error", {
      userId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Erreur interne export RGPD." },
      { status: 500 }
    );
  }
}
