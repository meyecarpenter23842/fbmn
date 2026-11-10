BEGIN;
CREATE TABLE fbmn_catalog_private.chat_conversations (
 session_id text PRIMARY KEY CHECK(session_id ~ '^[0-9a-f]{36}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE fbmn_catalog_private.chat_turns (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 session_id text NOT NULL REFERENCES fbmn_catalog_private.chat_conversations(session_id) ON DELETE CASCADE,
 question text NOT NULL CHECK(length(question) BETWEEN 1 AND 300),
 answer text CHECK(length(answer) BETWEEN 1 AND 3000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_conversations_recent ON fbmn_catalog_private.chat_conversations(updated_at DESC,session_id);
CREATE INDEX chat_turns_session ON fbmn_catalog_private.chat_turns(session_id,id);
CREATE INDEX chat_turns_search ON fbmn_catalog_private.chat_turns USING gin
 (to_tsvector('simple'::regconfig,question || ' ' || coalesce(answer,'')));
REVOKE ALL ON fbmn_catalog_private.chat_conversations,fbmn_catalog_private.chat_turns FROM PUBLIC;
GRANT SELECT,INSERT,DELETE ON fbmn_catalog_private.chat_conversations TO fbmn_admin_http_staging;
GRANT UPDATE(updated_at) ON fbmn_catalog_private.chat_conversations TO fbmn_admin_http_staging;
GRANT SELECT,INSERT ON fbmn_catalog_private.chat_turns TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog_private.chat_turns_id_seq TO fbmn_admin_http_staging;
COMMIT;
