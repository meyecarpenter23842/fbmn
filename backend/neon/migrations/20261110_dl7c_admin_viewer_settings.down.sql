-- Explicit Owner approval required: rollback drops settings history.
BEGIN;
DROP VIEW IF EXISTS fbmn_public.v_catalogue_viewer_settings;
DROP TABLE IF EXISTS fbmn_catalog_private.website_catalogue_viewer_settings_audit;
DROP TABLE IF EXISTS fbmn_catalog_private.website_catalogue_viewer_settings;
COMMIT;
