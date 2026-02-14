# Legacy Netlify Functions

This folder contains old Netlify Functions kept only for historical reference.

- `early-access.ts`
- `launch.ts`
- `alert-change.ts`
- `emails/*`

These handlers are no longer part of the active ChronoCrawl product flow.
The active product uses Next.js API routes under `app/api/*`.

Before re-enabling any legacy function, validate:

1. It is still called by a live frontend flow.
2. Its env vars are still present and valid.
3. It does not conflict with current API routes.
