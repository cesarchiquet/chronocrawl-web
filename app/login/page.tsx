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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ok">(
    "idle"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMessage("");
  }, [email, password]);

  const handleSignIn = async () => {
    setStatus("loading");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setStatus("error");
      setMessage(`Connexion impossible: ${error.message}`);
      return;
    }
    setStatus("ok");
    setMessage("Connecté. Tu peux aller au dashboard.");
  };

  const handleSignUp = async () => {
    setStatus("loading");
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setStatus("error");
      setMessage(`Inscription impossible: ${error.message}`);
      return;
    }
    setStatus("ok");
    setMessage("Inscription réussie. Tu peux te connecter.");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050816] via-[#0b1025] to-[#050816] text-white">
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-md mx-auto px-6 pt-28 pb-24 text-center"
      >
        <h1 className="text-3xl md:text-4xl font-bold">Connexion</h1>
        <p className="mt-4 text-gray-300">
          Connecte‑toi pour accéder au dashboard ChronoCrawl.
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

          <button
            onClick={handleSignIn}
            className="w-full px-4 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
            disabled={status === "loading"}
          >
            Se connecter
          </button>
          <button
            onClick={handleSignUp}
            className="w-full px-4 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition"
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
          <a href="/dashboard" className="underline underline-offset-4">
            Aller au dashboard
          </a>
        </div>
      </motion.section>
    </main>
  );
}
