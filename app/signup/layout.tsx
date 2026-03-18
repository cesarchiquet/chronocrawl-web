import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte ChronoCrawl",
  description:
    "Crée ton compte ChronoCrawl pour commencer l’essai, ajouter une première URL concurrente et recevoir des alertes utiles.",
  alternates: {
    canonical: "/signup",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
