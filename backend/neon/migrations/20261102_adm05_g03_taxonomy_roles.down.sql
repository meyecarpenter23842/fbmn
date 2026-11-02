-- Rollback G03 rename privileges only. Never remove data or categories.
BEGIN;
REVOKE UPDATE (category_label) ON fbmn_catalog.categories FROM fbmn_admin_http_staging;
REVOKE UPDATE (family_label,revision) ON fbmn_catalog.families FROM fbmn_admin_http_staging;
COMMIT;
