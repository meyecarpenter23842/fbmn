# G04 — Decorative R2 background / glass fallback (08/11/2026)

**Scope:** Website Futurebook only; no Admin, Worker, DB, API schema, SKU, product media, pricing, routing, SEO, CTA, or production deployment.

## Read-only verification
- Cloudflare R2 account: bucket `fbmn` exists; listing on 08/11/2026 returned **0 objects** (not paginated).
- R2 bucket custom media domains: **none**.
- Managed `r2.dev` endpoint: **enabled**, but this is **not an approved production media origin** and is rejected by the existing `getApprovedMediaUrl` validation.
- Vercel `fbmn-web` production environment variable names: `FBMN_PUBLIC_API_ENABLED` and `FBMN_PUBLIC_API_BASE_URL`; no configured media CDN or decorative background key.
- Website `lib/content/schema.ts` / `lib/public-api/client.ts` currently have **no public decorative-background field**. The CMS placement contract defines banners for `home.hero`, `home.after_products`, `category.header`, but **no decorative background slot**, and documents that public CMS rendering is not connected.
- Existing `approvedSiteMedia` has no approved banner; do not reuse hero or product image as a decorative background.

## Delivered
1. `GlassPageBackdrop` gains an **optional explicit** `decorativeMedia` (approved R2 **banner**) and `publicMediaOrigin` from an approved public source, with `getApprovedMediaUrl` guarding the URL. It never auto-loads a product or private R2 image.
2. `app/glass-foundation.css` is the **only style owner**: no-image rendering uses the **unchanged** G03 lavender gradient; an approved image, when provided, sits between a transparent readability overlay and the same gradient.
3. The transparent veil token is defined only in `app/globals.css`. Backgrounds are CSS decorative images (no extra DOM media, no alt duplication, no size shifts); `cover` + scroll attachment avoid expensive fixed repaint. If the image URL fails after render, the last gradient layer remains visible.
4. G04 regression tests cover approved/private/pending/unsafe media, invalid origin, missing image fallback, layer order, no layout CSS conflict and no change to the Song Natural product flow.

## Still blocked — real R2 image activation
**No actual decorative asset or approved public background configuration currently exists.** The approved-media prop is **not passed by the Song Natural page**; therefore the site correctly stays on gradient fallback. Do not claim live R2 background integration or pixel-level image QA.

To enable an image later, Owner must supply/approve a decorative background and its placement, ensure a safe public-media read path and approved HTTPS origin, and publish that information in a **sanctioned public configuration/read-model**. Only then wire that public value to `GlassPageBackdrop` in a **separately authorized scope**; do not invent fields or expose private bucket URLs for G04.

## Quality/release
- PR on repo phụ, run lint/typecheck/tests/build and Codex review before squash merge.
- Responsive actual-image screenshots at 1440/1280/768/390/360 remain blocked until a real approved image and public config are available.
- No deploy to production without Owner approval.
