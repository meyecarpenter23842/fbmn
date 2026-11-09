-- DL7B rollback: destructive to catalogue book metadata. Never run automatically.
BEGIN;
DROP TABLE IF EXISTS fbmn_catalog_private.website_catalogue_audit;
DROP TABLE IF EXISTS fbmn_catalog_private.website_catalogue_assets;
DROP TABLE IF EXISTS fbmn_catalog_private.website_catalogue_books;
-- Keep website.catalogue in Admin auth audit constraint for historical rows.
-- R2 files/bucket are deliberately retained: no silent removal of owner media.
COMMIT;
