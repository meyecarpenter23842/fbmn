-- DL4 rollback is deliberate and destructive to curated layout history.
-- Never run automatically on production.
BEGIN;
DROP VIEW IF EXISTS fbmn_public.v_web_home_layout;
DROP TABLE IF EXISTS fbmn_catalog_private.web_home_layout_audit;
DROP TABLE IF EXISTS fbmn_catalog_private.web_home_layout;
-- Keep the website.layout action in the existing audit constraint.
-- Historical denied/allowed audit rows must remain valid after rollback.
COMMIT;
