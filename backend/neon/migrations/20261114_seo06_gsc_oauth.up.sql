-- SEO06 OAuth: Owner-only encrypted Google refresh token for CEO server use.
-- Requires explicit Owner approval before applying; create only on reviewed branch.
BEGIN;
DO $guard$ BEGIN
 IF to_regnamespace('fbmn_catalog_private') IS NULL OR
    to_regrole('fbmn_ceo_push_login') IS NULL
 THEN RAISE EXCEPTION 'SEO06 OAuth prerequisite: private schema/CEO DB role required'; END IF;
END $guard$;
CREATE TABLE fbmn_catalog_private.ceo_gsc_oauth_grants(
 owner_subject text PRIMARY KEY CHECK(length(owner_subject) BETWEEN 1 AND 200),
 ciphertext text NOT NULL CHECK(length(ciphertext) BETWEEN 40 AND 15000 AND left(ciphertext,3)='v1.'),
 updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON fbmn_catalog_private.ceo_gsc_oauth_grants FROM PUBLIC;
GRANT USAGE ON SCHEMA fbmn_catalog_private TO fbmn_ceo_push_login;
GRANT SELECT,INSERT,UPDATE,DELETE ON fbmn_catalog_private.ceo_gsc_oauth_grants TO fbmn_ceo_push_login;
COMMIT;
