-- Dangerous rollback intentionally guarded and only for schema with no CMS media.
BEGIN;
DO $guard$ BEGIN
 IF current_setting('fbmn.rollback_confirmed',true) IS DISTINCT FROM 'yes'
 THEN RAISE EXCEPTION 'Explicit rollback confirmation required'; END IF;
 IF EXISTS(SELECT 1 FROM fbmn_catalog_private.cms_entry_media)
 THEN RAISE EXCEPTION 'CMS media exists: preserve R2 references and audit'; END IF;
END $guard$;
DROP TABLE fbmn_catalog_private.cms_entry_media;
ALTER TABLE fbmn_catalog_private.cms_entries
 DROP CONSTRAINT cms_entries_placements_shape,
 DROP CONSTRAINT cms_entries_popup_delay_check,
 DROP CONSTRAINT cms_entries_popup_cooldown_check,
 DROP CONSTRAINT cms_entries_popup_max_check,
 DROP COLUMN placements,
 DROP COLUMN popup_delay_seconds,
 DROP COLUMN popup_cooldown_minutes,
 DROP COLUMN popup_max_per_session;
-- Keep historical media_upload audit action allowed, for immutable audit.
COMMIT;
