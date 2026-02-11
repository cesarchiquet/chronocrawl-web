"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import type { Session } from "@supabase/supabase-js";

const fadeUp = {
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
  metadata: { summary?: string; url?: string } | null;
  detected_at: string | null;
  is_read: boolean | null;
};

type SubscriptionState = {
  plan: "starter" | "pro" | "agency";
  status: string;
  trial_end: string | null;
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
  }, [session?.user?.id, session?.user?.user_metadata?.subscription_status]);

  const loadData = async () => {
    if (!session?.user) return;
    const { data: urlsData } = await supabase
      .from("monitored_urls")
      .select("id,url,status,last_checked_at,created_at")
      .order("created_at", { ascending: false });

    setUrls(urlsData || []);

    const { data: eventsData } = await supabase
      .from("detected_changes")
      .select(
        "id,monitored_url_id,domain,severity,field_key,metadata,detected_at,is_read"
      )
      .order("detected_at", { ascending: false })
      .limit(80);

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

    const ranked = ((eventsData || []) as ChangeEvent[])
      .sort((a, b) => {
        const domainDelta = domainRank[a.domain] - domainRank[b.domain];
        if (domainDelta !== 0) return domainDelta;
        const sevDelta = severityRank[a.severity] - severityRank[b.severity];
        if (sevDelta !== 0) return sevDelta;
        return (b.detected_at || "").localeCompare(a.detected_at || "");
      })
      .slice(0, 8);

    setEvents(ranked);

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { count: changeCount24h } = await supabase
      .from("detected_changes")
      .select("id", { count: "exact", head: true })
      .gt("detected_at", since24h);

    const { count: highCount7d } = await supabase
      .from("detected_changes")
      .select("id", { count: "exact", head: true })
      .eq("severity", "high")
      .gt("detected_at", since7d);

    const { data: usage } = await supabase
      .from("user_monitor_usage")
      .select("run_count,window_started_at")
      .maybeSingle<{ run_count: number; window_started_at: string }>();

    setChanges24h(changeCount24h || 0);
    setHigh7d(highCount7d || 0);
    setDailyRunCount(usage?.run_count || 0);
    setDailyRunStartedAt(usage?.window_started_at || null);
  };

  const loadSubscriptionState = async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from("user_subscriptions")
      .select("plan,status,trial_end")
      .eq("user_id", session.user.id)
      .maybeSingle<SubscriptionState>();
    setSubscriptionState(data || null);
  };

  const loadAlertSettings = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from("user_alert_settings")
      .select("email_mode,min_email_severity,digest_hour")
      .eq("user_id", session.user.id)
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
  };

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
      .eq("is_read", false);

    if (!error) {
      setEvents((prev) => prev.map((item) => ({ ...item, is_read: true })));
    }
  };

  useEffect(() => {
    if (session?.user) {
      loadSubscriptionState();
      loadData();
      loadAlertSettings();
    }
  }, [session]);

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
    if (!session?.user?.id) return;
    setDigestMessage("");
    setRunningDigest(true);
    try {
      const response = await fetch("/api/alerts/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    setMessage("");

    const { error } = await supabase.from("monitored_urls").insert([
      {
        url: newUrl,
        user_id: session.user.id,
        status: "OK",
      },
    ]);

    if (error) {
      setMessage("Impossible d’ajouter cette URL.");
      return;
    }

    setNewUrl("");
    await loadData();
  };

  const removeUrl = async (id: string) => {
    await supabase.from("monitored_urls").delete().eq("id", id);
    await loadData();
  };

  const runAnalysis = async () => {
    if (!session?.user?.id) return;
    setAnalysisMessage("");
    setAnalysisRunning(true);

    try {
      const response = await fetch("/api/monitor/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Analyse impossible.");
      }

      const failedCount = Array.isArray(data?.failed) ? data.failed.length : 0;
      const dedupedCount = Number(data?.deduped || 0);
      const noiseCount = Number(data?.noiseFiltered || 0);
      setAnalysisMessage(
        `Analyse terminee: ${data.checked ?? 0} URL verifiee(s), ${data.changes ?? 0} changement(s), ${dedupedCount} dedoublonne(s), ${noiseCount} bruit(s) ignore(s), ${failedCount} echec(s).`
      );
      await loadData();
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
  const trialEndRaw =
    subscriptionState?.trial_end ||
    (session?.user?.user_metadata?.subscription_trial_end as
    | string
    | undefined);
  const hasActiveSubscription =
    subscriptionStatus === "active" || subscriptionStatus === "trialing";
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
  const unreadCount = events.filter((item) => !item.is_read).length;
  const filteredEvents = events.filter((item) => {
    if (alertFilter === "unread") return !item.is_read;
    if (alertFilter === "read") return !!item.is_read;
    return true;
  });
  const openBillingPortal = async () => {
    setBillingMessage("");
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session?.user?.id }),
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
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white" />
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
        {subscriptionStatus === "trialing" && (
          <div className="mt-4 rounded-lg border border-indigo-400/30 bg-indigo-500/10 p-4 text-sm text-indigo-100">
            <p className="font-medium">Essai en cours</p>
            <p className="mt-1 text-indigo-200">
              {trialDaysLeft !== null
                ? `Il te reste ${trialDaysLeft} jour${trialDaysLeft > 1 ? "s" : ""} d'essai.`
                : "Ton essai est actif. Upgrade quand tu veux depuis \"Gérer l'abonnement\"."}
            </p>
          </div>
        )}
        {subscriptionStatus === "inactive" && (
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
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200">
            Changements 24h: <span className="font-semibold">{changes24h}</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200">
            Alertes HIGH 7j: <span className="font-semibold">{high7d}</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200">
            Analyses 24h: <span className="font-semibold">{dailyRunCount}</span>
            {dailyRunStartedAt ? (
              <span className="text-gray-400"> (depuis {new Date(dailyRunStartedAt).toLocaleString("fr-FR")})</span>
            ) : null}
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
            {urls.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border border-white/10 p-4"
              >
                <div>
                  <p className="text-sm text-gray-300">{item.url}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Dernière vérification :
                    {item.last_checked_at ? " " + item.last_checked_at : " —"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                    {item.status || "OK"}
                  </span>
                  <button
                    onClick={() => removeUrl(item.id)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
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
          <div className="space-y-4">
            {filteredEvents.length === 0 && (
              <p className="text-gray-400 text-sm">Aucun changement détecté.</p>
            )}
            {filteredEvents.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-200">
                    {item.domain}
                  </span>
                  <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-white/10 text-gray-200">
                    {item.severity}
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
                <p className="text-sm text-gray-200">
                  {item.metadata?.summary || item.field_key}
                </p>
                {item.metadata?.url && (
                  <p className="text-xs text-gray-400 mt-1">{item.metadata.url}</p>
                )}
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">{item.detected_at || "—"}</p>
                  <button
                    onClick={() => markAlertAsRead(item.id, !item.is_read)}
                    className="text-xs text-indigo-200 hover:text-indigo-100"
                  >
                    {item.is_read ? "Marquer non lu" : "Marquer lu"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-xl bg-white/5 border border-white/10 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Preferences d&apos;alertes</h2>
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

        <div className="rounded-xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">Ajouter une URL</h2>
          <p className="text-gray-300 text-sm mb-4">
            Ajoute une page concurrente à surveiller. La détection des
            changements sera activée automatiquement.
          </p>
          <div className="mb-4">
            <button
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
