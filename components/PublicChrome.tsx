"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";
import { supabase } from "@/lib/supabaseClient";

type PublicChromeProps = {
  children: React.ReactNode;
};

export default function PublicChrome({ children }: PublicChromeProps) {
  const [session, setSession] = useState<Session | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const hydrateSession = async () => {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        setSession(refreshed.session);
        return;
      }

      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const openBillingPortal = async () => {
    if (!session?.access_token) return;
    const response = await fetch("/api/billing/portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({}),
    });
    const data = (await response.json().catch(() => ({}))) as {
      url?: string;
      code?: string;
    };
    if (response.ok && data?.url) {
      window.location.href = data.url;
      return;
    }

    if (data?.code === "MISSING_STRIPE_CUSTOMER") {
      window.location.href = "/tarifs?from=billing";
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#141414_0%,_#050505_38%,_#000000_100%)] text-white">
      <PublicNavigation
        session={session}
        onOpenBillingPortal={() => {
          void openBillingPortal();
        }}
        onSignOut={() => {
          void supabase.auth.signOut();
        }}
      />
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {children}
      </motion.div>
      <PublicFooter />
    </main>
  );
}
