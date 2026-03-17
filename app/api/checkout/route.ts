import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireUserFromRequest } from "@/lib/routeAuth";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const priceStarter = process.env.STRIPE_PRICE_STARTER;
const pricePro = process.env.STRIPE_PRICE_PRO;
const priceAgency = process.env.STRIPE_PRICE_AGENCY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

type Plan = "starter" | "pro" | "agency";
const VALID_PLANS: Plan[] = ["starter", "pro", "agency"];

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
      // Continue with next candidate.
    }
  }

  return "https://www.chronocrawl.com";
}

export async function POST(request: Request) {
  if (!stripe || !stripeSecretKey) {
    return errorResponse(
      "Stripe non configuré (clé secrète manquante).",
      500,
      "STRIPE_NOT_CONFIGURED"
    );
  }

  const auth = await requireUserFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    plan?: string;
    successPath?: string;
    cancelPath?: string;
  };
  const plan = payload.plan?.trim() as Plan | undefined;
  const successPath =
    typeof payload.successPath === "string" &&
    payload.successPath.startsWith("/dashboard")
      ? payload.successPath
      : "/dashboard";
  const cancelPath =
    typeof payload.cancelPath === "string" && payload.cancelPath.startsWith("/")
      ? payload.cancelPath
      : "/#tarifs";

  if (!plan || !VALID_PLANS.includes(plan)) {
    return errorResponse("Plan invalide.", 400, "INVALID_PLAN");
  }

  const userId = auth.user.id;
  const email = auth.user.email;
  const priceId =
    plan === "starter"
      ? priceStarter
      : plan === "pro"
        ? pricePro
        : plan === "agency"
          ? priceAgency
          : null;

  if (!priceId || !userId || !email) {
    return errorResponse(
      "Plan, utilisateur ou prix Stripe invalide.",
      400,
      "INVALID_CHECKOUT_INPUT"
    );
  }

  const origin = resolveBaseUrl(request);

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(userId);

  if (userError || !userData.user) {
    return errorResponse(
      "Utilisateur introuvable pour le checkout.",
      400,
      "USER_NOT_FOUND"
    );
  }

  const existingMetadata = userData.user.user_metadata ?? {};
  const { data: subscriptionRow } = await supabaseAdmin
    .from("user_subscriptions")
    .select("stripe_customer_id,status")
    .eq("user_id", userId)
    .maybeSingle<{ stripe_customer_id: string | null; status: string | null }>();
  const existingStatus = subscriptionRow?.status || null;
  const nextStatus =
    existingStatus === "active" || existingStatus === "trialing"
      ? existingStatus
      : "pending_checkout";
  const existingCustomerIdRaw =
    subscriptionRow?.stripe_customer_id ||
    (existingMetadata.stripe_customer_id as string | undefined);
  const existingCustomerId =
    typeof existingCustomerIdRaw === "string" &&
    existingCustomerIdRaw.startsWith("cus_")
      ? existingCustomerIdRaw
      : undefined;

  const customerId =
    existingCustomerId ||
    (
      await stripe.customers.create({
        email,
        metadata: { user_id: userId },
      })
    ).id;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: customerId,
    client_reference_id: userId,
    metadata: { user_id: userId, plan },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}${successPath}`,
    cancel_url: `${origin}${cancelPath}`,
    ...(plan === "starter"
      ? {
          subscription_data: {
            trial_period_days: 7,
            metadata: { user_id: userId, plan },
          },
          payment_method_collection: "always",
        }
      : {
          subscription_data: {
            metadata: { user_id: userId, plan },
          },
        }
    ),
  });

  await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...existingMetadata,
      stripe_customer_id: customerId,
    },
  });

  await supabaseAdmin.from("user_subscriptions").upsert(
    {
      user_id: userId,
      plan,
      status: nextStatus,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (!session.url) {
    return errorResponse(
      "Checkout Stripe indisponible.",
      500,
      "CHECKOUT_URL_MISSING"
    );
  }

  return NextResponse.json({ url: session.url, code: "OK" });
}
