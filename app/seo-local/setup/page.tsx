import Link from "next/link";
import PublicChrome from "@/components/PublicChrome";

const setupSteps = [
  "Choisir la ville et la zone locale a suivre.",
  "Ajouter 5 a 20 mots-cles locaux prioritaires.",
  "Definir les concurrents locaux a monitorer.",
  "Selectionner les pages critiques (service, contact, localisation).",
];

export default function SeoLocalSetupPage() {
  return (
    <PublicChrome>
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24">
        <p className="text-sm text-indigo-300 font-medium">SEO local - Setup</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold">
          Configuration en 4 etapes
        </h1>
        <p className="mt-5 text-gray-300 max-w-3xl">
          Cette page sert de cadrage produit pour la future automatisation SEO
          locale. On garde un flux simple et actionnable pour agences/TPE.
        </p>

        <div className="mt-10 space-y-3">
          {setupSteps.map((step, index) => (
            <div
              key={step}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <p className="text-sm text-gray-200">
                <span className="text-indigo-300 font-medium">
                  Etape {index + 1}:
                </span>{" "}
                {step}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/seo-local/report"
            className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            Continuer vers le rapport
          </Link>
          <Link
            href="/seo-local"
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition font-medium"
          >
            Retour SEO local
          </Link>
        </div>
      </section>
    </PublicChrome>
  );
}
