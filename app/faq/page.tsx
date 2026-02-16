import PublicChrome from "@/components/PublicChrome";

const items = [
  {
    q: "Que surveille ChronoCrawl exactement ?",
    a: "Les URLs que tu ajoutes: pages pricing, landing pages, contenus SEO ou pages produit.",
  },
  {
    q: "Comment reduisez-vous les faux positifs ?",
    a: "Le moteur compare plusieurs signaux (SEO, pricing, CTA, contenu) et dedoublonne les changements consecutifs.",
  },
  {
    q: "Puis-je filtrer par URL et periode ?",
    a: "Oui. Le centre d'alertes et l'historique permettent le filtrage par URL, etat de lecture, recherche texte et periode.",
  },
  {
    q: "Que signifient les statuts TIMEOUT / DNS_ERROR / HTTP_403 ?",
    a: "Ce sont des causes techniques de scan. Elles sont affichees dans le dashboard avec une recommandation d'action.",
  },
  {
    q: "Comment fonctionnent les limites plan ?",
    a: "Chaque plan definit un nombre max d'URLs et un volume max d'analyses journalieres.",
  },
  {
    q: "Mes donnees sont-elles isolees ?",
    a: "Oui, les donnees sont isolees par utilisateur et protegees par les policies RLS cote base.",
  },
];

export default function FaqPage() {
  return (
    <PublicChrome>
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24">
        <h1 className="text-4xl md:text-5xl font-bold text-center">FAQ complete</h1>
        <p className="mt-5 text-center text-gray-300 max-w-2xl mx-auto">
          La landing contient une version courte. Cette page rassemble la FAQ complete
          pour eviter les ambiguities avant inscription.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {items.map((item) => (
            <article key={item.q} className="rounded-xl bg-white/5 border border-white/10 p-6">
              <h2 className="text-lg font-semibold mb-2">{item.q}</h2>
              <p className="text-sm text-gray-300">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicChrome>
  );
}
