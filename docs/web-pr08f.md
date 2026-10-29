# WEB PR08f — API public staging running (29 October 2026)

Cloudflare Worker **separate from B2B**: `futurebook-mien-nam-public-api-staging`.
Live URL: `https://futurebook-mien-nam-public-api-staging.fbmn-alibaba240185.workers.dev`

Source: `backend/public-api/{worker-entry.mjs,staging-worker.mjs,handler.mjs,read-model.mjs}`.
- Hyperdrive `a49c268446874bda9c9f0c0ec2777e7e`, Neon staging `br-broad-sun-b5or5p77` with manually created view-only login `fbmn_public_http_staging`.
- PostgreSQL direct origin; query caching disabled; Cloudflare rate limit binding 60/60 per POP and route/IP bucket.
- Cloudflare Worker module was uploaded from Wrangler-built artifact, with bindings validated through Cloudflare API; `workers.dev` is enabled for testing. Deployment uses NO production migrations.
- Real HTTP checks passed on GitHub Actions run `40883055487` (GET categories/products/content 200, malformed query 400, forbidden origin 403, private route 404, POST 405, OPTIONS 204).
- Public read model currently has **zero approved categories/products/content**. API responses genuinely empty; do not invent demo catalogue or prices.
- B2B Worker `futurebook-mien-nam-api-staging` and its Hyperdrive unchanged. Existing Vercel website remains unaffected until explicitly enabled/deployed.
- Sensitive operational note: the database password was visible in user screenshots. Rotate credential before importing actual business data or moving beyond staging. SQL role SELECT permissions remain restricted, no NET or customer tables.

The temporary GitHub Actions bundle-transfer workflow used to upload the compiled source was intentionally removed before merge. Live HTTP smoke workflow remains for repeatable checks.
