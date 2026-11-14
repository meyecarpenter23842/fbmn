-- Explicit rollback only, with Owner approval.
BEGIN;
DROP VIEW IF EXISTS fbmn_public.v_web_app_download_settings;
DROP TABLE IF EXISTS fbmn_catalog_private.web_app_download_settings_audit;
DROP TABLE IF EXISTS fbmn_catalog_private.web_app_download_settings;
COMMIT;
