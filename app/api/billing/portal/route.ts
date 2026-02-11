import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe non configure (cle secrete manquante)." },
      { status: 500 }
    );
  }

  const { userId } = (await request.json()) as { userId?: string };

  if (!userId) {
    return NextResponse.json(
      { error: "Utilisateur manquant." },
      { status: 400 }
    );
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(userId);

  if (userError || !userData.user) {
    return NextResponse.json(
      { error: "Utilisateur introuvable." },
      { status: 400 }
    );
  }

  const customerId = userData.user.user_metadata?.stripe_customer_id as
    | string
    | undefined;

  if (!customerId) {
    return NextResponse.json(
      { error: "Compte client Stripe introuvable pour cet utilisateur." },
      { status: 400 }
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || "";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
