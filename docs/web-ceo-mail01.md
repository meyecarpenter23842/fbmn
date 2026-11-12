# CEO-MAIL01 — Owner email (Resend) — 11/11/2026

## Scope

- App CEO → Liên hệ → Khách liên hệ / Hộp thư đến / Đã gửi.
- Owner-only Next.js gateway: GET /api/ceo/mail?box=inbox|sent, GET /api/ceo/mail/[id]?box=..., POST /api/ceo/mail.
- Provider: Resend verified fbmn.vn domain with sending + receiving enabled, info@fbmn.vn mailbox. Reads are explicitly on refresh/on open, no webhook required.
- CEO-MAIL02 adds a separate signed Resend webhook for *new-email Web Push only*; see docs/web-ceo-mail02-push.md. Inbox refresh behavior remains unchanged.
- Email from is fixed by server; all actions require verified Owner session/JWT, POST requires same origin, safe input validation and bounded payloads. Never expose API key to Flutter or Git. No unsolicited sends in tests.
- Resend stores received/sent email history, Message-ID, delivery state and attachments. CEO-UI01 request read receipts and notifications are unchanged. **Email-specific read flags are not added** (Resend API offers no read/write mutation for these records); mail view has no fake unread badge.
- New/reply compose with original Message-ID header for threading; server obtains reply recipient from incoming Resend email rather than trusting client. Branded HTML + text footer: transparent FBMN logo via https://www.fbmn.vn/brand/fbmn-transparent-logo.webp, business contact, https://www.facebook.com/futurebook.miennam.
- Incoming HTML is converted into plain text; never render untrusted email HTML as Flutter code/webview. Attachment names are shown; download management stays in Resend Dashboard.
- Empty mailbox means the real provider returned zero messages. No sample customers or fake sending statuses.

## Deployment

- Add encrypted server-only RESEND_API_KEY to Vercel fbmn-ceo project (production).
- Vercel build and smoke /ceo/, /ceo/flutter_bootstrap.js, /ceo/manifest.json.
- CI: flutter analyze/test/web build, gateway lint/typecheck/test/build, Codex review clean, squash merge, sync development and primary Git trees before CEO-only production deploy.
- No database migration or Worker changes required. Check real Owner login and actual customer email externally.
