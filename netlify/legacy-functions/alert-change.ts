import type { Handler } from "@netlify/functions";
import { Resend } from "resend";
import { renderEmail } from "./emails/render";

const resend = new Resend(process.env.RESEND_API_KEY);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { email, site, pageUrl } = body;

    if (!email || !site || !pageUrl) {
      return { statusCode: 400, body: "Missing parameters" };
    }

    const html = renderEmail({
      title: "Changement détecté 👀",
      message: `
        Un changement a été détecté sur une page que tu surveilles.<br/><br/>
        <strong>Site :</strong> ${site}<br/>
        <strong>Page :</strong> ${pageUrl}<br/><br/>
        Clique ci-dessous pour consulter les modifications.
      `,
      ctaLabel: "Voir les changements",
      ctaUrl: "https://chronocrawl.com/dashboard",
    });

    await resend.emails.send({
      from: "ChronoCrawl <hello@chronocrawl.com>",
      to: email,
      subject: "ChronoCrawl — Changement détecté",
      html,
    });

    return { statusCode: 200, body: "Alert email sent" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  }
};
