import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Resend } from "resend";
import { renderSubscriptionEmail } from "@/lib/emailTemplates";
import { appLogger } from "@/lib/appLogger";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const priceStarter = process.env.STRIPE_PRICE_STARTER;
const pricePro = process.env.STRIPE_PRICE_PRO;
const priceAgency = process.env.STRIPE_PRICE_AGENCY;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function getPlanFromPriceId(priceId: string | undefined) {
  if (!priceId) return "starter";
  if (priceId === pricePro) return "pro";
  if (priceId === priceAgency) return "agency";
  if (priceId === priceStarter) return "starter";
  return "starter";
}

function normalizeSubscriptionStatus(status: string, cancelAtPeriodEnd?: boolean) {
  if (cancelAtPeriodEnd) return "inactive";
  if (status === "canceled" || status === "incomplete_expired") {
    return "inactive";
  }
  return status;
}

function formatPlanLabel(plan: string) {
  if (plan === "pro") return "Pro";
  if (plan === "agency") return "Agency";
  return "Starter";
}

async function sendSubscriptionActivatedEmail(params: {
  userId: string;
  plan: string;
  subscriptionId: string | null;
  trialEnd?: string | null;
}) {
  if (!resend || !params.subscriptionId) return;

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(params.userId);
  if (error || !data.user || typeof data.user.email !== "string" || !data.user.email) {
    return;
  }

  const user = data.user;
  const email = data.user.email;
  const metadata = user.user_metadata ?? {};
  if (metadata.last_subscription_email_subscription_id === params.subscriptionId) {
    return;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.chronocrawl.com";
  const { html, text } = renderSubscriptionEmail({
    planLabel: formatPlanLabel(params.plan),
    dashboardUrl: `${siteUrl}/dashboard`,
    billingUrl: `${siteUrl}/dashboard`,
    trialEndLabel: params.trialEnd
      ? new Date(params.trialEnd).toLocaleDateString("fr-FR")
      : null,
  });

  await resend.emails.send({
    from: "ChronoCrawl <hello@chronocrawl.com>",
    to: email,
    subject: `Ton abonnement ${formatPlanLabel(params.plan)} est actif`,
    html,
    text,
  });

  await supabaseAdmin.auth.admin.updateUserById(params.userId, {
    user_metadata: {
      ...metadata,
      last_subscription_email_subscription_id: params.subscriptionId,
      last_subscription_email_sent_at: new Date().toISOString(),
    },
  });

  appLogger.info("subscription_email:sent", {
    userId: params.userId,
    subscriptionId: params.subscriptionId,
    plan: params.plan,
  });
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
      `Échec de mise à jour de l'abonnement pour ${userId} : ${updateError.message}`
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
      { error: "Webhook Stripe non configuré." },
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
        const stripeSubscription =
          typeof session.subscription === "string"
            ? await stripe.subscriptions.retrieve(session.subscription)
            : null;
        const priceId =
          stripeSubscription?.items.data[0]?.price?.id ||
          (session.metadata?.plan
            ? session.metadata.plan === "pro"
              ? pricePro
              : session.metadata.plan === "agency"
                ? priceAgency
                : priceStarter
            : undefined);
        const normalizedStatus = stripeSubscription
          ? normalizeSubscriptionStatus(
              stripeSubscription.status,
              stripeSubscription.cancel_at_period_end
            )
          : "active";
        const trialEnd = stripeSubscription?.trial_end
          ? new Date(stripeSubscription.trial_end * 1000).toISOString()
          : null;
        const currentPeriodEnd = stripeSubscription?.current_period_end
          ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
          : null;

        await updateUserSubscriptionById({
          userId,
          plan: getPlanFromPriceId(priceId),
          status: normalizedStatus,
          customerId: typeof session.customer === "string" ? session.customer : null,
          subscriptionId:
            typeof session.subscription === "string" ? session.subscription : null,
          trialEnd,
        });

        await upsertSubscriptionState({
          userId,
          plan: getPlanFromPriceId(priceId),
          status: normalizedStatus,
          customerId: typeof session.customer === "string" ? session.customer : null,
          subscriptionId:
            typeof session.subscription === "string" ? session.subscription : null,
          trialEnd,
          currentPeriodEnd,
          cancelAtPeriodEnd: stripeSubscription?.cancel_at_period_end ?? false,
        });

        await sendSubscriptionActivatedEmail({
          userId,
          plan: getPlanFromPriceId(priceId),
          subscriptionId:
            typeof session.subscription === "string" ? session.subscription : null,
          trialEnd,
        });
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId =
        session.client_reference_id || session.metadata?.user_id || "";

      if (userId) {
        const { data: existingRow } = await supabaseAdmin
          .from("user_subscriptions")
          .select("status,plan,stripe_customer_id")
          .eq("user_id", userId)
          .maybeSingle<{
            status: string | null;
            plan: string | null;
            stripe_customer_id: string | null;
          }>();

        if (existingRow?.status === "pending_checkout") {
          await updateUserSubscriptionById({
            userId,
            plan: existingRow.plan || "starter",
            status: "inactive",
            customerId:
              typeof session.customer === "string"
                ? session.customer
                : existingRow.stripe_customer_id,
          });

          await upsertSubscriptionState({
            userId,
            plan: existingRow.plan || "starter",
            status: "inactive",
            customerId:
              typeof session.customer === "string"
                ? session.customer
                : existingRow.stripe_customer_id,
          });
        }
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
        const status = shouldDowngrade
          ? "inactive"
          : normalizeSubscriptionStatus(
              subscription.status,
              subscription.cancel_at_period_end
            );
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
