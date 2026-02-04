import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  metadataBase: new URL("https://chronocrawl.com"),

  title: {
    default: "Surveiller un site concurrent | ChronoCrawl",
    template: "%s | ChronoCrawl",
  },

  description:
    "Surveille les sites concurrents automatiquement. ChronoCrawl détecte les changements et t’envoie des alertes instantanées. Veille concurrentielle simple et rapide.",

  openGraph: {
    title: "Surveiller un site concurrent | ChronoCrawl",
    description:
      "Surveille les sites concurrents automatiquement. ChronoCrawl détecte les changements et t’envoie des alertes instantanées. Veille concurrentielle simple et rapide.",
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
    title: "Surveiller un site concurrent | ChronoCrawl",
    description:
      "Surveille les sites concurrents automatiquement. ChronoCrawl détecte les changements et t’envoie des alertes instantanées. Veille concurrentielle simple et rapide.",
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
