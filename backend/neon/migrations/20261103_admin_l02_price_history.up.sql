-- ADMIN L02: extend draft-only G04 pricebook with immutable amount audit and idempotent batches.
-- SAFE ROLLOUT: code review first. Production migration requires explicit Owner instruction.
-- No price rows are inserted, changed or published by this DDL.
BEGIN;
ALTER TABLE fbmn_catalog_private.pricebook_entries
 DROP CONSTRAINT pricebook_entries_approval_state_check;
ALTER TABLE fbmn_catalog_private.pricebook_entries
 ADD CONSTRAINT pricebook_entries_approval_state_check
 CHECK (approval_state IN ('draft','approved'));
ALTER TABLE fbmn_catalog_private.pricebook_audit
 DROP CONSTRAINT pricebook_audit_action_check;
ALTER TABLE fbmn_catalog_private.pricebook_audit
 ADD CONSTRAINT pricebook_audit_action_check
 CHECK (action IN ('create_draft','update_draft','approve_draft'));
ALTER TABLE fbmn_catalog_private.pricebook_audit
 ADD COLUMN old_amount_vnd bigint,
 ADD COLUMN new_amount_vnd bigint,
 ADD COLUMN old_vat_included boolean,
 ADD COLUMN new_vat_included boolean,
 ADD COLUMN source_document text,
 ADD COLUMN batch_id uuid;
ALTER TABLE fbmn_catalog_private.pricebook_audit
 ADD CONSTRAINT pricebook_audit_nonnegative_amounts_check
 CHECK ((old_amount_vnd IS NULL OR old_amount_vnd>=0) AND
        (new_amount_vnd IS NULL OR new_amount_vnd>=0));
CREATE TABLE fbmn_catalog_private.pricebook_import_batches (
 id uuid PRIMARY KEY,
 payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
 actor_subject text NOT NULL CHECK (length(actor_subject) BETWEEN 1 AND 200),
 source_document text NOT NULL CHECK (length(source_document) BETWEEN 1 AND 300),
 rows_total integer NOT NULL CHECK (rows_total BETWEEN 1 AND 1000),
 created_count integer NOT NULL CHECK (created_count>=0),
 updated_count integer NOT NULL CHECK (updated_count>=0),
 unchanged_count integer NOT NULL CHECK (unchanged_count>=0),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (created_count+updated_count+unchanged_count=rows_total)
);
ALTER TABLE fbmn_catalog_private.pricebook_audit
 ADD CONSTRAINT pricebook_audit_batch_fk FOREIGN KEY(batch_id)
 REFERENCES fbmn_catalog_private.pricebook_import_batches(id) ON DELETE RESTRICT;
CREATE INDEX pricebook_audit_entry_history_idx
 ON fbmn_catalog_private.pricebook_audit(entry_id,created_at DESC);
CREATE INDEX pricebook_audit_batch_idx ON fbmn_catalog_private.pricebook_audit(batch_id)
 WHERE batch_id IS NOT NULL;
CREATE INDEX pricebook_import_batches_recent_idx
 ON fbmn_catalog_private.pricebook_import_batches(created_at DESC);
REVOKE ALL ON fbmn_catalog_private.pricebook_import_batches FROM PUBLIC;
GRANT SELECT,INSERT ON fbmn_catalog_private.pricebook_import_batches TO fbmn_admin_http_staging;
GRANT SELECT ON fbmn_catalog_private.pricebook_audit TO fbmn_admin_http_staging;
GRANT UPDATE (approval_state) ON fbmn_catalog_private.pricebook_entries TO fbmn_admin_http_staging;
COMMIT;
