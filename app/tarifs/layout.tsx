import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs ChronoCrawl",
  description:
    "Compare les tarifs ChronoCrawl et choisis le bon plan pour surveiller tes concurrents, suivre les changements SEO, CTA et pricing, et recevoir des alertes utiles.",
  alternates: {
    canonical: "/tarifs",
  },
};

export default function TarifsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
