-- SEO02C: expose strictly public SEO display controls. Publication is rechecked in Worker.
-- Requires SEO02B; never grants private audit fields, SKU pricing or other data.
BEGIN;
DO $seo_check$ BEGIN
 IF to_regclass('fbmn_catalog_private.web_seo_settings') IS NULL
 OR to_regrole('fbmn_public_reader') IS NULL
 OR to_regnamespace('fbmn_public') IS NULL
 THEN RAISE EXCEPTION 'SEO02C prerequisites missing'; END IF;
END $seo_check$;
CREATE VIEW fbmn_public.v_web_seo_settings WITH (security_barrier=true) AS
 SELECT kind,slug,mode,
 CASE WHEN mode='custom' THEN seo_title ELSE '' END AS title,
 CASE WHEN mode='custom' THEN meta_description ELSE '' END AS description,
 CASE WHEN mode='custom' AND kind='product' THEN og_image_path ELSE NULL END AS image
 FROM fbmn_catalog_private.web_seo_settings
 WHERE mode IN ('auto','custom','noindex');
REVOKE ALL ON fbmn_public.v_web_seo_settings FROM PUBLIC;
GRANT SELECT ON fbmn_public.v_web_seo_settings TO fbmn_public_reader;
COMMIT;
