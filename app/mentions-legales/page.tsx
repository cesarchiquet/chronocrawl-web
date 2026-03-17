"use client";

import PublicChrome from "@/components/PublicChrome";

export default function MentionsLegalesPage() {
  return (
    <PublicChrome>
      <section className="mx-auto w-full max-w-4xl px-6 pt-16 pb-24">
        <h1 className="text-3xl md:text-4xl font-bold">Mentions legales</h1>
        <div className="mt-8 space-y-6 text-sm text-gray-300">
          <p>
            Editeur: ChronoCrawl. Contact:{" "}
            <a className="text-indigo-300 underline" href="mailto:hello@chronocrawl.com">
              hello@chronocrawl.com
            </a>
            .
          </p>
          <p>
            Le site et l&apos;application ChronoCrawl ont pour objectif la veille
            concurrentielle et la detection de changements sur des URLs fournies
            par les utilisateurs.
          </p>
          <p>
            Hébergement et services tiers : Supabase (données + auth), Stripe
            (paiements), Resend (emails transactionnels).
          </p>
          <p>
            Pour toute demande légale ou signalement, utilise l&apos;adresse
            ci-dessus avec un objet explicite.
          </p>
          <p>
            Données personnelles : pour les détails de traitement, consulte la{" "}
            <a className="text-indigo-300 underline" href="/confidentialite">
              Politique de confidentialité
            </a>
            . Les demandes RGPD peuvent être exercées depuis le dashboard
            (export/suppression) ou par email.
          </p>
        </div>
      </section>
    </PublicChrome>
  );
}
