-- Restore old Workers/frontends before this rollback.
BEGIN;
DROP VIEW fbmn_public.v_catalogue_viewer_settings;
CREATE VIEW fbmn_public.v_catalogue_viewer_settings WITH (security_barrier=true) AS
 SELECT flip_duration_ms,sound_enabled,shadow_opacity
 FROM fbmn_catalog_private.website_catalogue_viewer_settings WHERE singleton=true;
REVOKE ALL ON fbmn_public.v_catalogue_viewer_settings FROM PUBLIC;
GRANT SELECT ON fbmn_public.v_catalogue_viewer_settings TO fbmn_public_reader;
ALTER TABLE fbmn_catalog_private.website_catalogue_viewer_settings DROP COLUMN sound_volume;
COMMIT;
