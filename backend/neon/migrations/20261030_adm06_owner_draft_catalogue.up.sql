-- ADM-06: scoped permission migration for existing fbmn_catalog staging tables.
-- Apply only AFTER the approved 20261029_adm02_catalogue_master.up.sql.
-- Does not insert SKUs, change prices, or publish any product.
BEGIN;
DO $check$ BEGIN
  IF to_regclass('fbmn_catalog.skus') IS NULL OR
     to_regclass('fbmn_catalog.families') IS NULL OR
     to_regclass('fbmn_catalog.audit_events') IS NULL
  THEN RAISE EXCEPTION 'Catalogue draft schema is not installed'; END IF;
END $check$;
GRANT USAGE ON SCHEMA fbmn_catalog TO fbmn_admin_http_staging;
GRANT SELECT, INSERT, UPDATE ON fbmn_catalog.skus TO fbmn_admin_http_staging;
GRANT SELECT, INSERT ON fbmn_catalog.families TO fbmn_admin_http_staging;
GRANT INSERT ON fbmn_catalog.audit_events TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog.audit_events_id_seq TO fbmn_admin_http_staging;
-- Deliberately NO privileges on fbmn_catalog_private, media_assets,
-- publications or ANY public website tables.
COMMIT;
