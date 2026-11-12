-- Rollback only after manually retaining any Owner unread cursors.
BEGIN;
REVOKE SELECT(id,session_id,created_at) ON fbmn_catalog_private.chat_turns FROM fbmn_ceo_push_login;
REVOKE SELECT(updated_at) ON fbmn_catalog_private.chat_conversations FROM fbmn_ceo_push_login;
DROP TABLE IF EXISTS fbmn_catalog_private.ceo_inbox_reads;
COMMIT;
