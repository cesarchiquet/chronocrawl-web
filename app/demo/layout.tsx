import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo",
  description:
    "Demo ChronoCrawl: exemple concret d'une detection de changement priorisee.",
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
