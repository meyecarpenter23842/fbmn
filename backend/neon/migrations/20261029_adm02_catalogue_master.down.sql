-- Destructive rollback ONLY on disposable staging branch and with explicit DBA permission.
BEGIN;
DO $$ BEGIN
 IF current_setting('fbmn.rollback_confirmed', true) IS DISTINCT FROM 'yes' THEN
   RAISE EXCEPTION 'Rollback requires SET LOCAL fbmn.rollback_confirmed = yes';
 END IF;
END $$;
DROP SCHEMA fbmn_catalog_private CASCADE;
DROP SCHEMA fbmn_catalog CASCADE;
COMMIT;
