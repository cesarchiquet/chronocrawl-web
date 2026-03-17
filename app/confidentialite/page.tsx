"use client";

import PublicChrome from "@/components/PublicChrome";

export default function ConfidentialitePage() {
  return (
    <PublicChrome>
      <section className="mx-auto w-full max-w-4xl px-6 pt-16 pb-24">
        <h1 className="text-3xl md:text-4xl font-bold">Politique de confidentialité</h1>
        <div className="mt-8 space-y-6 text-sm text-gray-300">
          <p>
            Cette page explique comment ChronoCrawl traite les données
            personnelles conformément au RGPD.
          </p>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">
              1) Données traitées
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Compte: email, identifiant utilisateur, dates de connexion.</li>
              <li>Produit : URLs surveillées, snapshots, changements détectés, logs d&apos;analyse.</li>
              <li>Facturation : identifiants Stripe (pas de numéro de carte stocké dans ChronoCrawl).</li>
              <li>Communication : préférences d&apos;alertes email (mode, seuil, heure digest).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">
              2) Finalités et base légale
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Exécution du service de veille : exécution du contrat.</li>
              <li>Facturation et gestion d&apos;abonnement : exécution du contrat / obligations légales.</li>
              <li>Sécurité, anti-abus, supervision technique : intérêt légitime.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">
              3) Durée de conservation
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Données produit : conservées tant que le compte est actif.</li>
              <li>Compte supprimé : suppression des données liées via suppression du compte.</li>
              <li>Données de facturation : conservation selon les obligations comptables applicables.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">
              4) Sous-traitants
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Supabase : base de données, authentification.</li>
              <li>Stripe: paiements et abonnements.</li>
              <li>Resend: emails transactionnels et digest.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">
              5) Tes droits
            </h2>
            <p>
              Depuis le dashboard, tu peux exporter tes données (JSON) et
              supprimer ton compte. Tu peux aussi contacter{" "}
              <a className="text-indigo-300 underline" href="mailto:hello@chronocrawl.com">
                hello@chronocrawl.com
              </a>{" "}
              pour toute demande d&apos;accès, rectification ou opposition.
            </p>
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
