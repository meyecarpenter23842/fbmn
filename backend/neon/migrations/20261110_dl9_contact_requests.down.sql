BEGIN;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM fbmn_catalog_private.contact_requests) OR EXISTS(SELECT 1 FROM fbmn_catalog_private.contact_request_audit) THEN RAISE EXCEPTION 'Contact data exists; preserve before rollback'; END IF; END $$;
DROP FUNCTION fbmn_public.submit_contact_request(text,text,text,text,text,text,text[],text,boolean);
DROP TABLE fbmn_catalog_private.contact_request_audit,fbmn_catalog_private.contact_requests;
COMMIT;
