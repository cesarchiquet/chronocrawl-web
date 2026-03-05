"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import DashboardSuiteMenu from "@/components/DashboardSuiteMenu";
import { supabase } from "@/lib/supabaseClient";

type AuditCheck = {
  id: string;
  label: string;
  status: "pass" | "fail";
  details: string;
};

type AuditPayload = {
  url: string;
  score: number;
  observationConfidence?: "low" | "medium" | "high";
  sourceScope?: "single_page_html" | string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  canonicalUrl: string | null;
  robotsDirective: string | null;
  pricingSignals: number;
  ctaSignals: number;
  checks: AuditCheck[];
  recommendations: string[];
  metrics?: {
    wordCount: number;
    h1Count: number;
    h2Count: number;
    imgCount: number;
    imgWithoutAltCount: number;
    internalLinkCount: number;
    externalLinkCount: number;
    hasViewport: boolean;
    hasJsonLd: boolean;
  };
};

type SavedMonitoredUrl = {
  id: string;
  url: string;
  created_at: string;
};

function statusLabel(status: AuditCheck["status"]) {
  if (status === "pass") return "OK";
  return "A surveiller";
}

function statusBadgeClass(status: AuditCheck["status"]) {
  if (status === "pass") return "bg-emerald-500/15 text-emerald-200";
  return "bg-rose-500/15 text-rose-200";
}

function confidenceLabel(level?: AuditPayload["observationConfidence"]) {
  if (level === "high") return "Elevee";
  if (level === "low") return "Faible";
  return "Moyenne";
}

function sourceScopeLabel(scope?: string) {
  if (scope === "single_page_html") return "Analyse HTML page unique";
  return "Analyse page unique";
}

