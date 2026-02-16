import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

const useCases = [
  {
    title: "SaaS B2B",
    problem: "Surveiller evolutions pricing, positioning et landing pages concurrentes.",
    setup: "10 a 30 URLs critiques: pricing, features, homepage, compare pages.",
    result: "Alertes prioritaires exploitables en quelques minutes par semaine.",
  },
  {
    title: "E-commerce",
    problem: "Detecter rapidement promotions, changements de prix et CTA concurrents.",
    setup: "Suivi categories produits, fiches best sellers et page panier.",
    result: "Reaction commerciale plus rapide sur les offres cle.",
  },
  {
    title: "Agence marketing",
    problem: "Suivre plusieurs clients sans bruit et sans controle manuel quotidien.",
    setup: "Segmentation par client + exports CSV + historique detaille.",
    result: "Reporting plus clair et decisions plus defendables en rendez-vous client.",
  },
  {
    title: "Equipe SEO",
    problem: "Suivre title, meta, H1, canonical et signaux de contenu.",
    setup: "Focus sur pages transactionnelles et pages SEO a fort trafic.",
    result: "Detection rapide des mouvements SEO concurrentiels significatifs.",
  },
];

export default function CasUsagePage() {
  return (
    <PublicChrome>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="mb-8 rounded-xl border border-indigo-300/25 bg-indigo-500/10 p-4">
          <p className="text-xs uppercase text-indigo-200">Parcours 90 sec - Etape 2/3</p>
          <p className="mt-1 text-sm text-indigo-100">
            Selectionne ton cas, puis passe au dashboard pour activer ta surveillance.
          </p>
          <Link
            href="/dashboard"
            className="mt-3 inline-flex rounded-md border border-indigo-300/40 px-3 py-2 text-xs text-indigo-100 hover:bg-indigo-500/20 transition"
          >
            Aller a l&apos;etape 3
          </Link>
        </div>
        <p className="text-sm text-indigo-300 font-medium">Cas d&apos;usage</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold">
          Pour qui ChronoCrawl cree le plus de valeur
        </h1>
        <p className="mt-5 text-gray-300 max-w-3xl">
          Chaque scenario ci-dessous suit la meme logique: probleme concret,
          setup de surveillance, puis resultat exploitable en decision.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {useCases.map((item) => (
            <article key={item.title} className="rounded-xl bg-white/5 border border-white/10 p-6">
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
            href="/demo"
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition font-medium"
          >
            Voir la demo
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            Creer un compte
          </Link>
        </div>
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-gray-100">Etat vide classique: je ne sais pas par quoi commencer.</p>
          <p className="mt-1 text-xs text-gray-300">
            Regle simple: commence par 3 URLs critiques (pricing, homepage, page produit phare), puis lance une analyse.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="rounded-md bg-indigo-500 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-400 transition"
            >
              Ajouter mes 3 URLs
            </Link>
            <Link
              href="/faq"
              className="rounded-md border border-white/20 px-3 py-2 text-xs text-gray-200 hover:bg-white/5 transition"
            >
              Lire la FAQ
            </Link>
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
