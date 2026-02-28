import Stripe from "stripe";
import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/routeAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { appLogger } from "@/lib/appLogger";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const userId = auth.user.id;

  try {
    const { data: subscriptionRow, error: subscriptionError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("status,stripe_subscription_id")
      .eq("user_id", userId)
      .maybeSingle<{ status: string | null; stripe_subscription_id: string | null }>();

    if (subscriptionError) {
      appLogger.error("privacy_delete:subscription_lookup_failed", {
        userId,
        message: subscriptionError.message,
      });
      return NextResponse.json(
        { error: "Impossible de verifier l'abonnement." },
        { status: 500 }
      );
    }

    const stripeSubscriptionId = subscriptionRow?.stripe_subscription_id || null;
    const status = (subscriptionRow?.status || "").toLowerCase();
    const isBillable =
      status === "active" || status === "trialing" || status === "past_due";

    if (isBillable && stripeSubscriptionId && stripe) {
      try {
        await stripe.subscriptions.cancel(stripeSubscriptionId);
      } catch (cancelError: unknown) {
        appLogger.error("privacy_delete:stripe_cancel_failed", {
          userId,
          stripeSubscriptionId,
          message:
            cancelError instanceof Error ? cancelError.message : "unknown",
        });
        return NextResponse.json(
          {
            error:
              "Suppression bloquee: impossible d'annuler l'abonnement Stripe.",
          },
          { status: 502 }
        );
      }
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      appLogger.error("privacy_delete:user_delete_failed", {
        userId,
        message: deleteError.message,
      });
      return NextResponse.json(
        { error: "Suppression du compte impossible pour le moment." },
        { status: 500 }
      );
    }

    appLogger.info("privacy_delete:success", { userId });
    return NextResponse.json({
      code: "OK",
      message: "Compte supprime. Toutes les donnees liees sont effacees.",
    });
  } catch (error: unknown) {
    appLogger.error("privacy_delete:unexpected_error", {
      userId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Erreur interne suppression compte." },
      { status: 500 }
    );
  }
}
