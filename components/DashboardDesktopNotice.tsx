"use client";

import Link from "next/link";

type DashboardDesktopNoticeProps = {
  compact?: boolean;
  onClose?: () => void;
};

export default function DashboardDesktopNotice({
  compact = false,
  onClose,
}: DashboardDesktopNoticeProps) {
  return (
    <div
      className={`cc-shell mx-auto w-full ${
        compact ? "max-w-md rounded-[28px] p-6" : "max-w-lg rounded-[32px] p-8"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-white/58">
        Dashboard
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
        Veuillez utiliser un ordinateur pour accéder au dashboard.
      </h1>
      <p className="mt-3 text-sm leading-7 text-white/70">
        La version mobile du site public reste disponible, mais le dashboard
        ChronoCrawl est réservé à un écran desktop pour garder une lecture claire
        des URLs, alertes et audits SEO.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/"
          className="cc-button-primary rounded-full px-5 py-2.5 text-sm"
          onClick={onClose}
        >
          Revenir à l&apos;accueil
        </Link>
        <Link
          href="/blog"
          className="cc-button-secondary rounded-full px-5 py-2.5 text-sm"
          onClick={onClose}
        >
          Voir le blog
        </Link>
      </div>
      {onClose ? (
        <button
          onClick={onClose}
          className="mt-4 text-xs text-white/55 transition hover:text-white/82"
        >
          Fermer
        </button>
      ) : null}
    </div>
  );
}
