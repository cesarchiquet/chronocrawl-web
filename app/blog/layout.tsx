import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides et analyses ChronoCrawl pour surveiller des concurrents, lire les changements SEO, CTA et pricing, et structurer une veille concurrentielle utile.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