export default function DashboardAuditSeoPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [url, setUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<AuditPayload | null>(null);
  const [savedUrls, setSavedUrls] = useState<SavedMonitoredUrl[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const hydrateSession = async () => {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        setSession(refreshed.session);
        setLoadingSession(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoadingSession(false);
    };

    void hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    const loadSavedUrls = async () => {
      const { data } = await supabase
        .from("monitored_urls")
        .select("id,url,created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setSavedUrls((data || []) as SavedMonitoredUrl[]);
    };

    void loadSavedUrls();
  }, [session?.user?.id]);

  const runAudit = async () => {
    if (!session?.access_token) {
      setErrorMessage("Session invalide. Reconnecte-toi.");
      return;
    }
    setErrorMessage("");
    setResult(null);
    setRunning(true);

    try {
      const response = await fetch("/api/tools/audit-seo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        audit?: AuditPayload;
      };
      if (!response.ok || !data.audit) {
        throw new Error(data.error || "Audit impossible.");
      }
      setResult(data.audit);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Erreur audit SEO.");
    } finally {
      setRunning(false);
    }
  };

  const stats = useMemo(() => {
    if (!result) return null;
    const pass = result.checks.filter((item) => item.status === "pass").length;
    const fail = result.checks.filter((item) => item.status === "fail").length;
    return { pass, fail };
  }, [result]);

  const priorityChecks = useMemo(() => {
    if (!result) return [];
    return result.checks
      .filter((item) => item.status !== "pass")
      .sort((a, b) => (a.status === "fail" && b.status !== "fail" ? -1 : 1));
  }, [result]);

  const summaryText = useMemo(() => {
    if (!result || !stats) return "";
    return [
      `URL: ${result.url}`,
      `Indice SEO observe: ${result.score}/100`,
      `Checks OK: ${stats.pass}`,
      `Points a surveiller: ${stats.fail}`,
      "",
      "Observations concurrentes:",
      ...(result.recommendations.length > 0
        ? result.recommendations.map((item) => `- ${item}`)
        : ["- Aucun point critique detecte"]),
    ].join("\n");
  }, [result, stats]);

  const copySummary = async () => {
    if (!summaryText) return;
    await navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loadingSession) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-10">
          <div className="h-6 w-32 rounded bg-white/10 animate-pulse" />
          <div className="mt-3 h-10 w-80 rounded bg-white/10 animate-pulse" />
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
        <section className="max-w-3xl mx-auto px-6 pt-28 pb-24 text-center">
          <h1 className="text-3xl font-bold">Audit SEO</h1>
          <p className="mt-4 text-gray-300">
            Connecte-toi pour analyser une URL concurrente.
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
        <p className="text-indigo-300 text-sm font-medium">Dashboard</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold">Audit SEO</h1>
        <p className="mt-3 text-gray-300">
          Observation SEO structuree d&apos;une page concurrente, avec niveau de fiabilite.
        </p>
        <DashboardSuiteMenu />
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Historique des URLs enregistrees</h2>
          <p className="mt-2 text-sm text-gray-300">
            Selectionne une URL deja surveillee pour lancer un audit en un clic.
          </p>
          <div className="mt-4">
            <select
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-indigo-400"
            >
              <option value="">
                {savedUrls.length === 0
                  ? "Aucune URL enregistree"
                  : "Choisir une URL de l'historique"}
              </option>
              {savedUrls.map((item) => (
                <option key={item.id} value={item.url}>
                  {item.url}
                </option>
              ))}
            </select>
            {savedUrls.length === 0 && (
              <p className="mt-2 text-xs text-gray-400">
                Ajoute une URL concurrente dans Surveillance puis reviens ici.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://site-concurrent.com/page"
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
            />
            <button
              onClick={runAudit}
              disabled={running}
              className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium disabled:opacity-50"
            >
              {running ? "Analyse en cours..." : "Analyser l'URL"}
            </button>
          </div>
          {errorMessage && <p className="mt-3 text-sm text-amber-200">{errorMessage}</p>}
        </div>

        {result && (
          <div className="mt-6 grid gap-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-300 break-all">{result.url}</p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-500/15 border border-indigo-300/30 px-3 py-1 text-sm text-indigo-100">
                    Indice SEO observe: {result.score}/100
                  </span>
                  <button
                    onClick={() => void copySummary()}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs text-gray-200 hover:bg-white/5"
                  >
                    {copied ? "Copie" : "Copier rapport"}
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Niveau de fiabilite:{" "}
                <span className="text-gray-200 uppercase">
                  {confidenceLabel(result.observationConfidence)}
                </span>
                {" | "}
                Source: {sourceScopeLabel(result.sourceScope)}
              </p>
              {stats && (
                <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-emerald-300/20 bg-emerald-500/5 p-3">
                    <p className="text-gray-400 text-xs">Checks OK</p>
                    <p className="text-xl font-semibold text-emerald-200">{stats.pass}</p>
                  </div>
                  <div className="rounded-lg border border-rose-300/20 bg-rose-500/5 p-3">
                    <p className="text-gray-400 text-xs">Points a surveiller</p>
                    <p className="text-xl font-semibold text-rose-200">{stats.fail}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">Priorites observees</h2>
              {priorityChecks.length === 0 ? (
                <p className="mt-3 text-sm text-emerald-200">
                  Aucun signal bloquant observe sur cette page concurrente.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {priorityChecks.slice(0, 3).map((check, index) => (
                    <div key={check.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-gray-100">
                          {index + 1}. {check.label}
                        </p>
                        <span className={`rounded-full px-2 py-1 text-[11px] ${statusBadgeClass(check.status)}`}>
                          {statusLabel(check.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-300">{check.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">Apercu SEO de la page</h2>
              <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
                <p className="text-gray-300">
                  <span className="text-gray-400">Title:</span> {result.title || "non detecte"}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">H1:</span> {result.h1 || "non detecte"}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">Meta:</span>{" "}
                  {result.metaDescription || "non detectee"}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">Canonical:</span>{" "}
                  {result.canonicalUrl || "non detecte"}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">Robots:</span>{" "}
                  {result.robotsDirective || "non specifie"}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-400">Signaux pricing/CTA:</span>{" "}
                  {result.pricingSignals} prix, {result.ctaSignals} CTA
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">Verifications structurees</h2>
              <div className="mt-4 space-y-3">
                {result.checks.map((check) => (
                  <div key={check.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-100">{check.label}</p>
                      <span className={`text-[11px] uppercase rounded-full px-2 py-1 ${statusBadgeClass(check.status)}`}>
                        {statusLabel(check.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-300">{check.details}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">Synthese actionnable</h2>
              {result.recommendations.length === 0 ? (
                <p className="mt-3 text-sm text-emerald-200">
                  Aucun point critique observe sur cette page concurrente.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {result.recommendations.map((item) => (
                    <li key={item} className="text-sm text-gray-200">
                      - {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        )}
      </section>
    </main>
  );
}
