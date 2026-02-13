"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

type ChangeEvent = {
  id: string;
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

export default function AlertsHistoryPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [severityFilter, setSeverityFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [urlFilter, setUrlFilter] = useState("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">(
    "all"
  );
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
  }, []);

  useEffect(() => {
    if (!session?.user) return;

    const load = async () => {
      const { data } = await supabase
        .from("detected_changes")
        .select("id,domain,severity,metadata,detected_at,is_read")
        .order("detected_at", { ascending: false })
        .limit(500);

      setEvents((data || []) as ChangeEvent[]);
    };

    load();
  }, [session?.user?.id]);

  const availableUrls = useMemo(() => {
    const values = new Set<string>();
    for (const event of events) {
      const url = event.metadata?.url;
      if (url) values.add(url);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((event) => {
      if (severityFilter !== "all" && event.severity !== severityFilter) {
        return false;
      }
      if (urlFilter !== "all" && event.metadata?.url !== urlFilter) {
        return false;
      }
      if (readFilter === "unread" && event.is_read) return false;
      if (readFilter === "read" && !event.is_read) return false;
      return true;
    });
  }, [events, severityFilter, urlFilter, readFilter]);

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
      const domain = event.domain || "";
      const severity = event.severity || "";
      const readState = event.is_read ? "read" : "unread";
      const url = event.metadata?.url || "";
      const summary = event.metadata?.summary || "Alerte détectée";
      return [
        detectedAt,
        domain,
        severity,
        readState,
        url,
        summary,
      ]
        .map((item) => escapeCsv(String(item)))
        .join(",");
    });

    const header = [
      "detected_at",
      "domain",
      "severity",
      "read_state",
      "url",
      "summary",
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816]" />
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
          <div className="grid md:grid-cols-4 gap-3 mb-5">
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
            <div className="text-sm text-gray-300 flex items-end">
              {filtered.length} alerte(s)
            </div>
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <p className="text-gray-400 text-sm">Aucune alerte pour ces filtres.</p>
            )}
            {filtered.map((event) => {
              const score = getPriorityScore(event);
              const priorityLabel = getPriorityLabel(score);
              const priorityClass = getPriorityClass(score);
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
                    className={`text-[10px] uppercase px-2 py-1 rounded-full ${
                      event.is_read
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "bg-amber-500/15 text-amber-200"
                    }`}
                  >
                    {event.is_read ? "lu" : "non lu"}
                  </span>
                </div>
                <p className="text-sm text-gray-200">
                  {event.metadata?.summary || "Alerte détectée"}
                </p>
                {event.metadata?.url && (
                  <p className="text-xs text-gray-400 mt-1 break-all">
                    {event.metadata.url}
                  </p>
                )}
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
        </div>
      </section>
    </main>
  );
}
