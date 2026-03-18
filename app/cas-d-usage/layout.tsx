import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cas d’usage veille concurrentielle",
  description:
    "Cas d’usage ChronoCrawl pour SaaS, e-commerce, agences et équipes marketing.",
};

export default function CasUsageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
