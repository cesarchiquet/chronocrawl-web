"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import {
  getAlertChangeSummary,
  getAlertConfidence,
  getAlertImpactLabel,
  getAlertRecommendedAction,
} from "@/lib/alertPresentation";

type ChangeEvent = {
  id: string;
  field_key?: string;
  domain: "seo" | "pricing" | "cta" | "content";
  severity: "low" | "medium" | "high";
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

const HISTORY_PAGE_SIZE = 250;

export default function AlertsHistoryPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(0);
  const [nowReferenceMs, setNowReferenceMs] = useState(0);
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [severityFilter, setSeverityFilter] = useState<
    "all" | "low" | "medium" | "high"
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
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const loadEventsPage = useCallback(
    async (userId: string, from: number, reset = false) => {
      const to = from + HISTORY_PAGE_SIZE - 1;
      const { data } = await supabase
        .from("detected_changes")
        .select("id,field_key,domain,severity,metadata,detected_at,is_read")
        .eq("user_id", userId)
        .order("detected_at", { ascending: false })
        .range(from, to);

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

  const availableUrls = useMemo(() => {
    const values = new Set<string>();
    for (const event of events) {
      const url = event.metadata?.url;
      if (url) values.add(url);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
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
        const detectedMs = event.detected_at ? Date.parse(event.detected_at) : NaN;
        if (!Number.isFinite(detectedMs)) return false;
        if (dateFilter === "custom") {
          if (fromMsCustom !== null && detectedMs < fromMsCustom) return false;
          if (toMsCustom !== null && detectedMs > toMsCustom) return false;
        } else if (fromMsPreset !== null && detectedMs < fromMsPreset) {
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

  const getPriorityScore = (event: ChangeEvent) => {
    const raw = event.metadata?.priority_score;
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (event.severity === "high") return 85;
    if (event.severity === "medium") return 60;
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

  const exportCsv = () => {
    const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = filtered.map((event) => {
      const detectedAt = event.detected_at || "";
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
      const beforeShort = event.metadata?.before_short || "";
      const afterShort = event.metadata?.after_short || "";
      return [
        detectedAt,
        fieldKey,
        domain,
        severity,
        readState,
        url,
        summary,
        priorityScore,
        priorityReason,
        beforeShort,
        afterShort,
      ]
        .map((item) => escapeCsv(String(item)))
        .join(",");
    });

    const header = [
      "detected_at",
      "field_key",
      "domain",
      "severity",
      "read_state",
      "url",
      "summary",
      "priority_score",
      "priority_reason",
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

  const markFilteredAsRead = async (isRead: boolean) => {
    if (!session?.user?.id || filtered.length === 0) {
      setBulkMessage("Aucune alerte a mettre a jour avec ces filtres.");
      return;
    }

    setBulkLoading(true);
    setBulkMessage("");
    const ids = filtered.map((event) => event.id);
    const chunkSize = 250;

    for (let index = 0; index < ids.length; index += chunkSize) {
      const chunk = ids.slice(index, index + chunkSize);
      const { error } = await supabase
        .from("detected_changes")
        .update({ is_read: isRead })
        .eq("user_id", session.user.id)
        .in("id", chunk);

      if (error) {
        setBulkLoading(false);
        setBulkMessage("Mise a jour impossible. Reessaie.");
        return;
      }
    }

    const idSet = new Set(ids);
    setEvents((prev) =>
      prev.map((event) =>
        idSet.has(event.id) ? { ...event, is_read: isRead } : event
      )
    );
    setBulkLoading(false);
    setBulkMessage(
      `${ids.length} alerte(s) marquee(s) ${isRead ? "lue(s)" : "non lue(s)"}.`
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-10">
          <div className="h-6 w-32 rounded bg-white/10 animate-pulse" />
          <div className="mt-4 h-10 w-72 rounded bg-white/10 animate-pulse" />
        </section>
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
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
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
        <section className="max-w-3xl mx-auto px-6 pt-28 pb-24 text-center">
          <h1 className="text-3xl font-bold">Historique d&apos;alertes</h1>
          <p className="mt-4 text-gray-300">
            Connecte-toi pour consulter l&apos;historique complet.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium mt-8"
          >
            Se connecter
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-indigo-300 text-sm font-medium">Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-bold">Historique d&apos;alertes</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCsv}
              className="px-5 py-2 rounded-lg border border-indigo-300/30 text-indigo-200 hover:bg-indigo-500/10 transition"
            >
              Export CSV
            </button>
            <a
              href="/dashboard"
              className="px-5 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition"
            >
              Retour dashboard
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-xl bg-white/5 border border-white/10 p-6">
          <div className="grid md:grid-cols-3 gap-3 mb-3">
            <label className="text-sm text-gray-300 flex flex-col gap-2">
              Sévérité
              <select
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(
                    e.target.value as "all" | "low" | "medium" | "high"
                  )
                }
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
              >
                <option value="all">Toutes</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="text-sm text-gray-300 flex flex-col gap-2">
              URL
              <select
                value={urlFilter}
                onChange={(e) => setUrlFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
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
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
              >
                <option value="all">Tous</option>
                <option value="unread">Non lus</option>
                <option value="read">Lus</option>
              </select>
            </label>
          </div>
          <div className="grid md:grid-cols-4 gap-3 mb-5">
            <label className="text-sm text-gray-300 flex flex-col gap-2">
              Periode
              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(
                    e.target.value as "all" | "24h" | "7d" | "30d" | "custom"
                  )
                }
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
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
                placeholder="URL, resume, domaine..."
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
              />
            </label>
            <div className="text-sm text-gray-300 flex items-end">
              {filtered.length} alerte(s)
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => markFilteredAsRead(true)}
                disabled={bulkLoading}
                className="px-3 py-2 rounded-lg border border-emerald-300/30 text-emerald-200 hover:bg-emerald-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Marquer filtrees lues
              </button>
              <button
                onClick={() => markFilteredAsRead(false)}
                disabled={bulkLoading}
                className="px-3 py-2 rounded-lg border border-amber-300/30 text-amber-200 hover:bg-amber-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Marquer non lues
              </button>
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
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
                />
              </label>
              <label className="text-sm text-gray-300 flex flex-col gap-2">
                Date fin
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
                />
              </label>
            </div>
          )}
          {bulkMessage && (
            <p className="text-sm text-indigo-200 mb-4">{bulkMessage}</p>
          )}

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <p className="text-gray-400 text-sm">Aucune alerte pour ces filtres.</p>
            )}
            {filtered.map((event) => {
              const score = getPriorityScore(event);
              const priorityLabel = getPriorityLabel(score);
              const priorityClass = getPriorityClass(score);
              const confidence = getAlertConfidence(event);
              const changeSummary = getAlertChangeSummary(event);
              const impactLabel = getAlertImpactLabel(event);
              const recommendedAction = getAlertRecommendedAction(event);
              const isExpanded = expandedAlertId === event.id;

              return (
                <div
                  key={event.id}
                  className="rounded-lg border border-white/10 p-4 bg-white/[0.02]"
                >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-200">
                    {event.domain}
                  </span>
                  <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-white/10 text-gray-200">
                    {event.severity}
                  </span>
                  <span
                    className={`text-[10px] uppercase px-2 py-1 rounded-full ${priorityClass}`}
                  >
                    Impact {score} - {priorityLabel}
                  </span>
                  <span
                    className={`text-[10px] uppercase px-2 py-1 rounded-full ${confidence.className}`}
                  >
                    Confiance {confidence.label}
                  </span>
                  <span
                    className={`text-[10px] uppercase px-2 py-1 rounded-full ${
                      event.is_read
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-amber-500/15 text-amber-200"
                    }`}
                  >
                    {event.is_read ? "lu" : "non lu"}
                  </span>
                </div>
                <p className="text-sm text-gray-200">{changeSummary}</p>
                {event.metadata?.url && (
                  <p className="text-xs text-gray-400 mt-1 break-all">
                    {event.metadata.url}
                  </p>
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
                  <p className="text-xs text-gray-500">{event.detected_at || "—"}</p>
                  <button
                    onClick={() => setExpandedAlertId(isExpanded ? null : event.id)}
                    className="text-xs text-gray-300 hover:text-white"
                  >
                    {isExpanded ? "Masquer preuve" : "Voir la preuve"}
                  </button>
                </div>
                {isExpanded && (
                  <div className="mt-3 rounded-md border border-white/10 bg-black/20 p-3">
                    <p className="text-[11px] text-gray-400">
                      {event.metadata?.priority_reason ||
                        "Priorité calculée automatiquement."}
                    </p>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                      <div>
                        <p className="text-gray-400 mb-1">Avant</p>
                        <p className="text-gray-200">
                          {event.metadata?.before_short || "non disponible"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Après</p>
                        <p className="text-gray-200">
                          {event.metadata?.after_short || "non disponible"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="mt-5 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 rounded-lg border border-indigo-300/30 text-indigo-200 hover:bg-indigo-500/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? "Chargement..." : "Charger plus"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
