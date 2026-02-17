"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import PublicChrome from "@/components/PublicChrome";
import { supabase } from "@/lib/supabaseClient";

type SeoLocalProfile = {
  city: string | null;
  area: string | null;
  keywords: string[] | null;
  updated_at: string;
};

type SeoLocalRun = {
  id: string;
  city: string;
  area_km: number;
  provider: string | null;
  status: "completed" | "failed";
  keywords_count: number;
  results_count: number;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
};

type KeywordPosition = {
  id: number;
  run_id: string;
  keyword: string;
  position: number;
  place_name: string;
  distance_km: number;
  source_url: string | null;
};

type KeywordBaseline = {
  id: number;
  run_id: string;
  keyword: string;
  target_position: number | null;
  target_detected: boolean;
  target_match_source: "name" | "source_url" | "business_url" | null;
  competitor_best_position: number | null;
  competitors_detected: number;
  top_position: number | null;
  top_place_name: string | null;
};

type PositionAlert = {
  id: number;
  keyword: string;
  previous_position: number;
  current_position: number;
  delta: number;
  severity: "medium" | "high";
  created_at: string;
};

type TrendStat = {
  latestPosition: number;
  delta7d: number | null;
  delta30d: number | null;
};

function formatDateTimeFr(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR");
}

function formatDelta(value: number | null) {
  if (value === null) return "n/a";
  if (value > 0) return `+${value} (mieux)`;
  if (value < 0) return `${value} (baisse)`;
  return "stable";
}

