"use client";

import { motion, Variants } from "framer-motion";
import { useState } from "react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function Home() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">

      {/* HERO */}
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto px-6 pt-28 pb-24 text-center"
      >
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          Surveille tes concurrents{" "}
          <span className="text-indigo-400">sans lever le petit doigt</span>
        </h1>

        <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">
          ChronoCrawl détecte automatiquement les changements sur les sites
          concurrents et t’alerte dès qu’une page évolue.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <a href="#acces">
            <button className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium">
              Demander un accès
            </button>
          </a>
          <a href="#fonctionnement">
            <button className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition">
              Voir comment ça marche
            </button>
          </a>
        </div>
      </motion.section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Détection intelligente",
            text: "Analyse uniquement les vrais changements de contenu, sans faux positifs.",
          },
          {
            title: "Alertes instantanées",
            text: "Email dès qu’un concurrent modifie une page stratégique.",
          },
          {
            title: "Pensé pour la veille pro",
            text: "SaaS, e-commerce, SEO, pricing, pages clés.",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className="rounded-xl bg-white/5 border border-white/10 p-6"
          >
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-300 text-sm">{item.text}</p>
          </motion.div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section
        id="fonctionnement"
        className="max-w-6xl mx-auto px-6 pb-24"
      >
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          Comment fonctionne ChronoCrawl
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Ajoute les URLs",
              text: "Indique les pages concurrentes que tu veux surveiller.",
            },
            {
              step: "02",
              title: "ChronoCrawl surveille",
              text: "Le moteur analyse les changements en continu.",
            },
            {
              step: "03",
              title: "Reçois une alerte",
              text: "Tu es notifié dès qu’un changement est détecté.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="rounded-xl bg-white/5 border border-white/10 p-6"
            >
              <span className="text-indigo-400 text-sm font-medium">
                {item.step}
              </span>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-gray-300 text-sm">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FORM */}
      <section
        id="acces"
        className="max-w-xl mx-auto px-6 pb-32 text-center"
      >
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold mb-4"
        >
          Accès anticipé
        </motion.h2>

        <p className="text-gray-300 mb-8">
          Laisse ton email pour être prévenu dès l’ouverture.
        </p>

        {!submitted ? (
          <form
            name="early-access"
            method="POST"
            data-netlify="true"
            onSubmit={() => setSubmitted(true)}
            className="flex flex-col sm:flex-row gap-4"
          >
            <input type="hidden" name="form-name" value="early-access" />

            <input
              type="email"
              name="email"
              required
              placeholder="ton@email.com"
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
            />

            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
            >
              Être notifié
            </button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-green-400 font-medium"
          >
            ✅ Merci ! Ton accès est enregistré.
          </motion.div>
        )}
      </section>
    </main>
  );
}