import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireUserFromRequest } from "@/lib/routeAuth";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

function errorResponse(
  message: string,
  status: number,
  code: string
) {
  return NextResponse.json(
    {
      error: message,
      code,
    },
    { status }
  );
}

function resolveBaseUrl(request: Request) {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    request.headers.get("origin"),
    "https://www.chronocrawl.com",
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      return `${url.protocol}//${url.host}`;
    } catch {
      // Ignore invalid candidate.
    }
  }

  return "https://www.chronocrawl.com";
}

export async function POST(request: Request) {
  if (!stripe) {
    return errorResponse(
      "Stripe non configure (cle secrete manquante).",
      500,
      "STRIPE_NOT_CONFIGURED"
    );
  }

  const auth = await requireUserFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const userId = auth.user.id;

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(userId);

  if (userError || !userData.user) {
    return errorResponse("Utilisateur introuvable.", 400, "USER_NOT_FOUND");
  }

  const customerId = userData.user.user_metadata?.stripe_customer_id as
    | string
    | undefined;

  const { data: subscriptionRow } = await supabaseAdmin
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle<{ stripe_customer_id: string | null }>();

  const resolvedCustomerId =
    subscriptionRow?.stripe_customer_id || customerId;

  if (!resolvedCustomerId) {
    return errorResponse(
      "Compte client Stripe introuvable pour cet utilisateur.",
      400,
      "MISSING_STRIPE_CUSTOMER"
    );
  }

  const origin = resolveBaseUrl(request);

  const session = await stripe.billingPortal.sessions.create({
    customer: resolvedCustomerId,
    return_url: `${origin}/dashboard`,
  });

  if (!session.url) {
    return errorResponse(
      "Portail billing indisponible.",
      500,
      "PORTAL_URL_MISSING"
    );
  }

  return NextResponse.json({ url: session.url, code: "OK" });
}
