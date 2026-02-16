"use client";

import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";

type PublicChromeProps = {
  children: React.ReactNode;
};

export default function PublicChrome({ children }: PublicChromeProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
      <PublicNavigation />
      {children}
      <PublicFooter />
    </main>
  );
}
