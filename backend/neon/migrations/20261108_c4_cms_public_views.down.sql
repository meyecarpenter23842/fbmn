-- C4 rollback removes only allowlisted public CMS views; never CMS data or R2.
-- Manually approve and verify no active clients rely on the routes first.
BEGIN;
DO $guard$ BEGIN
 IF current_setting('fbmn.rollback_confirmed',true) IS DISTINCT FROM 'yes'
 THEN RAISE EXCEPTION 'C4 rollback requires explicit Owner confirmation'; END IF;
END $guard$;
REVOKE ALL ON fbmn_public.v_cms_web_images,fbmn_public.v_cms_web_entries FROM fbmn_public_reader;
DROP VIEW fbmn_public.v_cms_web_images;
DROP VIEW fbmn_public.v_cms_web_entries;
COMMIT;
