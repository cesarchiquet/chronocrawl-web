import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact veille concurrentielle",
  description:
    "Contacte ChronoCrawl pour une question sur la veille concurrentielle ou pour discuter de ton besoin.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
