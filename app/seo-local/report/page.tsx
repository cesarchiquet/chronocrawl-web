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
  if (value > 0) return `+${value} (en hausse)`;
  if (value < 0) return `${value} (en baisse)`;
  return "stable";
}

function clampScore(value: number) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function formatProvider(value: string | null) {
  if (value === "google_places") return "Google";
  if (value === "nominatim") return "OpenStreetMap";
  return "Source standard";
}

function formatStatus(value: SeoLocalRun["status"] | undefined) {
  if (value === "completed") return "terminee";
  if (value === "failed") return "en erreur";
  return "indisponible";
}

function formatMatchSource(value: KeywordBaseline["target_match_source"]) {
  if (value === "name") return "nom d'entreprise";
  if (value === "source_url") return "lien source";
  if (value === "business_url") return "site web";
  return null;
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
      setMessage("Configuration indisponible pour le moment.");
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
      setMessage("Historique indisponible pour le moment.");
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
      setMessage("Resultats indisponibles pour le moment.");
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
        throw new Error(data?.error || "Analyse impossible pour le moment.");
      }

      setMessage(
        `Analyse terminee: ${data.positionsCount ?? 0} resultat(s), source ${formatProvider(data.provider || "nominatim")}, ${data.alertsCount ?? 0} baisse(s) detectee(s).`
      );

      await loadReportData(session.user.id);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Analyse impossible.");
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
        "Votre entreprise est encore peu visible: renforcez vos pages locales prioritaires."
      );
    }
    if (top10Rate < 0.65) {
      actions.push(
        "Travaillez d'abord les recherches hors top 10 avec du contenu local clair."
      );
    }
    if (highAlerts > 0) {
      actions.push(
        `Traitez en priorite ${highAlerts} recherche(s) en forte baisse cette semaine.`
      );
    }
    if (actions.length === 0) {
      actions.push("Bonne dynamique: conservez ce rythme et continuez l'optimisation locale.");
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
          <p className="mt-4 text-gray-300">Connecte-toi pour consulter ton suivi local.</p>
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
        <p className="text-sm text-indigo-300 font-medium">SEO local - Tableau de bord</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold">
          Suivi de votre visibilite locale
        </h1>
        <p className="mt-5 text-gray-300 max-w-3xl">
          Suivez simplement vos rangs dans votre ville, voyez ce qui monte ou baisse,
          puis appliquez les actions recommandees.
        </p>

        {message && <p className="mt-4 text-sm text-indigo-200">{message}</p>}

        {!profile ? (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-gray-200">Aucun reglage trouve. Commencez par configurer votre suivi.</p>
            <Link
              href="/seo-local/setup"
              className="inline-flex mt-4 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition text-sm font-medium"
            >
              Configurer le suivi local
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <article className="rounded-xl bg-white/5 border border-white/10 p-6">
                <p className="text-xs text-indigo-200 uppercase">Vos reglages</p>
                <p className="mt-2 text-sm text-gray-200">Ville: {profile.city || "—"}</p>
                <p className="mt-1 text-sm text-gray-300">Zone surveillee: {profile.area || "10km"}</p>
                <p className="mt-1 text-sm text-gray-300">
                  Recherches suivies: {(profile.keywords || []).length}
                </p>
              </article>
              <article className="rounded-xl bg-white/5 border border-white/10 p-6">
                <p className="text-xs text-indigo-200 uppercase">Derniere analyse</p>
                <p className="mt-2 text-sm text-gray-200">Statut: {formatStatus(latestRun?.status)}</p>
                <p className="mt-1 text-sm text-gray-300">Source de donnees: {formatProvider(latestRun?.provider || "nominatim")}</p>
                <p className="mt-1 text-sm text-gray-300">Resultats trouves: {currentPositions.length}</p>
                <p className="mt-1 text-sm text-gray-300">
                  Date: {formatDateTimeFr(latestRun?.finished_at || null)}
                </p>
              </article>
              <article className="rounded-xl bg-white/5 border border-white/10 p-6">
                <p className="text-xs text-indigo-200 uppercase">Sante locale</p>
                <p className="mt-2 text-3xl font-semibold text-indigo-100">{scoreAndActions.score}/100</p>
                <p className="mt-1 text-sm text-gray-300">
                  En top 3: {scoreAndActions.top3Count}/{scoreAndActions.configuredKeywords}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  En top 10: {scoreAndActions.top10Count}/{scoreAndActions.configuredKeywords}
                </p>
              </article>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={runLocalAnalysis}
                disabled={running}
                className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium disabled:opacity-50"
              >
                {running ? "Analyse en cours..." : "Lancer une analyse"}
              </button>
              <Link
                href="/seo-local/setup"
                className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition font-medium"
              >
                Modifier mes reglages
              </Link>
            </div>

            {currentTopByKeyword.length > 0 && (
              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">Vos meilleurs rangs</h2>
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
                          {" "}- rang {row.position}
                        </p>
                        <p className="text-xs text-gray-300">
                          {delta === null
                            ? "Nouveau suivi"
                            : delta > 0
                              ? `+${delta} (ameliore)`
                              : delta < 0
                                ? `${delta} (recule)`
                                : "stable"}
                          {trend ? ` | 7 jours ${formatDelta(trend.delta7d)} | 30 jours ${formatDelta(trend.delta30d)}` : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {latestBaselines.length > 0 && (
              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">Votre visibilite face aux concurrents</h2>
                <div className="mt-4 space-y-2">
                  {latestBaselines.slice(0, 12).map((row) => (
                    <div
                      key={row.id}
                      className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                    >
                      <p>
                        <span className="text-indigo-200 font-medium">{row.keyword}</span>
                        {" "}- votre entreprise {row.target_position ? `au rang #${row.target_position}` : "non visible pour l'instant"}
                        {formatMatchSource(row.target_match_source)
                          ? ` (detectee via ${formatMatchSource(row.target_match_source)})`
                          : ""}
                      </p>
                      <p className="text-gray-300">
                        meilleur concurrent {row.competitor_best_position ? `rang #${row.competitor_best_position}` : "non detecte"}
                        {" | concurrents detectes: "}
                        {row.competitors_detected}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentAlerts.length > 0 && (
              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">Baisses a surveiller</h2>
                <div className="mt-4 space-y-2">
                  {recentAlerts.slice(0, 8).map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                    >
                      <p>
                        <span className="text-indigo-200 font-medium">{alert.keyword}</span>
                        {" "}- rang #{alert.previous_position} vers #{alert.current_position}
                      </p>
                      <p
                        className={
                          alert.severity === "high" ? "text-rose-200" : "text-amber-200"
                        }
                      >
                        +{alert.delta} ({alert.severity === "high" ? "forte" : "moderee"}) - {formatDateTimeFr(alert.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">Prochaines actions prioritaires</h2>
              <div className="mt-4 space-y-2 text-sm text-gray-200">
                {scoreAndActions.actions.map((action) => (
                  <p key={action}>- {action}</p>
                ))}
                <p className="text-xs text-gray-400">
                  Baisses sur 7 jours: {scoreAndActions.highAlerts} fortes / {scoreAndActions.mediumAlerts} moderees
                </p>
              </div>
            </div>

            {groupedCurrent.length > 0 && (
              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">Detail des resultats</h2>
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
                            <p className="break-all">Rang #{row.position} - {row.place_name}</p>
                            <div className="flex items-center gap-3">
                              <span>{row.distance_km.toFixed(2)} km</span>
                              {row.source_url && (
                                <a
                                  href={row.source_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-200 hover:text-indigo-100"
                                >
                                  Voir source
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
            Modifier mes reglages
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
