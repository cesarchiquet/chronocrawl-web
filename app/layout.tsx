import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  metadataBase: new URL("https://chronocrawl.com"),

  title: {
    default: "ChronoCrawl — Surveille tes concurrents automatiquement",
    template: "%s | ChronoCrawl",
  },

  description:
    "ChronoCrawl détecte automatiquement les changements sur les sites concurrents et t’alerte dès qu’une page évolue.",

  openGraph: {
    title: "ChronoCrawl — Surveille tes concurrents automatiquement",
    description:
      "Détecte les changements sur les sites concurrents et reçois une alerte instantanée.",
    url: "https://chronocrawl.com",
    siteName: "ChronoCrawl",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ChronoCrawl – Veille concurrentielle automatisée",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ChronoCrawl — Surveille tes concurrents automatiquement",
    description:
      "ChronoCrawl surveille les sites concurrents et t’alerte dès qu’un changement est détecté.",
    images: ["/og-image.png"],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
