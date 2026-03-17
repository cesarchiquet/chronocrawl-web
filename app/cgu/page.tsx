"use client";

import PublicChrome from "@/components/PublicChrome";

export default function CguPage() {
  return (
    <PublicChrome>
      <section className="mx-auto w-full max-w-4xl px-6 pt-16 pb-24">
        <h1 className="text-3xl md:text-4xl font-bold">Conditions générales d&apos;utilisation</h1>
        <div className="mt-8 space-y-6 text-sm text-gray-300">
          <p>
            L&apos;utilisateur est responsable des URLs ajoutées dans ChronoCrawl
            et de la conformité de leur surveillance avec les règles applicables
            (droits d&apos;auteur, conditions d&apos;acces, politiques robots, etc.).
          </p>
          <p>
            ChronoCrawl fournit une obligation de moyens : la détection peut être
            impactée par des blocages tiers, des modifications techniques ou des
            indisponibilités de services externes.
          </p>
          <p>
            L&apos;accès au service peut être suspendu en cas d&apos;usage abusif,
            tentative de contournement des limites du plan ou activité illégale.
          </p>
          <p>
            Les modalités de facturation, de renouvellement et d&apos;annulation sont
            gérées via Stripe et visibles dans le portail client.
          </p>
        </div>
      </section>
    </PublicChrome>
  );
}
