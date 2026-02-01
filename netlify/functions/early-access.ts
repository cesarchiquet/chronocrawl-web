import type { Handler } from "@netlify/functions";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Clients
const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const handler: Handler = async (event) => {
  console.log("🚀 Function early-access appelée");

  // Autoriser uniquement POST
  if (event.httpMethod !== "POST") {
    console.log("❌ Mauvaise méthode :", event.httpMethod);
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    // Parse du body
    const body = JSON.parse(event.body || "{}");
    console.log("📩 Body reçu :", body);

    const email = body.email;

    // 🔒 Vérification email AVANT tout
    if (!email) {
      console.log("❌ Email manquant");
      return {
        statusCode: 400,
        body: "Email manquant",
      };
    }

    console.log("📧 Email reçu :", email);

    // 💾 Insertion dans Supabase
    const { error } = await supabase
      .from("early_access")
      .insert([{ email }]);

    if (error) {
      console.error("❌ Erreur Supabase :", error);
      return {
        statusCode: 500,
        body: "Erreur base de données",
      };
    }

    // ✉️ Envoi email via Resend
    console.log("✉️ Envoi email via Resend...");

    await resend.emails.send({
      from: "ChronoCrawl <hello@chronocrawl.com>",
      to: email,
      subject: "Bienvenue sur ChronoCrawl 🚀",
      html: `
        <h1>Merci pour ton inscription 👋</h1>
        <p>Tu es bien inscrit à l’accès anticipé de <strong>ChronoCrawl</strong>.</p>
        <p>On te prévient très vite 🔔</p>
      `,
    });

    console.log("✅ Email envoyé avec succès");

    return {
      statusCode: 200,
      body: "Inscription réussie",
    };
  } catch (err) {
    console.error("🔥 Erreur serveur :", err);

    return {
      statusCode: 500,
      body: "Erreur serveur",
    };
  }
};