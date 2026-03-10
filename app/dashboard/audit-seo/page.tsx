"use client";

import { motion, type Variants } from "framer-motion";
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

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

function statusLabel(status: AuditCheck["status"]) {
  if (status === "pass") return "OK";
  return "À surveiller";
}

function statusBadgeClass(status: AuditCheck["status"]) {
  if (status === "pass") return "bg-emerald-500/15 text-emerald-200";
  return "bg-rose-500/15 text-rose-200";
}

function confidenceLabel(level?: AuditPayload["observationConfidence"]) {
  if (level === "high") return "Élevée";
  if (level === "low") return "Faible";
  return "Moyenne";
}

function confidenceBadgeClass(level?: AuditPayload["observationConfidence"]) {
  if (level === "high") {
    return "border-emerald-300/25 bg-emerald-500/10 text-emerald-200";
  }
  if (level === "low") {
    return "border-rose-300/25 bg-rose-500/10 text-rose-200";
  }
  return "border-amber-300/25 bg-amber-500/10 text-amber-200";
}

function sourceScopeLabel(scope?: string) {
  if (scope === "single_page_html") return "Analyse HTML page unique";
  return "Analyse page unique";
}

function scoreBandClass(score: number) {
  if (score >= 80) return "bg-emerald-500/15 text-emerald-200 border-emerald-300/20";
  if (score >= 60) return "bg-indigo-500/15 text-indigo-100 border-indigo-300/20";
  if (score >= 40) return "bg-amber-500/15 text-amber-200 border-amber-300/20";
  return "bg-rose-500/15 text-rose-200 border-rose-300/20";
}

