-- C5: up to five per-banner Hero slides. Legacy cms_entry_media remains Slide 1.
-- Owner release gate: apply only after CI/review and before enabling new Workers.
BEGIN;
DO $preflight$ BEGIN
 IF to_regclass('fbmn_catalog_private.cms_entries') IS NULL
 OR to_regclass('fbmn_catalog_private.cms_entry_media') IS NULL
 OR to_regclass('fbmn_public.v_cms_web_entries') IS NULL
 OR to_regrole('fbmn_admin_http_staging') IS NULL
 OR to_regrole('fbmn_public_reader') IS NULL
 THEN RAISE EXCEPTION 'C5 prerequisites missing'; END IF;
END $preflight$;

CREATE TABLE fbmn_catalog_private.cms_banner_settings (
 entry_id uuid PRIMARY KEY REFERENCES fbmn_catalog_private.cms_entries(id) ON DELETE RESTRICT,
 enabled boolean NOT NULL DEFAULT true,
 autoplay boolean NOT NULL DEFAULT true,
 effect text NOT NULL DEFAULT 'fade-slide'
  CHECK(effect IN ('fade','slide','fade-slide')),
 interval_ms integer NOT NULL DEFAULT 7000
  CHECK(interval_ms BETWEEN 3000 AND 15000),
 duration_ms integer NOT NULL DEFAULT 480
  CHECK(duration_ms BETWEEN 300 AND 800),
 slide_order smallint[] NOT NULL DEFAULT ARRAY[1,2,3,4,5]::smallint[]
  CHECK(cardinality(slide_order)=5 AND slide_order @> ARRAY[1,2,3,4,5]::smallint[])
);
CREATE TABLE fbmn_catalog_private.cms_banner_slide_media (
 entry_id uuid NOT NULL REFERENCES fbmn_catalog_private.cms_entries(id) ON DELETE RESTRICT,
 slide_no smallint NOT NULL CHECK(slide_no BETWEEN 2 AND 5),
 device text NOT NULL CHECK(device IN ('desktop','mobile')),
 r2_key text NOT NULL UNIQUE CHECK(r2_key ~ '^cms/[0-9a-f-]{36}/public_web/(desktop|mobile)/[0-9a-f-]{36}\.webp$'),
 width integer NOT NULL CHECK(width BETWEEN 64 AND 6000),
 height integer NOT NULL CHECK(height BETWEEN 64 AND 6000),
 file_sha256 text NOT NULL CHECK(file_sha256 ~ '^[0-9a-f]{64}$'),
 uploaded_by text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(entry_id,slide_no,device)
);
CREATE INDEX cms_banner_slide_entry_idx ON fbmn_catalog_private.cms_banner_slide_media(entry_id,slide_no);

REVOKE ALL ON fbmn_catalog_private.cms_banner_settings,
 fbmn_catalog_private.cms_banner_slide_media FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON fbmn_catalog_private.cms_banner_settings TO fbmn_admin_http_staging;
GRANT SELECT,INSERT,UPDATE,DELETE ON fbmn_catalog_private.cms_banner_slide_media TO fbmn_admin_http_staging;

CREATE VIEW fbmn_public.v_cms_web_banner_slides WITH (security_barrier=true) AS
 SELECT e.id,1::integer AS slide_no,
  COALESCE(array_position(s.slide_order,1),1) AS ordinal,
  COALESCE(s.enabled,true) AS enabled,
  COALESCE(s.autoplay,true) AS autoplay,
  COALESCE(s.effect,'fade-slide') AS effect,
  COALESCE(s.interval_ms,7000) AS interval_ms,
  COALESCE(s.duration_ms,480) AS duration_ms
 FROM fbmn_public.v_cms_web_entries e
 LEFT JOIN fbmn_catalog_private.cms_banner_settings s ON s.entry_id=e.id::uuid
 WHERE e.kind='banner' AND e.slot='home.hero'
 UNION ALL
 SELECT e.id,m.slide_no::integer AS slide_no,
  COALESCE(array_position(s.slide_order,m.slide_no),m.slide_no::integer) AS ordinal,
  COALESCE(s.enabled,true) AS enabled,
  COALESCE(s.autoplay,true) AS autoplay,
  COALESCE(s.effect,'fade-slide') AS effect,
  COALESCE(s.interval_ms,7000) AS interval_ms,
  COALESCE(s.duration_ms,480) AS duration_ms
 FROM fbmn_public.v_cms_web_entries e
 JOIN fbmn_catalog_private.cms_banner_slide_media m
  ON m.entry_id=e.id::uuid AND m.device='desktop'
 JOIN fbmn_catalog_private.cms_banner_slide_media mobile
  ON mobile.entry_id=m.entry_id AND mobile.slide_no=m.slide_no AND mobile.device='mobile'
 LEFT JOIN fbmn_catalog_private.cms_banner_settings s ON s.entry_id=e.id::uuid
 WHERE e.kind='banner' AND e.slot='home.hero';

CREATE VIEW fbmn_public.v_cms_web_banner_slide_images WITH (security_barrier=true) AS
 SELECT m.entry_id::text AS id,m.slide_no::integer AS slide_no,m.device,m.r2_key
 FROM fbmn_catalog_private.cms_banner_slide_media m
 JOIN fbmn_public.v_cms_web_banner_slides s ON s.id=m.entry_id::text AND s.slide_no=m.slide_no
 WHERE m.device IN ('desktop','mobile')
 AND m.r2_key ~ '^cms/[0-9a-f-]{36}/public_web/(desktop|mobile)/[0-9a-f-]{36}\.webp$';

REVOKE ALL ON fbmn_public.v_cms_web_banner_slides,
 fbmn_public.v_cms_web_banner_slide_images FROM PUBLIC;
GRANT SELECT ON fbmn_public.v_cms_web_banner_slides,
 fbmn_public.v_cms_web_banner_slide_images TO fbmn_public_reader;
COMMIT;
