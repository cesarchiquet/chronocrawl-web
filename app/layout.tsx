import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});
const geistMono = GeistMono;
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "https://chronocrawl.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Surveiller un site concurrent | ChronoCrawl",
    template: "%s | ChronoCrawl",
  },

  description:
    "Surveille les sites concurrents automatiquement. ChronoCrawl détecte les changements et t’envoie des alertes instantanées. Veille concurrentielle simple et rapide.",
  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Que surveille ChronoCrawl ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Les pages que tu choisis : pages concurrentes, pricing, landing pages, pages produits et contenus SEO.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Comment fonctionne l’alerte changement site web ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Dès qu’un changement est détecté, tu reçois une notification par email avec un lien direct.",
                  },
                },
                {
                  "@type": "Question",
                  name: "À qui s’adresse l’outil ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "SaaS, e‑commerce, agences et équipes marketing qui veulent une veille concurrentielle simple et fiable.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Faut‑il installer quelque chose ?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Non, ChronoCrawl est un service SaaS : tu ajoutes tes URLs et la surveillance démarre.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${manrope.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
