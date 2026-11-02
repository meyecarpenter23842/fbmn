-- Reliable two-phase cleanup for privately stored WebP images; staging only.
BEGIN;
CREATE TABLE IF NOT EXISTS fbmn_catalog.media_cleanup_jobs (
 asset_id uuid PRIMARY KEY REFERENCES fbmn_catalog.media_assets(id) ON DELETE CASCADE,
 r2_key text NOT NULL,
 sku_cong_ty text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT ON fbmn_catalog.media_cleanup_jobs TO fbmn_admin_http_staging;
COMMIT;
