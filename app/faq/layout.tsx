import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "FAQ complète de ChronoCrawl : fonctionnement, alertes, faux positifs, plans et sécurité.",
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
