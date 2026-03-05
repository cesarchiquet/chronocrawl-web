"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, type Variants } from "framer-motion";
import type { Session } from "@supabase/supabase-js";
import {
  getAlertChangeSummary,
} from "@/lib/alertPresentation";
import { formatAlertDateShort } from "@/lib/dateFormat";
import {
  EVENTS_PAGE_SIZE,
  type ChangeEvent,
  type MonitoredUrl,
  type SubscriptionState,
  type UrlMeta,
} from "@/features/dashboard/types";
import {
  formatDateTimeFr,
  getUrlStatusInfo,
  normalizeMonitoredUrl,
} from "@/features/dashboard/utils";
import DashboardControlPanels from "@/features/dashboard/components/DashboardControlPanels";
import AlertDetailModal from "@/features/dashboard/components/AlertDetailModal";
import DashboardSuiteMenu from "@/components/DashboardSuiteMenu";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

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
  const [alertFilter, setAlertFilter] = useState<"all" | "unread" | "read">(
    "all"
  );
  const [alertUrlFilter, setAlertUrlFilter] = useState("all");
  const [alertDateFilter, setAlertDateFilter] = useState<
    "all" | "24h" | "7d" | "30d"
  >("all");
  const [alertDomainFilter, setAlertDomainFilter] = useState<
    "all" | "seo" | "cta" | "pricing"
  >("all");
  const [filterReferenceNow, setFilterReferenceNow] = useState(() => Date.now());
  const [emailMode, setEmailMode] = useState<"instant" | "daily" | "off">(
    "instant"
  );
  const [minEmailSeverity, setMinEmailSeverity] = useState<
    "medium" | "high"
  >("high");
  const [digestHour, setDigestHour] = useState(8);
  const [alertSettingsMessage, setAlertSettingsMessage] = useState("");
  const [digestMessage, setDigestMessage] = useState("");
  const [savingAlertSettings, setSavingAlertSettings] = useState(false);
  const [runningDigest, setRunningDigest] = useState(false);
  const [subscriptionState, setSubscriptionState] =
    useState<SubscriptionState | null>(null);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [urlMeta, setUrlMeta] = useState<Record<string, UrlMeta>>({});
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [urlTagFilter, setUrlTagFilter] = useState("all");

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

  useEffect(() => {
    if (!session?.user?.id) return;
    const rawMeta = window.localStorage.getItem(
      `chronocrawl:url-meta:${session.user.id}`
    );
    if (rawMeta) {
      try {
        setUrlMeta(JSON.parse(rawMeta) as Record<string, UrlMeta>);
      } catch {
        setUrlMeta({});
      }
    } else {
      setUrlMeta({});
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    window.localStorage.setItem(
      `chronocrawl:url-meta:${session.user.id}`,
      JSON.stringify(urlMeta)
    );
  }, [session?.user?.id, urlMeta]);

  const loadAllEvents = useCallback(async (userId: string) => {
    const rows: ChangeEvent[] = [];
    let from = 0;
    let useLegacySelect = false;
    const extendedSelect =
      "id,monitored_url_id,domain,severity,confidence_score,noise_flags,change_group_id,is_group_root,field_key,metadata,detected_at,is_read";
    const legacySelect =
      "id,monitored_url_id,domain,severity,field_key,metadata,detected_at,is_read";

    while (true) {
      const to = from + EVENTS_PAGE_SIZE - 1;
      let data: unknown[] | null = null;
      let error: { message?: string } | null = null;

      if (!useLegacySelect) {
        const res = await supabase
          .from("detected_changes")
          .select(extendedSelect)
          .eq("user_id", userId)
          .in("severity", ["medium", "high"])
          .order("detected_at", { ascending: false })
          .range(from, to);
        data = res.data;
        error = res.error;
      }

      if (useLegacySelect || error) {
        const legacyRes = await supabase
          .from("detected_changes")
          .select(legacySelect)
          .eq("user_id", userId)
          .in("severity", ["medium", "high"])
          .order("detected_at", { ascending: false })
          .range(from, to);
        data = legacyRes.data;
        error = legacyRes.error;
        useLegacySelect = true;
      }

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
    };
    const severityRank: Record<ChangeEvent["severity"], number> = {
      high: 0,
      medium: 1,
    };

    const ranked = eventsData.sort((a, b) => {
        const dateDelta = (b.detected_at || "").localeCompare(a.detected_at || "");
        if (dateDelta !== 0) return dateDelta;
        const domainDelta = domainRank[a.domain] - domainRank[b.domain];
        if (domainDelta !== 0) return domainDelta;
        return severityRank[a.severity] - severityRank[b.severity];
      });

    setEvents(ranked);

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
    setMinEmailSeverity(data.min_email_severity === "high" ? "high" : "medium");
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

  const setUrlFavorite = (urlId: string, favorite: boolean) => {
    setUrlMeta((prev) => ({
      ...prev,
      [urlId]: {
        ...(prev[urlId] || {}),
        favorite,
      },
    }));
  };

  const setUrlTag = (urlId: string, tag: string) => {
    setUrlMeta((prev) => ({
      ...prev,
      [urlId]: {
        ...(prev[urlId] || {}),
        tag,
      },
    }));
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

  const runAnalysis = async () => {
    if (!session?.user?.id || !session?.access_token) return;
    setAnalysisMessage("");
    setAnalysisRunning(true);

    try {
      let totalChecked = 0;
      let totalChanges = 0;
      let totalDeduped = 0;
      let totalNoise = 0;
      let totalGrouped = 0;
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
        totalGrouped += Number(data?.grouped || 0);
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

      const runHeadline =
        totalChanges === 0 && totalFailed === 0
          ? "Analyse terminee: moteur actif, aucun nouveau changement detecte."
          : totalChecked === 0 && totalFailed > 0
            ? "Analyse terminee: les URLs ont echoue pendant la verification."
            : "Analyse terminee.";
      setAnalysisMessage(
        `${runHeadline} ${totalChecked} URL verifiee(s), ${totalChanges} changement(s), ${totalDeduped} dedoublonne(s), ${totalNoise} bruit(s) ignore(s), ${totalGrouped} evenement(s) groupe(s), ${totalFailed} echec(s).${failedSamples.length > 0 ? ` Exemples: ${failedSamples.join(" | ")}.` : ""}${overflowNote}`
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
  const hasActiveSubscription =
    effectiveSubscriptionStatus === "active" ||
    effectiveSubscriptionStatus === "trialing";
  const canAddUrl =
    (isBypass || hasActiveSubscription) && currentCount < limit;
  const hasThreeUrls = currentCount >= 3;
  const hasFirstScan = urls.some((item) => !!item.last_checked_at);
  const hasFirstAlert = events.length > 0;
  const activationSteps = [
    { label: "Ajouter 3 URLs concurrentes", done: hasThreeUrls },
    { label: "Lancer un premier scan", done: hasFirstScan },
    { label: "Recevoir 1 alerte utile", done: hasFirstAlert },
  ];
  const activationDoneCount = activationSteps.filter((step) => step.done).length;
  const activationProgress = Math.round(
    (activationDoneCount / activationSteps.length) * 100
  );
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

  const availableUrlTags = useMemo(() => {
    const values = new Set<string>();
    for (const item of urls) {
      const tag = urlMeta[item.id]?.tag;
      if (tag) values.add(tag);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [urls, urlMeta]);

  const displayedUrls = useMemo(() => {
    const list = urls.filter((item) => {
      const meta = urlMeta[item.id] || {};
      if (showOnlyFavorites && !meta.favorite) return false;
      if (urlTagFilter !== "all" && (meta.tag || "") !== urlTagFilter) {
        return false;
      }
      return true;
    });
    return list.sort((a, b) => {
      const aFav = urlMeta[a.id]?.favorite ? 1 : 0;
      const bFav = urlMeta[b.id]?.favorite ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return (b.last_checked_at || "").localeCompare(a.last_checked_at || "");
    });
  }, [urls, showOnlyFavorites, urlTagFilter, urlMeta]);

  const filteredEvents = useMemo(() => {
    const fromMs =
      alertDateFilter === "24h"
        ? filterReferenceNow - 24 * 60 * 60 * 1000
        : alertDateFilter === "7d"
          ? filterReferenceNow - 7 * 24 * 60 * 60 * 1000
          : alertDateFilter === "30d"
            ? filterReferenceNow - 30 * 24 * 60 * 60 * 1000
            : null;
    return events.filter((item) => {
      if (alertFilter === "unread" && item.is_read) return false;
      if (alertFilter === "read" && !item.is_read) return false;
      if (alertDomainFilter !== "all" && item.domain !== alertDomainFilter) {
        return false;
      }
      if (alertUrlFilter !== "all" && item.metadata?.url !== alertUrlFilter) {
        return false;
      }
      if (fromMs !== null) {
        const detectedMs = item.detected_at ? Date.parse(item.detected_at) : NaN;
        if (!Number.isFinite(detectedMs) || detectedMs < fromMs) return false;
      }
      return true;
    });
  }, [
    alertDateFilter,
    alertFilter,
    alertDomainFilter,
    alertUrlFilter,
    events,
    filterReferenceNow,
  ]);
  const emptyStateMessage = useMemo(() => {
    const hasFilter =
      alertFilter !== "all" ||
      alertDomainFilter !== "all" ||
      alertUrlFilter !== "all" ||
      alertDateFilter !== "all";

    if (!hasFilter) {
      return {
        title: "Aucun changement detecte pour le moment.",
        hint: "Pour demarrer: ajoute au moins 1 URL puis lance \"Analyser maintenant\".",
      };
    }

    const active: string[] = [];
    if (alertFilter === "unread") active.push("Non lues");
    if (alertFilter === "read") active.push("Lues");
    if (alertDomainFilter !== "all") active.push(`Type ${alertDomainFilter.toUpperCase()}`);
    if (alertUrlFilter !== "all") active.push("URL specifique");
    if (alertDateFilter !== "all") active.push(`Periode ${alertDateFilter}`);

    return {
      title: "Aucune alerte pour les filtres actuels.",
      hint: `Filtres actifs: ${active.join(" | ")}.`,
    };
  }, [
    alertDateFilter,
    alertDomainFilter,
    alertFilter,
    alertUrlFilter,
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
        <DashboardSuiteMenu />
        {billingMessage && (
          <p className="mt-3 text-sm text-amber-200">{billingMessage}</p>
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
        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span>Capacite URLs du plan {plan.toUpperCase()}</span>
            <span>
              {currentCount}/{limit} ({Math.min(100, Math.round((currentCount / Math.max(1, limit)) * 100))}%)
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full ${
                currentCount / Math.max(1, limit) >= 0.9
                  ? "bg-red-400"
                  : currentCount / Math.max(1, limit) >= 0.75
                    ? "bg-amber-400"
                    : "bg-emerald-400"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.round((currentCount / Math.max(1, limit)) * 100)
                )}%`,
              }}
            />
          </div>
          {currentCount / Math.max(1, limit) >= 0.8 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-indigo-300/30 bg-indigo-500/10 px-3 py-2">
              <p className="text-xs text-indigo-100">
                Tu approches la limite de ton plan. Upgrade recommande pour eviter un blocage.
              </p>
              <button
                onClick={openBillingPortal}
                className="rounded border border-indigo-300/40 px-2 py-1 text-xs text-indigo-100 hover:bg-indigo-500/20"
              >
                Upgrade
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-200">Activation dashboard</p>
            <span className="text-xs text-gray-300">
              {activationDoneCount}/{activationSteps.length} etapes
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-indigo-400"
              style={{ width: `${activationProgress}%` }}
            />
          </div>
          <div className="mt-3 grid gap-2">
            {activationSteps.map((step) => (
              <div
                key={step.label}
                className="flex items-center gap-2 text-xs text-gray-300"
              >
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                    step.done
                      ? "border-emerald-300/40 bg-emerald-500/15 text-emerald-200"
                      : "border-white/20 text-gray-400"
                  }`}
                >
                  {step.done ? "✓" : "•"}
                </span>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="max-w-6xl mx-auto px-6 pb-16 grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 rounded-xl bg-white/5 border border-white/10 p-6 max-h-[620px] overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-xl font-semibold">URLs surveillées</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOnlyFavorites((value) => !value)}
                className={`text-xs px-2 py-1 rounded border ${
                  showOnlyFavorites
                    ? "border-indigo-300/40 bg-indigo-500/15 text-indigo-100"
                    : "border-white/15 text-gray-300 hover:bg-white/5"
                }`}
              >
                Favoris
              </button>
              <select
                value={urlTagFilter}
                onChange={(event) => setUrlTagFilter(event.target.value)}
                className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
              >
                <option value="all">Tous les tags</option>
                {availableUrlTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div id="add-url-panel" className="mb-4 rounded-lg border border-white/10 p-4">
            <p className="text-gray-300 text-sm mb-3">
              Ajoute une page concurrente à surveiller, puis lance une analyse.
            </p>
            <div className="mb-3">
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
                Limite atteinte : ton plan {plan.toUpperCase()} autorise {limit} URLs
                max. Supprime une URL ou upgrade ton abonnement.
              </p>
            )}
            {message && <p className="text-red-400 text-sm mt-3">{message}</p>}
          </div>
          <div className="space-y-4">
            {displayedUrls.length === 0 && (
              <p className="text-gray-400 text-sm">
                Aucune URL pour ce filtre.
              </p>
            )}
            {displayedUrls.map((item) => {
              const statusInfo = getUrlStatusInfo(item.status);
              const meta = urlMeta[item.id] || {};
              return (
              <div key={item.id} className="rounded-lg border border-white/10 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-gray-300">{item.url}</p>
                    {meta.favorite && (
                      <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] text-indigo-200">
                        Favori
                      </span>
                    )}
                    {meta.tag && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-gray-200">
                        {meta.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Dernière vérification :
                    {" " + formatDateTimeFr(item.last_checked_at)}
                  </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setUrlFavorite(item.id, !meta.favorite)}
                      className={`text-sm ${meta.favorite ? "text-indigo-200" : "text-gray-500"} hover:text-indigo-100`}
                      aria-label="Basculer favori"
                    >
                      ★
                    </button>
                    <select
                      value={meta.tag || ""}
                      onChange={(event) => setUrlTag(item.id, event.target.value)}
                      className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
                    >
                      <option value="">Sans tag</option>
                      <option value="Pricing">Pricing</option>
                      <option value="SEO">SEO</option>
                      <option value="CTA">CTA</option>
                      <option value="Content">Content</option>
                    </select>
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
            <label className="text-xs text-gray-300">Type</label>
            <select
              value={alertDomainFilter}
              onChange={(e) =>
                setAlertDomainFilter(
                  e.target.value as "all" | "seo" | "cta" | "pricing"
                )
              }
              className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
            >
              <option value="all">Tous</option>
              <option value="seo">SEO</option>
              <option value="cta">CTA</option>
              <option value="pricing">Pricing</option>
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
          </div>
          <div className="space-y-4">
            {filteredEvents.length === 0 && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-gray-300">
                <p>{emptyStateMessage.title}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {emptyStateMessage.hint}
                </p>
              </div>
            )}
            {filteredEvents.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 p-4">
                {(() => {
                  const priorityScore = getPriorityScore(item);
                  const priorityLabel = getPriorityLabel(priorityScore);
                  const priorityClass = getPriorityClass(priorityScore);
                  const changeSummary = getAlertChangeSummary(item);
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
        <AlertDetailModal
          alert={expandedAlert}
          onClose={() => setExpandedAlertId(null)}
        />
      )}

      <DashboardControlPanels
        emailMode={emailMode}
        minEmailSeverity={minEmailSeverity}
        digestHour={digestHour}
        savingAlertSettings={savingAlertSettings}
        runningDigest={runningDigest}
        alertSettingsMessage={alertSettingsMessage}
        digestMessage={digestMessage}
        onEmailModeChange={setEmailMode}
        onMinEmailSeverityChange={setMinEmailSeverity}
        onDigestHourChange={setDigestHour}
        onSaveAlertSettings={saveAlertSettings}
        onRunDailyDigestNow={runDailyDigestNow}
      />
    </main>
  );
}
