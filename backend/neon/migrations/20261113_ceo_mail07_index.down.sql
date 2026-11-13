-- Rollback requires prior verification that any indexed unread state is no longer needed.
BEGIN;
DROP TABLE IF EXISTS fbmn_catalog_private.ceo_mail_catalog;
DROP TABLE IF EXISTS fbmn_catalog_private.ceo_mail_scan;
COMMIT;
