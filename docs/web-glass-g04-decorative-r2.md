# G04 / G04R — Decorative R2 background / glass fallback (08/11/2026)

**Scope:** Futurebook Website Song Natural visual pilot, plus the *minimal* existing public Worker read endpoint explicitly requested by Owner. No Admin, DB, pricing, SKU, product media, authentication, layout, or SEO change.

## Verified image / binding (read-only)

- **Correct Cloudflare account**: the one hosting `futurebook-mien-nam-public-api-staging`, not another account with a different empty bucket also named `fbmn`. The previous initial G04 inventory (0 objects) was from that other bucket and is **not the source of this image**.
- Correct R2 bucket `fbmn`: exact existing object `banners/G04/backdrop-v1.webp`, **2,135,264 bytes**, `image/webp`, checked using the connected Cloudflare account after the Owner's screenshot.
- This bucket's **Public Access remains disabled** (no custom domain; managed r2.dev disabled).
- Existing deployed public Worker binding `PUBLIC_MEDIA_R2` resolves to `fbmn` in the *correct* account. It already serves approved SKU images using that binding.
- Website Vercel already has `FBMN_PUBLIC_API_BASE_URL` (configured in production; value not disclosed); the website uses its existing SSR public Worker proxy pattern.
- Exact object is authorized by Owner's instruction to connect this specific decorative background. Other objects in `banners/` or private directories remain inaccessible through this endpoint.

## G04R — Connecting the real image

1. **Cloudflare Worker** (`backend/public-api/staging-worker.mjs`): add `GET /v1/public/decorative-background`, which reads only the constant, Owner-approved `banners/G04/backdrop-v1.webp` with the existing `PUBLIC_MEDIA_R2` binding. Validates GET, no query, approved Origin, existing media rate limit, bounded image size (16 bytes – 5 MiB) and exact WebP MIME; no key supplied by a caller, no database lookup, no bucket list. All failures close without returning other R2 bytes.
2. **Website same-origin proxy** (`app/api/decorative-background/route.ts`): uses the existing server-only `FBMN_PUBLIC_API_BASE_URL`, rejects invalid worker origins, redirects, query strings, oversized images and bad MIME. Emits a `/api/decorative-background` WebP response. Neither R2 credentials nor the private object key are passed to the browser.
3. **GlassPageBackdrop** (`components/glass-ui.tsx`): opt-in exact, typed `decorativeReadPath="/api/decorative-background"` **only on the Song Natural page**. Existing `decorativeMedia` / `publicMediaOrigin` contract stays intact for other approved media in future.
4. **Fallback** (`app/glass-foundation.css`): existing overlay → image → lavender gradient layering remains; missing image/Worker 404/503 leaves the gradient visible with no UI, SKU or layout changes.
5. **Tests**: simulated Worker R2 GET/denials and Website proxy success/denials, exact route allowlist, rate limit, missing/bad image, CSS fallback, G03 selection/gallery regression; CI lint/typecheck/tests/build and Codex.

## Production enablement checklist

- [x] Verify exact object/mime/size in the correct Cloudflare account.
- [x] Verify the existing Worker already has R2 access to the correct bucket (read-only inspection).
- [ ] PR CI green + Codex clean, squash merge development main and owner-led fast-forward sync to main repo.
- [ ] **Deploy reviewed public Worker first**, only with Owner's explicit authorization; verify exact endpoint serves WebP and rejects other paths/queries.
- [ ] **Deploy reviewed Website second**, only with Owner authorization; verify `GET /api/decorative-background` is HTTP 200, `image/webp`, and Song Natural loads the photo. Verify fallback with simulated unavailable remote.
- [ ] Visual QA screenshots at 1440 / 1280 / 768 / 390 / 360px, SKU/gallery/CTA and LCP/contrast. 2.14 MB decorative asset may need a responsive compressed derivative in a future approved step.

**Release boundary:** No production deployment or R2 access changes in this PR. Do not enable Public Access or raw `r2.dev` for the bucket. This is an explicitly fixed one-image read contract, **not** a general CMS background configuration system; changing the file/version currently requires a reviewed allowlist update.
