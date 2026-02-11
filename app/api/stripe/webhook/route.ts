import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const priceStarter = process.env.STRIPE_PRICE_STARTER;
const pricePro = process.env.STRIPE_PRICE_PRO;
const priceAgency = process.env.STRIPE_PRICE_AGENCY;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

function getPlanFromPriceId(priceId: string | undefined) {
  if (!priceId) return "starter";
  if (priceId === pricePro) return "pro";
  if (priceId === priceAgency) return "agency";
  if (priceId === priceStarter) return "starter";
  return "starter";
}

async function updateUserSubscriptionById({
  userId,
  plan,
  status,
  customerId,
  subscriptionId,
  trialEnd,
}: {
  userId: string;
  plan: string;
  status: string;
  customerId?: string | null;
  subscriptionId?: string | null;
  trialEnd?: string | null;
}) {
  const { data: userData, error: userError } =
    await supabaseAdmin.auth.admin.getUserById(userId);
  if (userError || !userData.user) {
    throw new Error(
      `Utilisateur introuvable pendant webhook Stripe (${userId}).`
    );
  }

  const existingMetadata = userData.user.user_metadata ?? {};

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      user_metadata: {
        ...existingMetadata,
        plan,
        subscription_status: status,
        stripe_customer_id: customerId ?? existingMetadata.stripe_customer_id,
        stripe_subscription_id:
          subscriptionId ?? existingMetadata.stripe_subscription_id,
        subscription_trial_end:
          trialEnd ?? existingMetadata.subscription_trial_end ?? null,
      },
    }
  );

  if (updateError) {
    throw new Error(
      `Echec mise a jour abonnement pour ${userId}: ${updateError.message}`
    );
  }
}

export async function POST(request: Request) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Webhook Stripe non configure." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Signature invalide";
    return NextResponse.json({ error: details }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId =
        session.client_reference_id || session.metadata?.user_id || "";

      if (userId) {
        const priceId = session.metadata?.plan
          ? session.metadata.plan === "pro"
            ? pricePro
            : session.metadata.plan === "agency"
              ? priceAgency
              : priceStarter
          : undefined;

        await updateUserSubscriptionById({
          userId,
          plan: getPlanFromPriceId(priceId),
          status: "active",
          customerId: typeof session.customer === "string" ? session.customer : null,
          subscriptionId:
            typeof session.subscription === "string" ? session.subscription : null,
        });
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      const priceId = subscription.items.data[0]?.price?.id;
      const shouldDowngrade =
        event.type === "customer.subscription.deleted" ||
        subscription.status === "canceled";

      if (userId) {
        await updateUserSubscriptionById({
          userId,
          plan: shouldDowngrade ? "starter" : getPlanFromPriceId(priceId),
          status: shouldDowngrade ? "inactive" : subscription.status,
          customerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : null,
          subscriptionId: subscription.id,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
        });
      }
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur webhook Stripe.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
