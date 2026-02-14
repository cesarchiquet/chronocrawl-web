import type { Handler } from "@netlify/functions";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { renderEmail } from "./emails/render";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const handler: Handler = async () => {
  try {
    const { data: users, error } = await supabase
      .from("early_access")
      .select("email");

    if (error || !users) {
      return { statusCode: 500, body: "Database error" };
    }

    for (const user of users) {
      const html = renderEmail({
        title: "ChronoCrawl est officiellement ouvert 🚀",
        message: `
          Après plusieurs semaines de préparation,
          ChronoCrawl est maintenant disponible.<br/><br/>
          Tu peux enfin surveiller automatiquement les changements
          sur les sites concurrents, sans effort et sans bruit.<br/><br/>
          Clique ci-dessous pour accéder à la plateforme.
        `,
        ctaLabel: "Accéder à ChronoCrawl",
        ctaUrl: "https://chronocrawl.com/app",
      });

      await resend.emails.send({
        from: "ChronoCrawl <hello@chronocrawl.com>",
        to: user.email,
        subject: "ChronoCrawl — Ouverture officielle",
        html,
      });
    }

    return { statusCode: 200, body: "Launch emails sent" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  }
};
