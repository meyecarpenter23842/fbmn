# DL12A — Futurebook Miền Nam CEO (Flutter/Dart + Owner-only gateway)

**Owner scope:** Flutter web PWA source and read-only authenticated app foundation.
Only Futurebook Miền Nam; do not deploy or migrate other services in this lot.

## Five tabs
1. Tổng quan — summary from the first page of real Owner inboxes. Counts are *page-limited*, not global KPIs.
2. Hội thoại — read conversations and the first 25 messages in a thread from existing DL10C Worker API; no false read receipts.
3. Gia công — list and inspect existing DL6 outsourcing inbox; `new` is *unhandled*, not proof unread.
4. Liên hệ — list and inspect existing DL9 contact inbox; same status distinction.
5. Thống kê — intentionally disconnected until DL12B. Never display invented Analytics.

## Architecture / privacy
- `apps/ceo/flutter`: Flutter/Dart UI, scoped browser session cookies only, no JWT in Dart, no browser storage of PII, no PostHog connection.
- `apps/ceo/gateway`: same-origin Next BFF with Neon Auth. `/api/auth/[...path]` uses the same Neon Auth SDK contract as existing Admin.
- Owner gate: validate the short-lived server-side JWT via existing restricted Worker `GET /v1/admin/session`, require `role === owner` before each read. Non-owners receive 403; anonymous 401.
- Whitelist only GET `/api/ceo/chat-history`, `/api/ceo/contact-requests`, `/api/ceo/outsourcing-requests`. The gateway forwards via existing Owner-protected Worker endpoints and limits queries/response bytes. No generic public URL forwarding, POST/DELETE, price or customer exports.
- Session cookies and names/emails/messages are never stored in analytics/localStorage or returned through public Website. All gateway responses `Cache-Control: private, no-store`. Client only holds inbox data in in-memory widgets.
- The fifth tab is only a placeholder; no server-to-PostHog Analytics token is configured.

## Known limits and acceptance
- DL12A is not yet a completed live app until DL12D packages the Flutter build into the same-origin gateway deployment, configures Neon Auth/Worker endpoints, establishes PWA icons at required raster sizes, verifies Owner login and tests a real phone.
- There is currently **no persisted chat read/unread receipt** in the DL10C schema. Contact and outsourcing status values `new`/`handled` represent *processing*, not read status. A durable read receipt requires a separately reviewed schema/Worker change; it must not be faked with per-device storage.
- The app can read the first 25 turns; long threads remain accessible through Admin. Future pagination may extend detail without changing the Owner gate.
- No Web Push, badges or push device registration (DL12C), no PostHog query (DL12B), no Vercel CEO production deployment (DL12D).
- Build locally: `cd apps/ceo/flutter && flutter pub get && flutter analyze && flutter test && flutter build web --base-href=/ceo/`.
- Gateway checks: `cd apps/ceo/gateway && npm install && npm run lint && npm run typecheck && npm test && npm run build`.
- DL12D release will copy the `build/web` output under `apps/ceo/gateway/public/ceo` **in the approved build pipeline** and deploy one same-origin application. Do not serve the Flutter frontend from an unrelated domain or place Neon Auth secrets into Flutter compile-time defines.

## Owner session correction — 11/11/2026

CEO now uses the same managed Neon browser JWT flow as Futurebook Admin: client obtains short-lived JWT from same-origin `/api/auth/token`, forwards it in memory to CEO gateway, and the existing Admin Worker independently validates identity + Owner role from DB. JWTs are never persisted, exposed in UI or recorded by telemetry. A missing session returns 401 instead of a false Owner denial; a genuine Worker denial returns 403; upstream failure returns 503. No changes to Owner grants, Neon schema or Admin. Real-device Owner login remains to be validated after CEO deployment.
