"use client";

import { useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cc_cookie_consent";
const COOKIE_NAME = "cc_cookie_consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] ?? "");
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax`;
}

function getInitialVisibility() {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  const cookie = readCookie(COOKIE_NAME);
  return !(stored || cookie);
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(getInitialVisibility);

  const handleChoice = (value: "accepted" | "declined") => {
    localStorage.setItem(STORAGE_KEY, value);
    writeCookie(COOKIE_NAME, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4">
      <div className="cc-panel mx-auto w-full max-w-4xl rounded-[26px] border border-white/10 bg-black/70 p-5 backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-white/68">
            <p className="text-base font-semibold text-white">Politique de cookies</p>
            <p className="mt-2">
              ChronoCrawl utilise des cookies essentiels pour le fonctionnement du service. Tu peux accepter ou refuser.
              <Link href="/cookies" className="ml-2 text-white underline">
                En savoir plus
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="cc-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
              onClick={() => handleChoice("declined")}
            >
              Refuser
            </button>
            <button
              type="button"
              className="cc-button-primary rounded-full px-4 py-2 text-sm font-semibold"
              onClick={() => handleChoice("accepted")}
            >
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
