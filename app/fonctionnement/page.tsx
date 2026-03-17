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

export default function FonctionnementPage() {
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
        className="max-w-4xl mx-auto px-6 pt-16 pb-24"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Comment fonctionne ChronoCrawl
        </h1>
        <p className="mt-6 text-lg text-gray-300 text-center max-w-2xl mx-auto">
          ChronoCrawl est un outil de veille concurrentielle qui surveille un
          site concurrent, détecte les changements et t’envoie une alerte
          changement site web en quelques minutes.
        </p>

        <div className="mt-12 space-y-8">
          {[
            {
              title: "1. Ajoute les URLs à surveiller",
              text: "Tu choisis les pages concurrentes importantes : landing pages, pricing, pages produits ou contenus SEO.",
            },
            {
              title: "2. ChronoCrawl analyse les changements",
              text: "Le moteur compare les pages et détecte uniquement les vrais changements de contenu, pour éviter les faux positifs.",
            },
            {
              title: "3. Reçois une alerte en temps réel",
              text: "Dès qu’un changement est détecté, tu reçois une notification claire pour agir rapidement.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="cc-panel-strong cc-hover-lift rounded-[28px] p-6"
            >
              <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
              <p className="text-gray-300 text-sm">{item.text}</p>
            </div>
          ))}
          <div className="cc-panel-strong cc-hover-lift rounded-[28px] p-6">
            <h2 className="text-xl font-semibold mb-2">Sécurité et données</h2>
            <p className="text-gray-300 text-sm">
              Chaque compte n&apos;accède qu&apos;a ses propres données (RLS),
              les sessions API sont vérifiées par token et la facturation est
              gérée via Stripe.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {!session?.user ? (
            <Link
              href="/signup"
              className="cc-button-primary inline-flex items-center justify-center rounded-full px-6 py-3 font-medium"
            >
              Commencer gratuitement
            </Link>
          ) : null}
          <Link
            href="/dashboard"
            className="cc-button-secondary inline-flex items-center justify-center rounded-full px-6 py-3 font-medium"
          >
            Ouvrir le dashboard
          </Link>
        </div>
      </motion.section>
    </PublicChrome>
  );
}
