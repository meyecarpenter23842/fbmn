-- DL6 rollback: contains personally identifiable enquiry data; do not execute automatically.
BEGIN;
DROP FUNCTION IF EXISTS fbmn_public.submit_outsourcing_request(text,text,text,text,text,text,text,text,boolean);
DROP TABLE IF EXISTS fbmn_catalog_private.outsourcing_request_audit;
DROP TABLE IF EXISTS fbmn_catalog_private.outsourcing_requests;
COMMIT;
