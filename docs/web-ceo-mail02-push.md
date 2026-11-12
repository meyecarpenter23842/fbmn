# CEO-MAIL02 — Web Push on incoming Resend email (12/11/2026)

## Current diagnosis
CEO-MAIL01 supports real send/receive but its earlier scope never included Resend notifications. The connected Resend account initially has zero webhooks. Existing DL12C Cron scans only chat, contact and outsourcing, so a new inbound email did not create a push event.

## Narrow implementation
- Resend **email.received** -> POST https://ceo.fbmn.vn/api/ceo/mail/webhook. Do not use `inbox.email.received` because this integration uses Resend Receiving, not Inbox.
- Authenticate every event from its **raw body** and the `svix-id`, `svix-timestamp`, `svix-signature` headers with the Resend `RESEND_WEBHOOK_SECRET` (5-minute tolerance); fail closed if unconfigured. Do not trust the sender's subject/body.
- Accept only valid provider UUIDs delivered to `info@fbmn.vn`. Insert `mail:<uuid>` into the existing private `ceo_push_events` queue, with `kind='mail'`, UUID and received timestamp. No email content, sender address, attachments or PII in the queue.
- The existing five-minute Admin Worker dispatch invokes the CEO Vercel push dispatcher, which uses VAPID and per-device receipts to prevent duplicate pushes and retries failures. Delivery can lag up to a Cron interval.
- Service worker shows only **Email mới đến**; click opens `/ceo/index.html?tab=mail&id=<uuid>`, selecting Hộp thư đến and reading the exact email via the existing Owner-only mail detail API. Badge count remains limited to unseen contact/outsourcing requests; no invented email unread status.

## Owner-gated production rollout
1. CI + Codex review clean; squash merge into development `main`; mirror identical tree fast-forward to primary `main`.
2. Approve and apply `backend/neon/migrations/20261112_ceo_mail02_push.up.sql` after DB backup; it only expands the existing event-kind CHECK constraint. No Worker source changes.
3. Configure server-only encrypted `RESEND_WEBHOOK_SECRET` on **fbmn-ceo** Vercel project; do not expose it to Flutter, browser or Git. Create the Resend webhook for `email.received` only after the endpoint and secret are live; store its signing secret securely.
4. Deploy only CEO production (no Website/Admin/Worker code). Confirm the existing DL12C Worker Cron and device Web Push are active. Confirm webhook delivery 2xx in Resend.
5. Test on a subscribed Owner device: send an actual external email, wait up to five minutes, close app and verify notification; tap to open exact mail, verify another Resend replay does not re-notify; check authorization and sign-out. Chrome/Edge on desktop/mobile; iOS 16.4+ installed PWA required.

No unsolicited outgoing email and no production migration, webhook creation, or deployment without Owner authorization.
