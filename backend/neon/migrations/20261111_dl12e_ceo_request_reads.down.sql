-- DL12E rollback removes viewed receipts only, without touching requests.
-- Owner approval and backup required.
BEGIN;
DROP TABLE fbmn_catalog_private.ceo_request_reads;
COMMIT;
