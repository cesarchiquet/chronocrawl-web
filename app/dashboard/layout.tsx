import type { ReactNode } from "react";
import DashboardDesktopNotice from "@/components/DashboardDesktopNotice";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#141414_0%,_#050505_38%,_#000000_100%)] px-4 py-10 md:hidden">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
          <DashboardDesktopNotice />
        </div>
      </div>
      <div className="hidden md:block">{children}</div>
    </>
  );
}
