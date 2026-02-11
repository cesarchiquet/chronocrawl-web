import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const priceStarter = process.env.STRIPE_PRICE_STARTER;
const pricePro = process.env.STRIPE_PRICE_PRO;
const priceAgency = process.env.STRIPE_PRICE_AGENCY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

type Plan = "starter" | "pro" | "agency";

export async function POST(request: Request) {
  if (!stripe || !stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe non configuré (clé secrète manquante)." },
      { status: 500 }
    );
  }

  const { plan, userId, email } = (await request.json()) as {
    plan?: Plan;
    userId?: string;
    email?: string;
  };
  const priceId =
    plan === "starter"
      ? priceStarter
      : plan === "pro"
        ? pricePro
        : plan === "agency"
          ? priceAgency
          : null;

  if (!plan || !priceId || !userId || !email) {
    return NextResponse.json(
      { error: "Plan, utilisateur ou prix Stripe invalide." },
      { status: 400 }
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "";

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(userId);

  if (userError || !userData.user) {
    return NextResponse.json(
      { error: "Utilisateur introuvable pour le checkout." },
      { status: 400 }
    );
  }

  const existingMetadata = userData.user.user_metadata ?? {};
  const { data: subscriptionRow } = await supabaseAdmin
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle<{ stripe_customer_id: string | null }>();
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
    success_url: `${origin}/dashboard`,
    cancel_url: `${origin}/#tarifs`,
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
      status: "pending_checkout",
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ url: session.url });
}
