# WEB PR08c — Server-side public API adapter and fixed-view read-model

## Delivered
- Next.js catalogue/content SSR adapters can use `FBMN_PUBLIC_API_BASE_URL` only when `FBMN_PUBLIC_API_ENABLED=true`; defaults to the verified empty local data, **not** demo fixtures.
- All remote API payloads are parsed with a **field allowlist** (never spread raw JSON), HTTPS URL validation, size/time limits, bounded pagination and no-store.
- With remote mode enabled, 400/503/network failures **throw**. They never masquerade as empty catalogue or confirmed success.
- Cloudflare Worker-facing database projection `backend/public-api/read-model.mjs` has only eight **fixed** SQL queries over `fbmn_public.v_*` views from PR08b, no user query interpolation and no `futurebook`, customer, NET or orders tables.
- Tests validate JSON filtering, SSR-only mode switch, URL controls, missing API and SQL query allowlist.

## Not enabled yet (mandatory gates)
- The existing `futurebook-mien-nam-api-staging` Worker has a Hyperdrive/Auth setup tied to B2B and MUST NOT be repurposed.
- A *separate* public Worker and *dedicated LOGIN role* inheriting only `fbmn_public_reader` need to be created and E2E verified; NOLOGIN role alone cannot connect. Do **not** put a Neon owner credential in a Worker or Vercel.
- Cloudflare rate limiting needs a verified binding before exposing the Worker to the Internet.
- Production DB schema is not migrated or populated. PR08b remains isolated to Neon branches; review independent production backup strategy before promotion.
- No published Futurebook SKU, prices or campaigns have been approved; showing zero verified records is expected.

## Release gate
- Merge after green CI and completed code review.
- User-authorized **manual Vercel production deploy** may release this opt-in infrastructure with `FBMN_PUBLIC_API_ENABLED` absent/false; this does not activate the database source.
- Never mark the Worker–Neon live connection completed until server-side credential isolation, Worker staging HTTP responses, rate limit, and private data negative tests all pass.
