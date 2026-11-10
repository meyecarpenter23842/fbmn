-- DL5 rollback removes presentation settings and history; never run automatically.
BEGIN;
DROP VIEW IF EXISTS fbmn_public.v_web_category_display;
DROP TABLE IF EXISTS fbmn_catalog_private.web_category_display_audit;
DROP TABLE IF EXISTS fbmn_catalog_private.web_category_display;
COMMIT;
