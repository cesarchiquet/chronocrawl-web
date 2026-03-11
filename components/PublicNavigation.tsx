"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import DashboardDesktopNotice from "@/components/DashboardDesktopNotice";

type PublicNavigationProps = {
  session?: Session | null;
  onOpenBillingPortal?: () => void;
  onSignOut?: () => void;
};

const links = [
  { href: "/fonctionnement", label: "Produit" },
  { href: "/cas-d-usage", label: "Cas d'usage" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

const sectionLabels: Record<string, string> = {
  "/": "Produit",
  "/fonctionnement": "Produit",
  "/cas-d-usage": "Cas d'usage",
  "/tarifs": "Tarifs",
  "/faq": "FAQ",
  "/blog": "Blog",
  "/contact": "Contact",
  "/login": "Connexion",
  "/signup": "Essai gratuit",
};

export default function PublicNavigation({
  session,
  onOpenBillingPortal,
  onSignOut,
}: PublicNavigationProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showDashboardMobileNotice, setShowDashboardMobileNotice] =
    useState(false);

  const isActive = (href: string) => {
    const cleanHref = href.split("?")[0];
    return pathname === cleanHref;
  };

  const currentSectionLabel = sectionLabels[pathname];

  return (
    <header className="sticky top-4 z-40 px-4">
      <nav className="mx-auto flex w-full max-w-[1320px] items-center justify-between rounded-full border border-white/10 bg-[#050505d9] px-5 py-3 shadow-[0_14px_44px_rgba(0,0,0,0.42)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-lg font-semibold tracking-[-0.04em] text-white transition hover:text-white/82"
          >
            ChronoCrawl
          </Link>
          {pathname !== "/" && currentSectionLabel ? (
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-white/62">
              {currentSectionLabel}
            </span>
          ) : null}
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-sm">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 transition ${
                  isActive(item.href)
                  ? "bg-white text-black border border-white"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full border border-white bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/85"
              >
                Dashboard
              </Link>
              <button
                onClick={onOpenBillingPortal}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                Abonnement
              </button>
              <button
                onClick={onSignOut}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-white bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/85"
              >
                Créer un compte
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((value) => !value)}
          className="md:hidden rounded-full border border-white/15 px-3 py-1.5 text-sm text-gray-200 hover:bg-white/5"
          aria-label="Menu"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </nav>

      {mobileOpen && (
        <div className="mx-auto mt-3 max-w-[1320px] rounded-[28px] border border-white/10 bg-[#050505f2] p-4 shadow-[0_14px_44px_rgba(0,0,0,0.42)] backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                    isActive(item.href)
                    ? "bg-white text-black border border-white"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-1 flex flex-col gap-2 border-t border-white/10 pt-3">
              {session ? (
                <>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setShowDashboardMobileNotice(true);
                    }}
                    className="rounded-full border border-white bg-white px-4 py-2 text-center text-sm font-medium text-black hover:bg-white/85"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      onOpenBillingPortal?.();
                    }}
                    className="rounded-full border border-white/10 px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    Gérer l&apos;abonnement
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      onSignOut?.();
                    }}
                    className="rounded-full border border-white/10 px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full border border-white/10 px-4 py-2 text-center text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full border border-white bg-white px-4 py-2 text-center text-sm font-medium text-black hover:bg-white/85"
                  >
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showDashboardMobileNotice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm md:hidden">
          <DashboardDesktopNotice
            compact
            onClose={() => setShowDashboardMobileNotice(false)}
          />
        </div>
      ) : null}
    </header>
  );
}
