"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Dispatch, SetStateAction } from "react";
import { HERO_SLIDE_DURATION_MS, proofSlides } from "@/features/landing/content";

type HeroDashboardPreviewProps = {
  heroSlideIndex: number;
  setHeroSlideIndex: Dispatch<SetStateAction<number>>;
};

export default function HeroDashboardPreview({
  heroSlideIndex,
  setHeroSlideIndex,
}: HeroDashboardPreviewProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-indigo-200">
        Apercu dashboard
      </p>
      <div className="mt-4 rounded-xl border border-white/10 bg-[#0a1024] p-4 min-h-[360px] relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={heroSlideIndex}
            initial={{ opacity: 0, x: 22, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -22, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.34, ease: "easeOut" }}
            className="absolute inset-0 p-4 flex flex-col"
          >
            {proofSlides[heroSlideIndex]?.key === "urls" && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 h-[210px] overflow-hidden">
                <p className="text-xs font-medium text-gray-200">URLs surveillees</p>
                <div className="mt-2 space-y-2">
                  {[
                    "https://www.concurrent-a.com/pricing",
                    "https://www.concurrent-b.com/offres",
                    "https://www.concurrent-c.com/tarifs",
                  ].map((url) => (
                    <div
                      key={url}
                      className="rounded-md border border-white/10 bg-[#111a35] px-2 py-2 text-[11px] text-gray-300 flex items-center justify-between gap-2"
                    >
                      <span className="truncate">{url}</span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-200">
                        OK
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {proofSlides[heroSlideIndex]?.key === "alerts" && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 min-h-[200px]">
                <p className="text-xs font-medium text-gray-200">Centre d&apos;alertes</p>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-gray-300">
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Historique</span>
                  <span className="rounded border border-indigo-300/30 bg-indigo-500/15 px-2 py-1">0 non lu</span>
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Tout marquer lu</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-gray-300">
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">URL: Toutes les URLs</span>
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Seuil: Tous</span>
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Periode: Tout</span>
                </div>
                <div className="mt-2 rounded-md border border-white/10 bg-[#111a35] p-2">
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-indigo-200">CONTENT</span>
                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-red-200">HIGH</span>
                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-red-200">IMPACT 90 - HAUTE</span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-200">CONFIANCE ELEVEE</span>
                  </div>
                  <p className="mt-2 text-[11px] text-gray-200">[Content] Contenu modifie</p>
                  <p className="mt-1 text-[10px] text-gray-400">Action: Intervention immediate recommandee pour corriger l&apos;impact business.</p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-gray-300">
                    <span>17/02 3H25</span>
                    <span className="rounded border border-white/10 px-1.5 py-0.5">Voir changement</span>
                    <span className="rounded border border-white/10 px-1.5 py-0.5">Marquer non lu</span>
                  </div>
                </div>
              </div>
            )}
            {proofSlides[heroSlideIndex]?.key === "setup" && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 min-h-[200px]">
                <p className="text-xs font-medium text-gray-200">Preferences d&apos;alertes</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-gray-300">
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Mode email: Aucun</span>
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Seuil email: LOW</span>
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Digest: 19</span>
                </div>
                <div className="mt-2 flex gap-2 text-[10px]">
                  <span className="rounded border border-indigo-300/35 bg-indigo-500/15 px-2 py-1 text-indigo-100">Tous</span>
                  <span className="rounded border border-indigo-300/35 bg-indigo-500/15 px-2 py-1 text-indigo-100">LOW</span>
                  <span className="rounded border border-indigo-300/35 bg-indigo-500/15 px-2 py-1 text-indigo-100">MEDIUM</span>
                  <span className="rounded border border-indigo-300/35 bg-indigo-500/15 px-2 py-1 text-indigo-100">HIGH</span>
                </div>
                <div className="mt-2 rounded-md border border-white/10 bg-[#111a35] p-2 text-[11px] text-gray-300">
                  Ajouter une URL
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-gray-400">
                    https://site-concurrent.com/pricing
                  </span>
                  <span className="rounded bg-indigo-500 px-2 py-1 text-[10px] text-white">
                    Ajouter
                  </span>
                </div>
              </div>
            )}
            <div className="inline-flex w-fit rounded-full border border-indigo-300/30 bg-indigo-500/10 px-2 py-1 text-xs text-indigo-200">
              {proofSlides[heroSlideIndex]?.badge}
            </div>
            <h3 className="mt-3 text-base font-semibold leading-snug">
              {proofSlides[heroSlideIndex]?.title}
            </h3>
            <p className="mt-2 text-sm text-gray-300 leading-relaxed">
              {proofSlides[heroSlideIndex]?.detail}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          key={heroSlideIndex}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration: HERO_SLIDE_DURATION_MS / 1000,
            ease: "linear",
          }}
          className="h-full bg-indigo-400/90"
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() =>
            setHeroSlideIndex((value) =>
              value === 0 ? proofSlides.length - 1 : value - 1
            )
          }
          className="rounded-full border border-white/15 px-3 py-1 text-sm text-gray-300 hover:bg-white/5"
        >
          ←
        </button>
        <div className="flex items-center gap-2">
          {proofSlides.map((slide, index) => (
            <button
              key={slide.title}
              onClick={() => setHeroSlideIndex(index)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                heroSlideIndex === index ? "bg-indigo-300" : "bg-white/30"
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() =>
            setHeroSlideIndex((value) => (value + 1) % proofSlides.length)
          }
          className="rounded-full border border-white/15 px-3 py-1 text-sm text-gray-300 hover:bg-white/5"
        >
          →
        </button>
      </div>
    </div>
  );
}
