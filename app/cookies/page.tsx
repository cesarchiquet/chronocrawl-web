"use client";

import PublicChrome from "@/components/PublicChrome";

export default function CookiesPage() {
  return (
    <PublicChrome>
      <section className="mx-auto w-full max-w-4xl px-6 pt-16 pb-24">
        <h1 className="text-3xl md:text-4xl font-bold">Politique de cookies</h1>
        <div className="mt-8 space-y-6 text-sm text-gray-300">
          <p>
            Cette page explique comment ChronoCrawl utilise des cookies et des traceurs similaires sur le site.
          </p>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">1) Cookies essentiels</h2>
            <p>
              ChronoCrawl utilise des cookies strictement nécessaires au fonctionnement du service :
              authentification, sécurité, et maintien de session. Sans eux, certaines fonctionnalités ne
              fonctionneraient pas correctement.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">2) Cookies de mesure</h2>
            <p>
              Nous ne déployons pas de cookies publicitaires. Si des cookies de mesure sont activés dans le
              futur, cette page sera mise à jour pour en préciser la finalité et les options de désactivation.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">3) Gestion des préférences</h2>
            <p>
              Tu peux accepter ou refuser les cookies non essentiels via la bannière de consentement. Les cookies
              essentiels restent nécessaires pour le bon fonctionnement du service.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-100 mb-2">4) Contact</h2>
            <p>
              Pour toute question liée aux cookies ou à la confidentialité, écris à
              <a className="text-indigo-300 underline ml-1" href="mailto:hello@chronocrawl.com">
                hello@chronocrawl.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
