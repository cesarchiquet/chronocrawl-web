"use client";

import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import PublicNavigation from "@/components/PublicNavigation";
import PublicFooter from "@/components/PublicFooter";
import DemoVideoModal from "@/features/landing/components/DemoVideoModal";
import {
  impactMetrics,
} from "@/features/landing/content";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [checkoutError, setCheckoutError] = useState("");
  const [billingError, setBillingError] = useState("");
  const [demoOpen, setDemoOpen] = useState(false);
  const [subscriptionState, setSubscriptionState] = useState<{
    plan: "starter" | "pro" | "agency";
    status: string;
  } | null>(null);

  useEffect(() => {
    const hydrateSession = async () => {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        setSession(refreshed.session);
        setAuthLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setAuthLoading(false);
    };
    hydrateSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setAuthLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadSubscriptionState = async () => {
      if (!session?.user?.id) {
        setSubscriptionState(null);
        return;
      }
      const { data } = await supabase
        .from("user_subscriptions")
        .select("plan,status")
        .eq("user_id", session.user.id)
        .maybeSingle<{ plan: "starter" | "pro" | "agency"; status: string }>();
      setSubscriptionState(data || null);
    };
    loadSubscriptionState();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user) return;

    const currentStatus =
      (session.user.user_metadata?.subscription_status as string | undefined) ||
      "inactive";
    const isActive =
      currentStatus === "active" || currentStatus === "trialing";
    if (isActive) return;

    const interval = setInterval(async () => {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        setSession(refreshed.session);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [session?.user, session?.user?.id, session?.user?.user_metadata?.subscription_status]);

  const startCheckout = async (plan: "starter" | "pro" | "agency") => {
    if (!session?.user?.id || !session?.access_token) {
      setCheckoutError("Connecte-toi pour continuer.");
      return;
    }

    setCheckoutError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Impossible de démarrer le paiement.");
      }
      window.location.href = data.url;
    } catch (error: unknown) {
      const details =
        error instanceof Error ? error.message : "Erreur de paiement.";
      setCheckoutError(details);
    }
  };

  const openBillingPortal = async () => {
    if (!session?.user?.id || !session?.access_token) {
      setBillingError("Connecte-toi pour gérer ton abonnement.");
      return;
    }

    setBillingError("");
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (!response.ok || !data?.url) {
        throw new Error(
          data?.error || "Impossible d'ouvrir la gestion d'abonnement."
        );
      }

      window.location.href = data.url;
    } catch (error: unknown) {
      const details =
        error instanceof Error ? error.message : "Erreur portail abonnement.";
      setBillingError(details);
    }
  };

  const plan =
    subscriptionState?.plan || session?.user?.user_metadata?.plan || "starter";
  const subscriptionStatus =
    subscriptionState?.status ||
    session?.user?.user_metadata?.subscription_status ||
    "inactive";
  const effectiveSubscriptionStatus =
    subscriptionStatus === "pending_checkout"
      ? session?.user?.user_metadata?.subscription_status || "inactive"
      : subscriptionStatus;
  const tourHref = session?.user ? "/dashboard" : "/signup";

  useEffect(() => {
    if (!demoOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDemoOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [demoOpen]);

  if (authLoading) {
    return (
      <main className="min-h-scréen bg-[radial-gradient(circle_at_top,_#141414_0%,_#050505_38%,_#000000_100%)] text-white">
        <PublicNavigation />
        <section className="max-w-5xl mx-auto px-6 pt-28 pb-24">
          <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
          <div className="mt-5 h-12 w-full rounded bg-white/10 animate-pulse" />
          <div className="mt-3 h-12 w-4/5 rounded bg-white/10 animate-pulse" />
          <div className="mt-8 h-10 w-64 rounded bg-white/10 animate-pulse" />
          <div className="mt-10 flex flex-wrap gap-3">
            <div className="h-11 w-40 rounded bg-white/10 animate-pulse" />
            <div className="h-11 w-40 rounded bg-white/10 animate-pulse" />
            <div className="h-11 w-40 rounded bg-white/10 animate-pulse" />
          </div>
        </section>
        <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="cc-panel-strong cc-hover-lift rounded-[28px] p-6"
            >
              <div className="h-5 w-36 rounded bg-white/10 animate-pulse" />
              <div className="mt-3 h-3 w-full rounded bg-white/10 animate-pulse" />
              <div className="mt-2 h-3 w-5/6 rounded bg-white/10 animate-pulse" />
            </div>
          ))}
        </section>
        <PublicFooter />
      </main>
    );
  }

  return (
    <main className="min-h-scréen bg-[radial-gradient(circle_at_top,_#141414_0%,_#050505_38%,_#000000_100%)] text-white">
      <PublicNavigation
        session={session}
        onOpenBillingPortal={openBillingPortal}
        onSignOut={() => {
          void supabase.auth.signOut();
        }}
      />

      {/* HERO */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-[1320px] px-4 pt-20 pb-24 sm:px-6"
      >
        <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06)_0%,_rgba(14,14,14,0.96)_18%,_rgba(0,0,0,1)_70%)] px-6 py-14 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:px-10 lg:px-14 lg:py-18">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[-38%] h-[1100px] w-[1100px] -translate-x-1/2 rounded-full border border-white/6" />
            <div className="absolute left-1/2 top-[-22%] h-[920px] w-[920px] -translate-x-1/2 rounded-full border border-white/5" />
            <div className="absolute left-1/2 top-[14%] h-[780px] w-[780px] -translate-x-1/2 rounded-full border border-white/[0.04]" />
          </div>
          <div className="relative">
          <div className="mx-auto max-w-4xl text-center">
            {session?.user && (
              <div className="mb-8 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
                Connecté : {session.user.email}
              </div>
            )}
            <h1 className="text-5xl font-bold leading-[0.95] sm:text-6xl md:text-7xl lg:text-[5.6rem]">
              Veille concurrentielle
              <br />
              qui remonte les vrais changements
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-gray-300 sm:text-xl">
              ChronoCrawl te donne une surveillance d&apos;URLs concurrentes et un
              audit SEO concurrent dans une interface dense, lisible et sans
              bruit. Tu vois vite ce qui bouge, pourquoi c&apos;est utile et où
              agir.
            </p>
            <div className="mx-auto mt-5 inline-flex max-w-3xl flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
              <span>Surveillance</span>
              <span className="text-white/25">|</span>
              <span>Audit SEO concurrent</span>
              <span className="text-white/25">|</span>
              <span>Essai 7 jours</span>
            </div>

            {checkoutError && (
              <p className="mt-3 text-xs text-red-300">{checkoutError}</p>
            )}
            {billingError && (
              <p className="mt-2 text-xs text-red-300">{billingError}</p>
            )}
            {session?.user && (
              <p className="mt-3 text-xs text-white/60">
                Plan actif: {String(plan).toUpperCase()} | Statut:{" "}
                {String(effectiveSubscriptionStatus).toUpperCase()}
              </p>
            )}

            <div className="mt-10 flex flex-wrap justify-center items-start gap-3">
              {session?.user ? (
                <button
                  onClick={() => startCheckout("starter")}
                  className="rounded-full border border-white bg-white px-7 py-3.5 text-base font-medium text-black transition hover:bg-white/85"
                >
                  Commencer l&apos;essai 7 jours
                </button>
              ) : (
                <a
                  href="#tarifs"
                  className="rounded-full border border-white bg-white px-7 py-3.5 text-base font-medium text-black transition hover:bg-white/85"
                >
                  Commencer l&apos;essai 7 jours
                </a>
              )}
              <button
                onClick={() => {
                  setDemoOpen(true);
                }}
                className="cc-button-secondary rounded-full px-7 py-3.5 text-base font-medium"
              >
                Voir la demo
              </button>
            </div>
          </div>
          </div>
        </div>
      </motion.section>

      <section className="mx-auto max-w-[1320px] px-4 pb-10 sm:px-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="cc-hover-lift rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-4">
            <p className="text-xs text-gray-400">Temps de mise en route</p>
            <p className="mt-2 text-xl font-semibold text-white">~2 minutes</p>
          </div>
          <div className="cc-hover-lift rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-4">
            <p className="text-xs text-gray-400">Signaux suivis</p>
            <p className="mt-2 text-xl font-semibold text-white">SEO / CTA / Pricing</p>
          </div>
          <div className="cc-hover-lift rounded-[28px] border border-white/10 bg-white/[0.03] px-5 py-4">
            <p className="text-xs text-gray-400">Module complementaire</p>
            <p className="mt-2 text-xl font-semibold text-white">Audit SEO concurrent</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-4 pb-20 sm:px-6">
        <div className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05)_0%,_rgba(10,10,10,0.98)_24%,_rgba(0,0,0,1)_88%)] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">
                Parcours produit
              </p>
              <h2 className="mt-2 text-3xl font-semibold">
                Ce que tu fais vraiment dans ChronoCrawl
              </h2>
            </div>
            <a
              href={tourHref}
              className="rounded-full border border-white bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/85"
            >
              Commencer
            </a>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <a
              href={tourHref}
              className="cc-hover-lift rounded-[28px] border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Alertes</p>
              <p className="mt-3 text-lg font-medium">Voir les alertes utiles</p>
              <p className="mt-2 text-sm text-gray-300">SEO, CTA, pricing et titres visibles dans un centre d&apos;alertes lisible.</p>
            </a>
            <a
              href="/dashboard/audit-seo"
              className="cc-hover-lift rounded-[28px] border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Audit</p>
              <p className="mt-3 text-lg font-medium">Lire un audit SEO concurrent</p>
              <p className="mt-2 text-sm text-gray-300">Observation structurelle d&apos;une page concurrente, sans jargon inutile.</p>
            </a>
            <a
              href={tourHref}
              className="cc-hover-lift rounded-[28px] border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Action</p>
              <p className="mt-3 text-lg font-medium">Passer a l&apos;action</p>
              <p className="mt-2 text-sm text-gray-300">Ajouter des URLs, lancer un scan et ouvrir l&apos;historique des alertes.</p>
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Moins de bruit, plus de lecture utile",
            text: "Le produit se concentre sur les signaux SEO, CTA, pricing et titres visibles pour eviter les alertes inutiles.",
          },
          {
            title: "Alertes avec contexte",
            text: "Chaque alerte s'ouvre avec un avant / après, une interprêtation courte et une vérification utile.",
          },
          {
            title: "Audit SEO concurrent inclus",
            text: "Tu peux lire la structure SEO d'une page concurrente dans un module separe, sans changer d'outil.",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className="cc-hover-lift cc-panel-strong rounded-[28px] p-6"
          >
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-300 text-sm">{item.text}</p>
          </motion.div>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="cc-hover-lift flex h-full min-w-0 flex-col rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05)_0%,_rgba(10,10,10,0.98)_24%,_rgba(0,0,0,1)_88%)] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">
              Audit SEO concurrent
            </p>
            <h2 className="mt-2 max-w-xl text-3xl font-bold leading-[1.02]">
              Une restitution qui ressemble a un rapport, pas a un simple score
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-gray-300">
              L&apos;audit SEO concurrent est pense comme une lecture structuree de la
              page observee: fiche concurrente, cadre de confiance, signaux visibles
              et lecture executive. Tu comprends vite ce que la page montre
              publiquement, sans confusion avec un audit de ton propre site.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                {
                  title: "Fiche concurrente",
                  text: "L'URL observee, l'indice SEO et le niveau de fiabilite sont poses en tete de rapport.",
                },
                {
                  title: "Cadre de confiance",
                  text: "Le perimetre réel de lecture est explicite: HTML public, page unique, signaux disponibles.",
                },
                {
                  title: "Lecture executive",
                  text: "Les points visibles, les angles faibles et les signaux conversion ressortent sans jargon inutile.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="cc-hover-lift min-w-0 rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="break-words text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 break-words text-sm text-gray-300">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 mt-auto">
              <a
                href={session?.user ? "/dashboard/audit-seo" : "/signup"}
                className="inline-flex rounded-lg border border-white bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/85"
              >
                Voir l&apos;audit SEO concurrent
              </a>
            </div>
          </div>

          <div className="cc-hover-lift flex h-full min-w-0 flex-col overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05)_0%,_rgba(10,10,10,0.98)_24%,_rgba(0,0,0,1)_88%)]">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">
                    Fiche concurrente
                  </p>
                  <h3 className="mt-2 max-w-lg text-2xl font-semibold leading-tight text-white">
                    Restitution premium de la page observee
                  </h3>
                  <p className="mt-2 break-all text-sm text-gray-300">
                    https://www.concurrent-exemple.com/pricing
                  </p>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-white">
                    Indice SEO observe: 76/100
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
                    Fiabilité élevée
                  </span>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[1.05fr_0.95fr]">
                <div className="cc-hover-lift min-w-0 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Lecture executive
                  </p>
                  <p className="mt-2 break-words text-base font-medium text-white">
                    Page concurrente exploitable, avec une offre visible et des
                    leviers SEO clairement lisibles.
                  </p>
                  <p className="mt-2 break-words text-sm text-gray-300">
                    Faiblesses visibles: meta description courte, pression CTA moderee.
                  </p>
                  <p className="mt-1 break-words text-sm text-gray-300">
                    Points solides: title détecté, canonical present, pricing lisible.
                  </p>
                </div>
                <div className="cc-hover-lift min-w-0 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    Cadre de confiance
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400">Source analysee</p>
                      <p className="mt-1 break-words text-sm text-gray-100">Analyse HTML page unique</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400">Base de lecture</p>
                      <p className="mt-1 break-words text-sm text-gray-100">HTML public capture au moment du scan</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      ["Title", "Détecté"],
                      ["Meta", "Détectée"],
                      ["H1", "Détecté"],
                      ["Canonical", "Détectée"],
                      ["CTA", "6"],
                      ["Pricing", "1"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="min-w-0 rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-2"
                      >
                        <p className="text-[11px] text-gray-400">{label}</p>
                        <p className="mt-1 break-words text-sm font-medium text-gray-100">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid flex-1 content-start gap-3 px-6 py-5 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Checks OK", "8"],
                ["Points a surveiller", "2"],
                ["Signaux CTA", "6"],
                ["Signaux pricing", "1"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="cc-hover-lift min-w-0 rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="mt-1 break-words text-lg font-semibold text-gray-100">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="cc-hover-lift rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05)_0%,_rgba(10,10,10,0.98)_24%,_rgba(0,0,0,1)_88%)] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-white/60">
            Impact business
          </p>
          <h2 className="mt-2 text-3xl font-semibold">
            Ce que l&apos;équipe gagne concrètement
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {impactMetrics.map((item) => (
              <div
                key={item.label}
                className="cc-hover-lift rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
              >
                <p className="text-3xl font-semibold text-white">{item.value}</p>
                <p className="mt-2 text-sm text-gray-300">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <a
              href={session?.user ? "/dashboard" : "/signup"}
              className="inline-flex rounded-full border border-white bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/85"
            >
              Tester sur 1 URL en 60s
            </a>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="fonctionnement"
        className="max-w-6xl mx-auto px-6 pb-24"
      >
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          Comment fonctionne ChronoCrawl
        </motion.h2>

        <p className="text-gray-300 text-center max-w-2xl mx-auto mb-10">
          En trois étapes simples, tu mets en place une veille concurrentielle
          efficace : ajoute tes URLs, laisse ChronoCrawl surveiller, puis lis
          les changements utiles et l&apos;audit SEO concurrent dans le dashboard.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Ajoute les URLs",
              text: "Indique les pages concurrentes que tu veux suivre dans le module Surveillance.",
            },
            {
              step: "02",
              title: "ChronoCrawl surveille",
              text: "Le moteur releve les signaux SEO, CTA, pricing et titres visibles.",
            },
            {
              step: "03",
              title: "Lis et compare",
              text: "Tu ouvres l'alerte, compares l'avant / après et completes si besoin avec l'Audit SEO.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="cc-hover-lift cc-panel-strong rounded-[28px] p-6"
            >
              <span className="text-sm font-medium text-white/65">
                {item.step}
              </span>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-gray-300 text-sm">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="tarifs" className="max-w-6xl mx-auto px-6 pb-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-4"
        >
          Tarifs
        </motion.h2>
        <p className="text-gray-300 text-center max-w-2xl mx-auto mb-10">
          Choisis le plan qui correspond à ta veille concurrentielle. Tu peux
          changer ou arrêter à tout moment.
        </p>
        <p className="text-center text-xs text-gray-400 mb-8">
          Résumé des offres sur cette page.{" "}
          <a href="/tarifs" className="text-white/72 underline underline-offset-4 transition hover:text-white">
            En savoir plus sur les tarifs
          </a>
          .
        </p>
        <div className="mb-8 grid gap-3 md:grid-cols-3">
          {[
            "Essai 7 jours pour valider le produit avant de t'engager.",
            "Paiement sécurisé via Stripe, annulation possible depuis le dashboard.",
            "Après souscription, retour direct dans le dashboard pour ajouter la première URL.",
          ].map((item) => (
            <div
              key={item}
              className="cc-hover-lift cc-panel rounded-[22px] px-4 py-3 text-sm text-gray-300"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Starter",
              price: "12 €/mois",
              desc: "7 jours d’essai gratuit pour valider le produit.",
              fit: "Pour fréelance ou petite équipe",
              features: [
                "10 URLs surveillées",
                "Fréquence toutes les 6h",
                "Alertes email",
                "Historique 7 jours",
              ],
            },
            {
              name: "Pro",
              price: "29 €/mois",
              desc: "Le niveau recommande pour une veille suivie.",
              fit: "Pour SaaS et e-commerce en croissance",
              features: [
                "50 URLs surveillées",
                "Fréquence toutes les 60 min",
                "Alertes email + Slack",
                "Historique 30 jours",
              ],
              highlight: true,
            },
            {
              name: "Agency",
              price: "79 €/mois",
              desc: "Pour les équipes.",
              fit: "Pour agences multi-clients",
              features: [
                "200 URLs surveillées",
                "Fréquence toutes les 15 min",
                "Alertes email + Slack + Webhook",
                "Historique 90 jours",
              ],
            },
          ].map((plan, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className={`cc-hover-lift rounded-2xl border p-6 ${
                plan.highlight
                  ? "cc-panel-strong"
                  : "cc-panel"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {plan.highlight && (
                  <span className="text-xs px-2 py-1 rounded-full cc-chip">
                    Populaire
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold">{plan.price}</div>
              <p className="text-gray-300 text-sm mt-2">{plan.desc}</p>
              <p className="mt-2 text-xs text-white/68">{plan.fit}</p>
              <p className="mt-3 rounded-[20px] cc-panel px-3 py-2 text-xs text-gray-300">
                {plan.name === "Starter"
                  ? "Idéal pour tester le flux complet: ajouter des URLs, lancer un scan et vérifier les premières alertes."
                  : plan.name === "Pro"
                    ? "Idéal si tu veux un vrai rythme de veille avec plus d'URLs, plus de scans et plus d'historique."
                    : "Idéal si tu pilotes plusieurs marques ou plusieurs clients dans la même interface."}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              {session?.user ? (
                <button
                  onClick={() =>
                    startCheckout(
                      plan.name === "Starter"
                        ? "starter"
                        : plan.name === "Pro"
                          ? "pro"
                          : "agency"
                    )
                  }
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 font-medium transition ${
                    plan.highlight
                      ? "cc-button-primary"
                      : "cc-button-secondary"
                  }`}
                >
                  {plan.name === "Starter"
                    ? "Démarrer l’essai"
                    : plan.name === "Pro"
                      ? "Passer à Pro"
                      : "Passer à Agency"}
                </button>
              ) : (
                <a
                  href="/signup"
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 font-medium transition ${
                    plan.highlight
                      ? "cc-button-primary"
                      : "cc-button-secondary"
                  }`}
                >
                  {plan.name === "Starter"
                    ? "Démarrer l’essai"
                    : plan.name === "Pro"
                      ? "Passer à Pro"
                      : "Passer à Agency"}
                </a>
              )}
            </motion.div>
          ))}
        </div>
        <div className="mt-6 rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04)_0%,_rgba(10,10,10,0.98)_24%,_rgba(0,0,0,1)_88%)] p-4 text-center">
          <p className="text-sm text-white">
            Commence par l&apos;essai si tu veux valider le produit. Passe a `Pro`
            des que tu veux un rythme de veille vraiment exploitable.
          </p>
          <p className="mt-1 text-xs text-white/60">
            -20% avec l&apos;abonnement annuel. Annulation a tout moment.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-10"
        >
          FAQ — Veille concurrentielle
        </motion.h2>
        <p className="text-center text-xs text-gray-400 mb-8">
          FAQ rapide ci-dessous.{" "}
          <a href="/faq" className="text-white/72 underline underline-offset-4 transition hover:text-white">
            En savoir plus (FAQ complete)
          </a>
          .
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              q: "Que surveille ChronoCrawl ?",
              a: "Les URLs que tu ajoutes dans Surveillance. Le moteur remonte surtout les signaux SEO, CTA, pricing et titres visibles utiles à une veille concurrentielle.",
            },
            {
              q: "Que vais-je voir dans une alerte ?",
              a: "Un résumé court, un avant / après, une interprétation rapide et un lien direct vers le dashboard pour revoir le changement proprement.",
            },
            {
              q: "Le produit est-il simple a prendre en main ?",
              a: "Oui. Le parcours tient en peu d'etapes : ajouter une URL, lancer un scan, lire les alertes, puis ouvrir l'audit SEO concurrent si besoin.",
            },
            {
              q: "Quelle est la difference entre Surveillance et Audit SEO ?",
              a: "Surveillance suit les changements dans le temps. Audit SEO concurrent sert a lire ponctuellement la structure SEO d'une page concurrente.",
            },
            {
              q: "Est-ce qu'il faut installer quelque chose ?",
              a: "Non. ChronoCrawl est un SaaS : tu ajoutes tes URLs, tu règles tes emails si besoin, puis tu travailles depuis le dashboard.",
            },
            {
              q: "Quel plan choisir au debut ?",
              a: "Commence par l'essai ou Starter pour valider le flux. Passe a Pro des que tu veux plus d'URLs, plus de scans et plus d'historique.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="cc-hover-lift cc-panel-strong rounded-[28px] p-6"
            >
              <h3 className="text-lg font-semibold mb-2">{item.q}</h3>
              <p className="text-gray-300 text-sm">{item.a}</p>
            </motion.div>
          ))}
        </div>
        <div className="cc-hover-lift mt-6 cc-panel-strong rounded-[28px] p-5">
          <p className="text-sm font-medium text-gray-100">
            Ce que ChronoCrawl promet aujourd&apos;hui
          </p>
          <p className="mt-2 text-sm text-gray-300">
            Un produit simple et francophone pour surveiller des pages concurrentes,
            lire les alertes utiles et lancer un audit SEO concurrent sans empiler
            des modules inutiles.
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="max-w-4xl mx-auto px-6 pb-32 text-center">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold mb-4"
        >
          Contact
        </motion.h2>
        <p className="text-gray-300 mb-8">
          Une question sur la veille concurrentielle ou besoin d’un conseil ?
          Écris‑nous et on te répond rapidement.
        </p>
        <a
          href="mailto:hello@chronocrawl.com?subject=Contact%20ChronoCrawl"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white bg-white text-black hover:bg-white/85 transition font-medium"
        >
          hello@chronocrawl.com
        </a>
        <div className="mt-5">
          <a
            href={session?.user ? "/dashboard" : "/signup"}
            className="cc-button-secondary inline-flex items-center justify-center rounded-full px-6 py-3 font-medium"
          >
            Tester sur 1 URL en 60s
          </a>
        </div>
      </section>

      <DemoVideoModal
        isOpen={demoOpen}
        ctaHref={session?.user ? "/dashboard" : "/signup"}
        onClose={() => setDemoOpen(false)}
      />
      <PublicFooter />
    </main>
  );
}
