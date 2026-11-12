# CEO-MAIL03 — Push opt-in persistence & Resend attachments (2026-11-12)

## Owner request
- A device previously enabled for Web Push should remain enabled when the CEO PWA is closed/reopened or its service-worker registration is replaced, without prompting again.
- Compose and reply must support **real email attachments**, not cosmetic file names or HTML-only links.

## Web Push
- Persist only a browser-local boolean `fbmn-ceo-push-opt-in-v1`, never JWT/endpoint/keys/customer data.
- On authenticated Owner workspace startup, if Notification.permission is still `granted` and opt-in exists, re-register `/ceo/push-sw.js`, recover/create the browser subscription and POST it to existing Owner-only `/api/ceo/push/subscription`.
- Adopt existing live subscriptions after upgrade. Never auto-request browser permission; the first enable always needs the button gesture.
- **Off** unsubscribes locally, removes server subscription and clears opt-in. Logout revokes delivery immediately, but preserves the explicit preference for the next Owner sign-in on the same device.
- If OS/browser permission denied or storage cleared, explain and require a new user action. Background push still relies on OS/browser support and the existing five-minute dispatcher.

## Resend attachments
- Flutter CEO uses a file picker in **new and reply** composer. Supports PDF, Word, Excel, PowerPoint, CSV, TXT, JPEG, PNG and WebP. Up to 5 files, 3,000,000 decoded bytes in total. Shows file names, sizes and remove controls.
- File bytes are base64-encoded and submitted only to the existing same-origin Owner Gateway with POST /api/ceo/mail, never exposed publicly or logged.
- Gateway enforces 4,300,000 UTF-8 request bytes, max 5 attachments and 3,000,000 decoded bytes; validates canonical base64, safe file names and types. Body without attachments retains the prior 100,000 byte budget.
- Resend `POST /emails` receives `attachments: [{filename,content}]`. Existing brand signature, reply handling, sender lock and idempotency keys remain unchanged. No database migration, bucket, Worker or other service is required.
- **Why 3MB:** The Vercel function request body limit is 4.5MB including base64 expansion. Large files must use a separate future storage/direct-upload design, not silent truncation or a fake sent indicator.

## Tests & release
Gateway unit tests: malformed attachments, unsafe extensions/filenames, count/byte caps and provider payload. Push bridge tests: restart, logout/relogin, Off, legacy subscriptions and denied permission. Flutter analyze, widget tests, mobile 360px and web bundle build. Verify Codex review and CI before merge.

UAT on an actual Owner device: enable Push, close/reopen without re-enabling, log out/in, explicit Off; attach a small PDF and photo, send to a permitted real test recipient only with Owner's consent, check files and signature in delivered message, and reply with attachments.
