"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, type Variants } from "framer-motion";
import type { Session } from "@supabase/supabase-js";
import {
  getAlertChangeSummary,
  getAlertConfidence,
  getAlertImpactLabel,
  getAlertRecommendedAction,
} from "@/lib/alertPresentation";
import { formatAlertDateShort } from "@/lib/dateFormat";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

type MonitoredUrl = {
  id: string;
  url: string;
  status: string | null;
  last_checked_at: string | null;
  created_at: string;
};

type ChangeEvent = {
  id: string;
  monitored_url_id: string;
  domain: "seo" | "pricing" | "cta" | "content";
  severity: "low" | "medium" | "high";
  field_key: string;
  metadata: {
    summary?: string;
    url?: string;
    before_short?: string;
    after_short?: string;
    priority_score?: number;
    priority_reason?: string;
  } | null;
  detected_at: string | null;
  is_read: boolean | null;
};

type SubscriptionState = {
  plan: "starter" | "pro" | "agency";
  status: string;
  trial_end: string | null;
};
type MonitorRunLog = {
  status: string;
  checked: number;
  changes: number;
  failed_count: number;
  queued_remaining: number;
  duration_ms: number;
  started_at: string;
};

const EVENTS_PAGE_SIZE = 1000;
const ANALYSIS_SEVERITY_LEVELS: Array<ChangeEvent["severity"]> = [
  "low",
  "medium",
  "high",
];

function getUrlStatusInfo(statusRaw: string | null) {
  const status = (statusRaw || "OK").toUpperCase();

  if (status === "OK") {
    return {
      label: "OK",
      badgeClass: "bg-emerald-500/20 text-emerald-300",
      detail: "Surveillance active.",
      hint: "",
    };
  }

  if (status === "TIMEOUT") {
    return {
      label: "TIMEOUT",
      badgeClass: "bg-amber-500/20 text-amber-300",
      detail: "Le site a depasse le delai de reponse.",
      hint: "Relance plus tard ou verifie la latence du site cible.",
    };
  }

  if (status === "DNS_ERROR") {
    return {
      label: "DNS_ERROR",
      badgeClass: "bg-rose-500/20 text-rose-300",
      detail: "Le domaine est introuvable via DNS.",
      hint: "Verifie l'URL et le nom de domaine.",
    };
  }

  if (status === "SSL_ERROR") {
    return {
      label: "SSL_ERROR",
      badgeClass: "bg-rose-500/20 text-rose-300",
      detail: "Erreur TLS/SSL sur le site cible.",
      hint: "Verifie le certificat HTTPS du site.",
    };
  }

  if (status === "NETWORK_ERROR" || status === "ERROR") {
    return {
      label: status,
      badgeClass: "bg-amber-500/20 text-amber-300",
      detail: "Erreur reseau temporaire.",
      hint: "Relance l'analyse; si recurrent, verifier l'accessibilite.",
    };
  }

  if (status.startsWith("HTTP_")) {
    const code = Number(status.replace("HTTP_", ""));
    if (code === 403) {
      return {
        label: status,
        badgeClass: "bg-rose-500/20 text-rose-300",
        detail: "Acces refuse par le site cible.",
        hint: "Le site bloque probablement les bots ou necessite auth.",
      };
    }
    if (code === 404) {
      return {
        label: status,
        badgeClass: "bg-amber-500/20 text-amber-300",
        detail: "Page introuvable.",
        hint: "Met a jour ou supprime cette URL.",
      };
    }
    if (code >= 500) {
      return {
        label: status,
        badgeClass: "bg-amber-500/20 text-amber-300",
        detail: "Erreur serveur du site cible.",
        hint: "Reessaye plus tard.",
      };
    }
    return {
      label: status,
      badgeClass: "bg-amber-500/20 text-amber-300",
      detail: "Requete HTTP en echec.",
      hint: "Verifier la page et ses restrictions d'acces.",
    };
  }

  return {
    label: status,
    badgeClass: "bg-amber-500/20 text-amber-300",
    detail: "Statut de surveillance non standard.",
    hint: "Relance une analyse pour rafraichir l'etat.",
  };
}

function normalizeMonitoredUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    parsed.hash = "";
    if (parsed.pathname.endsWith("/") && parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function formatDateTimeFr(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("fr-FR");
}

function getRunHealthInfo(
  runLog: MonitorRunLog | null,
  failureRate: number
): { label: string; badgeClass: string; detail: string } {
  if (!runLog) {
    return {
      label: "AUCUNE EXECUTION",
      badgeClass: "bg-white/10 text-gray-200",
      detail: "Lance une premiere analyse pour initialiser le suivi.",
    };
  }

  const status = (runLog.status || "unknown").toUpperCase();
  if (status === "SUCCESS" && failureRate <= 20) {
    return {
      label: "STABLE",
      badgeClass: "bg-emerald-500/20 text-emerald-200",
      detail: `Derniere execution en ${runLog.duration_ms} ms.`,
    };
  }
  if (status === "PARTIAL_SUCCESS" || status === "PARTIAL") {
    return {
      label: "PARTIEL",
      badgeClass: "bg-amber-500/20 text-amber-200",
      detail:
        "Certaines URLs n'ont pas ete traitees. Relance une analyse pour completer.",
    };
  }
  if (status === "FAILED" || failureRate > 20) {
    return {
      label: "A SURVEILLER",
      badgeClass: "bg-rose-500/20 text-rose-200",
      detail: "Taux d'echec eleve. Verifie les URLs en erreur et relance.",
    };
  }
  return {
    label: status,
    badgeClass: "bg-amber-500/20 text-amber-200",
    detail: `Execution recente: ${runLog.duration_ms} ms, ${failureRate}% d'echec.`,
  };
}

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState<MonitoredUrl[]>([]);
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [billingMessage, setBillingMessage] = useState("");
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [analysisSeverities, setAnalysisSeverities] = useState<
    ChangeEvent["severity"][]
  >(["low", "medium", "high"]);
  const [alertFilter, setAlertFilter] = useState<"all" | "unread" | "read">(
    "all"
  );
  const [alertUrlFilter, setAlertUrlFilter] = useState("all");
  const [alertSearchQuery, setAlertSearchQuery] = useState("");
  const [alertDateFilter, setAlertDateFilter] = useState<
    "all" | "24h" | "7d" | "30d"
  >("all");
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [filterReferenceNow, setFilterReferenceNow] = useState(() => Date.now());
  const [emailMode, setEmailMode] = useState<"instant" | "daily" | "off">(
    "instant"
  );
  const [minEmailSeverity, setMinEmailSeverity] = useState<
    "low" | "medium" | "high"
  >("high");
  const [digestHour, setDigestHour] = useState(8);
  const [alertSettingsMessage, setAlertSettingsMessage] = useState("");
  const [digestMessage, setDigestMessage] = useState("");
  const [savingAlertSettings, setSavingAlertSettings] = useState(false);
  const [runningDigest, setRunningDigest] = useState(false);
  const [subscriptionState, setSubscriptionState] =
    useState<SubscriptionState | null>(null);
  const [changes24h, setChanges24h] = useState(0);
  const [high7d, setHigh7d] = useState(0);
  const [dailyRunCount, setDailyRunCount] = useState(0);
  const [dailyRunStartedAt, setDailyRunStartedAt] = useState<string | null>(null);
  const [latestRunLog, setLatestRunLog] = useState<MonitorRunLog | null>(null);
  const [recentRunFailureRate, setRecentRunFailureRate] = useState(0);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  useEffect(() => {
    const hydrateSession = async () => {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        setSession(refreshed.session);
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const currentStatus =
      (session.user.user_metadata?.subscription_status as string | undefined) ||
      "inactive";
    const isActive =
      currentStatus === "active" || currentStatus === "trialing";

    if (isActive) return;

    const interval = setInterval(async () => {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        setSession(refreshed.session);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [session?.user, session?.user?.id, session?.user?.user_metadata?.subscription_status]);

  const loadAllEvents = useCallback(async (userId: string) => {
    const rows: ChangeEvent[] = [];
    let from = 0;

    while (true) {
      const to = from + EVENTS_PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("detected_changes")
        .select(
          "id,monitored_url_id,domain,severity,field_key,metadata,detected_at,is_read"
        )
        .eq("user_id", userId)
        .order("detected_at", { ascending: false })
        .range(from, to);

      if (error || !data || data.length === 0) break;

      rows.push(...(data as ChangeEvent[]));
      if (data.length < EVENTS_PAGE_SIZE) break;
      from += EVENTS_PAGE_SIZE;
    }

    return rows;
  }, []);

  const loadData = useCallback(async (userId: string) => {
    const { data: urlsData } = await supabase
      .from("monitored_urls")
      .select("id,url,status,last_checked_at,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setUrls(urlsData || []);

    const eventsData = await loadAllEvents(userId);

    const domainRank: Record<ChangeEvent["domain"], number> = {
      seo: 0,
      pricing: 1,
      cta: 2,
      content: 3,
    };
    const severityRank: Record<ChangeEvent["severity"], number> = {
      high: 0,
      medium: 1,
      low: 2,
    };

    const ranked = eventsData.sort((a, b) => {
        const dateDelta = (b.detected_at || "").localeCompare(a.detected_at || "");
        if (dateDelta !== 0) return dateDelta;
        const domainDelta = domainRank[a.domain] - domainRank[b.domain];
        if (domainDelta !== 0) return domainDelta;
        return severityRank[a.severity] - severityRank[b.severity];
      });

    setEvents(ranked);

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { count: changeCount24h } = await supabase
      .from("detected_changes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("detected_at", since24h);

    const { count: highCount7d } = await supabase
      .from("detected_changes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("severity", "high")
      .gt("detected_at", since7d);

    const { data: usage } = await supabase
      .from("user_monitor_usage")
      .select("run_count,window_started_at")
      .eq("user_id", userId)
      .maybeSingle<{ run_count: number; window_started_at: string }>();

    const { data: runLogsData } = await supabase
      .from("monitor_run_logs")
      .select(
        "status,checked,changes,failed_count,queued_remaining,duration_ms,started_at"
      )
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(20);

    setChanges24h(changeCount24h || 0);
    setHigh7d(highCount7d || 0);
    setDailyRunCount(usage?.run_count || 0);
    setDailyRunStartedAt(usage?.window_started_at || null);
    const runLogs = (runLogsData || []) as MonitorRunLog[];
    setLatestRunLog(runLogs[0] || null);
    if (runLogs.length === 0) {
      setRecentRunFailureRate(0);
    } else {
      const failedRuns = runLogs.filter((row) => row.failed_count > 0).length;
      setRecentRunFailureRate(Math.round((failedRuns / runLogs.length) * 100));
    }
  }, [loadAllEvents]);

  const loadSubscriptionState = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_subscriptions")
      .select("plan,status,trial_end")
      .eq("user_id", userId)
      .maybeSingle<SubscriptionState>();
    setSubscriptionState(data || null);
  }, []);

  const loadAlertSettings = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("user_alert_settings")
      .select("email_mode,min_email_severity,digest_hour")
      .eq("user_id", userId)
      .maybeSingle<{
        email_mode: "instant" | "daily" | "off";
        min_email_severity: "low" | "medium" | "high";
        digest_hour: number;
      }>();

    if (error) {
      setAlertSettingsMessage(
        "Preferences alertes indisponibles (verifie la migration SQL et recharge)."
      );
      return;
    }

    if (!data) return;
    setEmailMode(data.email_mode || "instant");
    setMinEmailSeverity(data.min_email_severity || "high");
    setDigestHour(Number.isFinite(data.digest_hour) ? data.digest_hour : 8);
  }, []);

  const markAlertAsRead = async (id: string, isRead: boolean) => {
    const { error } = await supabase
      .from("detected_changes")
      .update({ is_read: isRead })
      .eq("id", id);

    if (!error) {
      setEvents((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: isRead } : item))
      );
    }
  };

  const markAllAsRead = async () => {
    if (!session?.user) return;
    const { error } = await supabase
      .from("detected_changes")
      .update({ is_read: true })
      .eq("user_id", session.user.id)
      .or("is_read.eq.false,is_read.is.null");

    if (!error) {
      setEvents((prev) => prev.map((item) => ({ ...item, is_read: true })));
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    void loadSubscriptionState(userId);
    void loadData(userId);
    void loadAlertSettings(userId);
  }, [loadAlertSettings, loadData, loadSubscriptionState, session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const interval = setInterval(() => {
      void loadData(userId);
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData, session?.user?.id]);

  useEffect(() => {
    setFilterReferenceNow(Date.now());
  }, [alertDateFilter, events.length]);

  useEffect(() => {
    if (!expandedAlertId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpandedAlertId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedAlertId]);

  const saveAlertSettings = async () => {
    if (!session?.user) return;
    setAlertSettingsMessage("");
    setSavingAlertSettings(true);
    const { error } = await supabase.from("user_alert_settings").upsert(
      {
        user_id: session.user.id,
        email_mode: emailMode,
        min_email_severity: minEmailSeverity,
        digest_hour: digestHour,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      setAlertSettingsMessage(
        "Impossible de sauvegarder les preferences. Verifie la migration SQL."
      );
      setSavingAlertSettings(false);
      return;
    }

    setAlertSettingsMessage("Preferences enregistrees.");
    setSavingAlertSettings(false);
  };

  const runDailyDigestNow = async () => {
    if (!session?.user?.id || !session?.access_token) return;
    setDigestMessage("");
    setRunningDigest(true);
    try {
      const response = await fetch("/api/alerts/digest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: session.user.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Digest impossible.");
      }
      setDigestMessage(
        `Digest traite: ${data.processed ?? 0} compte(s), ${data.sent ?? 0} email(s) envoye(s).`
      );
    } catch (error: unknown) {
      setDigestMessage(
        error instanceof Error ? error.message : "Erreur digest."
      );
    } finally {
      setRunningDigest(false);
    }
  };

  const addUrl = async () => {
    if (!newUrl || !session?.user) return;
    const normalizedUrl = normalizeMonitoredUrl(newUrl);
    if (!normalizedUrl) {
      setMessage("URL invalide. Utilise un format http(s)://...");
      return;
    }
    setMessage("");

    const { error } = await supabase.from("monitored_urls").insert([
      {
        url: normalizedUrl,
        user_id: session.user.id,
        status: "OK",
      },
    ]);

    if (error) {
      setMessage("Impossible d’ajouter cette URL.");
      return;
    }

    setNewUrl("");
    await loadData(session.user.id);
  };

  const removeUrl = async (id: string) => {
    await supabase.from("monitored_urls").delete().eq("id", id);
    if (session?.user?.id) {
      await loadData(session.user.id);
    }
  };

  const allAnalysisSeveritiesSelected =
    analysisSeverities.length === ANALYSIS_SEVERITY_LEVELS.length;

  const toggleAnalysisSeverity = (level: ChangeEvent["severity"]) => {
    setAnalysisSeverities((prev) => {
      if (prev.includes(level)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== level);
      }
      return ANALYSIS_SEVERITY_LEVELS.filter(
        (item) => item === level || prev.includes(item)
      );
    });
  };

  const toggleAllAnalysisSeverities = (checked: boolean) => {
    if (!checked) return;
    setAnalysisSeverities([...ANALYSIS_SEVERITY_LEVELS]);
  };

  const runAnalysis = async () => {
    if (!session?.user?.id || !session?.access_token) return;
    setAnalysisMessage("");
    setAnalysisRunning(true);

    try {
      let totalChecked = 0;
      let totalChanges = 0;
      let totalDeduped = 0;
      let totalNoise = 0;
      let totalFailed = 0;
      const failedSamples: string[] = [];
      let queuedRemaining = 0;
      let rounds = 0;
      const maxRounds = 30;

      do {
        const response = await fetch("/api/monitor/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            continueQueue: rounds > 0,
            severities: analysisSeverities,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Analyse impossible.");
        }

        totalChecked += Number(data?.checked || 0);
        totalChanges += Number(data?.changes || 0);
        totalDeduped += Number(data?.deduped || 0);
        totalNoise += Number(data?.noiseFiltered || 0);
        if (Array.isArray(data?.failed)) {
          totalFailed += data.failed.length;
          for (const item of data.failed as string[]) {
            if (failedSamples.length >= 3) break;
            failedSamples.push(item);
          }
        }
        queuedRemaining = Number(data?.queuedRemaining || 0);
        rounds += 1;

        if (queuedRemaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, 120));
        }
      } while (queuedRemaining > 0 && rounds < maxRounds);

      const overflowNote =
        queuedRemaining > 0
          ? ` File partiellement traitee (${queuedRemaining} URL(s) restantes). Relance l'analyse.`
          : "";

      const thresholdLabel = allAnalysisSeveritiesSelected
        ? "TOUS"
        : analysisSeverities.map((level) => level.toUpperCase()).join(" + ");
      setAnalysisMessage(
        `Analyse terminee (seuil ${thresholdLabel}): ${totalChecked} URL verifiee(s), ${totalChanges} changement(s), ${totalDeduped} dedoublonne(s), ${totalNoise} bruit(s) ignore(s), ${totalFailed} echec(s).${failedSamples.length > 0 ? ` Exemples: ${failedSamples.join(" | ")}.` : ""}${overflowNote}`
      );
      await loadData(session.user.id);
    } catch (error: unknown) {
      const details =
        error instanceof Error ? error.message : "Erreur pendant l'analyse.";
      setAnalysisMessage(details);
    } finally {
      setAnalysisRunning(false);
    }
  };

  const jumpToAddUrl = () => {
    const target = document.getElementById("add-url-panel");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const quickStartAddSample = () => {
    if (!newUrl.trim()) {
      setNewUrl("https://site-concurrent.com/pricing");
    }
    jumpToAddUrl();
  };

  const plan =
    (subscriptionState?.plan as
      | "starter"
      | "pro"
      | "agency"
      | undefined) ||
    (session?.user?.user_metadata?.plan as
      | "starter"
      | "pro"
      | "agency"
      | undefined) || "starter";

  const limits: Record<string, number> = {
    starter: 10,
    pro: 50,
    agency: 200,
  };

  const limit = limits[plan] || limits.starter;
  const currentCount = urls.length;
  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
  const bypassEmails =
    process.env.NEXT_PUBLIC_TEST_BYPASS_EMAILS?.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) || [];
  const userEmail = session?.user?.email?.toLowerCase();
  const isBypass = testMode && !!userEmail && bypassEmails.includes(userEmail);
  const subscriptionStatus =
    subscriptionState?.status ||
    (session?.user?.user_metadata?.subscription_status as string | undefined);
  const effectiveSubscriptionStatus =
    subscriptionStatus === "pending_checkout"
      ? (session?.user?.user_metadata?.subscription_status as string | undefined) ||
        "inactive"
      : subscriptionStatus;
  const trialEndRaw =
    subscriptionState?.trial_end ||
    (session?.user?.user_metadata?.subscription_trial_end as
    | string
    | undefined);
  const hasActiveSubscription =
    effectiveSubscriptionStatus === "active" ||
    effectiveSubscriptionStatus === "trialing";
  const canAddUrl =
    (isBypass || hasActiveSubscription) && currentCount < limit;
  const trialEndDate = trialEndRaw ? new Date(trialEndRaw) : null;
  const trialDaysLeft =
    trialEndDate && Number.isFinite(trialEndDate.getTime())
      ? Math.max(
          0,
          Math.ceil(
            (trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        )
      : null;
  const runHealthInfo = getRunHealthInfo(latestRunLog, recentRunFailureRate);
  const unreadCount = events.filter((item) => !item.is_read).length;
  const alertUrls = useMemo(() => {
    const values = new Set<string>();
    for (const item of urls) {
      if (item.url) values.add(item.url);
    }
    for (const event of events) {
      const url = event.metadata?.url;
      if (url) values.add(url);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [urls, events]);

  const filteredEvents = useMemo(() => {
    const fromMs =
      alertDateFilter === "24h"
        ? filterReferenceNow - 24 * 60 * 60 * 1000
        : alertDateFilter === "7d"
          ? filterReferenceNow - 7 * 24 * 60 * 60 * 1000
          : alertDateFilter === "30d"
            ? filterReferenceNow - 30 * 24 * 60 * 60 * 1000
            : null;
    const query = alertSearchQuery.trim().toLowerCase();

    return events.filter((item) => {
      if (alertFilter === "unread" && item.is_read) return false;
      if (alertFilter === "read" && !item.is_read) return false;
      if (alertSeverityFilter !== "all" && item.severity !== alertSeverityFilter) {
        return false;
      }
      if (alertUrlFilter !== "all" && item.metadata?.url !== alertUrlFilter) {
        return false;
      }
      if (fromMs !== null) {
        const detectedMs = item.detected_at ? Date.parse(item.detected_at) : NaN;
        if (!Number.isFinite(detectedMs) || detectedMs < fromMs) return false;
      }
      if (query) {
        const haystack = [
          item.metadata?.summary || "",
          item.metadata?.url || "",
          item.field_key || "",
          item.domain || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [
    alertDateFilter,
    alertFilter,
    alertSearchQuery,
    alertSeverityFilter,
    alertUrlFilter,
    events,
    filterReferenceNow,
  ]);

  const getPriorityScore = (item: ChangeEvent) => {
    const raw = item.metadata?.priority_score;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (item.severity === "high") return 85;
    if (item.severity === "medium") return 60;
    return 30;
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 75) return "Haute";
    if (score >= 45) return "Moyenne";
    return "Basse";
  };

  const getPriorityClass = (score: number) => {
    if (score >= 75) return "bg-red-500/15 text-red-200";
    if (score >= 45) return "bg-amber-500/15 text-amber-200";
    return "bg-emerald-500/15 text-emerald-200";
  };

  const expandedAlert = useMemo(
    () => events.find((item) => item.id === expandedAlertId) || null,
    [events, expandedAlertId]
  );

  const openBillingPortal = async () => {
    setBillingMessage("");
    if (!session?.access_token) {
      setBillingMessage("Session invalide. Reconnecte-toi.");
      return;
    }
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok || !data?.url) {
        throw new Error(
          data?.error ||
            "Impossible d'ouvrir la gestion d'abonnement pour le moment."
        );
      }
      window.location.href = data.url;
    } catch (error: unknown) {
      const details =
        error instanceof Error ? error.message : "Erreur Stripe.";
      setBillingMessage(details);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-10">
          <div className="h-6 w-32 rounded bg-white/10 animate-pulse" />
          <div className="mt-4 h-12 w-3/4 rounded bg-white/10 animate-pulse" />
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-14 rounded-lg border border-white/10 bg-white/5 animate-pulse"
              />
            ))}
          </div>
        </section>
        <section className="max-w-6xl mx-auto px-6 pb-16 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 rounded-lg border border-white/10 bg-black/20 animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="h-6 w-36 rounded bg-white/10 animate-pulse" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-14 rounded-lg border border-white/10 bg-black/20 animate-pulse"
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-xl mx-auto px-6 pt-28 pb-24 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold">
            Connecte‑toi pour accéder au dashboard
          </h1>
          <p className="mt-4 text-gray-300">
            L’accès au dashboard est réservé aux utilisateurs connectés.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium mt-8"
          >
            Se connecter
          </a>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-6 pt-20 pb-16"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-indigo-300 text-sm font-medium">Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-bold">
              Veille concurrentielle en un coup d’œil
            </h1>
            <p className="mt-3 text-gray-300">
              Suis tes URLs, détecte les changements et reçois des alertes en
              temps réel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openBillingPortal}
              className="px-6 py-3 rounded-lg border border-indigo-300/30 text-indigo-200 hover:bg-indigo-500/10 transition"
            >
              Gérer l&apos;abonnement
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition"
            >
              Se déconnecter
            </button>
          </div>
        </div>
        {billingMessage && (
          <p className="mt-3 text-sm text-amber-200">{billingMessage}</p>
        )}
        {effectiveSubscriptionStatus === "trialing" && (
          <div className="mt-4 rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-4 text-sm text-indigo-100">
            <p className="font-medium">Essai en cours</p>
            <p className="mt-1 text-indigo-200">
              {trialDaysLeft !== null
                ? `Il te reste ${trialDaysLeft} jour${trialDaysLeft > 1 ? "s" : ""} d'essai.`
                : "Ton essai est actif. Passe au plan superieur quand tu veux depuis \"Gerer l'abonnement\"."}
            </p>
          </div>
        )}
        {effectiveSubscriptionStatus === "inactive" && (
          <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p className="font-medium">Abonnement inactif</p>
            <p className="mt-1 text-amber-200">
              Ton compte a ete retrograde sur STARTER. Choisis un abonnement actif pour relancer la surveillance.
            </p>
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-200">
            Plan: {plan.toUpperCase()}
          </span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-200">
            {currentCount}/{limit} URLs
          </span>
          {!hasActiveSubscription && !isBypass && (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-200">
              Abonnement requis pour activer la surveillance
            </span>
          )}
          {isBypass && (
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-200">
              Mode test activé
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200">
            Changements 24h: <span className="font-semibold">{changes24h}</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200">
            Alertes HIGH 7j: <span className="font-semibold">{high7d}</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200">
            Analyses 24h: <span className="font-semibold">{dailyRunCount}</span>
            {dailyRunStartedAt ? (
              <span className="text-gray-400"> (depuis {formatDateTimeFr(dailyRunStartedAt)})</span>
            ) : null}
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200">
            <span className="inline-flex items-center gap-1">
              Sante monitoring:
              <span className="relative inline-flex items-center group">
                <button
                  type="button"
                  aria-label="Information sur la sante monitoring"
                  className="h-4 w-4 rounded-full border border-white/20 text-[10px] leading-none text-gray-300 hover:text-white hover:border-white/40"
                >
                  i
                </button>
                <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-72 -translate-x-1/2 rounded-md border border-white/10 bg-[#0b1025] p-2 text-[11px] text-gray-200 shadow-lg group-hover:block group-focus-within:block">
                  <span className="block">- STABLE: les derniers runs se passent bien.</span>
                  <span className="block mt-1">- PARTIEL: certaines URLs n&apos;ont pas ete traitees.</span>
                  <span className="block mt-1">- A SURVEILLER: taux d&apos;echec eleve, relance conseillée.</span>
                </span>
              </span>
            </span>{" "}
            <span className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${runHealthInfo.badgeClass}`}>
              {runHealthInfo.label}
            </span>
            {latestRunLog ? (
              <span className="text-gray-400">
                {" "}
                ({latestRunLog.duration_ms} ms, {recentRunFailureRate}% analyses en echec)
              </span>
            ) : null}
            <p className="text-[11px] text-gray-400 mt-1">{runHealthInfo.detail}</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-indigo-300/30 bg-indigo-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-indigo-200">
            Demarrage rapide
          </p>
          <h2 className="mt-1 text-lg font-semibold">Lancer la veille en 2 etapes</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <button
              onClick={quickStartAddSample}
              className="rounded-lg border border-white/15 bg-white/5 p-3 text-left hover:bg-white/10 transition"
            >
              <p className="text-xs text-indigo-200">Etape 1</p>
              <p className="mt-1 text-sm font-medium">Ajouter une URL concurrente</p>
              <p className="mt-1 text-xs text-gray-300">
                Prefill automatique d&apos;une URL exemple pour gagner du temps.
              </p>
            </button>
            <button
              onClick={() => {
                jumpToAddUrl();
                document.getElementById("analyze-now-btn")?.focus();
              }}
              className="rounded-lg border border-white/15 bg-white/5 p-3 text-left hover:bg-white/10 transition"
            >
              <p className="text-xs text-indigo-200">Etape 2</p>
              <p className="mt-1 text-sm font-medium">Cliquer sur Analyser maintenant</p>
              <p className="mt-1 text-xs text-gray-300">
                Premiere analyse immediatement avec les seuils d&apos;alerte choisis.
              </p>
            </button>
          </div>
        </div>
      </motion.section>

      <section className="max-w-6xl mx-auto px-6 pb-16 grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 rounded-xl bg-white/5 border border-white/10 p-6 max-h-[620px] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">URLs surveillées</h2>
          <div className="space-y-4">
            {urls.length === 0 && (
              <p className="text-gray-400 text-sm">
                Aucune URL pour le moment.
              </p>
            )}
            {urls.map((item) => {
              const statusInfo = getUrlStatusInfo(item.status);
              return (
              <div key={item.id} className="rounded-lg border border-white/10 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                  <p className="text-sm text-gray-300">{item.url}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Dernière vérification :
                    {" " + formatDateTimeFr(item.last_checked_at)}
                  </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.label}
                    </span>
                    <button
                      onClick={() => removeUrl(item.id)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                {item.status && item.status !== "OK" && (
                  <p className="text-xs text-amber-200 mt-2">
                    {statusInfo.detail}{" "}
                    <span className="text-amber-100/80">
                      {statusInfo.hint}
                    </span>
                  </p>
                )}
              </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-6 max-h-[620px] overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold">Centre d&apos;alertes</h2>
            <div className="flex items-center gap-2">
              <a
                href="/dashboard/alerts"
                className="text-xs px-2 py-1 rounded border border-indigo-300/30 text-indigo-200 hover:bg-indigo-500/10 transition"
              >
                Historique
              </a>
              <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-200">
                {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
              </span>
              <button
                onClick={markAllAsRead}
                className="text-xs px-2 py-1 rounded border border-white/15 hover:bg-white/5 transition"
                disabled={unreadCount === 0}
              >
                Tout marquer lu
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setAlertFilter("all")}
              className={`text-xs px-2 py-1 rounded-full border transition ${
                alertFilter === "all"
                  ? "border-indigo-300/40 bg-indigo-500/15 text-indigo-100"
                  : "border-white/15 text-gray-300 hover:bg-white/5"
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setAlertFilter("unread")}
              className={`text-xs px-2 py-1 rounded-full border transition ${
                alertFilter === "unread"
                  ? "border-indigo-300/40 bg-indigo-500/15 text-indigo-100"
                  : "border-white/15 text-gray-300 hover:bg-white/5"
              }`}
            >
              Non lues
            </button>
            <button
              onClick={() => setAlertFilter("read")}
              className={`text-xs px-2 py-1 rounded-full border transition ${
                alertFilter === "read"
                  ? "border-indigo-300/40 bg-indigo-500/15 text-indigo-100"
                  : "border-white/15 text-gray-300 hover:bg-white/5"
              }`}
            >
              Lues
            </button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-xs text-gray-300">URL</label>
            <select
              value={alertUrlFilter}
              onChange={(e) => setAlertUrlFilter(e.target.value)}
              className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
            >
              <option value="all">Toutes les URLs</option>
              {alertUrls.map((url) => (
                <option key={url} value={url}>
                  {url}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-gray-400">
              {filteredEvents.length} alerte(s)
            </span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-xs text-gray-300">Seuil</label>
            <select
              value={alertSeverityFilter}
              onChange={(e) =>
                setAlertSeverityFilter(
                  e.target.value as "all" | "low" | "medium" | "high"
                )
              }
              className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
            >
              <option value="all">Tous</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <label className="text-xs text-gray-300">Periode</label>
            <select
              value={alertDateFilter}
              onChange={(e) =>
                setAlertDateFilter(e.target.value as "all" | "24h" | "7d" | "30d")
              }
              className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
            >
              <option value="all">Tout</option>
              <option value="24h">24h</option>
              <option value="7d">7j</option>
              <option value="30d">30j</option>
            </select>
            <input
              type="text"
              value={alertSearchQuery}
              onChange={(e) => setAlertSearchQuery(e.target.value)}
              placeholder="Rechercher (URL, resume, champ)"
              className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400 min-w-[230px]"
            />
          </div>
          <p className="text-[11px] text-gray-400 mb-4">
            Priorité: Haute = action rapide, Moyenne = à planifier, Basse = information.
          </p>
          <div className="space-y-4">
            {filteredEvents.length === 0 && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-gray-300">
                <p>Aucun changement detecte pour ce filtre.</p>
                <p className="mt-1 text-xs text-gray-400">
                  Pour demarrer: ajoute au moins 1 URL puis lance &quot;Analyser maintenant&quot;.
                </p>
              </div>
            )}
            {filteredEvents.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 p-4">
                {(() => {
                  const priorityScore = getPriorityScore(item);
                  const priorityLabel = getPriorityLabel(priorityScore);
                  const priorityClass = getPriorityClass(priorityScore);
                  const confidence = getAlertConfidence(item);
                  const changeSummary = getAlertChangeSummary(item);
                  const impactLabel = getAlertImpactLabel(item);
                  const recommendedAction = getAlertRecommendedAction(item);
                  const isExpanded = expandedAlertId === item.id;
                  return (
                    <>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-200">
                    {item.domain}
                  </span>
                  <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-white/10 text-gray-200">
                    {item.severity}
                  </span>
                  <span
                    className={`text-[10px] uppercase px-2 py-1 rounded-full ${priorityClass}`}
                  >
                    Impact {priorityScore} - {priorityLabel}
                  </span>
                  <span
                    className={`text-[10px] uppercase px-2 py-1 rounded-full ${confidence.className}`}
                  >
                    Confiance {confidence.label}
                  </span>
                  <span
                    className={`text-[10px] uppercase px-2 py-1 rounded-full ${
                      item.is_read
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-amber-500/15 text-amber-200"
                    }`}
                  >
                    {item.is_read ? "lu" : "non lu"}
                  </span>
                </div>
                <p className="text-sm text-gray-200">{changeSummary}</p>
                {item.metadata?.url && (
                  <p className="text-xs text-gray-400 mt-1">{item.metadata.url}</p>
                )}
                <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
                  <p className="text-gray-300">
                    <span className="text-gray-400">Impact:</span> {impactLabel}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-400">Action:</span> {recommendedAction}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    {formatAlertDateShort(item.detected_at)}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setExpandedAlertId(isExpanded ? null : item.id)
                      }
                      className="text-xs text-gray-300 hover:text-white"
                    >
                      {isExpanded ? "Masquer changement" : "Voir changement"}
                    </button>
                    <button
                      onClick={() => markAlertAsRead(item.id, !item.is_read)}
                      className="text-xs text-indigo-200 hover:text-indigo-100"
                    >
                      {item.is_read ? "Marquer non lu" : "Marquer lu"}
                    </button>
                  </div>
                </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      </section>
      {expandedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Fermer"
            className="absolute inset-0 bg-black/70"
            onClick={() => setExpandedAlertId(null)}
          />
          <div className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-[#0b1025] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-indigo-200 uppercase">
                  {expandedAlert.domain} - {expandedAlert.severity}
                </p>
                <p className="mt-1 text-sm text-gray-100">
                  {getAlertChangeSummary(expandedAlert)}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {formatAlertDateShort(expandedAlert.detected_at)}
                </p>
              </div>
              <button
                onClick={() => setExpandedAlertId(null)}
                className="text-xs px-2 py-1 rounded border border-white/20 text-gray-200 hover:bg-white/5"
              >
                Fermer
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-300">
              <span className="text-gray-400">Impact:</span>{" "}
              {getAlertImpactLabel(expandedAlert)}
            </p>
            <p className="mt-1 text-xs text-gray-300">
              <span className="text-gray-400">Action:</span>{" "}
              {getAlertRecommendedAction(expandedAlert)}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 text-xs">
              <div className="rounded-md border border-white/10 bg-black/20 p-3">
                <p className="text-gray-400 mb-1">Avant</p>
                <p className="text-gray-200">
                  {expandedAlert.metadata?.before_short || "non disponible"}
                </p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 p-3">
                <p className="text-gray-400 mb-1">Apres</p>
                <p className="text-gray-200">
                  {expandedAlert.metadata?.after_short || "non disponible"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-gray-400">
              {expandedAlert.metadata?.priority_reason ||
                "Priorite calculee automatiquement."}
            </p>
          </div>
        </div>
      )}

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-xl bg-white/5 border border-white/10 p-6 mb-6">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xl font-semibold">Preferences d&apos;alertes</h2>
            <span className="relative inline-flex items-center group">
              <button
                type="button"
                aria-label="Information sur les preferences d'alertes"
                className="h-4 w-4 rounded-full border border-white/20 text-[10px] leading-none text-gray-300 hover:text-white hover:border-white/40"
              >
                i
              </button>
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-72 -translate-x-1/2 rounded-md border border-white/10 bg-[#0b1025] p-2 text-[11px] text-gray-200 shadow-lg group-hover:block group-focus-within:block">
                <span className="block">- Mode email: instant envoie chaque alerte, daily envoie un digest, off coupe les emails.</span>
                <span className="block mt-1">- Seuil email: niveau minimal envoye (HIGH uniquement, ou MEDIUM/HIGH, ou tout).</span>
                <span className="block mt-1">- Heure digest: heure locale (0-23) a laquelle le recap quotidien est envoye.</span>
              </span>
            </span>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            <label className="text-sm text-gray-300 flex flex-col gap-2">
              Mode email
              <select
                value={emailMode}
                onChange={(e) =>
                  setEmailMode(e.target.value as "instant" | "daily" | "off")
                }
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
              >
                <option value="instant">Instant</option>
                <option value="daily">Digest quotidien</option>
                <option value="off">Aucun email</option>
              </select>
            </label>
            <label className="text-sm text-gray-300 flex flex-col gap-2">
              Seuil email
              <select
                value={minEmailSeverity}
                onChange={(e) =>
                  setMinEmailSeverity(e.target.value as "low" | "medium" | "high")
                }
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="text-sm text-gray-300 flex flex-col gap-2">
              Heure digest (0-23)
              <input
                type="number"
                min={0}
                max={23}
                value={digestHour}
                onChange={(e) => setDigestHour(Number(e.target.value || 0))}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
              />
            </label>
            <div className="flex flex-col gap-2 justify-end">
              <button
                onClick={saveAlertSettings}
                disabled={savingAlertSettings}
                className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingAlertSettings ? "Sauvegarde..." : "Sauvegarder"}
              </button>
              <button
                onClick={runDailyDigestNow}
                disabled={runningDigest}
                className="px-4 py-2 rounded-lg border border-indigo-300/30 text-indigo-200 hover:bg-indigo-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {runningDigest ? "Digest..." : "Tester digest"}
              </button>
            </div>
          </div>
          {alertSettingsMessage && (
            <p className="text-sm text-indigo-200 mt-3">{alertSettingsMessage}</p>
          )}
          {digestMessage && (
            <p className="text-sm text-indigo-200 mt-1">{digestMessage}</p>
          )}
        </div>

        <div id="add-url-panel" className="rounded-xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">Ajouter une URL</h2>
          <p className="text-gray-300 text-sm mb-4">
            Ajoute une page concurrente à surveiller. La détection des
            changements sera activée automatiquement.
          </p>
          <div className="mb-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-300">Seuil alertes:</span>
              <span className="relative inline-flex items-center group">
                <button
                  type="button"
                  aria-label="Information sur le seuil d'alertes"
                  className="h-4 w-4 rounded-full border border-white/20 text-[10px] leading-none text-gray-300 hover:text-white hover:border-white/40"
                >
                  i
                </button>
                <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-md border border-white/10 bg-[#0b1025] p-2 text-[11px] text-gray-200 shadow-lg group-hover:block group-focus-within:block">
                  Choisis les niveaux d&apos;alertes a conserver pendant
                  &quot;Analyser maintenant&quot;. Exemple: coche MEDIUM + HIGH
                  pour ignorer LOW.
                </span>
              </span>
              <label className="text-xs px-2 py-1 rounded border border-white/15 text-gray-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allAnalysisSeveritiesSelected}
                  onChange={(event) =>
                    toggleAllAnalysisSeverities(event.target.checked)
                  }
                  disabled={analysisRunning}
                />
                Tous
              </label>
              {ANALYSIS_SEVERITY_LEVELS.map((level) => (
                <label
                  key={level}
                  className={`text-xs px-2 py-1 rounded border transition flex items-center gap-2 ${
                    analysisSeverities.includes(level)
                      ? "border-indigo-300/40 bg-indigo-500/15 text-indigo-100"
                      : "border-white/15 text-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={analysisSeverities.includes(level)}
                    onChange={() => toggleAnalysisSeverity(level)}
                    disabled={analysisRunning}
                  />
                  {level.toUpperCase()}
                </label>
              ))}
            </div>
            <button
              id="analyze-now-btn"
              onClick={runAnalysis}
              className="px-4 py-2 rounded-lg border border-indigo-300/30 text-indigo-200 hover:bg-indigo-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={(!hasActiveSubscription && !isBypass) || analysisRunning}
            >
              {analysisRunning ? "Analyse en cours..." : "Analyser maintenant"}
            </button>
            {analysisMessage && (
              <p className="text-indigo-200 text-sm mt-2">{analysisMessage}</p>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="url"
              placeholder="https://site-concurrent.com/pricing"
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <button
              onClick={addUrl}
              className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canAddUrl}
            >
              Ajouter
            </button>
          </div>
          {!hasActiveSubscription && !isBypass && (
            <p className="text-amber-200 text-sm mt-3">
              Ajout bloque : ton abonnement n&apos;est pas encore actif.
              Selectionne un plan depuis la landing, puis reviens ici.
            </p>
          )}
          {currentCount >= limit && (
            <p className="text-amber-200 text-sm mt-3">
              Limite atteinte : ton plan {plan.toUpperCase()} autorise {limit}{" "}
              URLs max. Supprime une URL ou upgrade ton abonnement.
            </p>
          )}
          {message && <p className="text-red-400 text-sm mt-3">{message}</p>}
        </div>
      </section>
    </main>
  );
}
