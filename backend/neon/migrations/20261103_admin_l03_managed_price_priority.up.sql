-- L03: explicit priority for user-defined channel pricing.
BEGIN;
ALTER TABLE fbmn_catalog_private.managed_price_lists
 ADD COLUMN priority integer NOT NULL DEFAULT 100 CHECK(priority BETWEEN 0 AND 10000);
GRANT UPDATE(priority) ON fbmn_catalog_private.managed_price_lists
 TO fbmn_admin_http_staging;
COMMIT;