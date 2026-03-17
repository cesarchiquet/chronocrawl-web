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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-wide text-white">
        Apercu dashboard
      </p>
      <div className="mt-4 min-h-[360px] relative overflow-hidden rounded-xl border border-white/10 bg-[#050505] p-4">
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
                <p className="text-xs font-medium text-gray-200">URLs surveillées</p>
                <div className="mt-2 space-y-2">
                  {[
                    "https://www.concurrent-a.com/pricing",
                    "https://www.concurrent-b.com/offres",
                    "https://www.concurrent-c.com/tarifs",
                  ].map((url) => (
                    <div
                      key={url}
                      className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-[#111111] px-2 py-2 text-[11px] text-gray-300"
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
                  <span className="rounded border border-white/10 bg-white/10 px-2 py-1">2 non lus</span>
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Tout marquer lu</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-gray-300">
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">URL: Toutes les URLs</span>
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Type: SEO</span>
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-1">Période: Tout</span>
                </div>
                <div className="mt-2 rounded-md border border-white/10 bg-white/[0.03] p-2">
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className="rounded border border-white/10 bg-white/10 px-2 py-0.5 text-white">SEO</span>
                    <span className="rounded border border-white/10 bg-white/10 px-2 py-0.5 text-white">HIGH</span>
                    <span className="rounded border border-white/10 bg-white/10 px-2 py-0.5 text-white">PRIORITÉ HAUTE</span>
                    <span className="rounded border border-white/10 bg-white/10 px-2 py-0.5 text-white">NOUVEAU</span>
                  </div>
                  <p className="mt-2 text-[11px] text-gray-200">Title SEO mis à jour sur la page surveillée</p>
                  <p className="mt-1 text-[10px] text-gray-400">Signal structurel pouvant modifier la visibilité de cette page.</p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-gray-300">
                    <span>17/02 3H25</span>
                    <span className="rounded border border-white/10 px-1.5 py-0.5">Voir changement</span>
                    <span className="rounded border border-white/10 px-1.5 py-0.5">Marquer lu</span>
                  </div>
                </div>
              </div>
            )}
            {proofSlides[heroSlideIndex]?.key === "audit" && (
              <div className="min-h-[220px] rounded-lg border border-white/10 bg-[radial-gradient(circle_at_top,_#1a1a1a_0%,_#0a0a0a_42%,_#030303_100%)] p-3">
                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                  <span className="rounded border border-white/10 bg-white/10 px-2 py-0.5 text-white">FICHE CONCURRENTE</span>
                  <span className="rounded border border-white/10 bg-white/10 px-2 py-0.5 text-white">FIABILITE ELEVEE</span>
                  <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-gray-300">76 / 100</span>
                </div>
                <div className="mt-3 rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Lecture executive</p>
                  <p className="mt-1 text-[11px] text-gray-200">
                    Page concurrente exploitable, avec quelques angles faibles clairement identifies.
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                  {[
                    ["Title", "Détecté"],
                    ["Meta", "Détectée"],
                    ["H1", "Détecté"],
                    ["CTA", "6"],
                    ["Pricing", "1"],
                    ["Canonical", "Détectée"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded border border-white/10 bg-white/5 px-2 py-2"
                    >
                      <p className="text-gray-400">{label}</p>
                      <p className="mt-1 text-gray-100">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 rounded-md border border-white/10 bg-black/20 p-2 text-[10px] text-gray-300">
                  Cadre de confiance: HTML public de la page observee, lu comme une restitution concurrente et non comme un audit de ton propre site.
                </div>
              </div>
            )}
            <div className="inline-flex w-fit rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs text-white">
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
