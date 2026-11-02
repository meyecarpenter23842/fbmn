-- Explicit rollback for the G03 identifier migration.
-- WARNING: removes displayed stable identifiers and must not be run once exported.
-- Does not change SKU ids, category_id or family_id relationships.
BEGIN;
ALTER TABLE fbmn_catalog.categories DROP COLUMN category_code;
ALTER TABLE fbmn_catalog.families DROP COLUMN family_code;
REVOKE USAGE ON SEQUENCE fbmn_catalog.category_code_seq FROM fbmn_admin_http_staging;
REVOKE USAGE ON SEQUENCE fbmn_catalog.family_code_seq FROM fbmn_admin_http_staging;
DROP SEQUENCE fbmn_catalog.category_code_seq;
DROP SEQUENCE fbmn_catalog.family_code_seq;
DROP FUNCTION fbmn_catalog.next_stable_taxonomy_code(text,regclass);
COMMIT;
