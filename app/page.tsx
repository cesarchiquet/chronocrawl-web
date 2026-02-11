"use client";

import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function Home() {
  const [status, setStatus] = useState<
  "idle" | "success" | "exists" | "error"
>("idle");
  const [session, setSession] = useState<any>(null);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const startCheckout = async (plan: "starter" | "pro" | "agency") => {
    if (!session?.user?.id || !session?.user?.email) {
      setCheckoutError("Connecte-toi pour continuer.");
      return;
    }

    setCheckoutError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          userId: session.user.id,
          email: session.user.email,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Impossible de démarrer le paiement.");
      }
      window.location.href = data.url;
    } catch (error: any) {
      setCheckoutError(error.message || "Erreur de paiement.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">

      {/* HERO */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto px-6 pt-28 pb-24 text-center"
      >
        <div className="flex items-center justify-between text-sm mb-10">
          {session?.user ? (
            <div className="px-4 py-2 rounded-lg border border-indigo-400/30 bg-indigo-500/10 text-indigo-200">
              Connecté : {session.user.email}
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <a
                  href="/dashboard"
                  className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
                >
                  Dashboard
                </a>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition"
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition"
                >
                  Se connecter
                </a>
                <a
                  href="/signup"
                  className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
                >
                  Créer un compte
                </a>
              </>
            )}
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          Surveiller un site concurrent{" "}
          <span className="text-indigo-400">automatiquement</span>
        </h1>

        <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">
          Veille concurrentielle automatisée : ChronoCrawl surveille les sites
          concurrents et t’envoie une alerte changement site web dès qu’une
          page évolue.
        </p>

        <div className="mt-8 mx-auto w-fit rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200">
          Starter gratuit 7 jours
          {session?.user ? (
            <button
              onClick={() => startCheckout("starter")}
              className="ml-3 inline-flex items-center rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-400 transition"
            >
              Démarrer l’essai
            </button>
          ) : (
            <a
              href="#tarifs"
              className="ml-3 inline-flex items-center rounded-full bg-indigo-500 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-400 transition"
            >
              Démarrer l’essai
            </a>
          )}
        </div>
        {checkoutError && (
          <p className="mt-3 text-xs text-red-300">{checkoutError}</p>
        )}

        <div className="mt-10 flex justify-center items-start gap-2">
          <a
            href="/blog"
            className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            Lire le guide
          </a>
          <div className="flex flex-col items-center gap-3">
            <a
              href="#contact"
              className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition"
            >
              Contact
            </a>
          </div>
          <a
            href={session?.user ? "/dashboard" : "/login"}
            className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            Accéder au dashboard
          </a>
        </div>
      </motion.section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Détection intelligente",
            text: "Détecte les changements importants sur les sites concurrents et réduit les faux positifs.",
          },
          {
            title: "Alertes instantanées",
            text: "Alerte changement site web envoyée dès qu’une page concurrente évolue.",
          },
          {
            title: "Pensé pour la veille pro",
            text: "Veille concurrentielle pour SaaS, e‑commerce, SEO, pricing et pages clés.",
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
      </section>
    </main>
  );
}
