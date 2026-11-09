-- C5 rollback. Never drop slide assets or settings without explicit Owner confirmation.
BEGIN;
DO $guard$ BEGIN
 IF current_setting('fbmn.rollback_confirmed',true) IS DISTINCT FROM 'yes'
 THEN RAISE EXCEPTION 'C5 rollback requires fbmn.rollback_confirmed=yes'; END IF;
 IF EXISTS (SELECT 1 FROM fbmn_catalog_private.cms_banner_slide_media)
 THEN RAISE EXCEPTION 'C5 has stored slide images; preserve data and stop rollback'; END IF;
END $guard$;
DROP VIEW IF EXISTS fbmn_public.v_cms_web_banner_slide_images;
DROP VIEW IF EXISTS fbmn_public.v_cms_web_banner_slides;
DROP TABLE IF EXISTS fbmn_catalog_private.cms_banner_slide_media;
DROP TABLE IF EXISTS fbmn_catalog_private.cms_banner_settings;
COMMIT;
