import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cas d’usage ChronoCrawl",
  description:
    "Découvre les cas d’usage ChronoCrawl pour les SaaS, l’e-commerce, les agences et les équipes marketing qui veulent une veille concurrentielle claire et actionnable.",
  alternates: {
    canonical: "/cas-d-usage",
  },
};

export default function CasUsageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
