# Stripe Live Setup

Use this checklist when switching ChronoCrawl from test billing to real Stripe subscriptions.

## 1. Create products and recurring prices

Create three recurring monthly prices in Stripe:

- `Starter`
- `Pro`
- `Agency`

Keep the billing interval identical to what the UI promises.

Copy the live price IDs into deployment variables:

- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_AGENCY`

## 2. Create the billing portal configuration

In Stripe Billing Portal:

- allow customers to cancel subscriptions
- allow customers to switch between `Starter`, `Pro`, and `Agency`
- keep ChronoCrawl as the return destination

Copy the portal configuration ID into:

- `STRIPE_PORTAL_CONFIGURATION_ID`

## 3. Configure the checkout and site URLs

Set these variables in production:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`

`NEXT_PUBLIC_SITE_URL` must be the public canonical site URL, for example:

```txt
https://www.chronocrawl.com
```

## 4. Create the webhook endpoint

Create a live webhook endpoint in Stripe:

```txt
https://www.chronocrawl.com/api/stripe/webhook
```

Subscribe it to at least:

- `checkout.session.completed`
- `checkout.session.expired`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy the webhook signing secret into:

- `STRIPE_WEBHOOK_SECRET`

## 5. Database prerequisites

Run the billing migration if it is not already applied:

- `db/003_billing_source_of_truth.sql`

The key tables are:

- `public.user_subscriptions`
- `public.stripe_webhook_events`

## 6. Production smoke test

Run the real flow with a real low-value test price or in Stripe test mode first:

1. Sign up with a fresh account
2. Start checkout on `Starter`
3. Confirm Stripe checkout returns to the dashboard
4. Verify `user_subscriptions` is updated
5. Open the billing portal
6. Switch plan or cancel
7. Verify webhook sync updates the dashboard state

## 7. Expected ChronoCrawl behavior

The current code is designed so that:

- a user with an active subscription is redirected to the billing portal instead of creating a duplicate checkout
- an expired checkout clears `pending_checkout`
- subscription status is synchronized from the real Stripe subscription object

If one of these behaviors fails in production, debug the webhook first.
