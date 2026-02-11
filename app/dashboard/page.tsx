"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

type MonitoredUrl = {
  id: string;
  url: string;
  status: string | null;
  last_checked_at: string | null;
  created_at: string;
};

type ChangeEvent = {
  id: string;
  url_id: string;
  summary: string | null;
  detected_at: string | null;
};

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [urls, setUrls] = useState<MonitoredUrl[]>([]);
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [message, setMessage] = useState("");
  const [billingMessage, setBillingMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = async () => {
    if (!session?.user) return;
    const { data: urlsData } = await supabase
      .from("monitored_urls")
      .select("id,url,status,last_checked_at,created_at")
      .order("created_at", { ascending: false });

    setUrls(urlsData || []);

    const { data: eventsData } = await supabase
      .from("change_events")
      .select("id,url_id,summary,detected_at")
      .order("detected_at", { ascending: false })
      .limit(5);

    setEvents(eventsData || []);
  };

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const addUrl = async () => {
    if (!newUrl || !session?.user) return;
    setMessage("");

    const { error } = await supabase.from("monitored_urls").insert([
      {
        url: newUrl,
        user_id: session.user.id,
        status: "OK",
      },
    ]);

    if (error) {
      setMessage("Impossible d’ajouter cette URL.");
      return;
    }

    setNewUrl("");
    await loadData();
  };

  const removeUrl = async (id: string) => {
    await supabase.from("monitored_urls").delete().eq("id", id);
    await loadData();
  };

  const plan =
    (session?.user?.user_metadata?.plan as
      | "starter"
      | "pro"
      | "agency"
      | undefined) || "starter";

  const limits: Record<string, number> = {
    starter: 10,
    pro: 50,
    agency: 200,
  };

  const limit = limits[plan] || limits.starter;
  const currentCount = urls.length;

  const testMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
  const bypassEmails =
    process.env.NEXT_PUBLIC_TEST_BYPASS_EMAILS?.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) || [];
  const userEmail = session?.user?.email?.toLowerCase();
  const isBypass = testMode && !!userEmail && bypassEmails.includes(userEmail);
  const subscriptionStatus = session?.user?.user_metadata?.subscription_status;
  const hasActiveSubscription = subscriptionStatus === "active";
  const canAddUrl =
    (isBypass || hasActiveSubscription) && currentCount < limit;
  const stripeCustomerId = session?.user?.user_metadata?.stripe_customer_id as
    | string
    | undefined;

  const openBillingPortal = async () => {
    setBillingMessage("");
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: stripeCustomerId }),
      });
      const data = await response.json();
      if (!response.ok || !data?.url) {
        throw new Error(
          data?.error ||
            "Impossible d'ouvrir la gestion d'abonnement pour le moment."
        );
      }
      window.location.href = data.url;
    } catch (error: unknown) {
      const details =
        error instanceof Error ? error.message : "Erreur Stripe.";
      setBillingMessage(details);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white" />
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-xl mx-auto px-6 pt-28 pb-24 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold">
            Connecte‑toi pour accéder au dashboard
          </h1>
          <p className="mt-4 text-gray-300">
            L’accès au dashboard est réservé aux utilisateurs connectés.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium mt-8"
          >
            Se connecter
          </a>
        </motion.section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-6 pt-20 pb-16"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-indigo-300 text-sm font-medium">Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-bold">
              Veille concurrentielle en un coup d’œil
            </h1>
            <p className="mt-3 text-gray-300">
              Suis tes URLs, détecte les changements et reçois des alertes en
              temps réel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openBillingPortal}
              className="px-6 py-3 rounded-lg border border-indigo-300/30 text-indigo-200 hover:bg-indigo-500/10 transition"
            >
              Gérer l&apos;abonnement
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition"
            >
              Se déconnecter
            </button>
          </div>
        </div>
        {billingMessage && (
          <p className="mt-3 text-sm text-amber-200">{billingMessage}</p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-200">
            Plan: {plan.toUpperCase()}
          </span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-200">
            {currentCount}/{limit} URLs
          </span>
          {!hasActiveSubscription && !isBypass && (
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-200">
              Abonnement requis pour activer la surveillance
            </span>
          )}
          {isBypass && (
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-200">
              Mode test activé
            </span>
          )}
        </div>
      </motion.section>

      <section className="max-w-6xl mx-auto px-6 pb-16 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">URLs surveillées</h2>
          <div className="space-y-4">
            {urls.length === 0 && (
              <p className="text-gray-400 text-sm">
                Aucune URL pour le moment.
              </p>
            )}
            {urls.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border border-white/10 p-4"
              >
                <div>
                  <p className="text-sm text-gray-300">{item.url}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Dernière vérification :
                    {item.last_checked_at ? " " + item.last_checked_at : " —"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                    {item.status || "OK"}
                  </span>
                  <button
                    onClick={() => removeUrl(item.id)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">Derniers changements</h2>
          <div className="space-y-4">
            {events.length === 0 && (
              <p className="text-gray-400 text-sm">Aucun changement détecté.</p>
            )}
            {events.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 p-4">
                <p className="text-sm text-gray-200">{item.summary}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {item.detected_at || "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-xl bg-white/5 border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-4">Ajouter une URL</h2>
          <p className="text-gray-300 text-sm mb-4">
            Ajoute une page concurrente à surveiller. La détection des
            changements sera activée automatiquement.
          </p>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="url"
              placeholder="https://site-concurrent.com/pricing"
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
            <button
              onClick={addUrl}
              className="px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canAddUrl}
            >
              Ajouter
            </button>
          </div>
          {!hasActiveSubscription && !isBypass && (
            <p className="text-amber-200 text-sm mt-3">
              Ajout bloque : ton abonnement n&apos;est pas encore actif.
              Selectionne un plan depuis la landing, puis reviens ici.
            </p>
          )}
          {currentCount >= limit && (
            <p className="text-amber-200 text-sm mt-3">
              Limite atteinte : ton plan {plan.toUpperCase()} autorise {limit}{" "}
              URLs max. Supprime une URL ou upgrade ton abonnement.
            </p>
          )}
          {message && <p className="text-red-400 text-sm mt-3">{message}</p>}
        </div>
      </section>
    </main>
  );
}
