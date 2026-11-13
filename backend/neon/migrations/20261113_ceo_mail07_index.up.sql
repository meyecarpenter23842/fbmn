-- CEO-MAIL07: index Resend inbox IDs, not message content, with historical cutover.
-- Historical messages not previously notified must not all become new at rollout.
BEGIN;
CREATE TABLE IF NOT EXISTS fbmn_catalog_private.ceo_mail_catalog(
 ref text PRIMARY KEY CHECK (ref ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
 occurred_at timestamptz NOT NULL,
 notice_eligible boolean NOT NULL DEFAULT false,
 indexed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS fbmn_catalog_private.ceo_mail_scan(
 id smallint PRIMARY KEY CHECK(id=1),
 cutover_at timestamptz NOT NULL DEFAULT now(),
 scanned_at timestamptz
);
INSERT INTO fbmn_catalog_private.ceo_mail_scan(id) VALUES(1) ON CONFLICT DO NOTHING;
CREATE INDEX IF NOT EXISTS ceo_mail_catalog_notice_idx ON fbmn_catalog_private.ceo_mail_catalog (occurred_at DESC) WHERE notice_eligible;
REVOKE ALL ON fbmn_catalog_private.ceo_mail_catalog FROM PUBLIC;
REVOKE ALL ON fbmn_catalog_private.ceo_mail_scan FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON fbmn_catalog_private.ceo_mail_catalog TO fbmn_ceo_push_login;
GRANT SELECT,UPDATE ON fbmn_catalog_private.ceo_mail_scan TO fbmn_ceo_push_login;
COMMIT;
