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
      </section>
    </PublicChrome>
  );
}
