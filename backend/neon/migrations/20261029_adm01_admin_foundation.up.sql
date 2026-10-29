-- ADM-01 (#11). Neon staging only; do not execute automatically from CI.
BEGIN;
CREATE SCHEMA fbmn_admin;
CREATE TYPE fbmn_admin.admin_role AS ENUM ('viewer','editor','publisher','pricing','admin');
CREATE TABLE fbmn_admin.channels (
  code text PRIMARY KEY CHECK (code IN ('public_web','dealer_app','consumer_app')),
  label text NOT NULL CHECK (length(label) BETWEEN 1 AND 100)
);
INSERT INTO fbmn_admin.channels(code,label) VALUES
  ('public_web','Website'),('dealer_app','App Đại lý'),('consumer_app','App Người tiêu dùng');
CREATE TABLE fbmn_admin.principals (
  auth_subject text PRIMARY KEY CHECK (length(auth_subject) BETWEEN 1 AND 200),
  role fbmn_admin.admin_role NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  approved_by text NOT NULL CHECK (length(approved_by) > 0),
  approved_at timestamptz NOT NULL DEFAULT now(),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0)
);
CREATE TABLE fbmn_admin.principal_channels (
  auth_subject text NOT NULL REFERENCES fbmn_admin.principals(auth_subject) ON DELETE CASCADE,
  channel_code text NOT NULL REFERENCES fbmn_admin.channels(code),
  PRIMARY KEY(auth_subject,channel_code)
);
CREATE TABLE fbmn_admin.config_revisions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  resource_key text NOT NULL CHECK (resource_key ~ '^[a-z][a-z0-9_.-]{0,99}$'),
  channel_code text REFERENCES fbmn_admin.channels(code),
  revision integer NOT NULL CHECK (revision > 0),
  value_json jsonb NOT NULL CHECK (jsonb_typeof(value_json) = 'object'),
  actor_subject text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX config_scope_revision_unique ON fbmn_admin.config_revisions
  (resource_key, COALESCE(channel_code,'_global'),revision);
CREATE TABLE fbmn_admin.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auth_subject text NOT NULL,
  action text NOT NULL CHECK (action IN ('session.read','channels.read','publish.check','pricing.check')),
  outcome text NOT NULL CHECK (outcome IN ('allowed','denied')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_actor_at_idx ON fbmn_admin.audit_events(auth_subject,created_at DESC);
-- Grant can only SELECT identity/role; runtime cannot self-promote.
CREATE ROLE fbmn_admin_runtime NOLOGIN;
GRANT USAGE ON SCHEMA fbmn_admin TO fbmn_admin_runtime;
GRANT SELECT ON fbmn_admin.channels,fbmn_admin.principals,fbmn_admin.principal_channels
 TO fbmn_admin_runtime;
GRANT INSERT ON fbmn_admin.audit_events TO fbmn_admin_runtime;
GRANT USAGE ON SEQUENCE fbmn_admin.audit_events_id_seq TO fbmn_admin_runtime;
REVOKE ALL ON SCHEMA fbmn_admin FROM PUBLIC;
COMMIT;
