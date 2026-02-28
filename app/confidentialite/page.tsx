"use client";

import PublicChrome from "@/components/PublicChrome";

export default function ConfidentialitePage() {
  return (
    <PublicChrome>
      <section className="mx-auto w-full max-w-4xl px-6 pt-16 pb-24">
        <h1 className="text-3xl md:text-4xl font-bold">Politique de confidentialite</h1>
        <div className="mt-8 space-y-6 text-sm text-gray-300">
          <p>
            Cette page explique comment ChronoCrawl traite les donnees
            personnelles conformement au RGPD.
          </p>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">
              1) Donnees traitees
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Compte: email, identifiant utilisateur, dates de connexion.</li>
              <li>Produit: URLs surveillees, snapshots, changements detectes, logs d&apos;analyse.</li>
              <li>Facturation: identifiants Stripe (pas de numero de carte stocke dans ChronoCrawl).</li>
              <li>Communication: preferences d&apos;alertes email (mode, seuil, heure digest).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">
              2) Finalites et base legale
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Execution du service de veille: execution du contrat.</li>
              <li>Facturation et gestion d&apos;abonnement: execution du contrat / obligations legales.</li>
              <li>Securite, anti-abus, supervision technique: interet legitime.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">
              3) Duree de conservation
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Donnees produit: conservees tant que le compte est actif.</li>
              <li>Compte supprime: suppression des donnees liees via suppression du compte.</li>
              <li>Donnees de facturation: conservation selon obligations comptables applicables.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">
              4) Sous-traitants
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Supabase: base de donnees, authentification.</li>
              <li>Stripe: paiements et abonnements.</li>
              <li>Resend: emails transactionnels et digest.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">
              5) Tes droits
            </h2>
            <p>
              Depuis le dashboard, tu peux exporter tes donnees (JSON) et
              supprimer ton compte. Tu peux aussi contacter{" "}
              <a className="text-indigo-300 underline" href="mailto:hello@chronocrawl.com">
                hello@chronocrawl.com
              </a>{" "}
              pour toute demande d&apos;acces, rectification ou opposition.
            </p>
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
