# WEB PR08 — Header branding, menu animation, safe contact API foundation
- Official logo derived from owner-supplied Futurebook Miền Nam image; no fabricated replacement.
- Responsive header uses the actual image asset; mobile top-right dropdown has semi-transparent purple, blur, gentle ease-out motion and reduced-motion fallback. Tapping outside or Escape closes the dropdown.
- POST /api/contact: same-origin JSON, 8 KiB payload cap, consent/field/honeypot/time checks. Always returns 503 after valid input until durable backend, privacy, rate limiting and anti-spam are independently verified.
- Contact form stays disabled; no contacts are persisted and no success is reported.
- No automatic Vercel deployment; preview release is user-requested and production stays unchanged.
