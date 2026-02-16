import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

export default function DemoPage() {
  return (
    <PublicChrome>
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="mb-8 rounded-xl border border-indigo-300/25 bg-indigo-500/10 p-4">
          <p className="text-xs uppercase text-indigo-200">Parcours 90 sec - Etape 1/3</p>
          <p className="mt-1 text-sm text-indigo-100">
            Ici tu vois exactement le format d&apos;une alerte exploitable.
          </p>
          <Link
            href="/cas-d-usage"
            className="mt-3 inline-flex rounded-md border border-indigo-300/40 px-3 py-2 text-xs text-indigo-100 hover:bg-indigo-500/20 transition"
          >
            Continuer vers l&apos;etape 2
          </Link>
        </div>
        <p className="text-sm text-indigo-300 font-medium">Demo produit</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold">
          A quoi ressemble une alerte utile
        </h1>
        <p className="mt-5 text-gray-300 max-w-3xl">
          Cette demo montre le format attendu d&apos;une alerte: priorite,
          preuve avant/apres, contexte URL et recommandation d&apos;action.
        </p>

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <article className="rounded-2xl border border-indigo-400/30 bg-indigo-500/10 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-red-500/20 text-red-200">
                Impact 92 - Haute
              </span>
              <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-200">
                pricing
              </span>
              <span className="text-[10px] uppercase px-2 py-1 rounded-full bg-amber-500/20 text-amber-200">
                non lu
              </span>
            </div>
            <h2 className="mt-3 text-xl font-semibold">
              [Pricing] Prix modifie sur /pricing
            </h2>
            <p className="mt-2 text-sm text-gray-300 break-all">
              https://example-competitor.com/pricing
            </p>
            <p className="mt-4 text-xs text-gray-400">
              Raison priorite: variation de prix superieure ou egale a 10%.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Preuve avant/apres</h2>
            <div className="mt-4 grid gap-4 text-sm">
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-gray-400 mb-1">Avant</p>
                <p className="text-gray-200">Plan Pro: 49 EUR / mois</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-gray-400 mb-1">Apres</p>
                <p className="text-gray-200">Plan Pro: 59 EUR / mois</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-gray-400 mb-1">Action recommandee</p>
                <p className="text-gray-200">
                  Evaluer l&apos;impact sur votre positionnement prix et ajuster
                  l&apos;argumentaire commercial.
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            Demarrer l&apos;essai
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition font-medium"
          >
            Voir le dashboard
          </Link>
        </div>
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-gray-100">Tu ne sais pas quoi faire ensuite ?</p>
          <p className="mt-1 text-xs text-gray-300">
            Va sur les cas d&apos;usage pour choisir ton scenario, puis passe au dashboard pour lancer ton premier scan.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/cas-d-usage"
              className="rounded-md border border-white/20 px-3 py-2 text-xs text-gray-200 hover:bg-white/5 transition"
            >
              Voir les cas d&apos;usage
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md bg-indigo-500 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-400 transition"
            >
              Ouvrir le dashboard
            </Link>
          </div>
        </div>
      </section>
    </PublicChrome>
  );
}