function auditPostureLabel(score: number) {
  if (score >= 80) return "Page concurrente structurellement propre";
  if (score >= 60) return "Page concurrente exploitable avec quelques angles faibles";
  if (score >= 40) return "Page concurrente inégale, avec plusieurs leviers visibles";
  return "Page concurrente fragile sur les signaux observés";
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
      setErrorMessage(error instanceof Error ? error.message : "Erreur pendant l'audit SEO.");
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

  const strengthChecks = useMemo(() => {
    if (!result) return [];
    return result.checks.filter((item) => item.status === "pass").slice(0, 4);
  }, [result]);

  const decisionSummary = useMemo(() => {
    if (!result || !stats) return null;

    const weakAreas: string[] = [];
    if (!result.title) weakAreas.push("title");
    if (!result.metaDescription) weakAreas.push("meta description");
    if (!result.h1) weakAreas.push("H1");
    if (!result.canonicalUrl) weakAreas.push("canonical");
    if (result.pricingSignals === 0) weakAreas.push("pricing peu visible");
    if (result.ctaSignals <= 2) weakAreas.push("CTA peu exposés");

    const strengths: string[] = [];
    if (result.title) strengths.push("title détecté");
    if (result.metaDescription) strengths.push("meta description détectée");
    if (result.h1) strengths.push("H1 détecté");
    if (result.canonicalUrl) strengths.push("canonical détectée");
    if (result.ctaSignals > 2) strengths.push(`${result.ctaSignals} CTA détectés`);
    if (result.pricingSignals > 0) strengths.push(`${result.pricingSignals} signal pricing`);

    return {
      lead:
        stats.fail === 0
          ? "La page concurrente presente une base SEO propre sur les signaux observés."
          : stats.fail <= 3
            ? "La page concurrente est exploitable, avec quelques points de vigilance clairement identifies."
            : "La page concurrente montre plusieurs faiblesses structurelles exploitables.",
      weaknesses:
        weakAreas.length > 0
          ? weakAreas.slice(0, 3).join(", ")
          : "aucune faiblesse majeure sur les signaux observés",
      strengths:
        strengths.length > 0
          ? strengths.slice(0, 3).join(", ")
          : "peu de signaux visibles sur cette page",
    };
  }, [result, stats]);

  const executiveCards = useMemo(() => {
    if (!result || !stats) return [];

    return [
      {
        label: "Angle SEO visible",
        value: result.title ? "Present" : "Peu structure",
        detail: result.title
          ? "Le title est détecté et donne un axe editorial clair."
          : "Le title n'apparait pas dans les signaux publics observés.",
      },
      {
        label: "Pression conversion",
        value:
          result.ctaSignals > 4
            ? "Active"
            : result.ctaSignals > 0
              ? "Moderee"
              : "Faible",
        detail:
          result.ctaSignals > 0
            ? `${result.ctaSignals} CTA détectés sur la page observee.`
            : "Aucun signal CTA vraiment visible dans le HTML observe.",
      },
      {
        label: "Lecture offre / pricing",
        value: result.pricingSignals > 0 ? "Visible" : "Discret",
        detail:
          result.pricingSignals > 0
            ? `${result.pricingSignals} signal pricing détecté sur la page.`
            : "Aucun bloc pricing clair n'est ressorti sur cette page.",
      },
      {
        label: "Stabilite structurelle",
        value: `${stats.pass}/${result.checks.length} checks OK`,
        detail:
          stats.fail === 0
            ? "La structure observee ressort propre sur les vérifications disponibles."
            : `${stats.fail} point(s) a surveiller sur les vérifications observees.`,
      },
    ];
  }, [result, stats]);

  const premiumSignalSummary = useMemo(() => {
    if (!result) return [];
    return [
      {
        label: "Title",
        value: result.title ? "Détecté" : "Absent",
      },
      {
        label: "Meta",
        value: result.metaDescription ? "Détectée" : "Absente",
      },
      {
        label: "H1",
        value: result.h1 ? "Détecté" : "Absent",
      },
      {
        label: "Canonical",
        value: result.canonicalUrl ? "Détectée" : "Absente",
      },
      {
        label: "CTA",
        value: `${result.ctaSignals}`,
      },
      {
        label: "Pricing",
        value: `${result.pricingSignals}`,
      },
    ];
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
        : ["- Aucun point critique détecté"]),
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
      <main className="min-h-scréen bg-[radial-gradient(circle_at_top,_#141414_0%,_#050505_38%,_#000000_100%)] text-white">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-10">
          <div className="h-6 w-32 rounded bg-white/10 animate-pulse" />
          <div className="mt-3 h-10 w-80 rounded bg-white/10 animate-pulse" />
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-scréen bg-[radial-gradient(circle_at_top,_#141414_0%,_#050505_38%,_#000000_100%)] text-white">
        <section className="max-w-3xl mx-auto px-6 pt-28 pb-24 text-center">
          <h1 className="text-3xl font-bold">Audit SEO</h1>
          <p className="mt-4 text-gray-300">
            Connecte-toi pour lancer un audit sur une URL concurrente.
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
        <div className="relative">
        <p className="text-white/60 text-xs font-medium uppercase tracking-[0.18em]">Dashboard</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold leading-[0.96]">Audit SEO
          <br />
          concurrent</h1>
        <p className="mt-3 max-w-2xl text-gray-300">
          Observation SEO structuree d&apos;une page concurrente, avec niveau de fiabilite.
        </p>
        </div>
        </div>
        <DashboardSuiteMenu />
      </motion.section>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.06 }}
        className="mx-auto max-w-[1320px] px-4 pb-24 sm:px-6"
      >
        <div className="mb-6 rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold">Historique des URLs enregistrees</h2>
          <p className="mt-2 text-sm text-gray-300">
            Sélectionne une URL deja surveillée pour lancer un audit en un clic.
          </p>
          <div className="mt-4">
            <select
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="cc-panel w-full rounded-[18px] px-4 py-3 text-sm text-gray-100 focus:outline-none"
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

        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://site-concurrent.com/page"
              className="cc-panel flex-1 rounded-[18px] px-4 py-3 focus:outline-none"
            />
            <button
              onClick={runAudit}
              disabled={running}
              className="px-6 py-3 rounded-lg border border-white bg-white text-black hover:bg-white/85 transition font-medium disabled:opacity-50"
            >
              {running ? "Audit en cours..." : "Lancer l'audit"}
            </button>
          </div>
          {errorMessage && <p className="mt-3 text-sm text-amber-200">{errorMessage}</p>}
        </div>

        {result && (
          <div className="mt-6 grid gap-6">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_#1a1a1a_0%,_#0a0a0a_42%,_#030303_100%)]">
              <div className="border-b border-white/10 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/68">
                      Fiche concurrente
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      Restitution premium de la page observee
                    </h2>
                    <p className="mt-2 break-all text-sm text-gray-300">
                      {result.url}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-sm ${scoreBandClass(result.score)}`}
                    >
                      Indice SEO observe: {result.score}/100
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${confidenceBadgeClass(
                        result.observationConfidence
                      )}`}
                    >
                      Fiabilité {confidenceLabel(result.observationConfidence)}
                    </span>
                    <button
                      onClick={() => void copySummary()}
                      className="cc-button-secondary rounded-full px-3 py-1 text-xs"
                    >
                      {copied ? "Copie" : "Copier rapport"}
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="cc-panel rounded-[20px] p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Lecture executive
                    </p>
                    <p className="mt-2 text-base font-medium text-white">
                      {auditPostureLabel(result.score)}
                    </p>
                    <p className="mt-2 text-sm text-gray-300">
                      {decisionSummary?.lead}
                    </p>
                    {decisionSummary && (
                      <div className="mt-3 grid gap-2 text-sm">
                        <p className="text-gray-300">
                          <span className="text-gray-400">Faiblesses visibles:</span>{" "}
                          {decisionSummary.weaknesses}
                        </p>
                        <p className="text-gray-300">
                          <span className="text-gray-400">Points solides:</span>{" "}
                          {decisionSummary.strengths}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Cadre de confiance
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] text-gray-400">Source analysee</p>
                        <p className="mt-1 text-sm text-gray-100">
                          {sourceScopeLabel(result.sourceScope)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">Base de lecture</p>
                        <p className="mt-1 text-sm text-gray-100">
                          HTML public capture au moment de l&apos;audit
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {premiumSignalSummary.map((item) => (
                        <div
                          key={item.label}
                          className="cc-panel rounded-[16px] px-3 py-2"
                        >
                          <p className="text-[11px] text-gray-400">{item.label}</p>
                          <p className="mt-1 text-sm font-medium text-gray-100">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {stats && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-4 text-sm">
                    <div className="rounded-lg border border-emerald-300/20 bg-emerald-500/5 p-3">
                      <p className="text-gray-400 text-xs">Checks OK</p>
                      <p className="text-xl font-semibold text-emerald-200">{stats.pass}</p>
                    </div>
                    <div className="rounded-lg border border-rose-300/20 bg-rose-500/5 p-3">
                      <p className="text-gray-400 text-xs">Points a surveiller</p>
                      <p className="text-xl font-semibold text-rose-200">{stats.fail}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-gray-400 text-xs">Signaux CTA</p>
                      <p className="text-xl font-semibold text-gray-100">{result.ctaSignals}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-gray-400 text-xs">Signaux pricing</p>
                      <p className="text-xl font-semibold text-gray-100">{result.pricingSignals}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {executiveCards.map((card) => (
                <div
                  key={card.label}
                  className="cc-panel-strong rounded-[24px] p-5"
                >
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    {card.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{card.value}</p>
                  <p className="mt-2 text-sm text-gray-300">{card.detail}</p>
                </div>
              ))}
            </div>

            <div className="cc-panel-strong rounded-[28px] p-6">
              <h2 className="text-xl font-semibold">Priorités observees</h2>
              {priorityChecks.length === 0 ? (
                <p className="mt-3 text-sm text-emerald-200">
                  Aucun signal bloquant observe sur cette page concurrente.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {priorityChecks.slice(0, 3).map((check, index) => (
                    <div key={check.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
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

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="cc-panel-strong rounded-[28px] p-6">
                <h2 className="text-xl font-semibold">Lecture structurelle de la page</h2>
                <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-gray-400 text-xs">Title</p>
                    <p className="mt-1 text-gray-200">{result.title || "non détecté"}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-gray-400 text-xs">H1</p>
                    <p className="mt-1 text-gray-200">{result.h1 || "non détecté"}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-gray-400 text-xs">Meta description</p>
                    <p className="mt-1 text-gray-200">
                      {result.metaDescription || "non détectée"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-gray-400 text-xs">Canonical</p>
                    <p className="mt-1 text-gray-200">{result.canonicalUrl || "non détecté"}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/20 p-3 md:col-span-2">
                    <p className="text-gray-400 text-xs">Robots</p>
                    <p className="mt-1 text-gray-200">
                      {result.robotsDirective || "non specifie"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="cc-panel-strong rounded-[28px] p-6">
                <h2 className="text-xl font-semibold">Cadre d&apos;analyse</h2>
                <div className="mt-4 space-y-3 text-sm text-gray-300">
                  <p>
                    Cet audit lit le HTML public de la page concurrente au moment de la requete.
                  </p>
                  <p>
                    Il mesure les signaux SEO visibles, la presence de CTA detectables et les indices pricing exposes.
                  </p>
                  <p>
                    Il ne remplace pas un crawl complet du site, ni une analyse trafic, ni un rendu JavaScript avance.
                  </p>
                </div>
                {strengthChecks.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {strengthChecks.map((check) => (
                      <span
                        key={check.id}
                        className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200"
                      >
                        {check.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="cc-panel-strong rounded-[28px] p-6">
              <h2 className="text-xl font-semibold">Vérifications structurees</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
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

            <div className="cc-panel-strong rounded-[28px] p-6">
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
      </motion.section>
    </main>
  );
}
