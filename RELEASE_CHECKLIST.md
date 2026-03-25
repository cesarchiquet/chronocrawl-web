# Release Checklist

Use this checklist before each production push.

## 1) Environment and DB

- [ ] Supabase migrations executed (including latest `db/00x_*.sql` files).
- [ ] Required env vars set in deployment target:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `STRIPE_PRICE_STARTER`
  - [ ] `STRIPE_PRICE_PRO`
  - [ ] `STRIPE_PRICE_AGENCY`
  - [ ] `STRIPE_PORTAL_CONFIGURATION_ID` (recommended)
  - [ ] `NEXT_PUBLIC_SITE_URL`
  - [ ] `RESEND_API_KEY`
  - [ ] `ALERT_DIGEST_SECRET` (if digest endpoint used by scheduler)
  - [ ] `MONITOR_SCHEDULE_SECRET` (required for automatic monitoring cron)

## 2) Smoke Flow (Manual)

- [ ] Sign up with a fresh test account (`/signup`).
- [ ] Log in (`/login`) and open dashboard.
- [ ] Add at least 1 URL and run analysis.
- [ ] Confirm:
  - [ ] URL status updates in "URLs surveillees"
  - [ ] URL favorites/tags can be set and filtered
  - [ ] Alerts appear in "Centre d'alertes"
  - [ ] "Voir la preuve" before/after values display
- [ ] In dashboard alert center:
  - [ ] preset buttons apply expected filters
  - [ ] "Enregistrer preset" and "Charger preset" work
  - [ ] export CSV works from current filters
  - [ ] export PDF opens print dialog with report
- [ ] Open full history (`/dashboard/alerts`) and verify:
  - [ ] filters (severity, url, read, date, search)
  - [ ] bulk read/unread actions
  - [ ] pagination ("Charger plus")
- [ ] Export CSV and confirm enriched columns:
  - [ ] `field_key`
  - [ ] `priority_score`
  - [ ] `priority_reason`
  - [ ] `before_short`
  - [ ] `after_short`

## 3) Billing Flow (Manual)

- [ ] Start checkout from landing.
- [ ] Complete Stripe test payment.
- [ ] Confirm user sees active/trialing state in dashboard.
- [ ] Open billing portal and return successfully.
- [ ] If a subscribed user re-clicks a pricing CTA, they are redirected to the billing portal instead of creating a duplicate subscription.
- [ ] A canceled or expired checkout does not leave the account stuck in `pending_checkout`.

## 4) API and Monitoring Sanity

- [ ] Trigger `/api/monitor/run` from dashboard and verify:
  - [ ] queue processes by batches
  - [ ] retries happen on transient failures
  - [ ] failure statuses are actionable (`TIMEOUT`, `DNS_ERROR`, `SSL_ERROR`, `HTTP_xxx`)
- [ ] Confirm dashboard "Sante monitoring" block updates.
- [ ] Netlify scheduled function `monitor-auto-dispatch` is active.
- [ ] Automatic monitoring respects plan frequency:
  - [ ] Starter: every 6h
  - [ ] Pro: every 60 min
  - [ ] Agency: every 15 min
- [ ] Trigger `/api/alerts/digest` (manual test) and verify:
  - [ ] email includes action-oriented summary (HIGH/MEDIUM + focus domain)
  - [ ] email includes "Action prioritaire du jour"
  - [ ] digest marks `digest_sent_at` on included alerts

## 5) Build and Lint

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.

## 6) Public Site

- [ ] Main pages load without layout break:
  - [ ] `/`
  - [ ] `/fonctionnement`
  - [ ] `/blog`
  - [ ] `/contact`
  - [ ] `/mentions-legales`
  - [ ] `/confidentialite`
  - [ ] `/cgu`
- [ ] Footer legal links work.
- [ ] `public/sitemap.xml` includes current pages.
