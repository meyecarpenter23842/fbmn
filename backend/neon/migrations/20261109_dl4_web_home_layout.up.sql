-- DL4. Staging migration only: run on the catalogue branch after Owner approval.
-- No SKU, price, CMS, customer, or publication record is modified.
BEGIN;
DO $check$ BEGIN
 IF to_regrole('fbmn_admin_http_staging') IS NULL OR
    to_regrole('fbmn_public_reader') IS NULL OR
    to_regnamespace('fbmn_catalog_private') IS NULL OR
    to_regnamespace('fbmn_public') IS NULL OR
    to_regclass('fbmn_catalog.publications') IS NULL
 THEN RAISE EXCEPTION 'DL4 prerequisites missing'; END IF;
END $check$;
ALTER TABLE fbmn_admin.audit_events DROP CONSTRAINT audit_events_action_check;
ALTER TABLE fbmn_admin.audit_events ADD CONSTRAINT audit_events_action_check
 CHECK(action IN ('session.read','channels.read','publish.check','pricing.check',
  'catalogue.manage','pricing.private','cms.manage','website.layout'));

CREATE TABLE fbmn_catalog_private.web_home_layout (
 singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
 category_ids text[] NOT NULL DEFAULT ARRAY[]::text[]
  CHECK (cardinality(category_ids)<=6),
 featured_skus text[] NOT NULL DEFAULT ARRAY[]::text[]
  CHECK (cardinality(featured_skus)<=12),
 category_limit integer NOT NULL DEFAULT 6 CHECK(category_limit BETWEEN 1 AND 6),
 product_limit integer NOT NULL DEFAULT 4 CHECK(product_limit BETWEEN 1 AND 12),
 section_order text[] NOT NULL DEFAULT ARRAY['categories','products']::text[]
  CHECK(cardinality(section_order)=2 AND
   section_order @> ARRAY['categories','products']::text[] AND
   section_order <@ ARRAY['categories','products']::text[]),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 updated_by text NOT NULL DEFAULT 'migration',
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO fbmn_catalog_private.web_home_layout(singleton) VALUES (true);
CREATE TABLE fbmn_catalog_private.web_home_layout_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 revision integer NOT NULL,
 actor_subject text NOT NULL,
 operation text NOT NULL CHECK(operation IN ('save','reset')),
 before_data jsonb NOT NULL,
 after_data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON fbmn_catalog_private.web_home_layout,
 fbmn_catalog_private.web_home_layout_audit FROM PUBLIC;
GRANT SELECT ON fbmn_catalog_private.web_home_layout TO fbmn_admin_http_staging;
GRANT UPDATE(category_ids,featured_skus,category_limit,product_limit,
 section_order,revision,updated_by,updated_at)
 ON fbmn_catalog_private.web_home_layout TO fbmn_admin_http_staging;
GRANT SELECT,INSERT ON fbmn_catalog_private.web_home_layout_audit TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog_private.web_home_layout_audit_id_seq TO fbmn_admin_http_staging;

-- Public Worker sees ONLY allowlisted presentation preferences, never audit/user data.
CREATE VIEW fbmn_public.v_web_home_layout WITH (security_barrier=true) AS
 SELECT l.category_ids,
  ARRAY(
   SELECT pin.sku FROM unnest(l.featured_skus) WITH ORDINALITY AS pin(sku,position)
   JOIN fbmn_catalog.publications p ON p.sku_cong_ty=pin.sku
   WHERE p.channel_code='public_web' AND p.state='published'
     AND p.published_at IS NOT NULL
   ORDER BY pin.position
  ) AS featured_skus,
  l.category_limit,l.product_limit,l.section_order,l.revision
 FROM fbmn_catalog_private.web_home_layout l WHERE l.singleton=true;
REVOKE ALL ON fbmn_public.v_web_home_layout FROM PUBLIC;
GRANT SELECT ON fbmn_public.v_web_home_layout TO fbmn_public_reader;
COMMIT;
