"use client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function FonctionnementPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-6 pt-28 pb-24"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Comment fonctionne ChronoCrawl
        </h1>
        <p className="mt-6 text-lg text-gray-300 text-center max-w-2xl mx-auto">
          ChronoCrawl est un outil de veille concurrentielle qui surveille un
          site concurrent, détecte les changements et t’envoie une alerte
          changement site web en quelques minutes.
        </p>

        <div className="mt-12 space-y-8">
          {[
            {
              title: "1. Ajoute les URLs à surveiller",
              text: "Tu choisis les pages concurrentes importantes : landing pages, pricing, pages produits ou contenus SEO.",
            },
            {
              title: "2. ChronoCrawl analyse les changements",
              text: "Le moteur compare les pages et détecte uniquement les vrais changements de contenu, pour éviter les faux positifs.",
            },
            {
              title: "3. Reçois une alerte en temps réel",
              text: "Dès qu’un changement est détecté, tu reçois une notification claire pour agir rapidement.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl bg-white/5 border border-white/10 p-6"
            >
              <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
              <p className="text-gray-300 text-sm">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="mailto:hello@chronocrawl.com?subject=Contact%20ChronoCrawl"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            Contacter l’équipe
          </a>
        </div>
      </motion.section>
    </main>
  );
}
