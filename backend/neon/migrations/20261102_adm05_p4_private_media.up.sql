-- ADM-05 P4: private R2-backed media metadata for Admin staging only.
-- This is non-destructive; no SKU is altered, no asset is published.
BEGIN;
DO $check$ BEGIN
  IF to_regclass('fbmn_catalog.media_assets') IS NULL OR
     to_regclass('fbmn_catalog.sku_media') IS NULL OR
     to_regclass('fbmn_catalog.skus') IS NULL
  THEN RAISE EXCEPTION 'Catalogue media schema must exist before P4'; END IF;
END $check$;
CREATE UNIQUE INDEX IF NOT EXISTS sku_media_single_cover_per_sku
  ON fbmn_catalog.sku_media(sku_cong_ty) WHERE media_role='cover';
CREATE INDEX IF NOT EXISTS sku_media_sku_sort
  ON fbmn_catalog.sku_media(sku_cong_ty,sort_order,asset_id);
GRANT SELECT ON fbmn_catalog.media_assets TO fbmn_admin_http_staging;
GRANT INSERT (id,source_filename,r2_key,mime_type,file_sha256)
  ON fbmn_catalog.media_assets TO fbmn_admin_http_staging;
GRANT SELECT,DELETE ON fbmn_catalog.sku_media TO fbmn_admin_http_staging;
GRANT INSERT (sku_cong_ty,asset_id,media_role,sort_order,match_method)
  ON fbmn_catalog.sku_media TO fbmn_admin_http_staging;
GRANT UPDATE (media_role,sort_order)
  ON fbmn_catalog.sku_media TO fbmn_admin_http_staging;
-- Do NOT grant media approval/publications, prices, XNT or public read.
COMMIT;
