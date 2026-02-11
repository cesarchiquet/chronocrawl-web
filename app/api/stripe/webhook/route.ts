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

async function upsertSubscriptionState(params: {
  userId: string;
  plan: string;
  status: string;
  customerId?: string | null;
  subscriptionId?: string | null;
  trialEnd?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const {
    userId,
    plan,
    status,
    customerId,
    subscriptionId,
    trialEnd,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  } = params;

  const { data: existingRow } = await supabaseAdmin
    .from("user_subscriptions")
    .select(
      "stripe_customer_id,stripe_subscription_id,trial_end,current_period_end,cancel_at_period_end"
    )
    .eq("user_id", userId)
    .maybeSingle<{
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      trial_end: string | null;
      current_period_end: string | null;
      cancel_at_period_end: boolean | null;
    }>();

  const { error } = await supabaseAdmin.from("user_subscriptions").upsert(
    {
      user_id: userId,
      plan,
      status,
      stripe_customer_id: customerId ?? existingRow?.stripe_customer_id ?? null,
      stripe_subscription_id:
        subscriptionId ?? existingRow?.stripe_subscription_id ?? null,
      trial_end: trialEnd ?? existingRow?.trial_end ?? null,
      current_period_end:
        currentPeriodEnd ?? existingRow?.current_period_end ?? null,
      cancel_at_period_end:
        cancelAtPeriodEnd ?? existingRow?.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(`Echec upsert user_subscriptions: ${error.message}`);
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
    const { data: existingEvent } = await supabaseAdmin
      .from("stripe_webhook_events")
      .select("event_id,status")
      .eq("event_id", event.id)
      .maybeSingle<{ event_id: string; status: string }>();

    if (existingEvent?.status === "processed") {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (!existingEvent) {
      const { error: insertEventError } = await supabaseAdmin
        .from("stripe_webhook_events")
        .insert({
          event_id: event.id,
          event_type: event.type,
          status: "processing",
        });
      if (insertEventError && insertEventError.code !== "23505") {
        throw new Error(
          `Echec enregistrement webhook event ${event.id}: ${insertEventError.message}`
        );
      }
    }

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
          status: "trialing",
          customerId: typeof session.customer === "string" ? session.customer : null,
          subscriptionId:
            typeof session.subscription === "string" ? session.subscription : null,
        });

        await upsertSubscriptionState({
          userId,
          plan: getPlanFromPriceId(priceId),
          status: "trialing",
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
      const hasScheduledCancellation = subscription.cancel_at_period_end === true;
      const shouldDowngrade =
        event.type === "customer.subscription.deleted" ||
        subscription.status === "canceled" ||
        hasScheduledCancellation;

      if (userId) {
        const status = shouldDowngrade ? "inactive" : subscription.status;
        const plan = shouldDowngrade ? "starter" : getPlanFromPriceId(priceId);
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;
        const currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        await updateUserSubscriptionById({
          userId,
          plan,
          status,
          customerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : null,
          subscriptionId: subscription.id,
          trialEnd,
        });

        await upsertSubscriptionState({
          userId,
          plan,
          status,
          customerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : null,
          subscriptionId: subscription.id,
          trialEnd,
          currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
      }
    }

    await supabaseAdmin
      .from("stripe_webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("event_id", event.id);
  } catch (error) {
    await supabaseAdmin
      .from("stripe_webhook_events")
      .upsert(
        {
          event_id: event.id,
          event_type: event.type,
          status: "failed",
          processed_at: new Date().toISOString(),
          error_message:
            error instanceof Error ? error.message : "Erreur webhook Stripe.",
        },
        { onConflict: "event_id" }
      );

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
