# ADM-01 — Admin auth/RBAC foundation (issue #11)

Independent Admin Worker. No production deployment. Does not replace the
public API Worker or the legacy B2B Worker. Three business channels:
public_web, dealer_app, consumer_app. Admin is a control plane, not a channel.

## Security

- Neon Auth / Better Auth owns sign-in and session. Client obtains a short-lived
  JWT from the authenticated Neon Auth /token endpoint, sends Bearer token to
  Admin API. Do not send cookie/password, or keep JWT in localStorage.
- Worker checks JWT cryptographic signature via configured JWKS, issuer,
  audience and expiry before using subject ID. The database is the ONLY source
  for permissions: approved principals, enabled flag and channel grants.
- Default principal set is empty; no public sign-up elevates permissions.
  Revocation is checked on every API request; never trust an X-Role header.
- Routes: GET /v1/admin/session (viewer+), GET /v1/admin/channels (viewer+),
  GET /v1/admin/publish-capability (publisher/admin),
  GET /v1/admin/pricing-capability (pricing/admin).
  Capability probes are read-only. No NET, CRUD or user-grant endpoint.
- Audit is append-only; failed audit denies the request. Distinct database
  connection must be the fbmn_admin_http_staging login with membership ONLY
  in fbmn_admin_runtime. Never reuse the public reader credentials.
- Configure ADMIN_HYPERDRIVE, ADMIN_RATE_LIMITER, ADMIN_ALLOWED_ORIGINS,
  NEON_AUTH_JWKS_URL, NEON_AUTH_ISSUER, NEON_AUTH_AUDIENCE as staging
  Cloudflare bindings/secrets. Check issuer/audience against real Neon tokens.
  The committed Wrangler config has no live Hyperdrive binding/routes.

## Required staging acceptance before merge

1. Review and apply the up migration on an approved Neon staging branch,
   verify rollback on disposable staging branch, not production.
   Rollback requires transaction SET LOCAL fbmn.rollback_confirmed = 'yes'.
2. Provision restricted login and an approved Google staging subject after
   authentication. Role grants require DBA-controlled explicit approval.
3. Test real browser Google sign-in/session and JWT, 401, 403, editor/publisher,
   channel scope, immediate role revocation, audit, and migration rollback.
4. Run root npm test and backend/admin-api npm install and npm run build:check.
   Unit tests use a fake verifier and DO NOT establish live auth.
5. CI green, Codex Review clean, squash merge. No production deploy, no
   import of SKU/ZIP/NET price as part of this first PR.
