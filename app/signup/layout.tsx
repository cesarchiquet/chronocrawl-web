import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Crée un compte ChronoCrawl pour surveiller un site concurrent et recevoir des alertes.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
