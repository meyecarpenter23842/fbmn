-- Only run with explicit Owner authorization: deleting subscriptions invalidates devices.
BEGIN;
DROP TABLE IF EXISTS fbmn_catalog_private.ceo_push_delivery_receipts;
DROP TABLE IF EXISTS fbmn_catalog_private.ceo_push_events;
DROP TABLE IF EXISTS fbmn_catalog_private.ceo_push_subscriptions;
COMMIT;
