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

const stats = [
  { label: "URLs surveillées", value: "12" },
  { label: "Changements détectés", value: "5" },
  { label: "Alertes envoyées", value: "8" },
  { label: "Fréquence", value: "Quotidienne" },
];

const monitored = [
  {
    url: "https://exemple.com/pricing",
    lastCheck: "Il y a 2 h",
    status: "Changé",
  },
  {
    url: "https://exemple.com/landing",
    lastCheck: "Il y a 6 h",
    status: "OK",
  },
  {
    url: "https://exemple.com/blog",
    lastCheck: "Hier",
    status: "OK",
  },
];

const changes = [
  {
    url: "https://exemple.com/pricing",
    summary: "Prix modifiés sur l’offre Pro",
    time: "Il y a 2 h",
  },
  {
    url: "https://exemple.com/landing",
    summary: "Nouveau titre de hero",
    time: "Il y a 1 j",
  },
  {
    url: "https://exemple.com/blog",
    summary: "Article ajouté",
    time: "Il y a 2 j",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-6 pt-20 pb-16"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-indigo-300 text-sm font-medium">Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-bold">
              Veille concurrentielle en un coup d’œil
            </h1>
            <p className="mt-3 text-gray-300">
              Suis tes URLs, détecte les changements et reçois des alertes en
              temps réel.
            </p>
          </div>
          <button className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium">
            Ajouter une URL
          </button>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-white/5 border border-white/10 p-5"
            >
              <p className="text-sm text-gray-300">{item.label}</p>
              <p className="text-2xl font-semibold mt-2">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <section className="max-w-6xl mx-auto px-6 pb-16 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">URLs surveillées</h2>
          <div className="space-y-4">
            {monitored.map((item) => (
              <div
                key={item.url}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border border-white/10 p-4"
              >
                <div>
                  <p className="text-sm text-gray-400">{item.url}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Dernière vérification : {item.lastCheck}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full w-fit ${
                    item.status === "Changé"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">Derniers changements</h2>
          <div className="space-y-4">
            {changes.map((item) => (
              <div key={item.url} className="rounded-lg border border-white/10 p-4">
                <p className="text-sm text-gray-400">{item.url}</p>
                <p className="text-sm text-gray-200 mt-2">{item.summary}</p>
                <p className="text-xs text-gray-500 mt-2">{item.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">Ajouter une URL</h2>
          <p className="text-gray-300 text-sm mb-4">
            Bientôt disponible. Tu pourras ajouter des URLs et définir la
            fréquence de surveillance directement ici.
          </p>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="url"
              placeholder="https://site-concurrent.com/pricing"
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
              disabled
            />
            <button
              className="px-6 py-3 rounded-lg bg-indigo-500/60 cursor-not-allowed"
              disabled
            >
              Ajouter
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
