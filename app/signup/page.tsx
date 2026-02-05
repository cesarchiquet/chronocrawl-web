"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [siteType, setSiteType] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ok">(
    "idle"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage("");
  }, [email, password, confirmPassword, siteType, targetUrl]);

  const handleSignUp = async () => {
    if (!email || !password) {
      setStatus("error");
      setMessage("Email et mot de passe requis.");
      return;
    }
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setStatus("loading");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          site_type: siteType || null,
          target_url: targetUrl || null,
        },
      },
    });

    if (error) {
      setStatus("error");
      setMessage(`Inscription impossible: ${error.message}`);
      return;
    }

    setStatus("ok");
    if (data.session) {
      router.push("/");
      return;
    }
    setMessage("Compte créé. Vérifie ton email pour confirmer, puis connecte-toi.");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-md mx-auto px-6 pt-28 pb-24 text-center"
      >
        <h1 className="text-3xl md:text-4xl font-bold">Créer un compte</h1>
        <p className="mt-4 text-gray-300">
          Commence ta veille concurrentielle en quelques minutes.
        </p>

        <div className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
          />
          <input
            type="text"
            placeholder="Type de site (SaaS, e‑commerce, agence...)"
            value={siteType}
            onChange={(e) => setSiteType(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
          />
          <input
            type="url"
            placeholder="URL concurrente à surveiller"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
          />

          <button
            onClick={handleSignUp}
            className="w-full px-4 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
            disabled={status === "loading"}
          >
            Créer un compte
          </button>
        </div>

        {message && (
          <p
            className={`mt-4 text-sm ${
              status === "error" ? "text-red-400" : "text-green-400"
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-6 text-sm text-gray-300">
          <a href="/login" className="underline underline-offset-4">
            Déjà un compte ? Se connecter
          </a>
        </div>
      </motion.section>
    </main>
  );
}
