import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Démo",
  description:
    "Démo ChronoCrawl : exemple concret de détection de changement priorisée.",
  alternates: {
    canonical: "/demo",
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
