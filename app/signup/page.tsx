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

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOptionalSetup, setShowOptionalSetup] = useState(false);
  const [startTrialNow, setStartTrialNow] = useState(true);
  const [siteType, setSiteType] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ok">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [from] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("from") || "";
  });
  const [intent] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("intent") || "";
  });
  const passwordsMatch =
    confirmPassword.length === 0 || password === confirmPassword;
  const canSubmit =
    email.trim().length > 4 &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    passwordsMatch;
  const contextualIntro =
    from === "blog"
      ? intent === "pricing"
        ? "Tu viens d’un article pricing. Crée ton compte pour surveiller une page tarifs concurrente et voir les vrais mouvements d’offre."
        : intent === "audit"
          ? "Tu viens du blog. Crée ton compte pour lancer un audit SEO concurrent et surveiller ensuite la même URL."
          : "Tu viens du blog. Crée ton compte pour tester ChronoCrawl sur une première URL concurrente."
      : "Cree ton compte, lance ton essai, puis ajoute ta premiere URL sans repasser par plusieurs ecrans.";

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

    if (targetUrl.trim()) {
      window.localStorage.setItem(
        "chronocrawl:onboarding-first-url",
        targetUrl.trim()
      );
    }

    setStatus("ok");
    if (data.session) {
      if (startTrialNow) {
        try {
          const response = await fetch("/api/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.session.access_token}`,
            },
            body: JSON.stringify({
              plan: "starter",
              successPath: targetUrl.trim()
                ? `/dashboard?trialStarted=1&onboarding=1&prefillUrl=${encodeURIComponent(
                    targetUrl.trim()
                  )}`
                : "/dashboard?trialStarted=1&onboarding=1",
              cancelPath: "/tarifs?checkout=cancelled&from=signup",
            }),
          });
          const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
            url?: string;
          };
          if (response.ok && payload.url) {
            window.location.href = payload.url;
            return;
          }
        } catch {
          // Fallback below.
        }
        router.push("/tarifs?from=signup");
        return;
      }
      const params = new URLSearchParams();
      params.set("onboarding", "1");
      if (targetUrl.trim()) {
        params.set("prefillUrl", targetUrl.trim());
      }
      router.push(`/dashboard?${params.toString()}`);
      return;
    }
    if (startTrialNow) {
      window.localStorage.setItem(
        "chronocrawl:post-login-destination",
        "/tarifs?from=signup"
      );
    }
    setMessage(
      targetUrl.trim()
        ? "Compte cree. Verifie ton email pour confirmer, puis connecte-toi. Ton URL sera pre-remplie apres connexion."
        : "Compte cree. Verifie ton email pour confirmer, puis connecte-toi."
    );
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
          <h1 className="text-3xl md:text-4xl font-bold">Créer un compte</h1>
          <p className="mt-4 text-gray-300">{contextualIntro}</p>
          <div className="mt-6 rounded-xl border border-indigo-300/25 bg-indigo-500/10 p-4 text-left">
            <p className="text-sm font-medium text-indigo-100">
              Parcours recommande
            </p>
            <div className="mt-2 grid gap-2 text-xs text-indigo-50/90">
              <span>1. Creer le compte</span>
              <span>2. Demarrer l&apos;essai 7 jours</span>
              <span>3. Ajouter la premiere URL dans le dashboard</span>
            </div>
          </div>

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
            autoComplete="new-password"
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
            autoComplete="new-password"
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
          <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left">
            <input
              type="checkbox"
              checked={startTrialNow}
              onChange={(e) => setStartTrialNow(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block text-sm text-gray-100">
                Demarrer mon essai 7 jours juste apres l&apos;inscription
              </span>
              <span className="mt-1 block text-xs text-gray-400">
                Recommande pour arriver plus vite a la premiere URL surveillee.
              </span>
            </span>
          </label>

          <button
            type="button"
            onClick={() => setShowOptionalSetup((value) => !value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-gray-200 hover:bg-white/10 transition"
          >
            {showOptionalSetup
              ? "Masquer les informations optionnelles"
              : "Ajouter une URL concurrente maintenant (optionnel)"}
          </button>
          {showOptionalSetup && (
            <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <input
                type="text"
                placeholder="Type de site (SaaS, e-commerce, agence...)"
                value={siteType}
                onChange={(e) => {
                  setSiteType(e.target.value);
                  setMessage("");
                  setStatus("idle");
                }}
                className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 focus:outline-none focus:border-indigo-400"
              />
              <input
                type="url"
                placeholder="Premiere URL concurrente a pre-remplir"
                value={targetUrl}
                onChange={(e) => {
                  setTargetUrl(e.target.value);
                  setMessage("");
                  setStatus("idle");
                }}
                className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/10 focus:outline-none focus:border-indigo-400"
              />
              <p className="text-xs text-gray-400">
                Si tu renseignes cette URL, elle sera pre-remplie dans le dashboard apres inscription.
              </p>
            </div>
          )}

          <button
            onClick={handleSignUp}
            className="w-full px-4 py-3 rounded-lg border border-white bg-white text-black hover:bg-white/85 transition font-medium"
            disabled={status === "loading" || !canSubmit}
          >
            {status === "loading"
              ? "Creation..."
              : startTrialNow
                ? "Creer mon compte et lancer l'essai"
                : "Creer mon compte"}
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
              Deja un compte ? Se connecter
            </Link>
          </div>
        </div>
      </motion.section>
    </PublicChrome>
  );
}
