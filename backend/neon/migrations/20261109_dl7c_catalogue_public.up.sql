-- DL7C public projection for approved flipbook content only.
-- Requires 20261109_dl7b_catalogue_books.up.sql. Execute only with Owner release approval.
BEGIN;
DO $gate$ BEGIN
 IF to_regclass('fbmn_catalog_private.website_catalogue_books') IS NULL OR
    to_regclass('fbmn_catalog_private.website_catalogue_assets') IS NULL OR
    to_regrole('fbmn_public_reader') IS NULL
 THEN RAISE EXCEPTION 'DL7C requires DL7B and public reader role'; END IF;
END $gate$;
CREATE VIEW fbmn_public.v_catalogue_ready_books WITH (security_barrier=true) AS
 SELECT b.id,b.title,b.edition,b.updated_at
 FROM fbmn_catalog_private.website_catalogue_books b
 WHERE b.state='ready' AND EXISTS (
  SELECT 1 FROM fbmn_catalog_private.website_catalogue_assets a
  WHERE a.book_id=b.id AND a.kind='page'
 );
CREATE VIEW fbmn_public.v_catalogue_ready_assets WITH (security_barrier=true) AS
 SELECT a.id,a.book_id,a.kind,a.sort_order,a.r2_key,a.byte_size,a.width,a.height
 FROM fbmn_catalog_private.website_catalogue_assets a
 JOIN fbmn_public.v_catalogue_ready_books b ON b.id=a.book_id;
REVOKE ALL ON fbmn_public.v_catalogue_ready_books,
 fbmn_public.v_catalogue_ready_assets FROM PUBLIC;
GRANT SELECT ON fbmn_public.v_catalogue_ready_books,
 fbmn_public.v_catalogue_ready_assets TO fbmn_public_reader;
-- No direct access to private tables and no INSERT/UPDATE/DELETE to public role.
COMMIT;
