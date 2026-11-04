-- ADM-03 / Issue #20: private, revisioned CMS authoring.
-- Manual Neon staging migration ONLY after Owner release gate.
-- Public API must not query this table; separate allowlisted public projection follows.
BEGIN;
DO $check$ BEGIN
 IF to_regnamespace('fbmn_catalog_private') IS NULL OR
    to_regrole('fbmn_admin_http_staging') IS NULL
 THEN RAISE EXCEPTION 'ADM-03 dependencies not installed'; END IF;
END $check$;

-- Denied CMS calls must be auditable through the pre-existing Admin gate.
ALTER TABLE fbmn_admin.audit_events DROP CONSTRAINT audit_events_action_check;
ALTER TABLE fbmn_admin.audit_events ADD CONSTRAINT audit_events_action_check
 CHECK(action IN ('session.read','channels.read','publish.check','pricing.check',
  'catalogue.manage','pricing.private','cms.manage'));

CREATE TABLE fbmn_catalog_private.cms_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK (kind IN ('banner','popup','article','promotion')),
 slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug)<=100),
 title text NOT NULL CHECK (length(btrim(title)) BETWEEN 2 AND 160),
 summary text NOT NULL DEFAULT '' CHECK(length(summary)<=400),
 paragraphs text[] NOT NULL DEFAULT ARRAY[]::text[] CHECK (cardinality(paragraphs)<=30),
 cta_url text CHECK(cta_url IS NULL OR length(cta_url)<=500),
 channel_targets text[] NOT NULL DEFAULT ARRAY[]::text[]
   CHECK(channel_targets <@ ARRAY['public_web','dealer_app','consumer_app']::text[]
     AND cardinality(channel_targets)<=3),
 sort_order integer NOT NULL DEFAULT 0 CHECK(sort_order BETWEEN 0 AND 10000),
 starts_at timestamptz,
 ends_at timestamptz,
 source_ref text NOT NULL DEFAULT '' CHECK(length(source_ref)<=500),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','hidden')),
 verified_at timestamptz,
 verified_by text,
 approved_at timestamptz,
 approved_by text,
 published_at timestamptz,
 withdrawn_at timestamptz,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 created_by text NOT NULL,
 updated_by text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(kind,slug),
 CHECK(starts_at IS NULL OR ends_at IS NULL OR ends_at>=starts_at),
 CHECK(status<>'published' OR
   (source_ref<>'' AND cardinality(channel_targets)>0
    AND verified_at IS NOT NULL AND approved_at IS NOT NULL
    AND published_at IS NOT NULL AND approved_by IS NOT NULL)),
 CHECK(kind NOT IN ('article','promotion') OR cardinality(paragraphs)>0)
);
CREATE INDEX cms_entries_kind_status_idx
 ON fbmn_catalog_private.cms_entries(kind,status,sort_order,created_at DESC);

CREATE TABLE fbmn_catalog_private.cms_entry_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 entry_id uuid NOT NULL REFERENCES fbmn_catalog_private.cms_entries(id) ON DELETE RESTRICT,
 actor_subject text NOT NULL,
 action text NOT NULL CHECK(action IN ('create','update','publish','hide')),
 before_data jsonb,
 after_data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cms_entry_audit_lookup_idx
 ON fbmn_catalog_private.cms_entry_audit(entry_id,created_at DESC);

REVOKE ALL ON fbmn_catalog_private.cms_entries,fbmn_catalog_private.cms_entry_audit FROM PUBLIC;
GRANT SELECT,INSERT ON fbmn_catalog_private.cms_entries TO fbmn_admin_http_staging;
GRANT UPDATE (title,summary,paragraphs,cta_url,channel_targets,sort_order,
 starts_at,ends_at,source_ref,status,verified_at,verified_by,approved_at,
 approved_by,published_at,withdrawn_at,revision,updated_by,updated_at)
 ON fbmn_catalog_private.cms_entries TO fbmn_admin_http_staging;
GRANT SELECT,INSERT ON fbmn_catalog_private.cms_entry_audit TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog_private.cms_entry_audit_id_seq TO fbmn_admin_http_staging;
-- No grants to public reader, no cross-channel publication, no NET/price access.
COMMIT;
