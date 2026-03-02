"use client";

import Image from "next/image";

type DemoVideoModalProps = {
  isOpen: boolean;
  ctaHref: string;
  onClose: () => void;
};

export default function DemoVideoModal({
  isOpen,
  ctaHref,
  onClose,
}: DemoVideoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Fermer la demo"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-[#070d22] p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-200">
              Demo rapide
            </p>
            <h3 className="mt-1 text-xl font-semibold">
              Video explicative ChronoCrawl
            </h3>
            <p className="mt-1 text-sm text-gray-300">
              Sequence fluide de 18 secondes, sans audio.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-white/15 px-3 py-1 text-sm text-gray-300 hover:bg-white/5"
          >
            Fermer
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b132f] p-4">
          <Image
            src="/demo/chronocrawl-demo.gif"
            alt="Demo ChronoCrawl: ajout URL, analyse, alerte high et action recommandee"
            className="w-full rounded-lg border border-white/10 bg-black/40"
            width={1200}
            height={675}
            unoptimized
            priority
          />
        </div>

        <div className="mt-4 rounded-lg border border-indigo-300/25 bg-indigo-500/10 p-3">
          <p className="text-sm text-indigo-100">
            Sequence attendue: vous ajoutez une URL concurrente, vous cliquez
            sur &quot;Analyser maintenant&quot;, puis vous voyez une alerte HIGH
            et l&apos;action recommandee.
          </p>
        </div>
        <div className="mt-3 flex items-center justify-end">
          <a
            href={ctaHref}
            className="rounded-md border border-white/15 px-3 py-1 text-sm text-gray-300 hover:bg-white/5"
          >
            Tester en live
          </a>
        </div>
      </div>
    </div>
  );
}
