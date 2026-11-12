BEGIN;
ALTER TABLE fbmn_catalog_private.ceo_push_subscriptions
 DROP COLUMN IF EXISTS last_test_at;
COMMIT;
