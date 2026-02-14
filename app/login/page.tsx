"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import PublicChrome from "@/components/PublicChrome";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ok">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const canSubmit = email.trim().length > 4 && password.length >= 6;

  const handleSignIn = async () => {
    if (!canSubmit) return;
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
    router.push("/");
  };

  const handleSignUp = async () => {
    if (!canSubmit) return;
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
    router.push("/");
  };

  return (
    <PublicChrome>
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-md mx-auto px-6 pt-16 pb-24 text-center"
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
            onChange={(e) => {
              setEmail(e.target.value);
              setMessage("");
              setStatus("idle");
            }}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setMessage("");
              setStatus("idle");
            }}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
          />

          <button
            onClick={handleSignIn}
            className="w-full px-4 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
            disabled={status === "loading" || !canSubmit}
          >
            {status === "loading" ? "Connexion..." : "Se connecter"}
          </button>
          <button
            onClick={handleSignUp}
            className="w-full px-4 py-3 rounded-lg border border-white/20 hover:bg-white/5 transition"
            disabled={status === "loading" || !canSubmit}
          >
            Créer un compte
          </button>
        </div>

        {!canSubmit && (
          <p className="mt-3 text-xs text-gray-400">
            Renseigne un email valide et un mot de passe de 6 caractères minimum.
          </p>
        )}

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
          <Link href="/dashboard" className="underline underline-offset-4">
            Aller au dashboard
          </Link>
        </div>
      </motion.section>
    </PublicChrome>
  );
}
