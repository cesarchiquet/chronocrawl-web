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
            Hebergement et services tiers: Supabase (donnees + auth), Stripe
            (paiements), Resend (emails transactionnels).
          </p>
          <p>
            Pour toute demande legale ou signalement, utilise l&apos;adresse
            ci-dessus avec un objet explicite.
          </p>
          <p>
            Donnees personnelles: pour les details de traitement, consulte la{" "}
            <a className="text-indigo-300 underline" href="/confidentialite">
              Politique de confidentialite
            </a>
            . Les demandes RGPD peuvent etre exercees depuis le dashboard
            (export/suppression) ou par email.
          </p>
        </div>
      </section>
    </PublicChrome>
  );
}
