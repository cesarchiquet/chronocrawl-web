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

const proofSlides = [
  {
    badge: "Avant",
    title: "Page pricing concurrente stable",
    detail: "Aucun changement depuis 12 jours.",
    footer: "Risque faible",
    note: "- Aucune action immediate requise.",
  },
  {
    badge: "Apres",
    title: "Nouveau plan + CTA modifie",
    detail: "Variation detectee sur prix, bloc offre et bouton principal.",
    footer: "Alerte priorite haute",
    note: "- Verifier l'impact sur votre positionnement offre.",
  },
  {
    badge: "Decision",
    title: "Action recommandee",
    detail: "Comparer les offres, ajuster la page cible, notifier l'equipe sales.",
    footer: "Temps de reaction: < 1h",
    note: "- Plan d'action partage a l'equipe en 1 clic.",
  },
];

const impactMetrics = [
  { label: "Temps economise / semaine", value: "6h" },
  { label: "Chang. critiques detectes", value: "94%" },
  { label: "Delai moyen de reaction", value: "< 60 min" },
];

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [checkoutError, setCheckoutError] = useState("");
  const [billingError, setBillingError] = useState("");
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroSlideIndex((value) => (value + 1) % proofSlides.length);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

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
                  Demarrer l&apos;essai gratuit
                </button>
              ) : (
                <a
                  href="#tarifs"
                  className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
                >
                  Demarrer l&apos;essai gratuit
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
            <div className="mt-4 rounded-xl border border-white/10 bg-[#0a1024] p-5 min-h-[300px] relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroSlideIndex}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                  className="absolute inset-0 p-5 flex flex-col"
                >
                  <div className="inline-flex w-fit rounded-full border border-indigo-300/30 bg-indigo-500/10 px-2 py-1 text-xs text-indigo-200">
                    {proofSlides[heroSlideIndex]?.badge}
                  </div>
                  <h3 className="mt-3 text-base font-semibold">
                    {proofSlides[heroSlideIndex]?.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-300">
                    {proofSlides[heroSlideIndex]?.detail}
                  </p>
                  <div className="mt-auto rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-gray-300">
                    {proofSlides[heroSlideIndex]?.footer}
                  </div>
                  <p className="mt-3 text-xs text-gray-400">
                    {proofSlides[heroSlideIndex]?.note}
                  </p>
                </motion.div>
              </AnimatePresence>
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
