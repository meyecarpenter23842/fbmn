-- USER01 stage B. Apply ONLY after stage A has committed, after Owner approval.
-- Existing Owner and existing catalogue/pricing data remain unchanged.
BEGIN;

CREATE TABLE IF NOT EXISTS fbmn_admin.user01_permissions (
  permission_key text PRIMARY KEY CHECK (permission_key ~ '^(admin|ceo)[.][a-z.]+$')
);
INSERT INTO fbmn_admin.user01_permissions(permission_key) VALUES
 ('admin.catalogue.read'),('admin.catalogue.write'),
 ('admin.pricing.read'),('admin.pricing.write'),
 ('admin.cms.read'),('admin.cms.write'),
 ('admin.website.read'),('admin.website.write'),('admin.users.manage'),
 ('ceo.overview'),('ceo.conversations'),('ceo.outsourcing'),('ceo.contacts'),
 ('ceo.mail.read'),('ceo.mail.send'),('ceo.statistics'),('ceo.seo'),
 ('ceo.notifications'),('ceo.gsc.manage')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS fbmn_admin.principal_permissions (
  auth_subject text NOT NULL REFERENCES fbmn_admin.principals(auth_subject) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES fbmn_admin.user01_permissions(permission_key),
  PRIMARY KEY(auth_subject, permission_key)
);
CREATE TABLE IF NOT EXISTS fbmn_admin.user01_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_subject text NOT NULL,
  target_subject text NOT NULL,
  action text NOT NULL CHECK(action IN ('create','update')),
  role text NOT NULL,
  enabled boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user01_audit_actor_idx ON fbmn_admin.user01_audit(actor_subject,created_at DESC);
GRANT SELECT ON fbmn_admin.principal_permissions TO fbmn_admin_runtime;
GRANT SELECT ON fbmn_admin.principal_permissions TO fbmn_admin_http_staging;

