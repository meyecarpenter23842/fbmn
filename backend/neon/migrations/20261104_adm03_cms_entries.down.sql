-- Destructive rollback only on disposable branch with explicit DBA confirmation.
BEGIN;
DO $check$ BEGIN
 IF current_setting('fbmn.rollback_confirmed',true) IS DISTINCT FROM 'yes'
 THEN RAISE EXCEPTION 'Set LOCAL fbmn.rollback_confirmed=yes to rollback CMS schema'; END IF;
END $check$;
DROP TABLE fbmn_catalog_private.cms_entry_audit;
DROP TABLE fbmn_catalog_private.cms_entries;
COMMIT;
