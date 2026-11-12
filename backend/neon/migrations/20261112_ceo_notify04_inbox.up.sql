-- CEO-NOTIFY04: Owner-specific unread cursor; never persist chat or mail content.
BEGIN;
CREATE TABLE IF NOT EXISTS fbmn_catalog_private.ceo_inbox_reads(
 owner_subject text NOT NULL CHECK(length(owner_subject) BETWEEN 1 AND 200),
 kind text NOT NULL CHECK(kind IN ('chat','mail')),
 ref text NOT NULL CHECK(length(ref) BETWEEN 30 AND 40),
 read_through timestamptz NOT NULL,
 PRIMARY KEY(owner_subject,kind,ref)
);
REVOKE ALL ON fbmn_catalog_private.ceo_inbox_reads FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE,DELETE ON fbmn_catalog_private.ceo_inbox_reads TO fbmn_ceo_push_login;
GRANT SELECT(session_id,updated_at) ON fbmn_catalog_private.chat_conversations TO fbmn_ceo_push_login;
GRANT SELECT(id,session_id,created_at) ON fbmn_catalog_private.chat_turns TO fbmn_ceo_push_login;
COMMIT;
