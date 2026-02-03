import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChronoCrawl — Surveille tes concurrents automatiquement",
  description:
    "ChronoCrawl détecte automatiquement les changements sur les sites concurrents et t’alerte dès qu’une page évolue.",

  metadataBase: new URL("https://chronocrawl.com"),

  openGraph: {
    title: "ChronoCrawl — Surveille tes concurrents automatiquement",
    description:
      "Détection intelligente des changements sur les sites concurrents. Reçois une alerte dès qu’une page évolue.",
    url: "https://chronocrawl.com",
    siteName: "ChronoCrawl",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "ChronoCrawl – Surveillance de concurrents",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ChronoCrawl — Surveillance de concurrents",
    description:
      "Détecte automatiquement les changements sur les sites concurrents.",
    images: ["/og.png"],
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