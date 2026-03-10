"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const dashboardMenuItems = [
  { href: "/dashboard", label: "Surveillance" },
  { href: "/dashboard/audit-seo", label: "Audit SEO" },
];

export default function DashboardSuiteMenu() {
  const pathname = usePathname();

  return (
    <nav className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-2">
      <div className="flex flex-wrap items-center gap-2">
        {dashboardMenuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-white text-black border border-white"
                  : "text-gray-300 border border-transparent hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
