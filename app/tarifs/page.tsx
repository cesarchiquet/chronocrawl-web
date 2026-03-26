"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import PublicChrome from "@/components/PublicChrome";
import { supabase } from "@/lib/supabaseClient";

const plans = [
  {
    name: "Starter",
    price: "12 EUR/mois",
    desc: "Pour lancer une veille concurrentielle simple et propre.",
    fit: "Pour fréelance ou petite équipe",
    details: [
      "10 URLs surveillées",
      "Fréquence toutes les 6h",
      "10 scans manuels par jour",
    ],
  },
  {
    name: "Pro",
    price: "29 EUR/mois",
    desc: "Le meilleur niveau pour suivre des concurrents en continu.",
    fit: "Pour SaaS et e-commerce en croissance",
    details: [
      "50 URLs surveillées",
      "Fréquence toutes les 60 min",
      "Scans manuels illimités",
    ],
    highlight: true,
  },
  {
    name: "Agency",
    price: "79 EUR/mois",
    desc: "Pour piloter plusieurs marques ou plusieurs clients.",
    fit: "Pour agences multi-clients",
    details: [
      "200 URLs surveillées",
      "Fréquence toutes les 15 min",
      "Scans manuels illimités",
    ],
  },
];

const comparisonRows = [
  { label: "URLs surveillées", starter: "10", pro: "50", agency: "200" },
  { label: "Fréquence max", starter: "Toutes les 6h", pro: "Toutes les 60 min", agency: "Toutes les 15 min" },
  { label: "Scans manuels", starter: "10 / jour", pro: "Illimités", agency: "Illimités" },
];

