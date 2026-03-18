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
  applicationName: "ChronoCrawl",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/brand-mark.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico"],
    apple: ["/brand-mark.png"],
  },

  title: {
    default: "ChronoCrawl : veille concurrentielle et surveillance de site concurrent",
    template: "%s | ChronoCrawl",
  },

  description:
    "ChronoCrawl surveille les sites concurrents, détecte les changements SEO, CTA et pricing, et t’envoie des alertes utiles dans un dashboard lisible.",
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
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${siteUrl}/#organization`,
                  name: "ChronoCrawl",
                  url: siteUrl,
                  logo: `${siteUrl}/brand-mark.png`,
                  email: "hello@chronocrawl.com",
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}/#website`,
                  url: siteUrl,
                  name: "ChronoCrawl",
                  alternateName: "ChronoCrawl Blog",
                  publisher: {
                    "@id": `${siteUrl}/#organization`,
                  },
                  inLanguage: "fr-FR",
                },
                {
                  "@type": "ItemList",
                  "@id": `${siteUrl}/#navigation`,
                  name: "Navigation principale",
                  itemListElement: [
                    { "@type": "SiteNavigationElement", position: 1, name: "Produit", url: `${siteUrl}/fonctionnement` },
                    { "@type": "SiteNavigationElement", position: 2, name: "Cas d'usage", url: `${siteUrl}/cas-d-usage` },
                    { "@type": "SiteNavigationElement", position: 3, name: "Tarifs", url: `${siteUrl}/tarifs` },
                    { "@type": "SiteNavigationElement", position: 4, name: "FAQ", url: `${siteUrl}/faq` },
                    { "@type": "SiteNavigationElement", position: 5, name: "Blog", url: `${siteUrl}/blog` },
                    { "@type": "SiteNavigationElement", position: 6, name: "Connexion", url: `${siteUrl}/login` },
                    { "@type": "SiteNavigationElement", position: 7, name: "Créer un compte", url: `${siteUrl}/signup` },
                    { "@type": "SiteNavigationElement", position: 8, name: "Contact", url: `${siteUrl}/contact` },
                  ],
                },
                {
                  "@type": "FAQPage",
                  "@id": `${siteUrl}/#faq`,
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
                        text: "SaaS, e-commerce, agences et équipes marketing qui veulent une veille concurrentielle simple et fiable.",
                      },
                    },
                    {
                      "@type": "Question",
                      name: "Faut-il installer quelque chose ?",
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: "Non, ChronoCrawl est un service SaaS : tu ajoutes tes URLs et la surveillance démarre.",
                      },
                    },
                  ],
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
