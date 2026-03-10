# ChronoCrawl Architecture (V1)

## Stack

- Next.js (App Router, TypeScript)
- Supabase (Auth + Postgres)
- Stripe (checkout + billing portal + webhook)
- Resend (digest emails)

## High-level modules

- `app/`
  - Route pages (`/`, `/dashboard`, `/dashboard/audit-seo`, `/dashboard/alerts`, `/tarifs`, ...)
  - API routes (`/api/*`)
- `components/`
  - Shared UI chrome (navigation/footer)
- `features/`
  - Domain-oriented UI/data extraction from pages
  - Current: `features/landing`, `features/dashboard`
- `lib/`
  - External clients + auth helpers + logger
  - Monitor pipeline helpers (`monitorDiff`, `monitorFetch`, `monitorDedupe`, `monitorRun*`)
- `db/`
  - SQL migrations executed in Supabase

## Active product surface

- `Surveillance`
  - monitored URLs
  - alert center
  - alert history
- `Audit SEO`
  - structured competitor page audit
- Removed from active path
  - dashboard `Pricing` module

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

- `app/dashboard/page.tsx` remains a central orchestrator and can still be split by hook/state domains.
- `app/api/monitor/run/route.ts` now delegates core logic to `lib/monitor*`, but endpoint orchestration can be split further into service layers.
