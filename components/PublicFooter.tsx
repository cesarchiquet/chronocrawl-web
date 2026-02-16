import Link from "next/link";

export default function PublicFooter() {
  return (
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
  );
}
