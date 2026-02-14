"use client";

import Link from "next/link";

type PublicChromeProps = {
  children: React.ReactNode;
};

export default function PublicChrome({ children }: PublicChromeProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#060a1bcc]/90 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="text-sm font-semibold tracking-wide text-indigo-200">
            ChronoCrawl
          </Link>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Link href="/fonctionnement" className="rounded-md px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white">
              Fonctionnement
            </Link>
            <Link href="/blog" className="rounded-md px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white">
              Blog
            </Link>
            <Link href="/contact" className="rounded-md px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white">
              Contact
            </Link>
            <Link href="/login" className="rounded-md px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white">
              Connexion
            </Link>
            <Link href="/signup" className="rounded-md bg-indigo-500 px-3 py-2 font-medium text-white hover:bg-indigo-400">
              Commencer
            </Link>
          </div>
        </nav>
      </header>
      {children}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-6 text-xs text-gray-400">
          <p>© 2026 ChronoCrawl</p>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hover:text-gray-200">
              Dashboard
            </Link>
            <Link href="/blog" className="hover:text-gray-200">
              Guides
            </Link>
            <Link href="/mentions-legales" className="hover:text-gray-200">
              Mentions legales
            </Link>
            <Link href="/confidentialite" className="hover:text-gray-200">
              Confidentialite
            </Link>
            <Link href="/cgu" className="hover:text-gray-200">
              CGU
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
