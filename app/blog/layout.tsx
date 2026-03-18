import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog ChronoCrawl",
  description:
    "Lis les guides ChronoCrawl pour surveiller un site concurrent, comprendre les changements SEO, CTA et pricing, et structurer une veille concurrentielle plus utile.",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