export default function TarifsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [fromSignup, setFromSignup] = useState(false);
  const [checkoutCancelled, setCheckoutCancelled] = useState(false);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setFromSignup(params.get("from") === "signup");
    setCheckoutCancelled(params.get("checkout") === "cancelled");
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
        body: JSON.stringify({
          plan,
          successPath:
            plan === "starter"
              ? "/dashboard?trialStarted=1&onboarding=1"
              : "/dashboard?planUpdated=1",
          cancelPath: "/tarifs?checkout=cancelled",
        }),
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
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 md:pt-16 pb-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">Tarifs ChronoCrawl</h1>
        <p className="mt-5 text-center text-gray-300 max-w-2xl mx-auto">
          ChronoCrawl repose aujourd&apos;hui sur un produit clair :
          `Surveillance`, `Centre d&apos;alertes`, `Historique alertes` et
          `Audit SEO concurrent`. Cette page montre simplement quelle capacité tu
          obtiens selon ton volume.
        </p>
        {fromSignup && (
          <div className="mt-6 rounded-xl border border-emerald-300/25 bg-emerald-500/10 p-4 text-left">
            <p className="text-sm font-medium text-emerald-100">
              Ton compte est prêt
            </p>
            <p className="mt-1 text-sm text-emerald-50/90">
              Prochaine étape : démarrer l&apos;essai pour ouvrir la surveillance,
              ajouter ta première URL et accéder au dashboard complet.
            </p>
          </div>
        )}
        {checkoutCancelled && (
          <div className="mt-6 rounded-xl border border-amber-300/25 bg-amber-500/10 p-4 text-left">
            <p className="text-sm font-medium text-amber-100">
              Checkout interrompu
            </p>
            <p className="mt-1 text-sm text-amber-50/90">
              Tu peux reprendre ici sans perdre le fil. Le plus simple pour démarrer reste l&apos;essai 7 jours.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-3 md:grid-cols-4">
          {[
            { label: "Module coeur", value: "Surveillance d'URLs" },
            { label: "Lecture alertes", value: "SEO / CTA / Pricing" },
            { label: "Module inclus", value: "Audit SEO concurrent" },
            { label: "Positionnement", value: "Simple, actionnable, francophone" },
          ].map((item) => (
            <div
              key={item.label}
              className="cc-panel-strong cc-hover-lift rounded-[26px] p-4"
            >
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="mt-1 text-sm font-medium text-gray-100">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 cc-shell cc-hover-lift rounded-[28px] p-5">
          <p className="text-sm text-white/72">
            Logique recommandée : commence par l&apos;essai pour valider le flux,
            puis passe à `Pro` dès que tu veux une veille concurrentielle suivie
            avec plus d&apos;URLs, plus de scans et plus d&apos;historique.
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`cc-hover-lift rounded-2xl border p-5 md:p-6 ${
                plan.highlight
                  ? "cc-panel-strong"
                  : "cc-panel"
              }`}
            >
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="mt-2 text-3xl font-bold">{plan.price}</p>
              <p className="mt-2 text-sm text-gray-300">{plan.desc}</p>
              <p className="mt-2 text-xs text-white/68">{plan.fit}</p>
              <div className="mt-4 cc-panel rounded-[20px] p-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  Ce que tu achètes vraiment
                </p>
                <p className="mt-1 text-sm text-gray-200">
                  {plan.name === "Starter"
                    ? "Le point d'entrée pour valider le produit sur un petit volume et confirmer que la veille te convient."
                    : plan.name === "Pro"
                      ? "Le bon équilibre pour suivre sérieusement plusieurs concurrents avec un vrai rythme de travail."
                      : "Le niveau équipe pour piloter plusieurs marques ou plusieurs clients dans la même interface."}
                </p>
              </div>
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
                      ? "cc-button-primary"
                      : "cc-button-secondary"
                  }`}
                >
                  {plan.name === "Starter"
                    ? "Démarrer l'essai"
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
                    ? "Démarrer l'essai"
                    : plan.name === "Pro"
                      ? "Passer à Pro"
                      : "Passer à Agency"}
                </a>
              )}
            </article>
          ))}
        </div>

        <div className="mt-8 cc-panel-strong cc-hover-lift rounded-[26px] p-4 overflow-x-auto">
          <p className="text-sm font-medium text-gray-100 mb-3">
            Comparatif rapide des plans
          </p>
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="text-left text-gray-300 border-b border-white/10">
                <th className="py-2 pr-4">Critere</th>
                <th className="py-2 pr-4">Starter</th>
                <th className="py-2 pr-4">Pro</th>
                <th className="py-2">Agency</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-b border-white/5 text-gray-200">
                  <td className="py-2 pr-4">{row.label}</td>
                  <td className="py-2 pr-4">{row.starter}</td>
                  <td className="py-2 pr-4">{row.pro}</td>
                  <td className="py-2">{row.agency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            {
              title: "Essai 7 jours",
              text: "Le plus simple pour tester le flux complet avant d'installer ChronoCrawl dans ton quotidien.",
            },
            {
              title: "Paiement sécurisé",
              text: "Le checkout passe par Stripe. Tu peux annuler a tout moment depuis le dashboard.",
            },
            {
              title: "Retour direct au dashboard",
              text: "Après validation, tu reviens directement dans le dashboard pour ajouter ta première URL ou reprendre la veille.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="cc-panel-strong cc-hover-lift rounded-[26px] p-4"
            >
              <p className="text-sm font-medium text-gray-100">{item.title}</p>
              <p className="mt-1 text-xs text-gray-300">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 cc-panel-strong cc-hover-lift rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-white/68">
            Parcours recommandé
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Starter pour valider, Pro pour travailler sérieusement
          </h2>
          <p className="mt-3 text-sm text-gray-300">
            Le vrai saut de valeur se fait entre l&apos;essai ou `Starter` et `Pro`.
            `Starter` sert à vérifier le flux complet. `Pro` devient le bon niveau
            dès que la veille fait partie du quotidien.
          </p>
          <div className="mt-5 space-y-3">
            {[
              {
                step: "01",
                title: "Valider le flux",
                text: "Ajouter des URLs, lancer les premiers scans et confirmer que les alertes remontent bien les bons signaux.",
              },
              {
                step: "02",
                title: "Mesurer le besoin réel",
                text: "Quand les URLs augmentent et que tu veux un rythme plus serré, Starter devient vite limite.",
              },
              {
                step: "03",
                title: "Passer à Pro",
                text: "Plus de volume, un scan toutes les 60 minutes et 30 jours d'historique : c'est le vrai niveau de travail.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="cc-panel cc-hover-lift rounded-[22px] p-4"
              >
                <p className="text-xs text-white/68">Étape {item.step}</p>
                <p className="mt-1 text-sm font-medium text-gray-100">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-gray-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {session ? (
          <p className="mt-8 text-center text-xs text-gray-400">
            Tu es connecté. Tu peux souscrire directement depuis cette page.
          </p>
        ) : (
          <p className="mt-8 text-center text-xs text-gray-400">
            Tu peux comparer ici, puis créer ton compte pour souscrire.
          </p>
        )}
        <div className="mt-6 cc-panel-strong cc-hover-lift rounded-[26px] p-4">
          <p className="text-sm font-medium text-gray-100">Besoin d&apos;aide pour choisir ?</p>
          <p className="mt-1 text-xs text-gray-300">
            Si tu veux valider le produit : Starter. Si tu veux un rythme business propre : Pro. Si tu gères plusieurs comptes : Agency.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="/dashboard"
              className="cc-button-secondary rounded-full px-4 py-2 text-xs"
            >
              Ouvrir le dashboard
            </a>
            <a
              href="/faq"
              className="cc-button-secondary rounded-full px-4 py-2 text-xs"
            >
              Lire la FAQ
            </a>
          </div>
        </div>
        <div className="mt-6 cc-panel-strong cc-hover-lift rounded-[26px] p-4">
          <p className="text-sm font-medium text-gray-100">Questions fréquentes avant abonnement</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs text-gray-300">
            <div className="cc-panel cc-hover-lift rounded-[20px] p-3">
              <p className="text-white/68 font-medium">Paiement</p>
              <p className="mt-1">Paiement sécurisé via Stripe. Facture disponible depuis le portail abonnement.</p>
            </div>
            <div className="cc-panel cc-hover-lift rounded-[20px] p-3">
              <p className="text-white/68 font-medium">Résiliation</p>
              <p className="mt-1">Tu peux annuler à tout moment. Aucun engagement longue durée imposé.</p>
            </div>
            <div className="cc-panel cc-hover-lift rounded-[20px] p-3">
              <p className="text-white/68 font-medium">Support</p>
              <p className="mt-1">Besoin d&apos;aide pour choisir ? Contact direct depuis la page contact.</p>
            </div>
          </div>
        </div>
        {checkoutError && (
          <p className="mt-3 text-center text-xs text-red-300">{checkoutError}</p>
        )}
      </section>
    </PublicChrome>
  );
}
