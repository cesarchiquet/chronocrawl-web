"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import {
  getAlertChangeKind,
  getAlertChangeSummary,
  getAlertDomainLabel,
  getAlertFieldLabel,
  getAlertImpactLabel,
  getAlertRecommendedAction,
} from "@/lib/alertPresentation";
import { formatAlertDateShort } from "@/lib/dateFormat";
import DashboardSuiteMenu from "@/components/DashboardSuiteMenu";

type ChangeEvent = {
  id: string;
  field_key?: string;
  domain: "seo" | "pricing" | "cta";
  severity: "medium" | "high";
  confidence_score?: number | null;
  noise_flags?: string[] | null;
  change_group_id?: string | null;
  is_group_root?: boolean | null;
  metadata: {
    summary?: string;
    url?: string;
    before_short?: string;
    after_short?: string;
    priority_score?: number;
    priority_reason?: string;
    grouped_changes_count?: number;
  } | null;
  détectéd_at: string | null;
  is_read: boolean | null;
};

const HISTORY_PAGE_SIZE = 250;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

function formatTimelineLabel(dateValue: string | null) {
  if (!dateValue) return "Date inconnue";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
  const diffDays = Math.round((startOfToday - startOfTarget) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function AlertsHistoryPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(0);
  const [nowReferenceMs, setNowReferenceMs] = useState(0);
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [severityFilter, setSeverityFilter] = useState<
    "all" | "medium" | "high"
  >("all");
  const [urlFilter, setUrlFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "all" | "24h" | "7d" | "30d" | "custom"
  >("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">(
    "all"
  );
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const loadEventsPage = useCallback(
    async (userId: string, from: number, reset = false) => {
      const to = from + HISTORY_PAGE_SIZE - 1;
      const extendedSelect =
        "id,field_key,domain,severity,confidence_score,noise_flags,change_group_id,is_group_root,metadata,détectéd_at,is_read";
      const legacySelect =
        "id,field_key,domain,severity,metadata,détectéd_at,is_read";

      let data: unknown[] | null = null;
      const extendedRes = await supabase
        .from("détectéd_changes")
        .select(extendedSelect)
        .eq("user_id", userId)
        .in("severity", ["medium", "high"])
        .order("détectéd_at", { ascending: false })
        .range(from, to);
      if (extendedRes.error) {
        const legacyRes = await supabase
          .from("détectéd_changes")
          .select(legacySelect)
          .eq("user_id", userId)
          .in("severity", ["medium", "high"])
          .order("détectéd_at", { ascending: false })
          .range(from, to);
        data = legacyRes.data;
      } else {
        data = extendedRes.data;
      }

      const pageRows = (data || []) as ChangeEvent[];
      setHasMore(pageRows.length === HISTORY_PAGE_SIZE);
      setCursor(from + pageRows.length);
      setNowReferenceMs(new Date().getTime());

      if (reset) {
        setEvents(pageRows);
        return;
      }

      setEvents((prev) => [...prev, ...pageRows]);
    },
    []
  );

  useEffect(() => {
    const hydrateSession = async () => {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        setSession(refreshed.session);
        await loadEventsPage(refreshed.session.user.id, 0, true);
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user?.id) {
        await loadEventsPage(data.session.user.id, 0, true);
      }
      setLoading(false);
    };

    hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user?.id) {
        void loadEventsPage(currentSession.user.id, 0, true);
        return;
      }
      setEvents([]);
      setCursor(0);
      setHasMore(true);
    });

    return () => subscription.unsubscribe();
  }, [loadEventsPage]);

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

  const availableUrls = useMemo(() => {
    const values = new Set<string>();
    for (const event of events) {
      const url = event.metadata?.url;
      if (url) values.add(url);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const expandedAlert = useMemo(
    () => events.find((event) => event.id === expandedAlertId) || null,
    [events, expandedAlertId]
  );
  const historyOverview = useMemo(() => {
    const unread = events.filter((event) => !event.is_read).length;
    const coveredUrls = new Set(
      events.map((event) => event.metadata?.url).filter(Boolean)
    ).size;
    const highPriority = events.filter((event) => event.severity === "high").length;
    const latestDétectédAt = events[0]?.détectéd_at || null;
    const groupedSequences = new Set(
      events.map((event) => event.change_group_id).filter(Boolean)
    ).size;

    return {
      total: events.length,
      unread,
      coveredUrls,
      highPriority,
      latestDétectédAt,
      groupedSequences,
    };
  }, [events]);

  const filtered = useMemo(() => {
    const now = nowReferenceMs;
    const fromMsPreset =
      dateFilter === "24h"
        ? now - 24 * 60 * 60 * 1000
        : dateFilter === "7d"
          ? now - 7 * 24 * 60 * 60 * 1000
          : dateFilter === "30d"
            ? now - 30 * 24 * 60 * 60 * 1000
        : null;
    const fromMsCustom = dateFrom
      ? new Date(`${dateFrom}T00:00:00`).getTime()
      : null;
    const toMsCustom = dateTo
      ? new Date(`${dateTo}T23:59:59.999`).getTime()
      : null;
    const query = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      if (severityFilter !== "all" && event.severity !== severityFilter) {
        return false;
      }
      if (urlFilter !== "all" && event.metadata?.url !== urlFilter) {
        return false;
      }
      if (readFilter === "unread" && event.is_read) return false;
      if (readFilter === "read" && !event.is_read) return false;
      if (dateFilter !== "all") {
        const détectédMs = event.détectéd_at ? Date.parse(event.détectéd_at) : NaN;
        if (!Number.isFinite(détectédMs)) return false;
        if (dateFilter === "custom") {
          if (fromMsCustom !== null && détectédMs < fromMsCustom) return false;
          if (toMsCustom !== null && détectédMs > toMsCustom) return false;
        } else if (fromMsPreset !== null && détectédMs < fromMsPreset) {
          return false;
        }
      }
      if (query) {
        const haystack = [
          event.metadata?.summary || "",
          event.metadata?.url || "",
          event.domain || "",
          event.severity || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [
    dateFilter,
    dateFrom,
    dateTo,
    events,
    nowReferenceMs,
    readFilter,
    searchQuery,
    severityFilter,
    urlFilter,
  ]);
  const filteredTimeline = useMemo(() => {
    const buckets = new Map<string, ChangeEvent[]>();
    for (const event of filtered) {
      const label = formatTimelineLabel(event.détectéd_at);
      const current = buckets.get(label) || [];
      current.push(event);
      buckets.set(label, current);
    }
    return Array.from(buckets.entries()).map(([label, items]) => ({
      label,
      items,
    }));
  }, [filtered]);

  const getPriorityScore = (event: ChangeEvent) => {
    if (typeof event.confidence_score === "number" && Number.isFinite(event.confidence_score)) {
      return event.confidence_score;
    }
    const raw = event.metadata?.priority_score;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (event.severity === "high") return 85;
    if (event.severity === "medium") return 60;
    return 30;
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 75) return "Priorité haute";
    if (score >= 45) return "Priorité moyenne";
    return "Priorité basse";
  };

  const getPriorityClass = (score: number) => {
    if (score >= 75) return "bg-red-500/15 text-red-200";
    if (score >= 45) return "bg-amber-500/15 text-amber-200";
    return "bg-emerald-500/15 text-emerald-200";
  };

  const getDomainClass = (domain: ChangeEvent["domain"]) => {
    if (domain === "seo") return "bg-sky-500/15 text-sky-200";
    if (domain === "cta") return "bg-violet-500/15 text-violet-200";
    return "bg-emerald-500/15 text-emerald-200";
  };

  const getAlertCardClass = (event: ChangeEvent) => {
    if (!event.is_read) {
      return "border-white/12 bg-white/[0.04]";
    }
    if (event.domain === "seo") return "border-sky-400/15 bg-sky-500/[0.03]";
    if (event.domain === "cta") {
      return "border-violet-400/15 bg-violet-500/[0.03]";
    }
    return "border-emerald-400/15 bg-emerald-500/[0.03]";
  };

  const exportCsv = () => {
    const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = filtered.map((event) => {
      const détectédAt = event.détectéd_at || "";
      const fieldKey = event.field_key || "";
      const domain = event.domain || "";
      const severity = event.severity || "";
      const readState = event.is_read ? "read" : "unread";
      const url = event.metadata?.url || "";
      const summary = event.metadata?.summary || "Alerte détectée";
      const priorityScore =
        typeof event.metadata?.priority_score === "number"
          ? String(event.metadata.priority_score)
          : "";
      const priorityReason = event.metadata?.priority_reason || "";
      const changeGroupId = event.change_group_id || "";
      const noiseFlags = Array.isArray(event.noise_flags)
        ? event.noise_flags.join("|")
        : "";
      const beforeShort = event.metadata?.before_short || "";
      const afterShort = event.metadata?.after_short || "";
      return [
        détectédAt,
        fieldKey,
        domain,
        severity,
        readState,
        url,
        summary,
        priorityScore,
        priorityReason,
        changeGroupId,
        noiseFlags,
        beforeShort,
        afterShort,
      ]
        .map((item) => escapeCsv(String(item)))
        .join(",");
    });

    const header = [
      "détectéd_at",
      "field_key",
      "domain",
      "severity",
      "read_state",
      "url",
      "summary",
      "priority_score",
      "priority_reason",
      "change_group_id",
      "noise_flags",
      "before_short",
      "after_short",
    ]
      .map((item) => `"${item}"`)
      .join(",");

    const content = [header, ...rows].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "chronocrawl-alerts.csv";
    link.click();
    URL.revokeObjectURL(objectUrl);
  };

  const loadMore = async () => {
    if (!session?.user?.id || !hasMore || loadingMore) return;
    setLoadingMore(true);
    await loadEventsPage(session.user.id, cursor, false);
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <main className="min-h-scréen bg-[radial-gradient(circle_at_top,_#141414_0%,_#050505_38%,_#000000_100%)] text-white">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 pb-10">
          <div className="h-6 w-32 rounded bg-white/10 animate-pulse" />
          <div className="mt-4 h-10 w-72 rounded bg-white/10 animate-pulse" />
        </section>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
          <div className="cc-panel-strong rounded-[28px] p-6">
            <div className="grid md:grid-cols-3 gap-3 mb-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 rounded-lg border border-white/10 bg-black/20 animate-pulse"
                />
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 rounded-lg border border-white/10 bg-black/20 animate-pulse"
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
      <main className="min-h-scréen bg-[radial-gradient(circle_at_top,_#141414_0%,_#050505_38%,_#000000_100%)] text-white">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 md:pt-28 pb-24 text-center">
          <h1 className="text-3xl font-bold">Historique d&apos;alertes</h1>
          <p className="mt-4 text-gray-300">
            Connecte-toi pour consulter l&apos;historique complet.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white bg-white text-black hover:bg-white/85 transition font-medium mt-8"
          >
            Se connecter
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-scréen bg-[radial-gradient(circle_at_top,_#141414_0%,_#050505_38%,_#000000_100%)] text-white">
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-[1320px] px-4 pt-12 pb-10 sm:px-6"
      >
        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05)_0%,_rgba(10,10,10,0.98)_24%,_rgba(0,0,0,1)_88%)] px-6 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.42)] md:px-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[-48%] h-[780px] w-[780px] -translate-x-1/2 rounded-full border border-white/[0.05]" />
            <div className="absolute left-1/2 top-[-28%] h-[620px] w-[620px] -translate-x-1/2 rounded-full border border-white/[0.04]" />
          </div>
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-[0.18em]">Dashboard</p>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold leading-[0.96]">Historique
              <br />
              des alertes</h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-300">
              Retrouve toutes les alertes détectées, compare les changements dans le
              temps et reviens rapidement sur les signaux les plus utiles.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCsv}
              className="cc-button-secondary rounded-full px-5 py-2.5 text-white"
            >
              Export CSV
            </button>
            <a
              href="/dashboard"
              className="cc-button-secondary rounded-full px-5 py-2.5"
            >
              Retour dashboard
            </a>
          </div>
        </div>
        </div>
        <DashboardSuiteMenu />
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-gray-400">Alertes archivees</p>
            <p className="mt-1 text-lg font-semibold text-gray-100">
              {historyOverview.total}
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-gray-400">Non lues</p>
            <p className="mt-1 text-lg font-semibold text-white/78">
              {historyOverview.unread}
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-gray-400">URLs couvertes</p>
            <p className="mt-1 text-lg font-semibold text-gray-100">
              {historyOverview.coveredUrls}
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-gray-400">Derniere alerte</p>
            <p className="mt-1 text-sm font-semibold text-gray-100">
              {historyOverview.latestDétectédAt
                ? formatAlertDateShort(historyOverview.latestDétectédAt)
                : "Aucune"}
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 md:col-span-2 lg:col-span-1">
            <p className="text-xs text-gray-400">Sequences groupees</p>
            <p className="mt-1 text-lg font-semibold text-gray-100">
              {historyOverview.groupedSequences}
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.06 }}
        className="mx-auto max-w-[1320px] px-4 pb-24 sm:px-6"
      >
        <div className="rounded-[32px] bg-white/[0.03] border border-white/10 p-4 md:p-6">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="cc-chip rounded-full px-3 py-1 text-[11px]">
              Vue archive
            </span>
            <span className="rounded-full border border-red-300/20 bg-red-500/10 px-3 py-1 text-[11px] text-red-100">
              {historyOverview.highPriority} priorité haute
            </span>
            <span className="cc-chip rounded-full px-3 py-1 text-[11px]">
              Compare facilement l&apos;avant / après sur chaque changement
            </span>
            <span className="cc-chip rounded-full px-3 py-1 text-[11px]">
              Lecture par journée et par sequence
            </span>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mb-3">
            <label className="text-sm text-gray-300 flex flex-col gap-2">
              Sévérité
              <select
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(
                    e.target.value as "all" | "medium" | "high"
                  )
                }
                className="cc-panel rounded-[18px] px-3 py-2 focus:outline-none"
              >
                <option value="all">Toutes</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="text-sm text-gray-300 flex flex-col gap-2">
              URL
              <select
                value={urlFilter}
                onChange={(e) => setUrlFilter(e.target.value)}
                className="cc-panel rounded-[18px] px-3 py-2 focus:outline-none"
              >
                <option value="all">Toutes les URLs</option>
                {availableUrls.map((url) => (
                  <option key={url} value={url}>
                    {url}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-gray-300 flex flex-col gap-2">
              État
              <select
                value={readFilter}
                onChange={(e) =>
                  setReadFilter(e.target.value as "all" | "unread" | "read")
                }
                className="cc-panel rounded-[18px] px-3 py-2 focus:outline-none"
              >
                <option value="all">Tous</option>
                <option value="unread">Non lus</option>
                <option value="read">Lus</option>
              </select>
            </label>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mb-5">
            <label className="text-sm text-gray-300 flex flex-col gap-2">
              Période
              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(
                    e.target.value as "all" | "24h" | "7d" | "30d" | "custom"
                  )
                }
                className="cc-panel rounded-[18px] px-3 py-2 focus:outline-none"
              >
                <option value="all">Tout</option>
                <option value="24h">24h</option>
                <option value="7d">7 jours</option>
                <option value="30d">30 jours</option>
                <option value="custom">Personnalisee</option>
              </select>
            </label>
            <label className="text-sm text-gray-300 flex flex-col gap-2">
              Recherche
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="URL, résumé, domaine..."
                className="cc-panel rounded-[18px] px-3 py-2 focus:outline-none"
              />
            </label>
            <div className="text-sm text-gray-300 flex items-end">
              {filtered.length} alerte(s)
            </div>
          </div>
          {dateFilter === "custom" && (
            <div className="grid md:grid-cols-2 gap-3 mb-5">
              <label className="text-sm text-gray-300 flex flex-col gap-2">
                Date debut
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="cc-panel rounded-[18px] px-3 py-2 focus:outline-none"
                />
              </label>
              <label className="text-sm text-gray-300 flex flex-col gap-2">
                Date fin
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="cc-panel rounded-[18px] px-3 py-2 focus:outline-none"
                />
              </label>
            </div>
          )}
          <div className="space-y-6 lg:max-h-[680px] lg:overflow-y-auto lg:pr-1">
            {filtered.length === 0 && (
              <div className="cc-panel rounded-[20px] p-4">
                <p className="text-sm text-gray-200">Aucune alerte pour ces filtres.</p>
                <p className="mt-1 text-xs text-gray-400">
                  Élargis la période, retire un filtre ou recharge plus d&apos;historique.
                </p>
              </div>
            )}
            {filteredTimeline.map((group) => (
              <div key={group.label}>
                <div className="mb-3 flex items-center gap-3">
                  <p className="text-sm font-medium text-gray-100">{group.label}</p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-400">
                    {group.items.length} alerte(s)
                  </span>
                </div>
                <div className="space-y-3">
                  {group.items.map((event) => {
              const score = getPriorityScore(event);
              const priorityLabel = getPriorityLabel(score);
              const priorityClass = getPriorityClass(score);
              const changeSummary = getAlertChangeSummary(event);
              const isExpanded = expandedAlertId === event.id;
              const priorityReason = event.metadata?.priority_reason;
              const quickMeta = [
                getAlertFieldLabel(event.field_key),
                getAlertChangeKind(event),
              ].join(" • ");

              return (
                <div
                  key={event.id}
                  className={`rounded-lg border p-4 transition ${getAlertCardClass(event)}`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] uppercase px-2 py-1 rounded-full ${getDomainClass(event.domain)}`}
                    >
                      {event.domain}
                    </span>
                    <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-white/10 text-gray-200">
                      {event.severity}
                    </span>
                    <span
                      className={`text-[10px] uppercase px-2 py-1 rounded-full ${priorityClass}`}
                    >
                      {priorityLabel}
                    </span>
                    {event.change_group_id && (
                      <span className="text-[10px] uppercase px-2 py-1 rounded-full cc-chip">
                        {event.is_group_root ? "Sequence" : "Groupe"} x
                        {event.metadata?.grouped_changes_count || 1}
                      </span>
                    )}
                    {Array.isArray(event.noise_flags) &&
                      event.noise_flags.length > 0 && (
                        <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-white/10 text-gray-200">
                          Bruit filtre
                        </span>
                      )}
                    <span
                      className={`text-[10px] uppercase px-2 py-1 rounded-full ${
                        event.is_read
                          ? "bg-emerald-500/15 text-emerald-200"
                          : "bg-amber-500/15 text-amber-200"
                      }`}
                    >
                      {event.is_read ? "Lu" : "Nouveau"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-100">
                    {changeSummary}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">{quickMeta}</p>
                  {priorityReason && (
                    <p className="mt-1 text-xs text-gray-300">{priorityReason}</p>
                  )}
                  {event.metadata?.url && (
                    <p className="text-xs text-gray-400 mt-2 break-all">
                      {event.metadata.url}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">
                      {formatAlertDateShort(event.détectéd_at)}
                    </p>
                    <button
                      onClick={() =>
                        setExpandedAlertId(isExpanded ? null : event.id)
                      }
                      className="text-xs text-gray-300 hover:text-white"
                    >
                      {isExpanded ? "Masquer changement" : "Voir changement"}
                    </button>
                  </div>
                </div>
              );
                  })}
                </div>
              </div>
            ))}
          </div>
          {expandedAlert && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <button
                aria-label="Fermer"
                className="absolute inset-0 bg-black/70"
                onClick={() => setExpandedAlertId(null)}
              />
              <div className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-[#0b1025] p-5">
                {(() => {
                  const quickFacts = [
                    { label: "Type", value: getAlertDomainLabel(expandedAlert.domain) },
                    { label: "Element", value: getAlertFieldLabel(expandedAlert.field_key) },
                    { label: "Variation", value: getAlertChangeKind(expandedAlert) },
                    { label: "Source", value: expandedAlert.metadata?.url || "URL indisponible" },
                  ];

                  return (
                    <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-white/68 uppercase">
                      Observation concurrente - {expandedAlert.domain} - {expandedAlert.severity}
                    </p>
                    <p className="mt-1 text-sm text-gray-100">
                      {getAlertChangeSummary(expandedAlert)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatAlertDateShort(expandedAlert.détectéd_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpandedAlertId(null)}
                    className="cc-button-secondary rounded-full px-2 py-1 text-xs"
                  >
                    Fermer
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-300">
                  <span className="text-gray-400">Ce que cela peut signaler :</span>{" "}
                  {getAlertImpactLabel(expandedAlert)}
                </p>
                <p className="mt-1 text-xs text-gray-300">
                  <span className="text-gray-400">Vérification utile :</span>{" "}
                  {getAlertRecommendedAction(expandedAlert)}
                </p>
                <div className="mt-4 grid gap-2 md:grid-cols-4 text-[11px]">
                  {quickFacts.map((item) => (
                    <div
                      key={item.label}
                      className="cc-panel rounded-[18px] p-3"
                    >
                      <p className="text-gray-400">{item.label}</p>
                      <p className="mt-1 break-words text-gray-100">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 text-xs">
                  <div className="rounded-md border border-amber-300/20 bg-amber-500/[0.05] p-3">
                    <p className="text-gray-400 mb-1">Etat precedent</p>
                    <p className="text-gray-200">
                      {expandedAlert.metadata?.before_short || "non disponible"}
                    </p>
                  </div>
                  <div className="rounded-md border border-emerald-300/20 bg-emerald-500/[0.05] p-3">
                    <p className="text-gray-400 mb-1">Etat observe</p>
                    <p className="text-gray-200">
                      {expandedAlert.metadata?.after_short || "non disponible"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-gray-400">
                  {expandedAlert.metadata?.priority_reason ||
                    "Priorité estimee selon le type de changement observe."}
                </p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
          {hasMore && (
            <div className="mt-5 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? "Chargement..." : "Charger plus"}
              </button>
            </div>
          )}
        </div>
      </motion.section>
    </main>
  );
}
