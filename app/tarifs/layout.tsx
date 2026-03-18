import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs veille concurrentielle",
  description:
    "Tarifs ChronoCrawl pour la veille concurrentielle : Starter, Pro et Agency.",
};

export default function TarifsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
