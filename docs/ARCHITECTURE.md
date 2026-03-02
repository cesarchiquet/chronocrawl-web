# ChronoCrawl Architecture (V1)

## Stack

- Next.js (App Router, TypeScript)
- Supabase (Auth + Postgres)
- Stripe (checkout + billing portal + webhook)
- Resend (digest emails)

## High-level modules

- `app/`
  - Route pages (`/`, `/dashboard`, `/tarifs`, ...)
  - API routes (`/api/*`)
- `components/`
  - Shared UI chrome (navigation/footer)
- `features/`
  - Domain-oriented UI/data extraction from pages
  - Current: `features/landing`
- `lib/`
  - External clients + auth helpers + logger
- `db/`
  - SQL migrations executed in Supabase

## Data flow

1. User adds URLs in dashboard.
2. `POST /api/monitor/run` performs checks and computes changes.
3. Changes are stored in `detected_changes`, surfaced in alert center.
4. Digest email route reads `user_alert_settings` + unread events and sends summaries.
5. Billing state is synchronized through Stripe webhook into `user_subscriptions`.

## Conventions

- Keep route pages focused on orchestration/composition.
- Put heavy UI blocks and static datasets in `features/<domain>/...`.
- Keep API business logic in small helpers when route files grow.
- Use explicit types for DB payloads on critical paths.
- Avoid hidden side effects in render paths.

## Current technical debt (known)

- `app/dashboard/page.tsx` and `app/api/monitor/run/route.ts` are still large.
- Next cleanup should split dashboard blocks and monitor pipeline helpers.
