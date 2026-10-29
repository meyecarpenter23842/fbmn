# ADM-01 — web login console UAT (non-production)

This is a **real authentication/authorization console**, NOT a products CRUD UI.
It has no mock user, fake JWT, self-grant, price data or public-reader DB access.

## Independent Admin Vercel project

Project `fbmn-admin` (root `apps/admin`) is physically separate from production Website `fbmn-web`. The only public route is `/` (not `/admin` on the website). Do not deploy this Next app via Website project. Admin has its own manual preview deployment workflow; no production deployment.

## Preview-only Vercel environment

- `NEON_AUTH_BASE_URL`: exact Neon Auth **staging** base URL (HTTPS)
- `NEON_AUTH_COOKIE_SECRET`: unique random >=32 character secret, preview-only
- `FBMN_ADMIN_API_BASE_URL`: independent **Admin** Cloudflare staging Worker origin (HTTPS, ending /). NOT the public Worker or legacy B2B Worker.
- Register the precise preview URL in Neon Auth staging trusted domains after preview is created; no wildcard and no prod-domain changes.

The OAuth sign-in uses Neon Auth via same-origin `/api/auth/[...path]`.
The server-side BFF reads a fresh authenticated token and calls only four
allowlisted GET Admin Worker endpoints; JWT never enters browser localStorage.
Browser displays `401` unauthenticated, `403` no DBA-approved role, and `503`
not configured/unavailable. Preview URL cannot prove success if worker/DB/role are not connected.

## Acceptance

1. Anonymous `/` shows Google login. `/api/admin/session` => 401.
2. Google login returns to `/`; non-provisioned subject gets 403, not Admin.
3. DBA explicitly provisions approved subject role and allowed channels on staging.
4. Approved subject sees actual DB role and channel list.
5. Revoke in staging DB; refresh returns 403, audit checks grant/denial.
6. Smoke 401/403/200 on actual Worker; test rollback on **disposable** Neon branch.
7. Merge only with green CI and Codex, deploy **preview only** by explicit command.
8. No production deploy, no SKU/price/media import in ADM-01.
