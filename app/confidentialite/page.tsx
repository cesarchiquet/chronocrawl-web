"use client";

import PublicChrome from "@/components/PublicChrome";

export default function ConfidentialitePage() {
  return (
    <PublicChrome>
      <section className="mx-auto w-full max-w-4xl px-6 pt-16 pb-24">
        <h1 className="text-3xl md:text-4xl font-bold">Politique de confidentialite</h1>
        <div className="mt-8 space-y-6 text-sm text-gray-300">
          <p>
            ChronoCrawl collecte uniquement les donnees necessaires au service:
            email de compte, URLs surveillees, evenements detectes et metadonnees
            techniques associees.
          </p>
          <p>
            Les donnees ne sont pas revendues. Elles sont utilisees pour fournir
            le dashboard, les alertes email et la facturation.
          </p>
          <p>
            Tu peux demander la suppression de ton compte et de tes donnees via{" "}
            <a className="text-indigo-300 underline" href="mailto:hello@chronocrawl.com">
              hello@chronocrawl.com
            </a>
            .
          </p>
          <p>
            Les paiements sont traites par Stripe. ChronoCrawl ne stocke pas les
            numeros complets de carte bancaire.
          </p>
        </div>
      </section>
    </PublicChrome>
  );
}
