-- C5 rollback. Never drop slide assets or settings without explicit Owner confirmation.
BEGIN;
DO $guard$ BEGIN
 IF current_setting('fbmn.rollback_confirmed',true) IS DISTINCT FROM 'yes'
 THEN RAISE EXCEPTION 'C5 rollback requires fbmn.rollback_confirmed=yes'; END IF;
 IF EXISTS (SELECT 1 FROM fbmn_catalog_private.cms_banner_slide_media)
 THEN RAISE EXCEPTION 'C5 has stored slide images; preserve data and stop rollback'; END IF;
 IF EXISTS (SELECT 1 FROM fbmn_catalog_private.cms_entry_audit WHERE action IN ('banner_slide_upload','banner_slide_settings','banner_slide_remove'))
 THEN RAISE EXCEPTION 'C5 audit history exists; preserve audit actions and stop rollback'; END IF;
END $guard$;
ALTER TABLE fbmn_catalog_private.cms_entry_audit DROP CONSTRAINT cms_entry_audit_action_check;
ALTER TABLE fbmn_catalog_private.cms_entry_audit
 ADD CONSTRAINT cms_entry_audit_action_check CHECK(action IN ('create','update','publish','hide','media_upload'));
DROP VIEW IF EXISTS fbmn_public.v_cms_web_banner_slide_images;
DROP VIEW IF EXISTS fbmn_public.v_cms_web_banner_slides;
DROP TABLE IF EXISTS fbmn_catalog_private.cms_banner_slide_media;
DROP TABLE IF EXISTS fbmn_catalog_private.cms_banner_settings;
COMMIT;
