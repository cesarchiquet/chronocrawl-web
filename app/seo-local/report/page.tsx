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

function formatDateTimeFr(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("fr-FR");
}

export default function SeoLocalReportPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<SeoLocalProfile | null>(null);
  const [latestRun, setLatestRun] = useState<SeoLocalRun | null>(null);
  const [previousRun, setPreviousRun] = useState<SeoLocalRun | null>(null);
  const [currentPositions, setCurrentPositions] = useState<KeywordPosition[]>([]);
  const [previousPositions, setPreviousPositions] = useState<KeywordPosition[]>([]);

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
        "id,city,area_km,status,keywords_count,results_count,started_at,finished_at,error_message"
      )
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(2);

    if (runsError) {
      setMessage("Historique SEO local indisponible. Lance la migration 009.");
      return;
    }

    const runs = (runsData || []) as SeoLocalRun[];
    const latest = runs[0] || null;
    const previous = runs[1] || null;
    setLatestRun(latest);
    setPreviousRun(previous);

    if (!latest?.id) {
      setCurrentPositions([]);
      setPreviousPositions([]);
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
      return;
    }

    setCurrentPositions((currentRows || []) as KeywordPosition[]);

    if (!previous?.id) {
      setPreviousPositions([]);
      return;
    }

    const { data: previousRows } = await supabase
      .from("seo_local_keyword_positions")
      .select("id,run_id,keyword,position,place_name,distance_km,source_url")
      .eq("run_id", previous.id)
      .order("keyword", { ascending: true })
      .order("position", { ascending: true })
      .limit(1000);

    setPreviousPositions((previousRows || []) as KeywordPosition[]);
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
        `Analyse locale terminee: ${data.positionsCount ?? 0} position(s) calculee(s) dans ${data.areaKm ?? "?"} km autour de ${data.city || "la ville"}.`
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
                <p className="mt-1 text-sm text-gray-300">Positions: {currentPositions.length}</p>
                <p className="mt-1 text-sm text-gray-300">
                  Fini a: {formatDateTimeFr(latestRun?.finished_at || null)}
                </p>
              </article>
              <article className="rounded-xl bg-white/5 border border-white/10 p-6">
                <p className="text-xs text-indigo-200 uppercase">Run precedent</p>
                <p className="mt-2 text-sm text-gray-200">
                  {previousRun ? formatDateTimeFr(previousRun.finished_at) : "Aucun run precedent"}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  {previousRun ? `${previousPositions.length} positions comparees` : "Lance un 2e run pour voir l'evolution"}
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
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
