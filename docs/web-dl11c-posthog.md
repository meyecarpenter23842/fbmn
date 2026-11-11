# DL11C — PostHog Website / hợp đồng Analytics CEO

Scope: Website Futurebook only. No migration, Worker changes or Admin events.
The Admin uses its own admin_* event namespace and a constant aggregate identity.
The public Website uses web_* events and ephemeral session-scoped anonymous IDs.

## KPI definitions
- Pageviews: count web_page_view grouped by day and page_type.
- Sessions: count web_session_start (30-minute inactivity expiry, sessionStorage only).
- Approximate visitors: unique distinct_id across web_session_start per day. This is **session-level reach**, not true cross-session unique users; cross-device/browser deduplication is deliberately impossible without persistent IDs.
- Acquisition: traffic_source=google/facebook/zalo/direct/referral. UTM source maps to a controlled channel, utm_medium uses a fixed enum, utm_campaign only accepts FBMN-managed 'fbmn-' codes. Referrer hostname is classified locally; full referrer and query are never transmitted.
- Category/product interest: web_category_view (category_key), web_product_view (product_key); web_sku_view (product_key, sku) when SKU is shown/changed.
- Catalogue: web_catalogue_view (book_id) after actual book payload is validated and displayed.
- PDF: web_pdf_view_request / web_pdf_download_request are **clicks only**; web_pdf_view_served / web_pdf_download_served are emitted by the server **only after** a 200 PDF response with valid content length/type from the Public Worker. A served 200 is **not** proof a user saved the complete file.
- Chat: web_chat_open after launcher opens, no chat text or conversation ID.
- Contact and outsourcing: *_submit_attempt before HTTP request; *_submit_success **only** for 201 with JSON {ok:true}. Failures do not count as conversion.

## Shared event properties (strict allowlist)
event, anonymous session_id UUIDv4, traffic_source, optional utm_medium and utm_campaign. Event-specific properties: page_type, category_key, product_key, sku, book_id. Server adds constant app='futurebook_website', PostHog personless settings, $ip=null and geoip disabled. The PDF server event contains only book_id and constant app; it never reads cookies, client IP, referrer, form values or UA.

No posthog-js, auto-capture, replay, heatmap, fingerprint, localStorage, cookie, URL query or arbitrary custom properties. GPC and Do-Not-Track suppress client events and server-side PDF served events. Missing browser cryptography disables tracking instead of interrupting business workflows. Analytics never blocks form/chat workflows. Strict origin/JSON/schema/size checks on POST /api/analytics. Key is server-side only.

## Vercel production
- FBMN_WEB_POSTHOG_ENABLED=1
- FBMN_WEB_POSTHOG_KEY = existing PostHog **project capture key**, stored as sensitive server-only env; never NEXT_PUBLIC.
- FBMN_WEB_POSTHOG_HOST = https://us.i.posthog.com (or exact existing project region).
If unconfigured the endpoint is an inert 204 and PDF tracking is disabled. No new analytics service.

## Acceptance evidence required
1. Review PR + 4 CI checks, Codex review and browser QA (360/390/768/1280/1440).
2. Validate POST no PII with tests, reject extra fields, multiple navigations no duplicate.
3. After production deploy, perform a real visit, category/product/SKU selection, catalogue open, PDF served and real successful/unsuccessful form submissions only if Owner-provided safe test data.
4. Query actual PostHog events to confirm ingestion (HTTP acceptance alone is not evidence). Without read access to PostHog, mark ingestion unverified and do not call DL11C fully verified.
5. For DL12B API query, use server-to-PostHog read credentials when separately approved; never expose query/API keys in Flutter or browser.
