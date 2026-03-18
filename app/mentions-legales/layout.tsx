import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Consulte les mentions légales de ChronoCrawl.",
  alternates: {
    canonical: "/mentions-legales",
  },
};

export default function MentionsLegalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
