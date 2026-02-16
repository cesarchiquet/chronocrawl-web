"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import PublicFooter from "@/components/PublicFooter";
import PublicNavigation from "@/components/PublicNavigation";
import { supabase } from "@/lib/supabaseClient";

type PublicChromeProps = {
  children: React.ReactNode;
};

export default function PublicChrome({ children }: PublicChromeProps) {
  const [session, setSession] = useState<Session | null>(null);

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
    const data = await response.json();
    if (response.ok && data?.url) {
      window.location.href = data.url;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
      <PublicNavigation
        session={session}
        onOpenBillingPortal={() => {
          void openBillingPortal();
        }}
        onSignOut={() => {
          void supabase.auth.signOut();
        }}
      />
      {children}
      <PublicFooter />
    </main>
  );
}
