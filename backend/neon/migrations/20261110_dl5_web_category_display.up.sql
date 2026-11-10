-- DL5. Category presentation only: Family default, individual published SKU optional.
-- Requires DL4 + P5; does not alter SKU, commercial pricing, publication, R2 or CMS data.
BEGIN;
DO $check$ BEGIN
 IF to_regrole('fbmn_admin_http_staging') IS NULL OR
    to_regrole('fbmn_public_reader') IS NULL OR
    to_regclass('fbmn_public.v_p5_visible_skus') IS NULL OR
    to_regnamespace('fbmn_catalog_private') IS NULL
 THEN RAISE EXCEPTION 'DL5 prerequisites missing'; END IF;
END $check$;
CREATE TABLE fbmn_catalog_private.web_category_display (
 category_id text PRIMARY KEY CHECK(category_id ~ '^p5-([0-9a-f-]{36}|uncategorized)$'),
 mode text NOT NULL DEFAULT 'family' CHECK(mode IN ('family','sku')),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 updated_by text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE fbmn_catalog_private.web_category_display_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 category_id text NOT NULL,
 revision integer NOT NULL,
 actor_subject text NOT NULL,
 before_data jsonb NOT NULL,
 after_data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON fbmn_catalog_private.web_category_display,
 fbmn_catalog_private.web_category_display_audit FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON fbmn_catalog_private.web_category_display TO fbmn_admin_http_staging;
GRANT SELECT,INSERT ON fbmn_catalog_private.web_category_display_audit TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog_private.web_category_display_audit_id_seq TO fbmn_admin_http_staging;
CREATE VIEW fbmn_public.v_web_category_display WITH (security_barrier=true) AS
 SELECT d.category_id,d.mode FROM fbmn_catalog_private.web_category_display d
 WHERE d.mode='sku' AND EXISTS (
  SELECT 1 FROM fbmn_public.v_p5_visible_skus s
  WHERE d.category_id='p5-'||COALESCE(s.category_id::text,'uncategorized')
 );
REVOKE ALL ON fbmn_public.v_web_category_display FROM PUBLIC;
GRANT SELECT ON fbmn_public.v_web_category_display TO fbmn_public_reader;
COMMIT;
