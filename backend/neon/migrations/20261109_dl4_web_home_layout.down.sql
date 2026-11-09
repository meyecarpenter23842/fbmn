-- DL4 rollback is deliberate and destructive to curated layout history.
-- Never run automatically on production.
BEGIN;
DROP VIEW IF EXISTS fbmn_public.v_web_home_layout;
DROP TABLE IF EXISTS fbmn_catalog_private.web_home_layout_audit;
DROP TABLE IF EXISTS fbmn_catalog_private.web_home_layout;
ALTER TABLE fbmn_admin.audit_events DROP CONSTRAINT audit_events_action_check;
ALTER TABLE fbmn_admin.audit_events ADD CONSTRAINT audit_events_action_check
 CHECK(action IN ('session.read','channels.read','publish.check','pricing.check',
  'catalogue.manage','pricing.private','cms.manage'));
COMMIT;
