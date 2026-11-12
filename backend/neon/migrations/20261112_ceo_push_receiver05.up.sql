-- CEO-PUSH05: rate-limit actual push test per registered Owner device.
BEGIN;
ALTER TABLE fbmn_catalog_private.ceo_push_subscriptions
 ADD COLUMN IF NOT EXISTS last_test_at timestamptz;
COMMIT;
