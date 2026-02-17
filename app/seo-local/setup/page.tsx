"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import PublicChrome from "@/components/PublicChrome";
import { supabase } from "@/lib/supabaseClient";

type SeoLocalProfile = {
  city: string | null;
  area: string | null;
  keywords: string[] | null;
  competitors: string[] | null;
  priority_pages: string[] | null;
  updated_at: string;
};

const LOCAL_DIAMETER_OPTIONS = [5, 10, 25, 50] as const;

type CityApiRow = {
  nom?: string;
  population?: number;
};

const FALLBACK_CITY_OPTIONS = [
  "Paris",
  "Pau",
  "Perpignan",
  "Pessac",
  "Poitiers",
  "Puteaux",
  "Lyon",
  "Marseille",
  "Toulouse",
  "Nice",
  "Nantes",
  "Montpellier",
  "Strasbourg",
  "Bordeaux",
  "Lille",
  "Rennes",
  "Reims",
  "Le Havre",
  "Saint-Etienne",
  "Toulon",
  "Grenoble",
  "Dijon",
  "Angers",
  "Nimes",
  "Clermont-Ferrand",
  "Aix-en-Provence",
  "Brest",
  "Le Mans",
  "Amiens",
  "Tours",
  "Limoges",
  "Annecy",
  "Metz",
  "Besancon",
  "Orleans",
  "Mulhouse",
  "Rouen",
  "Caen",
  "Avignon",
  "Bayonne",
  "La Rochelle",
  "Narbonne",
];

function normalizeHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseDiameterFromArea(value: string | null) {
  if (!value) return 10;
  const parsed = Number.parseInt(value.replace(/[^0-9]/g, ""), 10);
  if (!Number.isFinite(parsed)) return 10;
  if (
    LOCAL_DIAMETER_OPTIONS.includes(
      parsed as (typeof LOCAL_DIAMETER_OPTIONS)[number]
    )
  ) {
    return parsed as (typeof LOCAL_DIAMETER_OPTIONS)[number];
  }
  return 10;
}

