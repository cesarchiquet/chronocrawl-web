import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ ChronoCrawl",
  description:
    "Retrouve les réponses aux questions fréquentes sur ChronoCrawl : alertes, scans, audit SEO, plans, faux positifs et sécurité.",
  alternates: {
    canonical: "/faq",
  },
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
