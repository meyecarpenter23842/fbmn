# WEB PR08b — Neon isolated public read-model (Issue #10)

## Actual staging execution, 2026-10-29

- GitHub base: `33edae7d2b9fae54fc9c769aaa7af3db1948b8b4`; PR source branch: `feat/web-pr08b-neon-public-read-model`.
- Neon project: `lively-paper-20200386`; fresh branch: `pr08b-public-readmodel-20261029` (`br-nameless-night-b5xnk5qx`).
- Cloned from **existing staging** `pr03-auth-migration-test` (`br-mute-mud-b5dulebp`) at parent LSN `0/1EC0638`. Parent untouched. Production default `br-icy-breeze-b5bqji7p` untouched.
- Snapshot API returned `not allowed to snapshot non-root branch`. **No snapshot was created**. Immutable parent branch / point-of-branch LSN provide a separate restore baseline; further production restore needs an independently approved backup plan.
- A 25-statement initial migration was executed atomically on the new staging branch. DB introspection generated `up.sql` from the resulting schema and view definitions; this is the reproducible candidate for future branch rehearsals.
- Created 8 base tables and 8 `security_barrier` views in `fbmn_public`; no data imported and no demo publications inserted.
- Role `fbmn_public_reader`: NOLOGIN, NOINHERIT, no superuser, no createdb/createrole/bypassrls, and only USAGE on `fbmn_public` + SELECT on the 8 explicit approved/time-gated **views**. **No DEFAULT PRIVILEGES**; new views need explicit review + GRANT.
- READ MODEL contains only Futurebook catalogue and content. No view joins `futurebook`, `neon_auth`, pricing/customer/order tables. Unpublished and expired rows are filtered at the view layer; extra internal/source columns are hidden even when present in base tables.

## Live SQL validation (staging only)

- Metadata privileges: all 8 views SELECT=true; all 8 underlying tables SELECT=false; all 13 existing `futurebook` tables SELECT=false.
- Temporary `GRANT fbmn_public_reader TO neondb_owner WITH SET TRUE, INHERIT FALSE` used **only** for role-switch tests, and subsequently REVOKED.
- `SET LOCAL ROLE fbmn_public_reader` + SELECT public categories/products/promotions: success, currently zero published rows.
- SELECT base `fbmn_public.categories`: **permission denied**.
- SELECT `futurebook.customers`: **permission denied for schema**.
- SELECT `futurebook.sku_prices`: **permission denied for schema**.
- INSERT through `fbmn_public.v_categories`: **permission denied for view**.
- These are transactional access tests; failed queries rolled back. This is not an end-to-end Worker/API smoke test.

## Publication and architecture guardrails

1. Import/reconciliation/admin publication remains **out of scope**. Future publishing service must verify evidence, approvals, reviewed retail-only prices and R2 media; write into dedicated tables in a single audited transaction. Direct DB insert by service is not enabled in this PR.
2. Public views exclude future or withdrawn entries, gate content approvals and time windows, and return only allowlisted fields. Retail price is exposed only if the product mode is `retail` and explicit retail approval/verification exists; 0 VND is allowed by canonical contract. NET/dealer/contract have no public read-model columns.
3. No public DB user/password or Worker binding created. `fbmn_public_reader` is an **NOLOGIN role template** only; a future scoped runtime identity must be provisioned and tested during PR08c. Never use database owner credentials in Workers.
4. No customer/order data was migrated. Source staging branch has legacy private tables; strict role isolation prevents public reader access.
5. This PR does not modify Next.js UI, existing order app, Cloudflare Worker, R2 or Vercel production. Issue #10 stays open for actual data-source/Workers/API tests.

## Apply/rollback gates

- `up.sql` is for a **new empty schema** on an explicitly selected Neon staging branch; first compare with target schema. Apply atomically. Never run an unreviewed migration against default production.
- `verify.sql` is read-only metadata verification; manual impersonation tests are documented above.
- `down.sql` is an **explicitly destructive rollback plan** with a DBA-only confirmation guard, no CASCADE. It has **not been executed**; run only after separate review, preserving any real later publications before dropping tables.
- Before production migration: verify dedicated backup/snapshot alternative, rehearse deploy and rollback on new staging clone, inspect schema diff, audit role access, obtain approval. PR CI never runs SQL remotely.

## Code review P2 repairs

- Retail price has independent `retail_price_valid_from` / `retail_price_valid_until` dates (nullable end). Base table rejects non-null retail prices without effective start date; the public variant view returns NULL outside the effective window while keeping SKU visible. Migration and staging view are aligned.
- Legacy `futurebook` schema revocation now runs inside `DO ... IF EXISTS`, so a clean database without the legacy schema can apply the same migration atomically. No permission grant to legacy tables occurs.
- Separate regression checks assert both behaviors. These fixes were applied on the isolated PR08b staging branch only.

## Clean-branch migration rehearsal (same SQL file)

- Dedicated clean rehearsal branch: `pr08b-clean-rehearsal-20261029` (`br-broad-sun-b5or5p77`) cloned from untouched default `production` (`br-icy-breeze-b5bqji7p`). **No production writes**.
- Executed the exact committed `up.sql` file on this clean branch using a 24-statement SQL transaction: **success**. No `futurebook` legacy schema was needed.
- Schema verification remains a separate step and the down migration was **not** executed.
