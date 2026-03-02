# ChronoCrawl Web

ChronoCrawl is a SaaS for competitive page monitoring: users add URLs, run scans, and receive prioritized alerts when SEO/content/pricing/CTA signals change.

## Tech

- Next.js App Router + TypeScript
- Supabase (Auth + Postgres)
- Stripe (billing)
- Resend (email digest)

## Project layout

```text
app/                  # routes + API endpoints
components/           # shared UI shell components
features/             # domain-oriented UI modules (landing, dashboard, ...)
lib/                  # auth, db clients, helpers
db/                   # Supabase SQL migrations
docs/                 # architecture + contribution guides
```

Detailed docs:

- `docs/ARCHITECTURE.md`
- `docs/CONTRIBUTING_DEV.md`

## Local run

```bash
npm install
npm run dev
```

App URL: `http://localhost:3000`

## Quality checks

```bash
npm run lint
npm run build
```

## Database migrations (Supabase)

Run SQL scripts in order from `db/`:

1. `001_phase1_signal_model.sql`
2. `002_alert_preferences.sql`
3. `003_billing_source_of_truth.sql`
4. `004_monitor_guards.sql`
5. `005_monitor_jobs_queue.sql`
6. `006_monitor_run_logs.sql`
7. `007_detected_changes_perf_indexes.sql`

## Current cleanup status

V1 + V2 + V3 cleanup:

- Landing static content moved to `features/landing/content.ts`
- Landing and dashboard heavy UI blocks extracted into `features/*/components/*`
- Dashboard shared types/utils moved to `features/dashboard/*`
- Monitor diff/fetch/dedupe/request parsing extracted into `lib/monitor*`
- Architecture and contribution docs added for onboarding