-- SECURITY DEFINER only exposes nonsecret identity fields and explicit staff grants.
-- Neither Worker nor browser gets direct INSERT/UPDATE on principal tables or neon_auth.
CREATE OR REPLACE FUNCTION fbmn_admin.user01_list_staff(p_actor text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,fbmn_admin,neon_auth AS $$
DECLARE result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM fbmn_admin.principals
    WHERE auth_subject=p_actor AND enabled AND
      (role::text='owner' OR (role::text='admin' AND EXISTS(
        SELECT 1 FROM fbmn_admin.principal_permissions
        WHERE auth_subject=p_actor AND permission_key='admin.users.manage'
      )))
  ) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',p.auth_subject, 'email',u.email, 'name',u.name,
      'verified',u."emailVerified", 'role',p.role::text,
      'enabled',p.enabled, 'revision',p.revision,
      'permissions',COALESCE((
        SELECT jsonb_agg(pp.permission_key ORDER BY pp.permission_key)
        FROM fbmn_admin.principal_permissions pp WHERE pp.auth_subject=p.auth_subject
      ),'[]'::jsonb),
      'channels',COALESCE((
        SELECT jsonb_agg(pc.channel_code ORDER BY pc.channel_code)
        FROM fbmn_admin.principal_channels pc WHERE pc.auth_subject=p.auth_subject
      ),'[]'::jsonb)
    ) ORDER BY u.email
  ),'[]'::jsonb) INTO result
  FROM fbmn_admin.principals p JOIN neon_auth."user" u ON u.id::text=p.auth_subject;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION fbmn_admin.user01_save_staff(
  p_actor text, p_email text, p_role text, p_enabled boolean,
  p_permissions text[], p_channels text[], p_expected_revision integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,fbmn_admin,neon_auth AS $$
DECLARE v_actor_role text; v_subject text; v_old_role text; v_old_revision integer;
  v_permission text; v_channel text; v_action text;
BEGIN
  SELECT role::text INTO v_actor_role FROM fbmn_admin.principals
  WHERE auth_subject=p_actor AND enabled;
  IF v_actor_role NOT IN ('owner','admin') OR v_actor_role IS NULL OR
     (v_actor_role='admin' AND NOT EXISTS (
        SELECT 1 FROM fbmn_admin.principal_permissions
        WHERE auth_subject=p_actor AND permission_key='admin.users.manage'
     ))
    THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  IF p_role NOT IN ('viewer','editor','publisher','pricing','admin','ceo')
     OR p_email IS NULL OR length(trim(p_email)) NOT BETWEEN 3 AND 200
     OR p_enabled IS NULL OR p_permissions IS NULL OR p_channels IS NULL
     OR cardinality(p_permissions)>19 OR cardinality(p_channels)>3
    THEN RAISE EXCEPTION 'invalid input' USING ERRCODE='22023'; END IF;
  IF p_role<>'admin' AND 'admin.users.manage'=ANY(p_permissions)
    THEN RAISE EXCEPTION 'invalid staff permission' USING ERRCODE='22023'; END IF;
  IF cardinality(p_permissions)<>(SELECT count(DISTINCT x) FROM unnest(p_permissions) x)
    OR cardinality(p_channels)<>(SELECT count(DISTINCT x) FROM unnest(p_channels) x)
    THEN RAISE EXCEPTION 'duplicate permission' USING ERRCODE='22023'; END IF;
  FOREACH v_permission IN ARRAY p_permissions LOOP
    IF NOT EXISTS(SELECT 1 FROM fbmn_admin.user01_permissions WHERE permission_key=v_permission)
      THEN RAISE EXCEPTION 'unknown permission' USING ERRCODE='22023'; END IF;
  END LOOP;
  FOREACH v_channel IN ARRAY p_channels LOOP
    IF NOT EXISTS(SELECT 1 FROM fbmn_admin.channels WHERE code=v_channel)
      THEN RAISE EXCEPTION 'unknown channel' USING ERRCODE='22023'; END IF;
  END LOOP;
  SELECT u.id::text INTO v_subject FROM neon_auth."user" u
    WHERE lower(u.email)=lower(trim(p_email)) LIMIT 1;
  IF v_subject IS NULL THEN RAISE EXCEPTION 'auth user not found' USING ERRCODE='P0002'; END IF;
  IF v_subject=p_actor THEN RAISE EXCEPTION 'cannot edit self' USING ERRCODE='42501'; END IF;
  SELECT revision,role::text INTO v_old_revision,v_old_role
    FROM fbmn_admin.principals WHERE auth_subject=v_subject FOR UPDATE;
  IF v_old_role='owner' THEN RAISE EXCEPTION 'owner cannot be edited' USING ERRCODE='42501'; END IF;
  IF v_old_revision IS NULL THEN
    IF p_expected_revision IS NOT NULL THEN RAISE EXCEPTION 'version conflict' USING ERRCODE='40001'; END IF;
    INSERT INTO fbmn_admin.principals(auth_subject,role,enabled,approved_by)
      VALUES(v_subject,p_role::fbmn_admin.admin_role,p_enabled,p_actor);
    v_old_revision:=1;
    v_action:='create';
  ELSE
    IF p_expected_revision IS DISTINCT FROM v_old_revision
      THEN RAISE EXCEPTION 'version conflict' USING ERRCODE='40001'; END IF;
    UPDATE fbmn_admin.principals SET role=p_role::fbmn_admin.admin_role,
      enabled=p_enabled,approved_by=p_actor,approved_at=now(),revision=revision+1
      WHERE auth_subject=v_subject RETURNING revision INTO v_old_revision;
    v_action:='update';
  END IF;
  DELETE FROM fbmn_admin.principal_permissions WHERE auth_subject=v_subject;
  INSERT INTO fbmn_admin.principal_permissions(auth_subject,permission_key)
    SELECT v_subject, x FROM unnest(p_permissions) x;
  DELETE FROM fbmn_admin.principal_channels WHERE auth_subject=v_subject;
  INSERT INTO fbmn_admin.principal_channels(auth_subject,channel_code)
    SELECT v_subject, x FROM unnest(p_channels) x;
  INSERT INTO fbmn_admin.user01_audit(actor_subject,target_subject,action,role,enabled)
    VALUES(p_actor,v_subject,v_action,p_role,p_enabled);
  RETURN jsonb_build_object('id',v_subject,'role',p_role,'enabled',p_enabled,
    'revision',v_old_revision,'action',v_action);
END;
$$;

REVOKE ALL ON FUNCTION fbmn_admin.user01_list_staff(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION fbmn_admin.user01_save_staff(text,text,text,boolean,text[],text[],integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fbmn_admin.user01_list_staff(text) TO fbmn_admin_http_staging;
GRANT EXECUTE ON FUNCTION fbmn_admin.user01_save_staff(text,text,text,boolean,text[],text[],integer) TO fbmn_admin_http_staging;
COMMIT;
