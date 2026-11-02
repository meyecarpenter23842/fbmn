-- ADM-05 G03: permit the existing restricted Admin staging HTTP role to
-- rename only a category label or a family label/revision.
-- Must be applied deliberately after Neon branch backup and rehearsal.
-- No SKU, pricebook, public, publication or media permissions are modified.
BEGIN;
GRANT UPDATE (category_label) ON fbmn_catalog.categories TO fbmn_admin_http_staging;
GRANT UPDATE (family_label,revision) ON fbmn_catalog.families TO fbmn_admin_http_staging;
COMMIT;
