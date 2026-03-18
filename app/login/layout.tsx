import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion ChronoCrawl",
  description:
    "Connecte-toi à ChronoCrawl pour ouvrir le dashboard, reprendre ton essai et surveiller tes URLs concurrentes.",
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
