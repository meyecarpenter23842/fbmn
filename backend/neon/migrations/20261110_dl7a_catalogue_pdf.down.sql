-- Non-destructive rollback: refuse to drop PDF metadata if any document was uploaded.
BEGIN;
DO $safe$ BEGIN
 IF to_regclass('fbmn_catalog_private.website_catalogue_pdfs') IS NULL
 THEN RAISE EXCEPTION 'DL7A PDF migration not installed'; END IF;
 IF EXISTS(SELECT 1 FROM fbmn_catalog_private.website_catalogue_pdfs)
 THEN RAISE EXCEPTION 'PDF data exists: archive/delete only with explicit Owner data-retention approval'; END IF;
END $safe$;
DROP VIEW fbmn_public.v_catalogue_ready_pdfs;
CREATE OR REPLACE VIEW fbmn_public.v_catalogue_ready_books WITH (security_barrier=true) AS
 SELECT b.id,b.title,b.edition,b.updated_at
 FROM fbmn_catalog_private.website_catalogue_books b
 WHERE b.state='ready' AND EXISTS(
  SELECT 1 FROM fbmn_catalog_private.website_catalogue_assets a
  WHERE a.book_id=b.id AND a.kind='page');
DROP TABLE fbmn_catalog_private.website_catalogue_pdfs;
COMMIT;