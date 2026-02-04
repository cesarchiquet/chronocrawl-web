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
  const [status, setStatus] = useState<
  "idle" | "success" | "exists" | "error"
>("idle");

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
          Surveiller un site concurrent{" "}
          <span className="text-indigo-400">automatiquement</span>
        </h1>

        <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">
          Veille concurrentielle automatisée : ChronoCrawl surveille les sites
          concurrents et t’envoie une alerte changement site web dès qu’une
          page évolue.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <a href="#acces">
            <button className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium">
              Demander un accès
            </button>
          </a>
          <a
            href="mailto:hello@chronocrawl.com?subject=Contact%20ChronoCrawl"
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition"
          >
            Contact
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

        <p className="text-gray-300 text-center max-w-2xl mx-auto mb-10">
          En trois étapes simples, tu mets en place une veille concurrentielle
          efficace : ajoute tes URLs, laisse ChronoCrawl surveiller, puis reçois
          une alerte dès qu’un site concurrent change.
        </p>

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
          Laisse ton email pour être prévenu dès l’ouverture et commencer ta
          veille concurrentielle en premier.
        </p>

        {status === "idle" && (
  <form
    onSubmit={async (e) => {
      e.preventDefault();

      const formData = new FormData(e.currentTarget);
      const email = String(formData.get("email"));

      const res = await fetch("/.netlify/functions/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      let payload: { status?: string } | null = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (res.ok && payload?.status === "success") {
        setStatus("success");
      } else if (res.ok && payload?.status === "exists") {
        setStatus("exists");
      } else {
        setStatus("error");
      }
    }}
    className="flex flex-col sm:flex-row gap-4"
  >
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
)}

{status === "success" && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="mt-6 text-green-400 font-medium"
  >
    ✅ Merci ! Ton accès est enregistré.
  </motion.div>
)}

{status === "exists" && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="mt-6 text-yellow-400 font-medium"
  >
    👀 Cet email est déjà inscrit.
  </motion.div>
)}

{status === "error" && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="mt-6 text-red-400 font-medium"
  >
    ❌ Une erreur est survenue. Réessaie plus tard.
  </motion.div>
)}
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-10"
        >
          FAQ — Veille concurrentielle
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              q: "Que surveille ChronoCrawl ?",
              a: "Les pages que tu choisis : pages concurrentes, pricing, landing pages, pages produits et contenus SEO.",
            },
            {
              q: "Comment fonctionne l’alerte changement site web ?",
              a: "Dès qu’un changement est détecté, tu reçois une notification par email avec un lien direct.",
            },
            {
              q: "À qui s’adresse l’outil ?",
              a: "SaaS, e‑commerce, agences et équipes marketing qui veulent une veille concurrentielle simple et fiable.",
            },
            {
              q: "Faut‑il installer quelque chose ?",
              a: "Non, ChronoCrawl est un service SaaS : tu ajoutes tes URLs et la surveillance démarre.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-xl bg-white/5 border border-white/10 p-6"
            >
              <h3 className="text-lg font-semibold mb-2">{item.q}</h3>
              <p className="text-gray-300 text-sm">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
