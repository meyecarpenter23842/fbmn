-- DL7C read-only projection rollback; preserve all DL7B metadata and R2 objects.
BEGIN;
DROP VIEW IF EXISTS fbmn_public.v_catalogue_ready_assets;
DROP VIEW IF EXISTS fbmn_public.v_catalogue_ready_books;
COMMIT;
