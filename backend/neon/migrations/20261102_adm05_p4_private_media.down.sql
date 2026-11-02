-- Roll back P4 Admin staging media permissions without deleting any assets.
BEGIN;
REVOKE SELECT ON fbmn_catalog.media_assets FROM fbmn_admin_http_staging;
REVOKE INSERT (id,source_filename,r2_key,mime_type,file_sha256)
  ON fbmn_catalog.media_assets FROM fbmn_admin_http_staging;
REVOKE SELECT,DELETE ON fbmn_catalog.sku_media FROM fbmn_admin_http_staging;
REVOKE INSERT (sku_cong_ty,asset_id,media_role,sort_order,match_method)
  ON fbmn_catalog.sku_media FROM fbmn_admin_http_staging;
REVOKE UPDATE (media_role,sort_order)
  ON fbmn_catalog.sku_media FROM fbmn_admin_http_staging;
DROP INDEX IF EXISTS fbmn_catalog.sku_media_sku_sort;
DROP INDEX IF EXISTS fbmn_catalog.sku_media_single_cover_per_sku;
COMMIT;
