import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité de ChronoCrawl.",
};

export default function ConfidentialiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
