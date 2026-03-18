import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Produit ChronoCrawl",
  description:
    "Découvre comment ChronoCrawl surveille un site concurrent, détecte les changements SEO, CTA et pricing, et restitue les alertes dans un dashboard lisible.",
  alternates: {
    canonical: "/fonctionnement",
  },
};

export default function FonctionnementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
