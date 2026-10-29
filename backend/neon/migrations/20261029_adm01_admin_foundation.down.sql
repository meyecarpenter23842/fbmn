-- ADM-01 rollback. Staging only, DBA confirmation required; NOT automatic.
BEGIN;
DO $guard$ BEGIN
  IF current_setting('fbmn.rollback_confirmed', true) IS DISTINCT FROM 'yes'
  THEN RAISE EXCEPTION 'Explicit DBA rollback approval required'; END IF;
END $guard$;
REVOKE USAGE ON SCHEMA fbmn_admin FROM fbmn_admin_runtime;
REVOKE SELECT ON fbmn_admin.channels,fbmn_admin.principals,fbmn_admin.principal_channels FROM fbmn_admin_runtime;
REVOKE INSERT ON fbmn_admin.audit_events FROM fbmn_admin_runtime;
REVOKE USAGE ON SEQUENCE fbmn_admin.audit_events_id_seq FROM fbmn_admin_runtime;
DROP ROLE fbmn_admin_runtime;
DROP TABLE fbmn_admin.audit_events;
DROP TABLE fbmn_admin.config_revisions;
DROP TABLE fbmn_admin.principal_channels;
DROP TABLE fbmn_admin.principals;
DROP TABLE fbmn_admin.channels;
DROP TYPE fbmn_admin.admin_role;
DROP SCHEMA fbmn_admin;
COMMIT;
