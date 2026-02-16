"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import PublicChrome from "@/components/PublicChrome";
import { supabase } from "@/lib/supabaseClient";

const plans = [
  {
    name: "Starter",
    price: "12 EUR/mois",
    desc: "7 jours d'essai gratuit, ideal pour demarrer.",
    details: [
      "10 URLs surveillees",
      "Frequence toutes les 6h",
      "Alertes email",
      "Historique 7 jours",
    ],
  },
  {
    name: "Pro",
    price: "29 EUR/mois",
    desc: "Le meilleur equilibre.",
    details: [
      "50 URLs surveillees",
      "Frequence toutes les 60 min",
      "Alertes email + Slack",
      "Historique 30 jours",
    ],
    highlight: true,
  },
  {
    name: "Agency",
    price: "79 EUR/mois",
    desc: "Pour les equipes.",
    details: [
      "200 URLs surveillees",
      "Frequence toutes les 15 min",
      "Alertes email + Slack + Webhook",
      "Historique 90 jours",
    ],
  },
];

export default function TarifsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    const hydrate = async () => {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        setSession(refreshed.session);
        return;
      }
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    hydrate();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const startCheckout = async (plan: "starter" | "pro" | "agency") => {
    if (!session?.access_token) return;
    setCheckoutError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Checkout indisponible.");
      }
      window.location.href = data.url;
    } catch (error: unknown) {
      setCheckoutError(
        error instanceof Error ? error.message : "Erreur checkout."
      );
    }
  };

  return (
    <PublicChrome>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">Tarifs ChronoCrawl</h1>
        <p className="mt-5 text-center text-gray-300 max-w-2xl mx-auto">
          Cette page detaille les offres. La landing conserve un resume pour aller vite,
          et cette section sert de reference claire pour comparer les plans.
        </p>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.highlight
                  ? "bg-indigo-500/10 border-indigo-400/40"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold">{plan.price}</p>
              <p className="mt-2 text-sm text-gray-300">{plan.desc}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                {plan.details.map((detail) => (
                  <li key={detail}>• {detail}</li>
                ))}
              </ul>
              {session ? (
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
                    ? "Demarrer l'essai"
                    : plan.name === "Pro"
                      ? "Passer a Pro"
                      : "Passer a Agency"}
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
                    ? "Demarrer l'essai"
                    : plan.name === "Pro"
                      ? "Passer a Pro"
                      : "Passer a Agency"}
                </a>
              )}
            </article>
          ))}
        </div>

        {session ? (
          <p className="mt-8 text-center text-xs text-gray-400">
            Tu es connecte. Tu peux souscrire directement depuis cette page.
          </p>
        ) : (
          <p className="mt-8 text-center text-xs text-gray-400">
            Tu peux comparer ici, puis creer ton compte pour souscrire.
          </p>
        )}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-gray-100">Besoin d&apos;aide pour choisir ?</p>
          <p className="mt-1 text-xs text-gray-300">
            Si tu demarres: Starter. Si tu veux un rythme horaire: Pro. Si tu geres plusieurs marques: Agency.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="/demo?tour=1"
              className="rounded-md border border-white/20 px-3 py-2 text-xs text-gray-200 hover:bg-white/5 transition"
            >
              Voir la demo rapide
            </a>
            <a
              href="/faq"
              className="rounded-md border border-white/20 px-3 py-2 text-xs text-gray-200 hover:bg-white/5 transition"
            >
              Lire la FAQ
            </a>
          </div>
        </div>
        {checkoutError && (
          <p className="mt-3 text-center text-xs text-red-300">{checkoutError}</p>
        )}
      </section>
    </PublicChrome>
  );
}
