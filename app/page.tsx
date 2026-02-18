"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import PublicNavigation from "@/components/PublicNavigation";
import PublicFooter from "@/components/PublicFooter";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const HERO_SLIDE_DURATION_MS = 6500;

const proofSlides = [
  {
    key: "urls",
    badge: "Photo 1",
    title: "Toutes vos URLs au meme endroit",
    detail: "Vous voyez en un coup d'oeil quelles pages sont bien surveillees.",
  },
  {
    key: "alerts",
    badge: "Photo 2",
    title: "Les alertes importantes ressortent",
    detail: "Le centre d'alertes vous montre quoi traiter maintenant en priorite.",
  },
  {
    key: "setup",
    badge: "Photo 3",
    title: "Configuration simple en 2 minutes",
    detail: "Vous reglez vos alertes et vous lancez la surveillance sans complexite.",
  },
];

const impactMetrics = [
  { label: "Temps economise / semaine", value: "6h" },
  { label: "Chang. critiques detectes", value: "94%" },
  { label: "Delai moyen de reaction", value: "< 60 min" },
];

const OFFER_ROTATION_MS = 7500;

const compactOffers = [
  {
    name: "Starter",
    price: "12 EUR/mois",
    desc: "7 jours d'essai gratuit, ideal pour demarrer.",
    fit: "Freelance ou petite equipe",
    why: "Parfait pour lancer une veille concurrentielle propre sans complexite technique.",
    features: ["10 URLs", "Toutes les 6h", "Alertes email"],
  },
  {
    name: "Pro",
    price: "29 EUR/mois",
    desc: "Le meilleur equilibre.",
    fit: "SaaS et e-commerce",
    why: "Le niveau recommande pour suivre vos concurrents en continu avec un vrai rythme business.",
    features: ["50 URLs", "Toutes les 60 min", "Email + Slack"],
    highlight: true,
  },
  {
    name: "Agency",
    price: "79 EUR/mois",
    desc: "Pour les equipes multi-clients.",
    fit: "Agence",
    why: "Concu pour les equipes qui pilotent plusieurs comptes et ont besoin d'un suivi intensif.",
    features: ["200 URLs", "Toutes les 15 min", "Webhook"],
  },
] as const;

