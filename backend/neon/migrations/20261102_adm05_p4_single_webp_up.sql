-- ADM-05 P4 compact WebP storage; staging-only least privilege.
-- Needed for metadata refresh on 'Thay ảnh' and for deleting orphaned assets.
BEGIN;
GRANT UPDATE (source_filename,mime_type,file_sha256)
  ON fbmn_catalog.media_assets TO fbmn_admin_http_staging;
GRANT DELETE ON fbmn_catalog.media_assets TO fbmn_admin_http_staging;
COMMIT;
