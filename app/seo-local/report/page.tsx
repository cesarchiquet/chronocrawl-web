import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

export default function SeoLocalReportPage() {
  return (
    <PublicChrome>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <p className="text-sm text-indigo-300 font-medium">
          SEO local - Rapport
        </p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold">
          Exemple de rapport hebdo local
        </h1>
        <p className="mt-5 text-gray-300 max-w-3xl">
          Une vue executive simple: ce qui a change, l&apos;impact local
          probable et les actions a lancer en priorite.
        </p>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <article className="rounded-xl bg-white/5 border border-white/10 p-6">
            <p className="text-xs text-indigo-200 uppercase">Highlights</p>
            <p className="mt-2 text-2xl font-bold">7 changements</p>
            <p className="mt-2 text-sm text-gray-300">
              2 critiques, 3 moyens, 2 faibles
            </p>
          </article>
          <article className="rounded-xl bg-white/5 border border-white/10 p-6">
            <p className="text-xs text-indigo-200 uppercase">URL la plus active</p>
            <p className="mt-2 text-sm text-gray-200 break-all">
              /services/plombier-lyon
            </p>
            <p className="mt-2 text-sm text-gray-300">
              3 changements SEO en 7 jours
            </p>
          </article>
          <article className="rounded-xl bg-white/5 border border-white/10 p-6">
            <p className="text-xs text-indigo-200 uppercase">Actions recommandees</p>
            <p className="mt-2 text-sm text-gray-300">
              1) Ajuster title/H1 local
            </p>
            <p className="mt-1 text-sm text-gray-300">
              2) Revoir page service principale
            </p>
            <p className="mt-1 text-sm text-gray-300">
              3) Renforcer preuve locale (avis, adresse)
            </p>
          </article>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/seo-local/setup"
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition font-medium"
          >
            Revoir la configuration
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            Ouvrir le dashboard
          </Link>
        </div>
      </section>
    </PublicChrome>
  );
}
