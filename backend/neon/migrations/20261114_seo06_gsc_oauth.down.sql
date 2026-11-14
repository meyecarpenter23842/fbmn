-- SEO06 OAuth rollback: irreversible loss of encrypted Google grant; Owner approval required.
BEGIN;
DROP TABLE IF EXISTS fbmn_catalog_private.ceo_gsc_oauth_grants;
COMMIT;
