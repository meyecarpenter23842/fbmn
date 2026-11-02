-- Roll back P5 view/role additions only; preserve publication rows and previous permissions.
BEGIN;
REVOKE SELECT ON fbmn_public.v_p5_visible_skus,fbmn_public.v_p5_visible_media,
 fbmn_public.v_p5_image_assets FROM fbmn_public_reader;
DROP VIEW IF EXISTS fbmn_public.v_p5_image_assets;
DROP VIEW IF EXISTS fbmn_public.v_p5_visible_media;
DROP VIEW IF EXISTS fbmn_public.v_p5_visible_skus;
DROP INDEX IF EXISTS fbmn_catalog.publications_p5_visible_idx;
REVOKE UPDATE (state,approved_by,approved_at,published_at,revision)
 ON fbmn_catalog.publications FROM fbmn_admin_http_staging;
REVOKE SELECT,INSERT ON fbmn_catalog.publications FROM fbmn_admin_http_staging;
COMMIT;
