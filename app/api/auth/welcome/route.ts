import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireUserFromRequest } from "@/lib/routeAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { renderWelcomeEmail } from "@/lib/emailTemplates";
import { appLogger } from "@/lib/appLogger";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error || "Session invalide." },
      { status: auth.status || 401 }
    );
  }

  if (!resend) {
    return NextResponse.json({ ok: false, message: "Resend non configuré." }, { status: 200 });
  }

  const user = auth.user;
  const email = user.email?.trim();
  if (!email) {
    return NextResponse.json({ ok: false, message: "Email introuvable." }, { status: 200 });
  }

  const metadata = user.user_metadata ?? {};
  if (metadata.welcome_email_sent_at) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.chronocrawl.com";

  try {
    const { html, text } = renderWelcomeEmail({
      dashboardUrl: `${siteUrl}/dashboard`,
      pricingUrl: `${siteUrl}/tarifs`,
    });

    await resend.emails.send({
      from: "ChronoCrawl <hello@chronocrawl.com>",
      to: email,
      subject: "Bienvenue sur ChronoCrawl",
      html,
      text,
    });

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...metadata,
        welcome_email_sent_at: new Date().toISOString(),
      },
    });

    appLogger.info("welcome_email:sent", { userId: user.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    appLogger.warn("welcome_email:send_failed", {
      userId: user.id,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ ok: false, message: "Email non envoyé." }, { status: 200 });
  }
}
