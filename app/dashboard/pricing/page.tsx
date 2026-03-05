"use client";

import { useMemo, useState } from "react";
import DashboardSuiteMenu from "@/components/DashboardSuiteMenu";

type PricingCheck = {
  label: string;
  ok: boolean;
  why: string;
  fix: string;
};

function includesOne(text: string, words: string[]) {
  const content = text.toLowerCase();
  return words.some((word) => content.includes(word));
}

function scoreLabel(score: number) {
  if (score >= 80) return "Tres bon";
  if (score >= 60) return "Correct";
  return "A retravailler";
}

export default function DashboardPricingPage() {
  const [pricingText, setPricingText] = useState("");
  const [cta, setCta] = useState("");
  const [analyzed, setAnalyzed] = useState(false);

  const checks = useMemo<PricingCheck[] | null>(() => {
    const source = `${pricingText}\n${cta}`.trim();
    if (!source) return null;

    return [
      {
        label: "Benefice principal clair",
        ok: source.length >= 180,
        why: "Le visiteur doit comprendre vite ce que ton offre lui apporte.",
        fix: "Ajoute une phrase simple: 'Avec X, tu obtiens Y en Z jours'.",
      },
      {
        label: "Plans bien visibles",
        ok: includesOne(source, ["starter", "pro", "agency", "plan", "offre"]),
        why: "Sans plans clairs, le client ne sait pas quoi choisir.",
        fix: "Affiche 2 ou 3 plans avec differences nettes.",
      },
      {
        label: "Reduction du risque",
        ok: includesOne(source, ["essai", "gratuit", "sans engagement", "garantie"]),
        why: "Le client hesite moins s'il peut tester sans risque.",
        fix: "Ajoute essai gratuit ou garantie remboursement.",
      },
      {
        label: "CTA direct",
        ok: includesOne(source, ["demarrer", "essayer", "reserver", "commencer", "acheter"]),
        why: "Le bouton doit dire exactement quoi faire maintenant.",
        fix: "Utilise un CTA clair: 'Demarrer l'essai gratuit'.",
      },
      {
        label: "Preuves de confiance",
        ok: includesOne(source, ["temoignage", "clients", "logo", "cas client", "avis"]),
        why: "Les preuves augmentent la confiance et le passage a l'action.",
        fix: "Ajoute logos clients, temoignages ou resultats chiffres.",
      },
    ];
  }, [pricingText, cta]);

  const score = useMemo(() => {
    if (!checks) return 0;
    const okCount = checks.filter((item) => item.ok).length;
    return Math.round((okCount / checks.length) * 100);
  }, [checks]);

  const fillExample = () => {
    setPricingText(
      "Plan Starter pour independants. Plan Pro pour equipes en croissance. Plan Agency pour agences. Commence ton essai gratuit 7 jours, sans engagement. Plus de 300 equipes clientes utilisent deja la plateforme."
    );
    setCta("Demarrer l'essai gratuit");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-10">
        <p className="text-indigo-300 text-sm font-medium">Dashboard</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold">Pricing</h1>
        <p className="mt-3 text-gray-300">
          Outil simple pour verifier si ta page prix est claire pour le client.
        </p>
        <DashboardSuiteMenu />
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Comment ca marche</h2>
          <ol className="mt-3 space-y-2 text-sm text-gray-200">
            <li>1. Colle le texte de ta page pricing.</li>
            <li>2. Ecris ton bouton principal (CTA).</li>
            <li>3. Clique sur analyser pour obtenir un score + actions.</li>
          </ol>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Analyse pricing</h2>
            <button
              onClick={fillExample}
              className="rounded-lg border border-white/20 px-3 py-2 text-xs text-gray-200 hover:bg-white/5"
            >
              Charger un exemple
            </button>
          </div>

          <textarea
            value={pricingText}
            onChange={(event) => setPricingText(event.target.value)}
            placeholder="Ex: Plan Starter 29€, Plan Pro 79€, essai 7 jours..."
            className="mt-4 min-h-[220px] w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-indigo-400"
          />

          <input
            type="text"
            value={cta}
            onChange={(event) => setCta(event.target.value)}
            placeholder="Ex: Demarrer l'essai gratuit"
            className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-indigo-400"
          />

          <button
            onClick={() => setAnalyzed(true)}
            className="mt-4 px-5 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            Analyser ma page pricing
          </button>
        </div>

        {analyzed && checks && (
          <div className="mt-6 grid gap-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-300">Score global</p>
                <span className="rounded-full border border-indigo-300/30 bg-indigo-500/15 px-3 py-1 text-sm text-indigo-100">
                  {score}/100 - {scoreLabel(score)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold">Details clairs</h3>
              <div className="mt-3 space-y-3">
                {checks.map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-100">{item.label}</p>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] uppercase ${
                          item.ok
                            ? "bg-emerald-500/15 text-emerald-200"
                            : "bg-amber-500/15 text-amber-200"
                        }`}
                      >
                        {item.ok ? "OK" : "A corriger"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">Pourquoi: {item.why}</p>
                    {!item.ok && <p className="mt-1 text-xs text-amber-200">Action: {item.fix}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
