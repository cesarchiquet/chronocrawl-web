import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialite",
  description: "Politique de confidentialite de ChronoCrawl.",
};

export default function ConfidentialiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
