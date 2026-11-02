-- ADM-05 P5: channel publication and public-only catalogue projection.
-- Staging only. All 613 SKUs remain unpublished until Owner explicitly enables a channel.
BEGIN;
GRANT SELECT,INSERT ON fbmn_catalog.publications TO fbmn_admin_http_staging;
GRANT UPDATE (state,approved_by,approved_at,published_at,revision)
 ON fbmn_catalog.publications TO fbmn_admin_http_staging;
CREATE INDEX IF NOT EXISTS publications_p5_visible_idx
 ON fbmn_catalog.publications(channel_code,state,sku_cong_ty)
 WHERE state='published';
CREATE VIEW fbmn_public.v_p5_visible_skus AS
 SELECT s.sku_cong_ty,
        COALESCE(NULLIF(BTRIM(s.ten_san_pham),''),NULLIF(BTRIM(s.ten_goc_xnt),''),
                 NULLIF(BTRIM(s.ten_goc_bang_gia),''),s.sku_cong_ty) AS name,
        s.paper_size, s.product_spec,
        s.category_id::text AS category_id, c.category_label,
        s.family_id::text AS family_id, f.family_label
 FROM fbmn_catalog.publications p
 JOIN fbmn_catalog.skus s ON s.sku_cong_ty=p.sku_cong_ty
 LEFT JOIN fbmn_catalog.categories c ON c.id=s.category_id
 LEFT JOIN fbmn_catalog.families f ON f.id=s.family_id
 WHERE p.channel_code='public_web' AND p.state='published'
 AND p.published_at IS NOT NULL;
CREATE VIEW fbmn_public.v_p5_visible_media AS
 SELECT m.sku_cong_ty,m.asset_id::text AS asset_id,
        m.media_role,m.sort_order
 FROM fbmn_catalog.sku_media m
 JOIN fbmn_catalog.media_assets a ON a.id=m.asset_id
 JOIN fbmn_catalog.publications p ON p.sku_cong_ty=m.sku_cong_ty
 WHERE p.channel_code='public_web' AND p.state='published'
 AND p.published_at IS NOT NULL AND a.mime_type='image/webp'
 AND a.r2_key IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM fbmn_catalog.media_cleanup_jobs j WHERE j.asset_id=a.id);
CREATE VIEW fbmn_public.v_p5_image_assets AS
 SELECT a.id::text AS asset_id,a.r2_key
 FROM fbmn_catalog.media_assets a
 WHERE a.mime_type='image/webp' AND a.r2_key IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM fbmn_catalog.media_cleanup_jobs j WHERE j.asset_id=a.id)
 AND EXISTS(
   SELECT 1 FROM fbmn_catalog.sku_media m
   JOIN fbmn_catalog.publications p ON p.sku_cong_ty=m.sku_cong_ty
   WHERE m.asset_id=a.id AND p.channel_code='public_web'
    AND p.state='published' AND p.published_at IS NOT NULL);
REVOKE ALL ON fbmn_public.v_p5_visible_skus,fbmn_public.v_p5_visible_media,
 fbmn_public.v_p5_image_assets FROM PUBLIC;
GRANT SELECT ON fbmn_public.v_p5_visible_skus,
 fbmn_public.v_p5_visible_media,fbmn_public.v_p5_image_assets TO fbmn_public_reader;
COMMIT;
