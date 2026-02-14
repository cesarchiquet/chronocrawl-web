"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import PublicChrome from "@/components/PublicChrome";

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
  const passwordsMatch =
    confirmPassword.length === 0 || password === confirmPassword;
  const canSubmit =
    email.trim().length > 4 &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    passwordsMatch;

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
    <PublicChrome>
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="max-w-md mx-auto px-6 pt-16 pb-24 text-center"
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
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setMessage("");
              setStatus("idle");
            }}
            className={`w-full px-4 py-3 rounded-lg bg-white/5 border focus:outline-none focus:border-indigo-400 ${
              passwordsMatch ? "border-white/10" : "border-red-400/60"
            }`}
          />
          <input
            type="text"
            placeholder="Type de site (SaaS, e‑commerce, agence...)"
            value={siteType}
            onChange={(e) => {
              setSiteType(e.target.value);
              setMessage("");
              setStatus("idle");
            }}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
          />
          <input
            type="url"
            placeholder="URL concurrente à surveiller"
            value={targetUrl}
            onChange={(e) => {
              setTargetUrl(e.target.value);
              setMessage("");
              setStatus("idle");
            }}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-400"
          />

          <button
            onClick={handleSignUp}
            className="w-full px-4 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition font-medium"
            disabled={status === "loading" || !canSubmit}
          >
            {status === "loading" ? "Création..." : "Créer un compte"}
          </button>
        </div>

        {!passwordsMatch && (
          <p className="mt-3 text-xs text-red-300">
            Les mots de passe doivent être identiques.
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
          <Link href="/login" className="underline underline-offset-4">
            Déjà un compte ? Se connecter
          </Link>
        </div>
      </motion.section>
    </PublicChrome>
  );
}
