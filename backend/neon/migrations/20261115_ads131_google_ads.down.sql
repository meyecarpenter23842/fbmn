-- Rollback is destructive to ADS-specific drafts/credentials/audit.
-- DO NOT RUN without separate Owner approval and verified backup.
BEGIN;
DELETE FROM fbmn_admin.user01_permissions WHERE permission_key IN
 ('ceo.ads.read','ceo.ads.draft','ceo.ads.manage')
 AND NOT EXISTS(SELECT 1 FROM fbmn_admin.principal_permissions p
  WHERE p.permission_key=fbmn_admin.user01_permissions.permission_key);
DROP TABLE IF EXISTS fbmn_catalog_private.ceo_ads_audit;
DROP TABLE IF EXISTS fbmn_catalog_private.ceo_ads_drafts;
DROP TABLE IF EXISTS fbmn_catalog_private.ceo_ads_connections;
COMMIT;
