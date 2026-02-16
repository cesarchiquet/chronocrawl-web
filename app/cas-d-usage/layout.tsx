import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cas d'usage",
  description:
    "Cas d'usage ChronoCrawl pour SaaS, e-commerce, agence et equipes marketing.",
};

export default function CasUsageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
