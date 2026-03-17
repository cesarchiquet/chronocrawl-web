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
  const [from] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("from") || "";
  });
  const canSubmit = email.trim().length > 4 && password.length >= 6;
  const contextualIntro =
    from === "blog"
      ? "Connecte-toi pour reprendre depuis le blog, ouvrir le dashboard et ajouter directement une URL concurrente."
      : "Connecte-toi pour reprendre ton essai, ouvrir le dashboard et ajouter ta première URL.";

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
    const nextPath =
      window.localStorage.getItem("chronocrawl:post-login-destination") ||
      "/dashboard?onboarding=1";
    window.localStorage.removeItem("chronocrawl:post-login-destination");
    router.push(nextPath);
  };

  return (
    <PublicChrome>
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-lg mx-auto px-4 sm:px-6 pt-12 md:pt-16 pb-20 md:pb-24 text-center"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
          <h1 className="text-3xl md:text-4xl font-bold">Connexion</h1>
          <p className="mt-4 text-gray-300">{contextualIntro}</p>

          <div className="mt-8 space-y-4">
          <input
            type="email"
            autoComplete="email"
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
            autoComplete="current-password"
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
            className="w-full px-4 py-3 rounded-lg border border-white bg-white text-black hover:bg-white/85 transition font-medium"
            disabled={status === "loading" || !canSubmit}
          >
            {status === "loading" ? "Connexion..." : "Ouvrir mon dashboard"}
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
            <Link href="/signup" className="underline underline-offset-4">
              Pas encore de compte ? Créer un compte
            </Link>
          </div>
        </div>
      </motion.section>
    </PublicChrome>
  );
}
