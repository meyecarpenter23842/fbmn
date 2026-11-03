-- Rollback only an unused G04 table; never drop price evidence, SKUs or existing prices.
-- Do not execute after users have created price drafts without explicit approval.
BEGIN;
REVOKE USAGE ON SEQUENCE fbmn_catalog_private.pricebook_audit_id_seq FROM fbmn_admin_http_staging;
REVOKE INSERT ON fbmn_catalog_private.pricebook_audit FROM fbmn_admin_http_staging;
REVOKE SELECT,INSERT,UPDATE (amount_vnd,vat_included,vat_rate_bps,source_document,effective_until,revision,updated_by,updated_at)
 ON fbmn_catalog_private.pricebook_entries FROM fbmn_admin_http_staging;
DROP TABLE fbmn_catalog_private.pricebook_audit;
DROP TABLE fbmn_catalog_private.pricebook_entries;
-- Do not remove audit actions if they have already been recorded.
DO $audit$ BEGIN
 IF EXISTS (SELECT 1 FROM fbmn_admin.audit_events
            WHERE action IN ('catalogue.manage','pricing.private')) THEN
  RAISE EXCEPTION 'G04 rollback refused: audit entries use new action names';
 END IF;
END $audit$;
ALTER TABLE fbmn_admin.audit_events DROP CONSTRAINT audit_events_action_check;
ALTER TABLE fbmn_admin.audit_events ADD CONSTRAINT audit_events_action_check
 CHECK (action IN ('session.read','channels.read','publish.check','pricing.check'));
COMMIT;
