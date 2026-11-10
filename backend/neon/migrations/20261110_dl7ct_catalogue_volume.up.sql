-- DL7C-T: additive settings migration; preserve settings and audits.
BEGIN;
ALTER TABLE fbmn_catalog_private.website_catalogue_viewer_settings
 ADD COLUMN sound_volume integer NOT NULL DEFAULT 35 CHECK(sound_volume BETWEEN 0 AND 100);
GRANT UPDATE(sound_volume) ON fbmn_catalog_private.website_catalogue_viewer_settings TO fbmn_admin_http_staging;
CREATE OR REPLACE VIEW fbmn_public.v_catalogue_viewer_settings WITH (security_barrier=true) AS
 SELECT flip_duration_ms,sound_enabled,shadow_opacity,sound_volume
 FROM fbmn_catalog_private.website_catalogue_viewer_settings WHERE singleton=true;
COMMIT;
