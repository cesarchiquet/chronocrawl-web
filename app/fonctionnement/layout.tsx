import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fonctionnement",
  description:
    "Découvre comment ChronoCrawl surveille un site concurrent et envoie des alertes de changement automatiquement.",
};

export default function FonctionnementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
