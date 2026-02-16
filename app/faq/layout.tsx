import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "FAQ complete de ChronoCrawl: fonctionnement, alertes, faux positifs, plans et securite.",
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
