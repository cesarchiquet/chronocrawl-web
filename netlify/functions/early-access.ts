import { Handler } from "@netlify/functions";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const handler: Handler = async (event) => {
  try {
    const data = JSON.parse(event.body || "{}");
    const email = data.email;

    if (!email) {
      return {
        statusCode: 400,
        body: "Email manquant",
      };
    }

    await resend.emails.send({
      from: "ChronoCrawl <hello@chronocrawl.com>",
      to: email,
      subject: "Bienvenue sur ChronoCrawl 🚀",
      html: `
        <h1>Merci pour ton inscription 👋</h1>
        <p>Tu es bien inscrit à l’accès anticipé de <strong>ChronoCrawl</strong>.</p>
        <p>On te prévient très vite 🔥</p>
      `,
    });

    return {
      statusCode: 200,
      body: "Email envoyé",
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: "Erreur serveur",
    };
  }
};