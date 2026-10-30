-- ADM-01 / Owner RBAC stage A, STAGING ONLY.
-- Execute this statement and COMMIT before executing stage B.
-- PostgreSQL forbids using a newly added enum value in a unique-index
-- predicate until the ALTER TYPE transaction is committed.
ALTER TYPE fbmn_admin.admin_role ADD VALUE IF NOT EXISTS 'owner';
