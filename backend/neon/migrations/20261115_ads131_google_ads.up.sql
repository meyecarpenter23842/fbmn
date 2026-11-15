-- ADS01–ADS03; HOLD until separate Owner approval for production SQL.
-- No test/staging Neon branch. Does not alter existing GSC/SEO/PostHog data.
BEGIN;
CREATE TABLE IF NOT EXISTS fbmn_catalog_private.ceo_ads_connections(
 owner_subject text PRIMARY KEY,
 ciphertext text NOT NULL,
 customer_id text CHECK(customer_id IS NULL OR customer_id ~ '^[0-9]{10}$'),
 login_customer_id text CHECK(login_customer_id IS NULL OR login_customer_id ~ '^[0-9]{10}$'),
 currency text CHECK(currency IS NULL OR currency ~ '^[A-Z]{3}$'),
 time_zone text,
 customer_name text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS fbmn_catalog_private.ceo_ads_drafts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_subject text NOT NULL,
 actor_subject text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('keyword_set','campaign')),
 name text NOT NULL CHECK(length(name) BETWEEN 3 AND 100),
 payload jsonb NOT NULL,
 revision integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ceo_ads_drafts_owner_idx
 ON fbmn_catalog_private.ceo_ads_drafts(owner_subject,updated_at DESC);
CREATE TABLE IF NOT EXISTS fbmn_catalog_private.ceo_ads_audit(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_subject text NOT NULL,
 owner_subject text NOT NULL,
 action text NOT NULL,
 customer_id text,
 details jsonb NOT NULL DEFAULT '{}'::jsonb,
 google_request_id text,
 status text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ceo_ads_audit_owner_idx
 ON fbmn_catalog_private.ceo_ads_audit(owner_subject,created_at DESC);
-- Restrict all tables to the existing server-only CEO database login.
REVOKE ALL ON fbmn_catalog_private.ceo_ads_connections FROM PUBLIC;
REVOKE ALL ON fbmn_catalog_private.ceo_ads_drafts FROM PUBLIC;
REVOKE ALL ON fbmn_catalog_private.ceo_ads_audit FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE,DELETE ON fbmn_catalog_private.ceo_ads_connections TO fbmn_ceo_push_login;
GRANT SELECT,INSERT,UPDATE,DELETE ON fbmn_catalog_private.ceo_ads_drafts TO fbmn_ceo_push_login;
GRANT SELECT,INSERT ON fbmn_catalog_private.ceo_ads_audit TO fbmn_ceo_push_login;
GRANT USAGE,SELECT ON SEQUENCE fbmn_catalog_private.ceo_ads_audit_id_seq TO fbmn_ceo_push_login;
CREATE TABLE IF NOT EXISTS fbmn_catalog_private.ceo_ads_approvals(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 approval_hash text NOT NULL UNIQUE CHECK(length(approval_hash)=64),
 owner_subject text NOT NULL,
 action text NOT NULL CHECK(action IN ('create_paused','status','budget')),
 draft_id uuid,
 customer_id text NOT NULL CHECK(customer_id ~ '^[0-9]{10}$'),
 currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 preview jsonb NOT NULL,
 result jsonb,
 status text NOT NULL CHECK(status IN ('in_flight','verified','failed','unknown')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ceo_ads_approvals_owner_idx
 ON fbmn_catalog_private.ceo_ads_approvals(owner_subject,created_at DESC);
REVOKE ALL ON fbmn_catalog_private.ceo_ads_approvals FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON fbmn_catalog_private.ceo_ads_approvals TO fbmn_ceo_push_login;

-- USER01 permission catalogue, introduced separately from GSC.
INSERT INTO fbmn_admin.user01_permissions(permission_key)
 VALUES ('ceo.ads.read'),('ceo.ads.draft'),('ceo.ads.manage')
 ON CONFLICT DO NOTHING;
COMMIT;
