import PublicChrome from "@/components/PublicChrome";

const items = [
  {
    q: "Que surveille ChronoCrawl exactement ?",
    a: "Les URLs que tu ajoutes: pages pricing, landing pages, contenus SEO ou pages produit.",
  },
  {
    q: "Comment réduisez-vous les faux positifs ?",
    a: "Le moteur compare plusieurs signaux (SEO, pricing, CTA, contenu) et dédoublonne les changements consécutifs.",
  },
  {
    q: "Puis-je filtrer par URL et période ?",
    a: "Oui. Le centre d'alertes et l'historique permettent le filtrage par URL, état de lecture, recherche texte et période.",
  },
  {
    q: "Que signifient les statuts TIMEOUT / DNS_ERROR / HTTP_403 ?",
    a: "Ce sont des causes techniques de scan. Elles sont affichées dans le dashboard avec une recommandation d'action.",
  },
  {
    q: "Comment fonctionnent les limites du plan ?",
    a: "Chaque plan définit un nombre maximal d'URLs et un volume maximal d'analyses journalières.",
  },
  {
    q: "Mes données sont-elles isolées ?",
    a: "Oui, les données sont isolées par utilisateur et protégées par les policies RLS côté base.",
  },
];

export default function FaqPage() {
  return (
    <PublicChrome>
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">FAQ complète</h1>
        <p className="mt-5 text-center text-gray-300 max-w-2xl mx-auto">
          La page d&apos;accueil contient une version courte. Cette page rassemble la FAQ complète
          pour éviter les ambiguïtés avant inscription.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {items.map((item) => (
            <article key={item.q} className="cc-panel-strong cc-hover-lift rounded-[28px] p-6">
              <h2 className="text-lg font-semibold mb-2">{item.q}</h2>
              <p className="text-sm text-gray-300">{item.a}</p>
            </article>
          ))}
        </div>
        <div className="cc-panel-strong mt-8 rounded-[28px] p-5">
          <p className="text-sm font-medium text-gray-100">Tu n&apos;as pas trouve ta réponse ?</p>
          <p className="mt-1 text-xs text-gray-300">
            Ouvre directement le dashboard: c&apos;est le chemin le plus rapide pour comprendre le produit.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="/dashboard"
              className="cc-button-secondary rounded-full px-4 py-2 text-xs"
            >
              Ouvrir le dashboard
            </a>
            <a
              href="/contact"
              className="cc-button-primary rounded-full px-4 py-2 text-xs font-medium"
            >
              Contacter l&apos;équipe
            </a>
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