export default function SeoLocalSetupPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [city, setCity] = useState("");
  const [diameterKm, setDiameterKm] = useState<
    (typeof LOCAL_DIAMETER_OPTIONS)[number]
  >(10);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [priorityPages, setPriorityPages] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [competitorDraft, setCompetitorDraft] = useState("");
  const [priorityPageDraft, setPriorityPageDraft] = useState("");
  const [cityFocused, setCityFocused] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<string[]>(
    FALLBACK_CITY_OPTIONS.slice(0, 8)
  );
  const [cityLoading, setCityLoading] = useState(false);

  const keywordsList = keywords;
  const competitorsList = competitors;
  const priorityPagesList = priorityPages;
  useEffect(() => {
    if (!cityFocused) return;
    const query = city.trim();

    if (!query) {
      setCitySuggestions(FALLBACK_CITY_OPTIONS.slice(0, 8));
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setCityLoading(true);
        const response = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(
            query
          )}&fields=nom,population&boost=population&limit=30`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error("city-fetch-failed");
        }

        const rows = (await response.json()) as CityApiRow[];
        const filtered = rows
          .filter(
            (row) =>
              typeof row.nom === "string" &&
              typeof row.population === "number" &&
              row.population >= 5000
          )
          .map((row) => row.nom as string);

        const unique = Array.from(new Set(filtered)).slice(0, 12);
        setCitySuggestions(
          unique.length > 0 ? unique : FALLBACK_CITY_OPTIONS.slice(0, 8)
        );
      } catch {
        setCitySuggestions(FALLBACK_CITY_OPTIONS.slice(0, 8));
      } finally {
        setCityLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [city, cityFocused]);

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
    const loadProfile = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from("seo_local_profiles")
        .select("city,area,keywords,competitors,priority_pages,updated_at")
        .eq("user_id", session.user.id)
        .maybeSingle<SeoLocalProfile>();

      if (!data) return;
      setCity(data.city || "");
      setDiameterKm(parseDiameterFromArea(data.area));
      setKeywords(data.keywords || []);
      setCompetitors(data.competitors || []);
      setPriorityPages(data.priority_pages || []);
      setLastSavedAt(data.updated_at || null);
      setFeedback({ type: "info", text: "Configuration chargee." });
    };
    void loadProfile();
  }, [session?.user?.id]);

  const saveProfile = async () => {
    if (!session?.user?.id) return;

    if (!city.trim()) {
      setFeedback({ type: "error", text: "Ajoute une ville avant de sauvegarder." });
      return;
    }
    if (keywordsList.length === 0) {
      setFeedback({
        type: "error",
        text: "Ajoute au moins 1 mot-cle local avant de sauvegarder.",
      });
      return;
    }
    if (priorityPagesList.length === 0) {
      setFeedback({
        type: "error",
        text: "Ajoute au moins 1 page prioritaire avant de sauvegarder.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const payload = {
      user_id: session.user.id,
      city: city.trim() || null,
      area: `${diameterKm}km`,
      keywords,
      competitors,
      priority_pages: priorityPages,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("seo_local_profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      setFeedback({
        type: "error",
        text: "Sauvegarde impossible. Lance d'abord la migration 008 dans Supabase.",
      });
      setSaving(false);
      return;
    }

    setLastSavedAt(payload.updated_at);
    setSaving(false);
    setFeedback({
      type: "success",
      text: "Configuration SEO local enregistree. Tu peux ouvrir le rapport maintenant.",
    });
  };

  const addKeyword = () => {
    const next = keywordDraft.trim();
    if (!next) return;
    if (keywords.includes(next)) return;
    setKeywords((prev) => [...prev, next]);
    setKeywordDraft("");
  };

  const addCompetitor = () => {
    const parsed = normalizeHttpUrl(competitorDraft);
    if (!parsed) {
      setFeedback({
        type: "error",
        text: "URL concurrent invalide. Utilise http(s)://...",
      });
      return;
    }
    if (competitors.includes(parsed)) return;
    setCompetitors((prev) => [...prev, parsed]);
    setCompetitorDraft("");
    setFeedback(null);
  };

  const addPriorityPage = () => {
    const parsed = normalizeHttpUrl(priorityPageDraft);
    if (!parsed) {
      setFeedback({
        type: "error",
        text: "URL prioritaire invalide. Utilise http(s)://...",
      });
      return;
    }
    if (priorityPages.includes(parsed)) return;
    setPriorityPages((prev) => [...prev, parsed]);
    setPriorityPageDraft("");
    setFeedback(null);
  };

  if (loading) {
    return (
      <PublicChrome>
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-24">
          <div className="h-8 w-72 rounded bg-white/10 animate-pulse" />
          <div className="mt-4 h-24 rounded bg-white/10 animate-pulse" />
        </section>
      </PublicChrome>
    );
  }

  if (!session) {
    return (
      <PublicChrome>
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
          <h1 className="text-3xl font-bold">Setup SEO local</h1>
          <p className="mt-4 text-gray-300">
            Connecte-toi pour configurer la ville, les mots-cles et les URLs
            prioritaires.
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
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24">
        <p className="text-sm text-indigo-300 font-medium">SEO local - Setup</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold">
          Configuration fonctionnelle
        </h1>
        <p className="mt-5 text-gray-300 max-w-3xl">
          Definis ton contexte local puis sauvegarde. Le rapport SEO local
          utilisera directement cette configuration.
        </p>

        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
          <p className="font-medium text-indigo-200">Comment ca marche</p>
          <p className="mt-1">1) Remplis la ville + mots-cles + pages prioritaires.</p>
          <p className="mt-1">2) Clique sur sauvegarder la configuration.</p>
          <p className="mt-1">3) Ouvre le rapport SEO local pour voir le recap.</p>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <label className="text-sm text-gray-300 flex flex-col gap-2 relative">
            Ville
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              onFocus={() => setCityFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setCityFocused(false), 120);
              }}
              placeholder="Ex: Lyon"
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
            />
            {cityFocused && citySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border border-white/10 bg-[#0b1025] shadow-lg max-h-52 overflow-y-auto">
                <div className="px-3 py-2 text-[11px] text-gray-400 border-b border-white/10">
                  Villes de France &gt;= 5000 habitants
                  {cityLoading ? " (chargement...)" : ""}
                </div>
                {citySuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setCity(suggestion);
                      setCityFocused(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/10 transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </label>
          <label className="text-sm text-gray-300 flex flex-col gap-2">
            Etendue locale (diametre)
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LOCAL_DIAMETER_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDiameterKm(option)}
                  className={`px-3 py-2 rounded-lg border text-sm transition ${
                    diameterKm === option
                      ? "border-indigo-300/40 bg-indigo-500/15 text-indigo-100"
                      : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {option} km
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              Recherche autour de {city.trim() || "la ville choisie"} sur un
              diametre de {diameterKm} km.
            </span>
          </label>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <label className="text-sm text-gray-300 flex flex-col gap-2">
            Mots-cles locaux
            <div className="flex gap-2">
              <input
                value={keywordDraft}
                onChange={(event) => setKeywordDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="Ex: plombier lyon"
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={addKeyword}
                className="px-3 py-2 rounded-lg border border-indigo-300/30 text-indigo-200 hover:bg-indigo-500/10 transition"
              >
                Ajouter
              </button>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 min-h-[112px] max-h-36 overflow-y-auto">
              {keywords.length === 0 ? (
                <p className="text-xs text-gray-500">Aucun mot-cle ajoute.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full bg-indigo-500/15 border border-indigo-300/20 px-2 py-1 text-xs text-indigo-100"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() =>
                          setKeywords((prev) => prev.filter((value) => value !== item))
                        }
                        className="text-indigo-200 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {keywordsList.length} mot(s)-cle enregistre(s)
            </span>
          </label>
          <label className="text-sm text-gray-300 flex flex-col gap-2">
            Concurrents locaux
            <div className="flex gap-2">
              <input
                value={competitorDraft}
                onChange={(event) => setCompetitorDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCompetitor();
                  }
                }}
                placeholder="https://concurrent-a.fr"
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={addCompetitor}
                className="px-3 py-2 rounded-lg border border-indigo-300/30 text-indigo-200 hover:bg-indigo-500/10 transition"
              >
                Ajouter
              </button>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 min-h-[112px] max-h-36 overflow-y-auto">
              {competitors.length === 0 ? (
                <p className="text-xs text-gray-500">Aucun concurrent ajoute.</p>
              ) : (
                <div className="space-y-1">
                  {competitors.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between gap-2 rounded-md bg-black/20 px-2 py-1 text-xs text-gray-200"
                    >
                      <span className="break-all">{item}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCompetitors((prev) =>
                            prev.filter((value) => value !== item)
                          )
                        }
                        className="text-gray-400 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {competitorsList.length} concurrent(s) enregistre(s)
            </span>
          </label>
          <label className="text-sm text-gray-300 flex flex-col gap-2">
            Pages prioritaires
            <div className="flex gap-2">
              <input
                value={priorityPageDraft}
                onChange={(event) => setPriorityPageDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addPriorityPage();
                  }
                }}
                placeholder="https://monsite.fr/page-locale"
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
              />
              <button
                type="button"
                onClick={addPriorityPage}
                className="px-3 py-2 rounded-lg border border-indigo-300/30 text-indigo-200 hover:bg-indigo-500/10 transition"
              >
                Ajouter
              </button>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2 min-h-[112px] max-h-36 overflow-y-auto">
              {priorityPages.length === 0 ? (
                <p className="text-xs text-gray-500">Aucune page prioritaire ajoutee.</p>
              ) : (
                <div className="space-y-1">
                  {priorityPages.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between gap-2 rounded-md bg-black/20 px-2 py-1 text-xs text-gray-200"
                    >
                      <span className="break-all">{item}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPriorityPages((prev) =>
                            prev.filter((value) => value !== item)
                          )
                        }
                        className="text-gray-400 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {priorityPagesList.length} page(s) prioritaire(s)
            </span>
          </label>
        </div>

        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-xs text-gray-300">
          <p className="text-indigo-200 font-medium">Apercu configuration</p>
          <p className="mt-2">- Ville: {city.trim() || "non renseignee"}</p>
          <p>- Zone: diametre {diameterKm} km</p>
          <p>- Mots-cles: {keywordsList.length}</p>
          <p>- Concurrents: {competitorsList.length}</p>
          <p>- Pages prioritaires: {priorityPagesList.length}</p>
          {lastSavedAt && (
            <p className="mt-2 text-gray-400">
              Derniere sauvegarde: {new Date(lastSavedAt).toLocaleString("fr-FR")}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium disabled:opacity-50"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder la configuration"}
          </button>
          <Link
            href="/seo-local/report"
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition font-medium"
          >
            Ouvrir le rapport SEO local
          </Link>
        </div>

        {feedback && (
          <div
            className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
              feedback.type === "error"
                ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                : feedback.type === "success"
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-indigo-400/30 bg-indigo-500/10 text-indigo-200"
            }`}
          >
            {feedback.text}
          </div>
        )}
      </section>
    </PublicChrome>
  );
}
