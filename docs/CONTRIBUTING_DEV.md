# Dev Contribution Guide (V1)

## Local setup

```bash
npm install
npm run dev
```

Required environment variables are documented in `.env.local` examples used by routes:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_AGENCY`
- `STRIPE_PORTAL_CONFIGURATION_ID` (optional but recommended in production)
- `RESEND_API_KEY`

## Quality gate before commit

```bash
npm run lint
npm run build
```

## Folder rules

- Shared app chrome/UI: `components/`
- Domain blocks/content: `features/<domain>/`
- Route composition only: `app/**/page.tsx`
- API route entrypoints: `app/api/**/route.ts`
- Infra/helpers: `lib/`
- SQL migrations only: `db/`

## PR rules

- Prefer small commits with one intent each.
- Preserve UI behavior unless change is explicitly requested.
- Add/adjust docs when introducing new route or module.
- If changing database behavior, include matching SQL migration.
