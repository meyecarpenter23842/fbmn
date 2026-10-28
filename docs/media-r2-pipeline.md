# WEB PR 05 — Cloudflare R2 Media Pipeline

## Actual audit 2026-10-28 (read-only)

- Existing bucket: fbmn, APAC Standard, created 2026-10-27.
- Object list: empty (0 files). Custom domains: none. Managed r2.dev: disabled.
- CORS: not configured (404 / Cloudflare code 10059 on GET).
- Owner-approved logo/SKU photos/banners: none accessible in Project Files/Library for this turn.
- No bucket creation, object PUT, access changes, Vercel deploy, Neon mutation or changes to order.

Reuse the empty fbmn bucket with strict, separate prefixes. Do not create another bucket now. No production public route can be enabled until a domain, content ownership and publishing boundary are reviewed.

## Approved key conventions

- brand/{name}-v{integer}.png|webp|jpg|avif
- products/{confirmed-SKU}/{view}-v{integer}.webp|png|jpg|avif
- banners/{campaign-id}/{placement}-v{integer}.webp|png|jpg|avif

All object keys are case-sensitive ASCII without spaces/traversal/query strings. Do not store source PDFs, NET price lists, raw customer data or private staging assets under public prefixes. Use fresh versioned filenames rather than overwriting a published key.

## Safe publication workflow

1. Authenticated editor obtains a short-lived, scoped upload ticket from a future Workers Admin API. Neither browser nor website receives R2 access keys.
2. Upload to private staging. Backend validates actual file bytes, MIME, dimensions, size and source ownership; rejects SVG/scripts and non-image files.
3. Authorized publisher reviews and approves exact file version, source evidence and alt text. Backend moves/copies safe image to an approved key; audit the revision.
4. Public read Worker enforces the approved-key allowlist before streaming images, or use a separate public bucket containing **only** approved images. An entire mixed private/public bucket must not be made public.
5. Server returns allowlisted public media DTOs to website/native. NET/contract source data are never part of public payloads.

Current PR adds vetted key/approval/origin validation and VerifiedMediaImage with error fallback, not upload or publishing API. Site media registry remains empty, so the existing approved CSS/UI layout stays unchanged.

## Serving, caching, and responsive behavior

- Leave NEXT_PUBLIC_MEDIA_BASE_URL unset until trusted HTTPS custom media origin is reviewed and live.
- A trusted public image response must have correct Content-Type (image/jpeg, png, webp, avif), Cache-Control: public, max-age=31536000, immutable **only** for approved versioned files.
- Revoke a published file by replacing its manifest key/version; the future read Worker must consider CDN cache purge/revocation.
- Cross-origin img does not need admin-upload CORS. Future signed browser PUT requires narrowly scoped CORS origins, methods and headers.
- Keep original file private; publish server-generated thumb/mobile/desktop derivatives after review. Actual responsive derivatives and image compression are pending real images and upload processing.
- Logo fallback is FB text; hero fallback remains existing notebook illustration. Verified assets carry intrinsic pixel width/height and responsive sizes; network errors also fall back.
- No bottom native tabs, dock or sticky cart are added.

## Acceptance gates

- [x] Bucket/domain/object inventory and decision to reuse bucket.
- [x] Versioned safe path, approved source/status validation, HTTPS-origin allowlist.
- [x] Fallback UI integrated without redesigning desktop/mobile pages.
- [x] Privacy, path traversal, MIME and missing-media automated tests.
- [ ] Original Futurebook logo, product photos and banners supplied with approvals.
- [ ] Media distribution domain and public read isolation approved.
- [ ] Authenticated upload, byte verification, generated responsive derivatives in Workers/Admin.
- [ ] Real R2 uploads, Content-Type/Cache-Control/CORS and permission testing.
- [ ] Visual device QA at 360/390/768/1280/1440 px and explicit staging deploy approval.

**Keep Issue #7 open.** This PR establishes the safe code foundation but live image publishing cannot be completed without approved source files and a read endpoint. Do not deploy Vercel automatically or change production settings.
