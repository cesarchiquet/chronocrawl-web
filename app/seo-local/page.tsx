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
          Veille SEO locale pour agences et TPE
        </h1>
        <p className="mt-5 text-gray-300 max-w-3xl">
          Surveille les pages locales critiques, detecte les changements SEO
          importants et transforme-les en actions claires pour tes clients.
        </p>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <article className="rounded-xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-lg font-semibold">Setup simple</h2>
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
