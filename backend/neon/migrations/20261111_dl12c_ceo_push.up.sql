-- DL12C: private Owner device Web Push subscriptions, no customer PII in push.
-- Apply only with Owner migration approval AFTER backup, staging migration and review.
BEGIN;
DO $guard$ BEGIN
 IF to_regnamespace('fbmn_catalog_private') IS NULL OR
    to_regrole('fbmn_ceo_push_login') IS NULL
 THEN RAISE EXCEPTION 'DL12C prerequisite: provision a dedicated fbmn_ceo_push_login role first'; END IF;
END $guard$;
CREATE TABLE fbmn_catalog_private.ceo_push_subscriptions(
 endpoint text PRIMARY KEY CHECK(length(endpoint) BETWEEN 30 AND 2048),
 p256dh text NOT NULL CHECK(length(p256dh) BETWEEN 80 AND 128),
 auth text NOT NULL CHECK(length(auth) BETWEEN 16 AND 48),
 created_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ceo_push_subscriptions_recent
 ON fbmn_catalog_private.ceo_push_subscriptions(last_seen_at DESC);
CREATE TABLE fbmn_catalog_private.ceo_push_events(
 event_key text PRIMARY KEY CHECK(length(event_key) BETWEEN 6 AND 100),
 kind text NOT NULL CHECK(kind IN ('chat','contact','outsourcing')),
 ref text NOT NULL CHECK(length(ref) BETWEEN 30 AND 40),
 occurred_at timestamptz NOT NULL,
 claimed_until timestamptz,
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
 delivered_at timestamptz
);
CREATE INDEX ceo_push_events_ready
 ON fbmn_catalog_private.ceo_push_events(occurred_at)
 WHERE delivered_at IS NULL;
REVOKE ALL ON fbmn_catalog_private.ceo_push_subscriptions,fbmn_catalog_private.ceo_push_events FROM PUBLIC;
GRANT USAGE ON SCHEMA fbmn_catalog_private TO fbmn_ceo_push_login;
GRANT SELECT,INSERT,UPDATE,DELETE ON fbmn_catalog_private.ceo_push_subscriptions TO fbmn_ceo_push_login;
GRANT SELECT,INSERT,UPDATE,DELETE ON fbmn_catalog_private.ceo_push_events TO fbmn_ceo_push_login;
-- Events are IDs/timestamps/status only, not customer name/contact/chat body.
GRANT SELECT(id,created_at,status) ON fbmn_catalog_private.contact_requests TO fbmn_ceo_push_login;
GRANT SELECT(id,created_at,status) ON fbmn_catalog_private.outsourcing_requests TO fbmn_ceo_push_login;
GRANT SELECT(session_id,created_at) ON fbmn_catalog_private.chat_conversations TO fbmn_ceo_push_login;
COMMIT;
