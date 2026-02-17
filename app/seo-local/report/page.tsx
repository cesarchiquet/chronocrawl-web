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

type SeoLocalResult = {
  id: number;
  run_id: string;
  keyword: string;
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
  const [results, setResults] = useState<SeoLocalResult[]>([]);

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

  useEffect(() => {
    const loadProfileAndRun = async () => {
      if (!session?.user?.id) return;

      const { data: profileData, error: profileError } = await supabase
        .from("seo_local_profiles")
        .select("city,area,keywords,updated_at")
        .eq("user_id", session.user.id)
        .maybeSingle<SeoLocalProfile>();

      if (profileError) {
        setMessage("Configuration SEO locale indisponible. Lance la migration 008.");
        return;
      }

      setProfile(profileData || null);

      const { data: latestRunRow, error: runError } = await supabase
        .from("seo_local_runs")
        .select(
          "id,city,area_km,status,keywords_count,results_count,started_at,finished_at,error_message"
        )
        .eq("user_id", session.user.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle<SeoLocalRun>();

      if (runError) {
        setMessage("Historique SEO local indisponible. Lance la migration 009.");
        return;
      }

      setLatestRun(latestRunRow || null);

      if (!latestRunRow?.id) {
        setResults([]);
        return;
      }

      const { data: rows } = await supabase
        .from("seo_local_results")
        .select("id,run_id,keyword,place_name,distance_km,source_url")
        .eq("run_id", latestRunRow.id)
        .order("keyword", { ascending: true })
        .order("distance_km", { ascending: true })
        .limit(500);

      setResults((rows || []) as SeoLocalResult[]);
    };

    void loadProfileAndRun();
  }, [session?.user?.id]);

  const runLocalAnalysis = async () => {
    if (!session?.access_token) return;
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
        `Analyse locale terminee: ${data.resultsCount ?? 0} resultat(s) qualifies dans ${data.areaKm ?? "?"} km autour de ${data.city || "la ville"}.`
      );

      const { data: latestRunRow } = await supabase
        .from("seo_local_runs")
        .select(
          "id,city,area_km,status,keywords_count,results_count,started_at,finished_at,error_message"
        )
        .eq("user_id", session.user.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle<SeoLocalRun>();

      setLatestRun(latestRunRow || null);

      if (latestRunRow?.id) {
        const { data: rows } = await supabase
          .from("seo_local_results")
          .select("id,run_id,keyword,place_name,distance_km,source_url")
          .eq("run_id", latestRunRow.id)
          .order("keyword", { ascending: true })
          .order("distance_km", { ascending: true })
          .limit(500);
        setResults((rows || []) as SeoLocalResult[]);
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Execution impossible.");
    } finally {
      setRunning(false);
    }
  };

  const groupedByKeyword = useMemo(() => {
    const groups = new Map<string, SeoLocalResult[]>();
    for (const row of results) {
      const current = groups.get(row.keyword) || [];
      current.push(row);
      groups.set(row.keyword, current);
    }
    return Array.from(groups.entries());
  }, [results]);

  const topKeywords = useMemo(
    () => groupedByKeyword.map(([keyword, rows]) => ({ keyword, count: rows.length })),
    [groupedByKeyword]
  );

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
          <p className="mt-4 text-gray-300">
            Connecte-toi pour consulter ton rapport local.
          </p>
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
          Rapport moteur local (ville + perimetre + mots-cles)
        </h1>
        <p className="mt-5 text-gray-300 max-w-3xl">
          Le moteur geolocalise la ville, applique ton perimetre en km et cherche
          les resultats locaux pour chaque mot-cle configure.
        </p>

        {!profile ? (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-gray-200">
              Aucune configuration SEO locale enregistree.
            </p>
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
                <p className="mt-2 text-sm text-gray-200">
                  Statut: {latestRun?.status || "aucun run"}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Resultats qualifies: {latestRun?.results_count || 0}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Fini a: {formatDateTimeFr(latestRun?.finished_at || null)}
                </p>
              </article>
              <article className="rounded-xl bg-white/5 border border-white/10 p-6">
                <p className="text-xs text-indigo-200 uppercase">Lecture rapide</p>
                {topKeywords.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-300">Aucun resultat local pour l&apos;instant.</p>
                ) : (
                  topKeywords.slice(0, 3).map((item) => (
                    <p key={item.keyword} className="mt-2 text-sm text-gray-300">
                      - {item.keyword}: {item.count} resultat(s)
                    </p>
                  ))
                )}
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

            {message && <p className="mt-4 text-sm text-indigo-200">{message}</p>}

            {groupedByKeyword.length > 0 && (
              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-semibold">Resultats par mot-cle</h2>
                <div className="mt-4 space-y-5">
                  {groupedByKeyword.map(([keyword, rows]) => (
                    <div key={keyword} className="rounded-lg border border-white/10 bg-black/20 p-4">
                      <p className="text-sm font-medium text-indigo-200">{keyword}</p>
                      <div className="mt-3 space-y-2">
                        {rows.slice(0, 5).map((row) => (
                          <div
                            key={row.id}
                            className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-gray-300"
                          >
                            <p className="break-all">{row.place_name}</p>
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
