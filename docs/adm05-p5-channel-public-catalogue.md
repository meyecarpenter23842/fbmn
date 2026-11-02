# ADM-05 P5 - Channel publication and public catalogue
Scope: roadmap.md and Issue #41; no separate roadmap.

- All 613 existing SKUs remain hidden by default. Only the Owner can toggle public_web, dealer_app, consumer_app separately, with confirmation, optimistic revision and audit.
- Only public_web=published is readable by anonymous public APIs. Dealer/consumer flags are recorded for future authenticated apps; they never expose NET/dealer prices.
- Public views fbmn_public.v_p5_visible_skus, v_p5_visible_media and v_p5_image_assets are strictly publication-gated; no fbmn_catalog_private price tables.
- Website derives product/variants from company SKU and family grouping, shows multiple sample pictures, and falls back to placeholder when no media.
- Private R2 objects are streamed only after DB verifies their publication. Browser gets only a virtual asset ID, no internal storage key. Cache no-store.
- Updating publication takes effect without redeploy. Missing category appears in 'Chua phan loai'; categorization stays in Admin.

Release staging: CI green, Codex clean, squash merge; apply the P5 migration on the Neon branch containing 613 SKUs; deploy Admin Worker, public Worker with PUBLIC_MEDIA_R2 read binding, Admin Vercel and Web Vercel manually. No production DB migration or automatic SKU publication.

Owner UAT: Start with 0110 unpublished. In Admin > San pham toggle Web on, reload website /san-pham to see card and two cover images. Toggle Web off to confirm catalogue and image return 404. Toggle Dealer only to confirm website stays hidden. Inspect no price NET or customer fields are returned.

## Release gate - Neon public credentials
- The existing public Worker Hyperdrive points at a **different Neon branch** from the Admin staging catalogue. P5 is intentionally disabled in wrangler until this is fixed.
- Public DB login must have SELECT only on fbmn_public views. It must NOT inherit neon_superuser, neondb_owner, pg_read_all_data, catalogue base-table or private price privileges.
- A least-privilege role fbmn_p5_public_login was created on the catalogue staging branch with no password yet. Provision its password through the secure owner credential workflow, create a Cloudflare Hyperdrive using this role and the catalogue branch endpoint, verify no direct access to fbmn_catalog_private.price_evidence, then switch PUBLIC_P5_ENABLED=true and deploy the public Worker.
- Do not substitute a Neon API-created superuser-like role or repurpose the Admin Hyperdrive for public traffic. Do not claim Website catalogue UAT until this gate passes.

- When enabling P5, set BOTH PUBLIC_P5_ENABLED=true and EXPECTED_DB_ROLE=fbmn_p5_public_login, and point HYPERDRIVE to that same strict-reader login. The Worker deliberately rejects mismatched identities; while P5 is off, legacy EXPECTED_DB_ROLE=fbmn_public_http_staging remains required.
