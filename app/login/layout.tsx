import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connexion à ChronoCrawl pour accéder au dashboard.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
