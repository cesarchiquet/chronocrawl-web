import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CGU",
  description: "Consulte les conditions générales d’utilisation de ChronoCrawl.",
  alternates: {
    canonical: "/cgu",
  },
};

export default function CguLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
