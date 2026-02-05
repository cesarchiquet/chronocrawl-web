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

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-6 pt-28 pb-24 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          Contact ChronoCrawl
        </h1>
        <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">
          Une question sur la veille concurrentielle, les alertes ou le
          fonctionnement ? Écris‑nous et on te répond rapidement.
        </p>

        <div className="mt-10">
          <a
            href="mailto:hello@chronocrawl.com?subject=Contact%20ChronoCrawl"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            hello@chronocrawl.com
          </a>
        </div>
      </motion.section>
    </main>
  );
}
