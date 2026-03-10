import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

const useCases = [
  {
    title: "SaaS B2B",
    problem: "Surveiller les évolutions pricing, positioning et landing pages concurrentes.",
    setup: "10 a 30 URLs critiques: pricing, features, homepage, compare pages.",
    result: "Alertes prioritaires exploitables en quelques minutes par semaine.",
  },
  {
    title: "E-commerce",
    problem: "Détectér rapidement promotions, changements de prix et CTA concurrents.",
    setup: "Suivi categories produits, fiches best sellers et page panier.",
    result: "Reaction commerciale plus rapide sur les offres cle.",
  },
  {
    title: "Agence marketing",
    problem: "Suivre plusieurs clients sans bruit et sans contrôle manuel quotidien.",
    setup: "Segmentation par client + exports CSV + historique détaillé.",
    result: "Reporting plus clair et decisions plus défendables en rendez-vous client.",
  },
  {
    title: "Équipe SEO",
    problem: "Suivre title, meta, H1, canonical et signaux de contenu.",
    setup: "Focus sur pages transactionnelles et pages SEO a fort trafic.",
    result: "Detection rapide des mouvements SEO concurrentiels significatifs.",
  },
];

export default function CasUsagePage() {
  return (
    <PublicChrome>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <p className="text-sm font-medium text-white/60">Cas d&apos;usage</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold">
          Pour qui ChronoCrawl crée le plus de valeur
        </h1>
        <p className="mt-5 text-gray-300 max-w-3xl">
          Chaque scénario ci-dessous suit la même logique: problème concret,
          setup de surveillance, puis resultat exploitable en decision.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {useCases.map((item) => (
            <article key={item.title} className="cc-panel-strong cc-hover-lift rounded-[28px] p-6">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="mt-3 text-sm text-gray-300">
                <span className="text-gray-200 font-medium">Probleme:</span>{" "}
                {item.problem}
              </p>
              <p className="mt-2 text-sm text-gray-300">
                <span className="text-gray-200 font-medium">Setup:</span>{" "}
                {item.setup}
              </p>
              <p className="mt-2 text-sm text-gray-300">
                <span className="text-gray-200 font-medium">Resultat:</span>{" "}
                {item.result}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="cc-button-primary rounded-full px-6 py-3 font-medium"
          >
            Créer un compte
          </Link>
          <Link
            href="/dashboard"
            className="cc-button-secondary rounded-full px-6 py-3 font-medium"
          >
            Ouvrir le dashboard
          </Link>
        </div>
        <div className="cc-panel-strong mt-8 rounded-[28px] p-5">
          <p className="text-sm font-medium text-gray-100">Etat vide classique: je ne sais pas par quoi commencer.</p>
          <p className="mt-1 text-xs text-gray-300">
            Regle simple: commence par 3 URLs critiques (pricing, homepage, page produit phare), puis lance une analyse.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="cc-button-primary rounded-full px-4 py-2 text-xs font-medium"
            >
              Ajouter mes 3 URLs
            </Link>
            <Link
              href="/faq"
              className="cc-button-secondary rounded-full px-4 py-2 text-xs"
            >
              Lire la FAQ
            </Link>
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
