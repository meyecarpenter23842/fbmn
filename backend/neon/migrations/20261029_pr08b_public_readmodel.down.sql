-- WEB PR08b rollback: REVIEW FIRST. Never run on production automatically.
-- Guard: explicit DBA transaction SET LOCAL fbmn.rollback_confirmed = 'yes'.
DO $guard$ BEGIN
  IF current_setting('fbmn.rollback_confirmed', true) IS DISTINCT FROM 'yes' THEN
    RAISE EXCEPTION 'Rollback requires explicit DBA confirmation';
  END IF;
END $guard$;

REVOKE SELECT ON fbmn_public."v_categories", fbmn_public."v_products", fbmn_public."v_variants", fbmn_public."v_media", fbmn_public."v_articles", fbmn_public."v_promotions", fbmn_public."v_company", fbmn_public."v_dealer_information" FROM fbmn_public_reader;
REVOKE USAGE ON SCHEMA fbmn_public FROM fbmn_public_reader;

DROP VIEW fbmn_public."v_dealer_information";
DROP VIEW fbmn_public."v_company";
DROP VIEW fbmn_public."v_promotions";
DROP VIEW fbmn_public."v_articles";
DROP VIEW fbmn_public."v_media";
DROP VIEW fbmn_public."v_variants";
DROP VIEW fbmn_public."v_products";
DROP VIEW fbmn_public."v_categories";

DROP TABLE fbmn_public."dealer_information";
DROP TABLE fbmn_public."company";
DROP TABLE fbmn_public."promotions";
DROP TABLE fbmn_public."articles";
DROP TABLE fbmn_public."media";
DROP TABLE fbmn_public."variants";
DROP TABLE fbmn_public."products";
DROP TABLE fbmn_public."categories";

DROP ROLE fbmn_public_reader;
DROP SCHEMA fbmn_public;
