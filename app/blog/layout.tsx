import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides simples de veille concurrentielle pour surveiller un site concurrent et recevoir des alertes de changement.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
