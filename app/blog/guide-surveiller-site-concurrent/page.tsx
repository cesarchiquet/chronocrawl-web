"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import PublicChrome from "@/components/PublicChrome";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function GuideSurveillerSiteConcurrent() {
  return (
    <PublicChrome>
      <motion.article
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mx-auto px-6 pt-16 pb-24"
      >
        <p className="text-sm text-indigo-300 font-medium">Guide</p>
        <h1 className="text-4xl md:text-5xl font-bold mt-2">
          Comment surveiller un site concurrent (guide simple)
        </h1>
        <p className="mt-6 text-lg text-gray-300">
          Surveiller un site concurrent permet de repérer rapidement les
          changements de prix, d’offre ou de positionnement. Voici un guide
          simple pour mettre en place une veille concurrentielle efficace et
          recevoir une alerte changement site web dès qu’une page évolue.
        </p>

        <div className="mt-10 space-y-8">
          <section className="rounded-xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-2">
              1. Choisir les pages à surveiller
            </h2>
            <p className="text-gray-300 text-sm">
              Commence par sélectionner les pages clés : page d’accueil, pricing,
              pages produits, landing pages et contenus SEO importants. Moins il
              y a d’URLs, plus la surveillance est précise.
            </p>
          </section>

          <section className="rounded-xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-2">
              2. Définir la fréquence de suivi
            </h2>
            <p className="text-gray-300 text-sm">
              Une surveillance quotidienne suffit dans la plupart des cas. Pour
              le pricing ou des pages stratégiques, une fréquence plus élevée
              peut être utile.
            </p>
          </section>

          <section className="rounded-xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-2">
              3. Détecter les vrais changements
            </h2>
            <p className="text-gray-300 text-sm">
              L’objectif est d’ignorer les micro‑variations (date, tracking) et
              de ne garder que les changements de contenu. C’est là que la
              qualité de l’outil fait la différence.
            </p>
          </section>

          <section className="rounded-xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-2">
              4. Recevoir une alerte changement site web
            </h2>
            <p className="text-gray-300 text-sm">
              Quand une page concurrente change, une alerte rapide te permet de
              réagir immédiatement : ajuster ton pricing, ton message ou ta
              stratégie marketing.
            </p>
          </section>

          <section className="rounded-xl bg-white/5 border border-white/10 p-6">
            <h2 className="text-xl font-semibold mb-2">
              5. Automatiser ta veille concurrentielle
            </h2>
            <p className="text-gray-300 text-sm">
              Pour gagner du temps, utilise un outil dédié qui surveille un site
              concurrent automatiquement et t’envoie les changements sans effort.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-300 mb-4">
            Envie de mettre ça en place facilement ?
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white bg-white text-black hover:bg-white/85 transition font-medium"
          >
            Créer un compte ChronoCrawl
          </Link>
        </div>
      </motion.article>
    </PublicChrome>
  );
}
