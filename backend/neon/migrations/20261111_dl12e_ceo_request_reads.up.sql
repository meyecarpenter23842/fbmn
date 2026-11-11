-- DL12E: Owner-scoped viewed receipts, distinct from handling status.
-- Production requires backup, migration rehearsal, and Owner approval.
BEGIN;
CREATE TABLE fbmn_catalog_private.ceo_request_reads (
 owner_subject text NOT NULL CHECK(length(owner_subject) BETWEEN 1 AND 200),
 kind text NOT NULL CHECK(kind IN ('contact','outsourcing')),
 request_id uuid NOT NULL,
 viewed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(owner_subject,kind,request_id)
);
CREATE INDEX ceo_request_reads_expiry ON fbmn_catalog_private.ceo_request_reads(viewed_at);
REVOKE ALL ON fbmn_catalog_private.ceo_request_reads FROM PUBLIC;
GRANT SELECT,INSERT,DELETE ON fbmn_catalog_private.ceo_request_reads TO fbmn_ceo_push_login;
COMMIT;
