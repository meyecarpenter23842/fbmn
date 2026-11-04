# WEB Lô 05 — P5 restricted Public Worker release gate (04/11/2026)

Tracking: existing Issue #19, `docs/roadmap.md`. This is the second narrow Lô 05 PR after #122; not another roadmap or issue.

## Verified, read-only inventory at PR creation

- Admin Hyperdrive connects to `ep-old-moon-b5lq2yse.c-7.us-east-2.aws.neon.tech` on the default Neon `production` branch, database `neondb`.
- Dedicated Cloudflare Hyperdrive `fbmn-public-p5-readonly` ID `a41b7ba00cbe4bf6b6485dee613f0a77` points at the **pooled endpoint of that same Neon branch**, with role `fbmn_p5_public_login`. No password/connection string in Git.
- Public reader can SELECT `fbmn_public.v_p5_visible_skus` and P5 media views, but **cannot SELECT** `fbmn_catalog.skus` or `fbmn_catalog_private.price_evidence`. The Worker additionally verifies `current_user`, restricts statements to allowlisted public views and strips private fields from public responses.
- **Release blocker 1:** Cloudflare Hyperdrive database query caching is currently `disabled=false` (60-second max age). It must be disabled in the Cloudflare UI before publishing so Admin hide/toggle changes are not stale.
- **Release blocker 2:** A read-only query at PR creation found **613/613 SKUs published to public_web**. This differs from the earlier one-SKU record. Owner must explicitly confirm they want all 613 publicly visible, or hide unapproved SKUs in Admin, before ANY P5 deploy. Never mass-toggle records automatically.
- **Release blocker 3:** The currently deployed Public Worker only has Hyperdrive, RATE_LIMITER and two plain-text vars, NOT the new P5 R2 or IMAGE_RATE_LIMITER bindings; it still points to old Hyperdrive. Do not hot-patch a binding on live Worker and leave code mismatched.

## PR changes and deploy policy

- `wrangler.jsonc` now selects the dedicated reader Hyperdrive, `PUBLIC_P5_ENABLED=true`, `EXPECTED_DB_ROLE=fbmn_p5_public_login`. Preserves `workers_dev=false` from the reviewed source contract (the existing Worker subdomain is configured separately in Cloudflare), CORS allowlist, R2 binding and separate image rate limiter.
- Static regression checks require the exact dedicated read-only role and ID; no user credentials or private price access is added.
- **Merging this PR does NOT deploy the Public Worker.** CI only executes a Worker build dry run. Do not manually deploy until blockers are cleared, and use the exact reviewed bundle at merged `main`.
- When ready: confirm Hyperdrive cache disabled; Owner publication confirmation; confirm Worker script controls and account; deploy with all four P5 bindings + vars in a single reviewed operation, preserving the existing Worker URL; check `current_user` gate and rejected private endpoint.
- Website production: verify server-side `FBMN_PUBLIC_API_ENABLED=true` and correct public Worker HTTPS origin in Vercel, perform a **single manual Website deploy if environment changed**, never redeploy per SKU change. Confirm SSR /san-pham and images from P5 with 200/404 and no NET/XNT/PII. Owner UAT deferred.
- **Rollback:** restore old Worker deployment/bindings/vars and disable P5. Never change Admin prices/SKUs as rollback.

The CI green/Codex clean gate is required before squash merge, deployment requires separate release readiness confirmation.
