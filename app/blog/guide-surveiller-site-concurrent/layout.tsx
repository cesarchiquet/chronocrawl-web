import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comment surveiller un site concurrent",
  description:
    "Guide simple pour surveiller un site concurrent, faire une veille concurrentielle efficace et recevoir une alerte changement site web.",
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
