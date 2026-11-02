-- G03: Owner enters meaningful category/family codes. Never generate a fallback.
-- Existing DM/NM codes and all SKU foreign keys stay unchanged.
-- Migration changes no existing rows and has a reversible schema-only DOWN.
BEGIN;
ALTER TABLE fbmn_catalog.categories
  ALTER COLUMN category_code DROP DEFAULT,
  DROP CONSTRAINT fbmn_category_code_format,
  ADD CONSTRAINT fbmn_category_code_format
    CHECK (category_code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$');
ALTER TABLE fbmn_catalog.families
  ALTER COLUMN family_code DROP DEFAULT,
  DROP CONSTRAINT fbmn_family_code_format,
  ADD CONSTRAINT fbmn_family_code_format
    CHECK (family_code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$');
-- Admin may change a human-facing code through CAS + audit, but never UUID or SKU.
GRANT UPDATE (category_code) ON fbmn_catalog.categories TO fbmn_admin_http_staging;
GRANT UPDATE (family_code) ON fbmn_catalog.families TO fbmn_admin_http_staging;
COMMIT;
