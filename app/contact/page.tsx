"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import type { Session } from "@supabase/supabase-js";
import PublicChrome from "@/components/PublicChrome";
import { supabase } from "@/lib/supabaseClient";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function ContactPage() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const hydrate = async () => {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        setSession(refreshed.session);
        return;
      }
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    hydrate();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <PublicChrome>
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          Contact ChronoCrawl
        </h1>
        <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto">
          Une question sur la veille concurrentielle, les alertes ou le
          fonctionnement ? Écris‑nous et on te répond rapidement.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:hello@chronocrawl.com?subject=Contact%20ChronoCrawl"
            className="cc-button-primary inline-flex items-center justify-center rounded-full px-6 py-3 font-medium"
          >
            hello@chronocrawl.com
          </a>
          {!session?.user ? (
            <Link
              href="/signup"
              className="cc-button-secondary inline-flex items-center justify-center rounded-full px-6 py-3 font-medium"
            >
              Créer un compte
            </Link>
          ) : null}
        </div>
      </motion.section>
    </PublicChrome>
  );
}
