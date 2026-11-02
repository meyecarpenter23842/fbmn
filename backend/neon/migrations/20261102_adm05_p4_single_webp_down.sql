-- ADM-05 P4 single WebP rollback for staging grants only.
BEGIN;
REVOKE UPDATE (source_filename,mime_type,file_sha256) ON fbmn_catalog.media_assets FROM fbmn_admin_http_staging;
REVOKE DELETE ON fbmn_catalog.media_assets FROM fbmn_admin_http_staging;
COMMIT;
