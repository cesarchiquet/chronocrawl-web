import Stripe from "stripe";
import { NextResponse } from "next/server";

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

  const { plan } = (await request.json()) as { plan?: Plan };
  const priceId =
    plan === "starter"
      ? priceStarter
      : plan === "pro"
        ? pricePro
        : plan === "agency"
          ? priceAgency
          : null;

  if (!plan || !priceId) {
    return NextResponse.json(
      { error: "Plan ou prix Stripe invalide." },
      { status: 400 }
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard`,
    cancel_url: `${origin}/#tarifs`,
    ...(plan === "starter"
      ? {
          subscription_data: { trial_period_days: 7 },
          payment_method_collection: "always",
        }
      : {}),
  });

  return NextResponse.json({ url: session.url });
}
