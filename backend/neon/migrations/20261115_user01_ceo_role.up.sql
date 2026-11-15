-- USER01 stage A. Commit this migration BEFORE stage B; never apply automatically.
-- A CEO staff role is distinct from the unique protected Owner role.
ALTER TYPE fbmn_admin.admin_role ADD VALUE IF NOT EXISTS 'ceo';
