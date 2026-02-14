"use client";

import PublicChrome from "@/components/PublicChrome";

export default function CguPage() {
  return (
    <PublicChrome>
      <section className="mx-auto w-full max-w-4xl px-6 pt-16 pb-24">
        <h1 className="text-3xl md:text-4xl font-bold">Conditions generales d&apos;utilisation</h1>
        <div className="mt-8 space-y-6 text-sm text-gray-300">
          <p>
            L&apos;utilisateur est responsable des URLs ajoutees dans ChronoCrawl
            et de la conformite de leur surveillance avec les regles applicables
            (droits d&apos;auteur, conditions d&apos;acces, politiques robots, etc.).
          </p>
          <p>
            ChronoCrawl fournit une obligation de moyens: la detection peut etre
            impactee par des blocages tiers, des modifications techniques ou des
            indisponibilites de services externes.
          </p>
          <p>
            L&apos;acces au service peut etre suspendu en cas d&apos;usage abusif,
            tentative de contournement des limites plan ou activite illegale.
          </p>
          <p>
            Les modalites de facturation, renouvellement et annulation sont
            gerees via Stripe et visibles dans le portail client.
          </p>
        </div>
      </section>
    </PublicChrome>
  );
}
