-- ADM-01 / Owner RBAC stage B, STAGING ONLY.
-- Execute only AFTER migration 20261030_adm01_owner_staging.up.sql
-- has completed and committed in a separate transaction.
CREATE UNIQUE INDEX IF NOT EXISTS principals_single_owner_idx
ON fbmn_admin.principals ((1))
WHERE role = 'owner'::fbmn_admin.admin_role;
