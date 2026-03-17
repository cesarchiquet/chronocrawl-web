import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CGU",
  description: "Conditions générales d'utilisation de ChronoCrawl.",
};

export default function CguLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
