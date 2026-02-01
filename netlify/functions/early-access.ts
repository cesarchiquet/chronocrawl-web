import type { Handler } from "@netlify/functions";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// 🔑 Clients
const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// 🚀 Handler
export const handler: Handler = async (event) => {
  console.log("🚀 Function early-access appelée");

  // ❌ Mauvaise méthode
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    // 0️⃣ Parse body
    const body = JSON.parse(event.body || "{}");
    const email = body.email;

    // 1️⃣ Validation email
    if (!email) {
      console.log("❌ Email manquant");
      return {
        statusCode: 400,
        body: "Email manquant",
      };
    }

    console.log("📧 Email reçu :", email);

    // 2️⃣ Vérifie si déjà inscrit
    const { data: existing } = await supabase
      .from("early_access")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      console.log("⚠️ Email déjà inscrit :", email);
      return {
        statusCode: 200,
        body: "Déjà inscrit",
      };
    }

    // 3️⃣ Insert en base
    const { error } = await supabase
      .from("early_access")
      .insert([{ email }]);

    if (error) {
      console.error("❌ Erreur Supabase :", error);
      return {
        statusCode: 500,
        body: "Erreur Supabase",
      };
    }

    console.log("✅ Email inséré en base");

    // 4️⃣ Envoi email
    console.log("✉️ Envoi email via Resend...");

    await resend.emails.send({
      from: "ChronoCrawl <hello@chronocrawl.com>",
      to: email,
      subject: "Bienvenue sur ChronoCrawl 🚀",
      html: `
        <div style="font-family: Arial, sans-serif; background:#0f172a; padding:40px; color:#e5e7eb">
          <div style="max-width:600px;margin:auto;background:#020617;padding:32px;border-radius:12px">
            <h1 style="color:#38bdf8">Bienvenue sur ChronoCrawl 🚀</h1>
            <p>Merci pour ton inscription à l’accès anticipé.</p>
            <p>On te prévient très vite 🔔</p>
            <p style="margin-top:32px;font-size:12px;color:#94a3b8">
              © ChronoCrawl
            </p>
          </div>
        </div>
      `,
    });

    console.log("✅ Email envoyé");

    // 5️⃣ Success
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