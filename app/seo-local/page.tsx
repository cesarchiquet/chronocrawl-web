import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

export default function SeoLocalPage() {
  return (
    <PublicChrome>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <p className="text-sm text-indigo-300 font-medium">
          Produit dedie - SEO local
        </p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold">
          SEO local: plus de demandes locales, moins de perte de visibilite
        </h1>
        <p className="mt-5 text-gray-300 max-w-3xl">
          Cette offre aide a proteger ton trafic local et tes leads entrants.
          Tu detectes les changements importants sur les pages locales et tu
          transformes ces signaux en actions business simples.
        </p>

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Pourquoi c&apos;est rentable</h2>
          <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm text-gray-300">
            <p>
              - Evite les pertes invisibles de leads locaux quand une page
              importante change.
            </p>
            <p>
              - Donne un reporting client rapide pour agences locales (moins de
              temps manuel, plus de valeur percue).
            </p>
            <p>
              - Permet de prioriser les actions SEO qui ont un impact concret sur
              les demandes entrantes.
            </p>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <article className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-5">
            <h3 className="text-lg font-semibold text-emerald-100">
              Pour qui c&apos;est ideal
            </h3>
            <p className="mt-2 text-sm text-emerald-50/90">
              Agences locales, franchises, TPE geo-dependantes (sante, travaux,
              droit, services de proximite).
            </p>
          </article>
          <article className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-5">
            <h3 className="text-lg font-semibold text-amber-100">
              Quand tu peux t&apos;en passer
            </h3>
            <p className="mt-2 text-sm text-amber-50/90">
              Si ton business est 100% national/international sans enjeu local
              fort, la veille concurrentielle classique suffit souvent.
            </p>
          </article>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <article className="rounded-xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold">Setup business simple</h2>
            <p className="mt-2 text-sm text-gray-300">
              Ville cible, mots-cles locaux, concurrents principaux, pages
              critiques.
            </p>
          </article>
          <article className="rounded-xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold">Signaux utiles</h2>
            <p className="mt-2 text-sm text-gray-300">
              Focus title/meta/H1/canonical/robots + priorite et impact
              business.
            </p>
          </article>
          <article className="rounded-xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold">Reporting agence</h2>
            <p className="mt-2 text-sm text-gray-300">
              Vue hebdo prete a partager avec ton client en quelques minutes.
            </p>
          </article>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/seo-local/setup"
            className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            Configurer SEO local
          </Link>
          <Link
            href="/seo-local/report"
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition font-medium"
          >
            Voir un exemple de rapport
          </Link>
        </div>
      </section>
    </PublicChrome>
  );
}
