import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacter ChronoCrawl",
  description:
    "Contacte ChronoCrawl pour une question produit, un besoin commercial ou un échange autour de ta veille concurrentielle.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
