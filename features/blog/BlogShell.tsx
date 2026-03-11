import Link from "next/link";
import PublicNavigation from "@/components/PublicNavigation";

export default function BlogShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08)_0%,_rgba(12,12,12,0.96)_16%,_rgba(0,0,0,1)_50%,_rgba(0,0,0,1)_100%)] text-white">
      <PublicNavigation />

      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <div className="cc-shell rounded-[30px]">
          {children}

          <footer className="border-t border-white/8 px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1.4fr_0.9fr_0.9fr]">
              <div className="max-w-xl">
                <p className="text-sm uppercase tracking-[0.18em] text-white/42">
                  Veille concurrentielle
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
                  Un blog construit pour rendre la veille plus lisible et plus exploitable.
                </h2>
                <p className="mt-4 text-sm leading-6 text-white/62 sm:text-base">
                  Guides, lectures SEO, signaux CTA et analyses pricing pour comprendre comment des concurrents bougent en production.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">Produit</p>
                <div className="mt-4 flex flex-col gap-3 text-sm text-white/62">
                  <Link href="/dashboard" className="transition hover:text-white">
                    Surveillance
                  </Link>
                  <Link href="/dashboard/audit-seo" className="transition hover:text-white">
                    Audit SEO
                  </Link>
                  <Link href="/dashboard/alerts" className="transition hover:text-white">
                    Historique alertes
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">Contact</p>
                <div className="mt-4 flex flex-col gap-3 text-sm text-white/62">
                  <a href="mailto:contact@chronocrawl.com" className="transition hover:text-white">
                    contact@chronocrawl.com
                  </a>
                  <Link href="/contact" className="transition hover:text-white">
                    Page contact
                  </Link>
                  <Link href="/faq" className="transition hover:text-white">
                    Questions fréquentes
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}
