import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="px-4 py-10 sm:px-6">
      <div className="cc-shell mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 rounded-[32px] px-6 py-5 text-xs text-gray-400">
        <p>© 2026 ChronoCrawl</p>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="transition hover:text-white">
            Dashboard
          </Link>
          <Link href="/blog" className="transition hover:text-white">
            Guides
          </Link>
          <Link href="/mentions-legales" className="transition hover:text-white">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="transition hover:text-white">
            Confidentialité
          </Link>
          <Link href="/cgu" className="transition hover:text-white">
            CGU
          </Link>
        </div>
      </div>
    </footer>
  );
}
