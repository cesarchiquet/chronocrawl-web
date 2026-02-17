"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

type PublicNavigationProps = {
  session?: Session | null;
  onOpenBillingPortal?: () => void;
  onSignOut?: () => void;
};

const links = [
  { href: "/fonctionnement", label: "Produit" },
  { href: "/demo", label: "Premier pas" },
  { href: "/cas-d-usage", label: "Cas d'usage" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function PublicNavigation({
  session,
  onOpenBillingPortal,
  onSignOut,
}: PublicNavigationProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    const cleanHref = href.split("?")[0];
    return pathname === cleanHref;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060a1bcc]/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="text-sm font-semibold tracking-wide text-indigo-200">
          ChronoCrawl
        </Link>

        <div className="hidden md:flex items-center gap-1 text-sm">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 transition ${
                isActive(item.href)
                  ? "bg-indigo-500/20 text-indigo-100 border border-indigo-400/40"
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
                className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400"
              >
                Dashboard
              </Link>
              <button
                onClick={onOpenBillingPortal}
                className="rounded-md px-3 py-2 text-sm text-gray-300 border border-white/15 hover:bg-white/5 hover:text-white"
              >
                Abonnement
              </button>
              <button
                onClick={onSignOut}
                className="rounded-md px-3 py-2 text-sm text-gray-300 border border-white/15 hover:bg-white/5 hover:text-white"
              >
                Deconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm text-gray-300 border border-white/15 hover:bg-white/5 hover:text-white"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400"
              >
                Creer un compte
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((value) => !value)}
          className="md:hidden rounded-md border border-white/15 px-2 py-1 text-sm text-gray-200 hover:bg-white/5"
          aria-label="Menu"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#060a1bf0]">
          <div className="mx-auto max-w-6xl px-5 py-3 flex flex-col gap-2">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-3 py-2 text-sm transition ${
                  isActive(item.href)
                    ? "bg-indigo-500/20 text-indigo-100 border border-indigo-400/40"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-1 flex flex-col gap-2 border-t border-white/10 pt-3">
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 text-center"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      onOpenBillingPortal?.();
                    }}
                    className="rounded-md px-3 py-2 text-sm text-gray-300 border border-white/15 hover:bg-white/5 hover:text-white text-left"
                  >
                    Gerer l&apos;abonnement
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      onSignOut?.();
                    }}
                    className="rounded-md px-3 py-2 text-sm text-gray-300 border border-white/15 hover:bg-white/5 hover:text-white text-left"
                  >
                    Se deconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-sm text-gray-300 border border-white/15 hover:bg-white/5 hover:text-white text-center"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 text-center"
                  >
                    Creer un compte
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
