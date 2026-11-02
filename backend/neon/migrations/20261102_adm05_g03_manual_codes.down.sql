-- Roll back schema policy only. Keep human codes and all SKU relationships.
BEGIN;
REVOKE UPDATE (category_code) ON fbmn_catalog.categories FROM fbmn_admin_http_staging;
REVOKE UPDATE (family_code) ON fbmn_catalog.families FROM fbmn_admin_http_staging;
ALTER TABLE fbmn_catalog.categories
  DROP CONSTRAINT fbmn_category_code_format,
  ADD CONSTRAINT fbmn_category_code_format CHECK (category_code ~ '^DM-[0-9]{4,}$'),
  ALTER COLUMN category_code SET DEFAULT fbmn_catalog.next_stable_taxonomy_code('DM','fbmn_catalog.category_code_seq'::regclass);
ALTER TABLE fbmn_catalog.families
  DROP CONSTRAINT fbmn_family_code_format,
  ADD CONSTRAINT fbmn_family_code_format CHECK (family_code ~ '^NM-[0-9]{4,}$'),
  ALTER COLUMN family_code SET DEFAULT fbmn_catalog.next_stable_taxonomy_code('NM','fbmn_catalog.family_code_seq'::regclass);
COMMIT;