const URL_VOLUME_STOPS = [10, 25, 50, 100, 200] as const;

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [checkoutError, setCheckoutError] = useState("");
  const [billingError, setBillingError] = useState("");
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [offerIndex, setOfferIndex] = useState(0);
  const [simulatedVolumeIndex, setSimulatedVolumeIndex] = useState(2);
  const [simulatedFrequency, setSimulatedFrequency] = useState<15 | 60 | 360>(60);
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
      setBillingError("Connecte-toi pour gerer ton abonnement.");
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
  const simulatedUrls = URL_VOLUME_STOPS[simulatedVolumeIndex] || URL_VOLUME_STOPS[0];
  const scansPerDay = Math.ceil(1440 / simulatedFrequency) * simulatedUrls;
  const suggestedPlan =
    scansPerDay <= 2500 ? "Starter" : scansPerDay <= 10000 ? "Pro" : "Agency";

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHeroSlideIndex((value) => (value + 1) % proofSlides.length);
    }, HERO_SLIDE_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [heroSlideIndex]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setOfferIndex((value) => (value + 1) % compactOffers.length);
    }, OFFER_ROTATION_MS);
    return () => clearTimeout(timeout);
  }, [offerIndex]);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
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
              className="rounded-xl border border-white/10 bg-white/5 p-6"
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
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
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
        className="max-w-6xl mx-auto px-6 pt-28 pb-24"
      >
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="text-center lg:text-left">
            {session?.user && (
              <div className="mb-10 inline-flex items-center rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200">
                Connecte : {session.user.email}
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Surveiller un site concurrent{" "}
              <span className="text-indigo-400">automatiquement</span>
            </h1>

            <p className="mt-6 text-lg text-gray-300 max-w-2xl lg:mx-0 mx-auto">
              Veille concurrentielle automatisée : ChronoCrawl surveille les sites
              concurrents et t’envoie une alerte changement site web dès qu’une
              page évolue.
            </p>
            <div className="mt-4 rounded-lg border border-indigo-300/25 bg-indigo-500/10 p-3 text-sm text-indigo-100 max-w-2xl lg:mx-0 mx-auto">
              Essai gratuit 7 jours, sans engagement. En moyenne: premier signal utile en moins de 24h.
            </div>

            {checkoutError && (
              <p className="mt-3 text-xs text-red-300">{checkoutError}</p>
            )}
            {billingError && (
              <p className="mt-2 text-xs text-red-300">{billingError}</p>
            )}
            {session?.user && (
              <p className="mt-2 text-xs text-indigo-200">
                Plan actif: {String(plan).toUpperCase()} | Statut:{" "}
                {String(effectiveSubscriptionStatus).toUpperCase()}
              </p>
            )}

            <div className="mt-10 flex flex-wrap justify-center lg:justify-start items-start gap-2">
              {session?.user ? (
                <button
                  onClick={() => startCheckout("starter")}
                  className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
                >
                  Commencer l&apos;essai 7 jours
                </button>
              ) : (
                <a
                  href="#tarifs"
                  className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
                >
                  Commencer l&apos;essai 7 jours
                </a>
              )}
              <a
                href={tourHref}
                className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition font-medium"
              >
                Comprendre le produit
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-indigo-200">
              Apercu dashboard
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-[#0a1024] p-4 min-h-[360px] relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroSlideIndex}
                  initial={{ opacity: 0, x: 22, scale: 0.98, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: -22, scale: 0.98, filter: "blur(4px)" }}
                  transition={{ duration: 0.34, ease: "easeOut" }}
                  className="absolute inset-0 p-4 flex flex-col"
                >
                  {proofSlides[heroSlideIndex]?.key === "urls" && (
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3 h-[210px] overflow-hidden">
                      <p className="text-xs font-medium text-gray-200">URLs surveillees</p>
                      <div className="mt-2 space-y-2">
                        {[
                          "https://www.concurrent-a.com/pricing",
                          "https://www.concurrent-b.com/offres",
                          "https://www.concurrent-c.com/tarifs",
                        ].map((url) => (
                          <div
                            key={url}
                            className="rounded-md border border-white/10 bg-[#111a35] px-2 py-2 text-[11px] text-gray-300 flex items-center justify-between gap-2"
                          >
                            <span className="truncate">{url}</span>
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">
                              OK
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {proofSlides[heroSlideIndex]?.key === "alerts" && (
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3 min-h-[200px]">
                      <p className="text-xs font-medium text-gray-200">Centre d&apos;alertes</p>
                      <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-gray-300">
                        <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Historique</span>
                        <span className="rounded border border-indigo-300/30 bg-indigo-500/15 px-2 py-1">0 non lu</span>
                        <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Tout marquer lu</span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-gray-300">
                        <span className="rounded border border-white/10 bg-white/5 px-2 py-1">URL: Toutes les URLs</span>
                        <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Seuil: Tous</span>
                        <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Periode: Tout</span>
                      </div>
                      <div className="mt-2 rounded-md border border-white/10 bg-[#111a35] p-2">
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-indigo-200">CONTENT</span>
                          <span className="rounded bg-red-500/20 px-2 py-0.5 text-red-200">HIGH</span>
                          <span className="rounded bg-red-500/20 px-2 py-0.5 text-red-200">IMPACT 90 - HAUTE</span>
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-200">CONFIANCE ELEVEE</span>
                        </div>
                        <p className="mt-2 text-[11px] text-gray-200">[Content] Contenu modifie</p>
                        <p className="mt-1 text-[10px] text-gray-400">Action: Intervention immediate recommandee pour corriger l&apos;impact business.</p>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-gray-300">
                          <span>17/02 3H25</span>
                          <span className="rounded border border-white/10 px-1.5 py-0.5">Voir changement</span>
                          <span className="rounded border border-white/10 px-1.5 py-0.5">Marquer non lu</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {proofSlides[heroSlideIndex]?.key === "setup" && (
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3 min-h-[200px]">
                      <p className="text-xs font-medium text-gray-200">Preferences d&apos;alertes</p>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-gray-300">
                        <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Mode email: Aucun</span>
                        <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Seuil email: LOW</span>
                        <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Digest: 19</span>
                      </div>
                      <div className="mt-2 flex gap-2 text-[10px]">
                        <span className="rounded border border-indigo-300/35 bg-indigo-500/15 px-2 py-1 text-indigo-100">Tous</span>
                        <span className="rounded border border-indigo-300/35 bg-indigo-500/15 px-2 py-1 text-indigo-100">LOW</span>
                        <span className="rounded border border-indigo-300/35 bg-indigo-500/15 px-2 py-1 text-indigo-100">MEDIUM</span>
                        <span className="rounded border border-indigo-300/35 bg-indigo-500/15 px-2 py-1 text-indigo-100">HIGH</span>
                      </div>
                      <div className="mt-2 rounded-md border border-white/10 bg-[#111a35] p-2 text-[11px] text-gray-300">
                        Ajouter une URL
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-gray-400">
                          https://site-concurrent.com/pricing
                        </span>
                        <span className="rounded bg-indigo-500 px-2 py-1 text-[10px] text-white">
                          Ajouter
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="inline-flex w-fit rounded-full border border-indigo-300/30 bg-indigo-500/10 px-2 py-1 text-xs text-indigo-200">
                    {proofSlides[heroSlideIndex]?.badge}
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-snug">
                    {proofSlides[heroSlideIndex]?.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                    {proofSlides[heroSlideIndex]?.detail}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                key={heroSlideIndex}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{
                  duration: HERO_SLIDE_DURATION_MS / 1000,
                  ease: "linear",
                }}
                className="h-full bg-indigo-400/90"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() =>
                  setHeroSlideIndex((value) =>
                    value === 0 ? proofSlides.length - 1 : value - 1
                  )
                }
                className="rounded-full border border-white/15 px-3 py-1 text-sm text-gray-300 hover:bg-white/5"
              >
                ←
              </button>
              <div className="flex items-center gap-2">
                {proofSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    onClick={() => setHeroSlideIndex(index)}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      heroSlideIndex === index ? "bg-indigo-300" : "bg-white/30"
                    }`}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() =>
                  setHeroSlideIndex((value) => (value + 1) % proofSlides.length)
                }
                className="rounded-full border border-white/15 px-3 py-1 text-sm text-gray-300 hover:bg-white/5"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="max-w-6xl mx-auto px-6 pb-10">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs text-gray-400">Temps de mise en route</p>
            <p className="mt-1 text-lg font-semibold text-indigo-100">~2 minutes</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs text-gray-400">Alertes prioritaires</p>
            <p className="mt-1 text-lg font-semibold text-indigo-100">High / Medium / Low</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs text-gray-400">Mode essai</p>
            <p className="mt-1 text-lg font-semibold text-indigo-100">Sans engagement</p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-indigo-300/30 bg-indigo-500/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-200">
                Premier pas
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                Comprendre le produit
              </h2>
            </div>
            <a
              href={tourHref}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition"
            >
              Commencer
            </a>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <a
              href="/demo?tour=1"
              className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <p className="text-xs text-indigo-200">Etape 1</p>
              <p className="mt-1 text-sm font-medium">Voir une alerte type</p>
              <p className="mt-1 text-xs text-gray-300">Format, preuve, priorite, action.</p>
            </a>
            <a
              href="/cas-d-usage?tour=1"
              className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <p className="text-xs text-indigo-200">Etape 2</p>
              <p className="mt-1 text-sm font-medium">Choisir son cas d&apos;usage</p>
              <p className="mt-1 text-xs text-gray-300">SaaS, e-commerce, agence, SEO.</p>
            </a>
            <a
              href={tourHref}
              className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <p className="text-xs text-indigo-200">Etape 3</p>
              <p className="mt-1 text-sm font-medium">Passer a l&apos;action</p>
              <p className="mt-1 text-xs text-gray-300">Ajouter des URLs et lancer la premiere analyse.</p>
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 min-h-[320px] flex flex-col">
            <p className="text-sm font-semibold">Choisissez votre offre</p>
            <p className="mt-2 text-xs text-gray-400">
              Les memes offres que dans la section Tarifs, en version compacte.
            </p>
            <div className="mt-4 flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={compactOffers[offerIndex].name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 h-full flex flex-col"
                >
                  <p className="text-2xl font-bold tracking-tight">
                    {compactOffers[offerIndex].name}
                  </p>
                  <p className="mt-1 text-4xl font-semibold text-white">
                    {compactOffers[offerIndex].price}
                  </p>
                  <p className="mt-3 text-sm text-gray-200">{compactOffers[offerIndex].desc}</p>
                  <p className="mt-2 text-sm text-indigo-200">{compactOffers[offerIndex].fit}</p>
                  <p className="mt-3 text-sm text-gray-300">{compactOffers[offerIndex].why}</p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-300">
                    {compactOffers[offerIndex].features.map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-4">
                    <div className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-center text-xs text-gray-200">
                      Voir l&apos;offre {compactOffers[offerIndex].name}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() =>
                    setOfferIndex((value) =>
                      value === 0 ? compactOffers.length - 1 : value - 1
                    )
                  }
                  className="rounded-full border border-white/15 px-3 py-1 text-sm text-gray-300 hover:bg-white/5"
                  aria-label="Offre precedente"
                >
                  ←
                </button>
                <div className="flex items-center gap-2">
                  {compactOffers.map((offer, index) => (
                    <button
                      key={offer.name}
                      onClick={() => setOfferIndex(index)}
                      className={`h-2.5 w-2.5 rounded-full ${
                        offerIndex === index ? "bg-indigo-300" : "bg-white/30"
                      }`}
                      aria-label={`Offre ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() =>
                    setOfferIndex((value) => (value + 1) % compactOffers.length)
                  }
                  className="rounded-full border border-white/15 px-3 py-1 text-sm text-gray-300 hover:bg-white/5"
                  aria-label="Offre suivante"
                >
                  →
                </button>
              </div>
              <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  key={offerIndex}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: OFFER_ROTATION_MS / 1000, ease: "linear" }}
                  className="h-full rounded-full bg-indigo-400/80"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 min-h-[320px]">
            <p className="text-sm font-semibold">Simulateur simple</p>
            <p className="mt-2 text-xs text-gray-400">
              Choisissez votre volume et votre frequence pour voir l&apos;offre conseillee.
            </p>
            <div className="mt-4 rounded-lg border border-indigo-300/20 bg-gradient-to-br from-[#0b122d] via-[#090f26] to-[#070c1f] p-4">
              <div className="rounded-lg border border-indigo-300/15 bg-indigo-500/5 p-2">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 360, label: "Standard", detail: "6h" },
                    { value: 60, label: "Actif", detail: "60m" },
                    { value: 15, label: "Intense", detail: "15m" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setSimulatedFrequency(item.value as 15 | 60 | 360)}
                      className={`rounded-md border px-2 py-2 text-xs transition ${
                        simulatedFrequency === item.value
                          ? "border-indigo-300/40 bg-indigo-500/12 text-indigo-100"
                          : "border-indigo-200/15 bg-black/35 text-gray-200 hover:bg-indigo-500/6"
                      }`}
                    >
                      <p className="font-medium">{item.label}</p>
                      <p className="text-[10px] opacity-80">{item.detail}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <label htmlFor="sim-urls">Volume d&apos;URLs surveillees</label>
                  <span className="rounded-full border border-indigo-300/35 bg-indigo-500/12 px-2 py-0.5 text-indigo-100">
                    {simulatedUrls} URLs
                  </span>
                </div>
                <input
                  id="sim-urls"
                  type="range"
                  min={0}
                  max={URL_VOLUME_STOPS.length - 1}
                  step={1}
                  value={simulatedVolumeIndex}
                  onChange={(event) =>
                    setSimulatedVolumeIndex(Number(event.target.value))
                  }
                  className="mt-2 w-full accent-indigo-300"
                />
                <div className="mt-2 flex items-center justify-between text-[10px] text-indigo-200/70">
                  {URL_VOLUME_STOPS.map((value) => (
                    <span key={value}>{value}</span>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  {
                    name: "Starter",
                    price: "12 EUR/mois",
                    cap: "jusqu'a 2 500 analyses/jour",
                  },
                  {
                    name: "Pro",
                    price: "29 EUR/mois",
                    cap: "jusqu'a 10 000 analyses/jour",
                  },
                  {
                    name: "Agency",
                    price: "79 EUR/mois",
                    cap: "volume avance + equipe",
                  },
                ].map((plan) => {
                  const isRecommended = suggestedPlan === plan.name;
                  return (
                    <motion.div
                      key={plan.name}
                      initial={false}
                      animate={{ scale: isRecommended ? 1.02 : 1, opacity: isRecommended ? 1 : 0.72 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`rounded-lg border p-3 ${
                        isRecommended
                          ? "border-indigo-300/45 bg-indigo-500/14"
                          : "border-indigo-200/15 bg-black/35"
                      }`}
                    >
                      <p className="text-xs font-semibold">{plan.name}</p>
                      {isRecommended && (
                        <span className="mt-1 inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">
                          Recommande
                        </span>
                      )}
                      <p className="mt-2 text-sm font-semibold text-white">
                        {plan.price}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-300">{plan.cap}</p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-3 rounded-lg border border-indigo-300/35 bg-indigo-500/12 p-3">
                <p className="text-xs text-indigo-50">
                  Estimation actuelle:{" "}
                  <span className="font-semibold text-white">
                    {scansPerDay.toLocaleString("fr-FR")} analyses/jour
                  </span>{" "}
                  ({(scansPerDay * 30).toLocaleString("fr-FR")} / mois)
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Probleme: trop de bruit",
            text: "Action: filtrage des changements utiles. Resultat: moins de faux positifs, plus de signaux exploitables.",
          },
          {
            title: "Probleme: reaction tardive",
            text: "Action: alertes immediates avec preuve. Resultat: decisions prises avant que le marche bouge.",
          },
          {
            title: "Probleme: pas de priorites claires",
            text: "Action: priorite haute / moyenne / basse. Resultat: l'equipe sait quoi traiter en premier.",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className="rounded-xl bg-white/5 border border-white/10 p-6"
          >
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-300 text-sm">{item.text}</p>
          </motion.div>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-indigo-300/30 bg-indigo-500/10 p-6">
          <p className="text-xs uppercase tracking-wide text-indigo-200">
            Impact business
          </p>
          <h2 className="mt-1 text-2xl font-semibold">
            Ce que l&apos;equipe gagne concretement
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {impactMetrics.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <p className="text-3xl font-semibold text-indigo-100">{item.value}</p>
                <p className="mt-2 text-sm text-gray-300">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <a
              href={session?.user ? "/dashboard" : "/signup"}
              className="inline-flex rounded-lg bg-indigo-500 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-400 transition"
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
          efficace : ajoute tes URLs, laisse ChronoCrawl surveiller, puis reçois
          une alerte dès qu’un site concurrent change.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Ajoute les URLs",
              text: "Indique les pages concurrentes que tu veux surveiller.",
            },
            {
              step: "02",
              title: "ChronoCrawl surveille",
              text: "Le moteur analyse les changements en continu.",
            },
            {
              step: "03",
              title: "Reçois une alerte",
              text: "Tu es notifié dès qu’un changement est détecté.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="rounded-xl bg-white/5 border border-white/10 p-6"
            >
              <span className="text-indigo-400 text-sm font-medium">
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
          Resume des offres sur cette page.{" "}
          <a href="/tarifs" className="text-indigo-300 hover:text-indigo-200 underline underline-offset-4">
            En savoir plus sur les tarifs
          </a>
          .
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Starter",
              price: "12 €/mois",
              desc: "7 jours d’essai gratuit, idéal pour démarrer.",
              fit: "Pour freelance ou petite equipe",
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
              desc: "Le meilleur équilibre.",
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
              className={`rounded-2xl border p-6 ${
                plan.highlight
                  ? "bg-indigo-500/10 border-indigo-400/40"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {plan.highlight && (
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-200">
                    Populaire
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold">{plan.price}</div>
              <p className="text-gray-300 text-sm mt-2">{plan.desc}</p>
              <p className="mt-2 text-xs text-indigo-200">{plan.fit}</p>
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
                      ? "bg-indigo-500 hover:bg-indigo-400 text-white"
                      : "border border-white/20 hover:bg-white/5"
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
                      ? "bg-indigo-500 hover:bg-indigo-400 text-white"
                      : "border border-white/20 hover:bg-white/5"
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
        <p className="mt-6 text-center text-xs text-gray-400">
          -20% avec l’abonnement annuel. Annulation à tout moment.
        </p>
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
          <a href="/faq" className="text-indigo-300 hover:text-indigo-200 underline underline-offset-4">
            En savoir plus (FAQ complete)
          </a>
          .
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              q: "Que surveille ChronoCrawl ?",
              a: "Les pages que tu choisis : pages concurrentes, pricing, landing pages, pages produits et contenus SEO.",
            },
            {
              q: "Comment fonctionne l’alerte changement site web ?",
              a: "Dès qu’un changement est détecté, tu reçois une notification par email avec un lien direct.",
            },
            {
              q: "À qui s’adresse l’outil ?",
              a: "SaaS, e‑commerce, agences et équipes marketing qui veulent une veille concurrentielle simple et fiable.",
            },
            {
              q: "Faut‑il installer quelque chose ?",
              a: "Non, ChronoCrawl est un service SaaS : tu ajoutes tes URLs et la surveillance démarre.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-xl bg-white/5 border border-white/10 p-6"
            >
              <h3 className="text-lg font-semibold mb-2">{item.q}</h3>
              <p className="text-gray-300 text-sm">{item.a}</p>
            </motion.div>
          ))}
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
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
        >
          hello@chronocrawl.com
        </a>
        <div className="mt-5">
          <a
            href={session?.user ? "/dashboard" : "/signup"}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition font-medium"
          >
            Tester sur 1 URL en 60s
          </a>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