function clampScore(value: number) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export default function SeoLocalReportPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<SeoLocalProfile | null>(null);
  const [latestRun, setLatestRun] = useState<SeoLocalRun | null>(null);
  const [recentRuns, setRecentRuns] = useState<SeoLocalRun[]>([]);
  const [currentPositions, setCurrentPositions] = useState<KeywordPosition[]>([]);
  const [previousPositions, setPreviousPositions] = useState<KeywordPosition[]>([]);
  const [recentPositions, setRecentPositions] = useState<KeywordPosition[]>([]);
  const [latestBaselines, setLatestBaselines] = useState<KeywordBaseline[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<PositionAlert[]>([]);

  useEffect(() => {
    const hydrate = async () => {
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
    hydrate();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const loadReportData = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from("seo_local_profiles")
      .select("city,area,keywords,updated_at")
      .eq("user_id", userId)
      .maybeSingle<SeoLocalProfile>();

    if (profileError) {
      setMessage("Configuration SEO locale indisponible. Lance la migration 008.");
      return;
    }
    setProfile(profileData || null);

    const { data: runsData, error: runsError } = await supabase
      .from("seo_local_runs")
      .select(
        "id,city,area_km,provider,status,keywords_count,results_count,started_at,finished_at,error_message"
      )
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(40);

    if (runsError) {
      setMessage("Historique SEO local indisponible. Lance la migration 009.");
      return;
    }

    const runs = (runsData || []) as SeoLocalRun[];
    setRecentRuns(runs);

    const latest = runs[0] || null;
    const previous = runs[1] || null;
    setLatestRun(latest);

    if (!latest?.id) {
      setCurrentPositions([]);
      setPreviousPositions([]);
      setRecentPositions([]);
      setLatestBaselines([]);
      setRecentAlerts([]);
      return;
    }

    const { data: currentRows, error: currentError } = await supabase
      .from("seo_local_keyword_positions")
      .select("id,run_id,keyword,position,place_name,distance_km,source_url")
      .eq("run_id", latest.id)
      .order("keyword", { ascending: true })
      .order("position", { ascending: true })
      .limit(1000);

    if (currentError) {
      setMessage("Positions locales indisponibles. Lance la migration 010.");
      setCurrentPositions([]);
      setPreviousPositions([]);
      setRecentPositions([]);
      setLatestBaselines([]);
      setRecentAlerts([]);
      return;
    }

    setCurrentPositions((currentRows || []) as KeywordPosition[]);

    if (previous?.id) {
      const { data: previousRows } = await supabase
        .from("seo_local_keyword_positions")
        .select("id,run_id,keyword,position,place_name,distance_km,source_url")
        .eq("run_id", previous.id)
        .order("keyword", { ascending: true })
        .order("position", { ascending: true })
        .limit(1000);
      setPreviousPositions((previousRows || []) as KeywordPosition[]);
    } else {
      setPreviousPositions([]);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const runIdsForTrend = runs
      .filter((run) => new Date(run.started_at) >= thirtyDaysAgo)
      .map((run) => run.id);

    if (runIdsForTrend.length > 0) {
      const { data: trendRows } = await supabase
        .from("seo_local_keyword_positions")
        .select("id,run_id,keyword,position,place_name,distance_km,source_url")
        .in("run_id", runIdsForTrend)
        .order("run_id", { ascending: true })
        .order("keyword", { ascending: true })
        .order("position", { ascending: true })
        .limit(5000);
      setRecentPositions((trendRows || []) as KeywordPosition[]);
    } else {
      setRecentPositions([]);
    }

    const { data: baselineRows } = await supabase
      .from("seo_local_keyword_baselines")
      .select(
        "id,run_id,keyword,target_position,target_detected,target_match_source,competitor_best_position,competitors_detected,top_position,top_place_name"
      )
      .eq("run_id", latest.id)
      .order("keyword", { ascending: true })
      .limit(1000);

    setLatestBaselines((baselineRows || []) as KeywordBaseline[]);

    const { data: alertRows } = await supabase
      .from("seo_local_position_alerts")
      .select("id,keyword,previous_position,current_position,delta,severity,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    setRecentAlerts((alertRows || []) as PositionAlert[]);
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    void loadReportData(session.user.id);
  }, [session?.user?.id]);

  const runLocalAnalysis = async () => {
    if (!session?.access_token || !session?.user?.id) return;
    setRunning(true);
    setMessage("");

    try {
      const response = await fetch("/api/seo-local/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Execution SEO locale impossible.");
      }

      setMessage(
        `Analyse terminee: ${data.positionsCount ?? 0} position(s), provider ${data.provider || "nominatim"}, ${data.alertsCount ?? 0} alerte(s) de baisse.`
      );

      await loadReportData(session.user.id);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Execution impossible.");
    } finally {
      setRunning(false);
    }
  };

  const currentTopByKeyword = useMemo(() => {
    const map = new Map<string, KeywordPosition>();
    for (const row of currentPositions) {
      const existing = map.get(row.keyword);
      if (!existing || row.position < existing.position) {
        map.set(row.keyword, row);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.keyword.localeCompare(b.keyword));
  }, [currentPositions]);

  const previousTopByKeyword = useMemo(() => {
    const map = new Map<string, KeywordPosition>();
    for (const row of previousPositions) {
      const existing = map.get(row.keyword);
      if (!existing || row.position < existing.position) {
        map.set(row.keyword, row);
      }
    }
    return map;
  }, [previousPositions]);

  const groupedCurrent = useMemo(() => {
    const groups = new Map<string, KeywordPosition[]>();
    for (const row of currentPositions) {
      const list = groups.get(row.keyword) || [];
      list.push(row);
      groups.set(row.keyword, list);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [currentPositions]);

  const trendByKeyword = useMemo(() => {
    const runDateById = new Map<string, number>();
    for (const run of recentRuns) {
      const timestamp = new Date(run.started_at).getTime();
      if (Number.isFinite(timestamp)) {
        runDateById.set(run.id, timestamp);
      }
    }

    const grouped = new Map<string, Array<{ timestamp: number; position: number }>>();

    for (const row of recentPositions) {
      const timestamp = runDateById.get(row.run_id);
      if (!timestamp) continue;
      const list = grouped.get(row.keyword) || [];
      const existing = list.find((entry) => entry.timestamp === timestamp);
      if (!existing || row.position < existing.position) {
        const filtered = list.filter((entry) => entry.timestamp !== timestamp);
        filtered.push({ timestamp, position: row.position });
        grouped.set(row.keyword, filtered);
      }
    }

    const result = new Map<string, TrendStat>();

    for (const [keyword, values] of grouped.entries()) {
      values.sort((a, b) => b.timestamp - a.timestamp);
      const latest = values[0];
      if (!latest) continue;

      const horizon7 = latest.timestamp - 7 * 24 * 60 * 60 * 1000;
      const horizon30 = latest.timestamp - 30 * 24 * 60 * 60 * 1000;

      const point7 = values.find((value) => value.timestamp <= horizon7) || values.at(-1);
      const point30 = values.find((value) => value.timestamp <= horizon30) || values.at(-1);

      const delta7d = point7 ? point7.position - latest.position : null;
      const delta30d = point30 ? point30.position - latest.position : null;

      result.set(keyword, {
        latestPosition: latest.position,
        delta7d,
        delta30d,
      });
    }

    return result;
  }, [recentPositions, recentRuns]);

  const scoreAndActions = useMemo(() => {
    const configuredKeywords = Math.max(profile?.keywords?.length || 0, currentTopByKeyword.length);
    const top3Count = currentTopByKeyword.filter((row) => row.position <= 3).length;
    const top10Count = currentTopByKeyword.filter((row) => row.position <= 10).length;
    const top3Rate = configuredKeywords > 0 ? top3Count / configuredKeywords : 0;
    const top10Rate = configuredKeywords > 0 ? top10Count / configuredKeywords : 0;

    const alertsLast7Days = recentAlerts.filter((alert) => {
      const date = new Date(alert.created_at).getTime();
      if (!Number.isFinite(date)) return false;
      return date >= Date.now() - 7 * 24 * 60 * 60 * 1000;
    });

    const highAlerts = alertsLast7Days.filter((alert) => alert.severity === "high").length;
    const mediumAlerts = alertsLast7Days.filter((alert) => alert.severity === "medium").length;

    const targetDetected = latestBaselines.filter((row) => row.target_detected).length;
    const targetCoverage =
      latestBaselines.length > 0 ? targetDetected / latestBaselines.length : 0;

    const rawScore = top3Rate * 55 + top10Rate * 45 - highAlerts * 12 - mediumAlerts * 4;
    const score = clampScore(rawScore);

    const actions: string[] = [];
    if (targetCoverage < 0.6) {
      actions.push(
        "Renforcer les pages locales cibles: la marque est peu detectee dans les resultats." 
      );
    }
    if (top10Rate < 0.65) {
      actions.push(
        "Prioriser les mots-cles hors top 10 avec contenu local + schema + liens internes dedies."
      );
    }
    if (highAlerts > 0) {
      actions.push(
        `Traiter en urgence ${highAlerts} mot-cle(s) en chute forte cette semaine.`
      );
    }
    if (actions.length === 0) {
      actions.push("Maintenir le cap: couverture stable, continuer l'optimisation progressive.");
    }

    return {
      score,
      top3Count,
      top10Count,
      configuredKeywords,
      highAlerts,
      mediumAlerts,
      actions,
    };
  }, [currentTopByKeyword, latestBaselines, profile?.keywords?.length, recentAlerts]);

  if (loading) {
    return (
      <PublicChrome>
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
          <div className="h-8 w-80 rounded bg-white/10 animate-pulse" />
          <div className="mt-5 h-32 rounded bg-white/10 animate-pulse" />
        </section>
      </PublicChrome>
    );
  }

  if (!session) {
    return (
      <PublicChrome>
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
          <h1 className="text-3xl font-bold">Rapport SEO local</h1>
          <p className="mt-4 text-gray-300">Connecte-toi pour consulter ton rapport local.</p>
          <Link
            href="/login"
            className="inline-flex mt-8 px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            Se connecter
          </Link>
        </section>
      </PublicChrome>
    );
  }

  return (
    <PublicChrome>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <p className="text-sm text-indigo-300 font-medium">SEO local - Rapport</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold">
          Positions locales et evolutions
        </h1>
        <p className="mt-5 text-gray-300 max-w-3xl">
          Le moteur calcule des positions par mot-cle selon ta ville et ton perimetre.
          Tu vois ensuite l&apos;evolution entre le dernier run et le precedent.
        </p>

        {message && <p className="mt-4 text-sm text-indigo-200">{message}</p>}

        {!profile ? (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-gray-200">Aucune configuration SEO locale enregistree.</p>
            <Link
              href="/seo-local/setup"
              className="inline-flex mt-4 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition text-sm font-medium"
            >
              Configurer SEO local
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <article className="rounded-xl bg-white/5 border border-white/10 p-6">
                <p className="text-xs text-indigo-200 uppercase">Configuration active</p>
                <p className="mt-2 text-sm text-gray-200">Ville: {profile.city || "—"}</p>
                <p className="mt-1 text-sm text-gray-300">Perimetre: {profile.area || "10km"}</p>
                <p className="mt-1 text-sm text-gray-300">
                  Mots-cles: {(profile.keywords || []).length}
                </p>
              </article>
              <article className="rounded-xl bg-white/5 border border-white/10 p-6">
                <p className="text-xs text-indigo-200 uppercase">Dernier run</p>
                <p className="mt-2 text-sm text-gray-200">Statut: {latestRun?.status || "aucun"}</p>
                <p className="mt-1 text-sm text-gray-300">Provider: {latestRun?.provider || "nominatim"}</p>
                <p className="mt-1 text-sm text-gray-300">Positions: {currentPositions.length}</p>
                <p className="mt-1 text-sm text-gray-300">
                  Fini a: {formatDateTimeFr(latestRun?.finished_at || null)}
                </p>
              </article>
              <article className="rounded-xl bg-white/5 border border-white/10 p-6">
                <p className="text-xs text-indigo-200 uppercase">Score actionnable</p>
                <p className="mt-2 text-3xl font-semibold text-indigo-100">{scoreAndActions.score}/100</p>
                <p className="mt-1 text-sm text-gray-300">
                  Top 3: {scoreAndActions.top3Count}/{scoreAndActions.configuredKeywords}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Top 10: {scoreAndActions.top10Count}/{scoreAndActions.configuredKeywords}
                </p>
              </article>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={runLocalAnalysis}
                disabled={running}
                className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium disabled:opacity-50"
              >
                {running ? "Analyse locale..." : "Lancer analyse locale"}
              </button>
              <Link
                href="/seo-local/setup"
                className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition font-medium"
              >
                Modifier la configuration
              </Link>
            </div>

            {currentTopByKeyword.length > 0 && (
              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">Top positions par mot-cle</h2>
                <div className="mt-4 space-y-2">
                  {currentTopByKeyword.map((row) => {
                    const previous = previousTopByKeyword.get(row.keyword);
                    const delta = previous ? previous.position - row.position : null;
                    const trend = trendByKeyword.get(row.keyword);
                    return (
                      <div
                        key={row.keyword}
                        className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                      >
                        <p>
                          <span className="text-indigo-200 font-medium">{row.keyword}</span>
                          {" "}- position {row.position}
                        </p>
                        <p className="text-xs text-gray-300">
                          {delta === null
                            ? "Nouveau mot-cle"
                            : delta > 0
                              ? `+${delta} (mieux)`
                              : delta < 0
                                ? `${delta} (baisse)`
                                : "stable"}
                          {trend ? ` | 7j ${formatDelta(trend.delta7d)} | 30j ${formatDelta(trend.delta30d)}` : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {latestBaselines.length > 0 && (
              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">Baseline marque vs concurrents</h2>
                <div className="mt-4 space-y-2">
                  {latestBaselines.slice(0, 12).map((row) => (
                    <div
                      key={row.id}
                      className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                    >
                      <p>
                        <span className="text-indigo-200 font-medium">{row.keyword}</span>
                        {" "}- cible {row.target_position ? `#${row.target_position}` : "non detectee"}
                        {row.target_match_source ? ` (via ${row.target_match_source})` : ""}
                      </p>
                      <p className="text-gray-300">
                        concurrent best {row.competitor_best_position ? `#${row.competitor_best_position}` : "n/a"}
                        {" | detectes: "}
                        {row.competitors_detected}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentAlerts.length > 0 && (
              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">Alertes de baisse de position</h2>
                <div className="mt-4 space-y-2">
                  {recentAlerts.slice(0, 8).map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                    >
                      <p>
                        <span className="text-indigo-200 font-medium">{alert.keyword}</span>
                        {" "}- #{alert.previous_position} vers #{alert.current_position}
                      </p>
                      <p
                        className={
                          alert.severity === "high" ? "text-rose-200" : "text-amber-200"
                        }
                      >
                        +{alert.delta} ({alert.severity}) - {formatDateTimeFr(alert.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">Plan d&apos;action recommande</h2>
              <div className="mt-4 space-y-2 text-sm text-gray-200">
                {scoreAndActions.actions.map((action) => (
                  <p key={action}>- {action}</p>
                ))}
                <p className="text-xs text-gray-400">
                  Alertes 7j: {scoreAndActions.highAlerts} high / {scoreAndActions.mediumAlerts} medium
                </p>
              </div>
            </div>

            {groupedCurrent.length > 0 && (
              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">Detail positions</h2>
                <div className="mt-4 space-y-5">
                  {groupedCurrent.map(([keyword, rows]) => (
                    <div key={keyword} className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-sm font-medium text-indigo-200">{keyword}</p>
                      <div className="mt-3 space-y-2">
                        {rows.slice(0, 8).map((row) => (
                          <div
                            key={row.id}
                            className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-gray-300"
                          >
                            <p className="break-all">#{row.position} - {row.place_name}</p>
                            <div className="flex items-center gap-3">
                              <span>{row.distance_km.toFixed(2)} km</span>
                              {row.source_url && (
                                <a
                                  href={row.source_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-200 hover:text-indigo-100"
                                >
                                  Source
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/seo-local/setup"
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition font-medium"
          >
            Modifier la configuration
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            Ouvrir le dashboard
          </Link>
        </div>
      </section>
    </PublicChrome>
  );
}
