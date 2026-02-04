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

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto px-6 pt-28 pb-24"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-center">Blog</h1>
        <p className="mt-6 text-lg text-gray-300 text-center max-w-2xl mx-auto">
          Guides simples pour améliorer ta veille concurrentielle et surveiller
          un site concurrent efficacement.
        </p>

        <div className="mt-12 grid gap-6">
          <a
            href="/blog/guide-surveiller-site-concurrent"
            className="block rounded-xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition"
          >
            <h2 className="text-xl font-semibold mb-2">
              Comment surveiller un site concurrent (guide simple)
            </h2>
            <p className="text-gray-300 text-sm">
              Les étapes clés pour détecter les changements, recevoir des
              alertes et garder un avantage concurrentiel.
            </p>
          </a>
        </div>
      </motion.section>
    </main>
  );
}
