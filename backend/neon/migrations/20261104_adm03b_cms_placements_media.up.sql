-- L07 CMS placements and private R2 media. Additive; never modifies SKU or NET.
-- This migration follows 20261104_adm03_cms_entries.up.sql.
BEGIN;
DO $guard$ BEGIN
 IF to_regclass('fbmn_catalog_private.cms_entries') IS NULL
    OR to_regclass('fbmn_catalog_private.cms_entry_audit') IS NULL
 THEN RAISE EXCEPTION 'L07 CMS authoring migration required first'; END IF;
END $guard$;

ALTER TABLE fbmn_catalog_private.cms_entries
 ADD COLUMN placements jsonb NOT NULL DEFAULT '{}'::jsonb,
 ADD COLUMN popup_delay_seconds integer NOT NULL DEFAULT 3,
 ADD COLUMN popup_cooldown_minutes integer NOT NULL DEFAULT 1440,
 ADD COLUMN popup_max_per_session integer NOT NULL DEFAULT 1,
 ADD CONSTRAINT cms_entries_placements_shape CHECK (jsonb_typeof(placements)='object'),
 ADD CONSTRAINT cms_entries_popup_delay_check CHECK(popup_delay_seconds BETWEEN 0 AND 120),
 ADD CONSTRAINT cms_entries_popup_cooldown_check CHECK(popup_cooldown_minutes BETWEEN 0 AND 43200),
 ADD CONSTRAINT cms_entries_popup_max_check CHECK(popup_max_per_session BETWEEN 1 AND 20);

CREATE TABLE fbmn_catalog_private.cms_entry_media (
 entry_id uuid NOT NULL REFERENCES fbmn_catalog_private.cms_entries(id) ON DELETE RESTRICT,
 channel text NOT NULL CHECK(channel IN ('public_web','dealer_app','consumer_app')),
 device text NOT NULL CHECK(device IN ('desktop','mobile')),
 r2_key text NOT NULL UNIQUE CHECK(r2_key ~ '^cms/[0-9a-f-]{36}/(public_web|dealer_app|consumer_app)/(desktop|mobile)/[0-9a-f-]{36}\.webp$'),
 mime_type text NOT NULL DEFAULT 'image/webp' CHECK(mime_type='image/webp'),
 width integer NOT NULL CHECK(width BETWEEN 64 AND 6000),
 height integer NOT NULL CHECK(height BETWEEN 64 AND 6000),
 file_sha256 text NOT NULL CHECK(file_sha256 ~ '^[0-9a-f]{64}$'),
 uploaded_by text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(entry_id,channel,device)
);
CREATE INDEX cms_entry_media_owner_idx
 ON fbmn_catalog_private.cms_entry_media(entry_id,channel,device);

ALTER TABLE fbmn_catalog_private.cms_entry_audit
 DROP CONSTRAINT cms_entry_audit_action_check;
ALTER TABLE fbmn_catalog_private.cms_entry_audit
 ADD CONSTRAINT cms_entry_audit_action_check
 CHECK(action IN ('create','update','publish','hide','media_upload'));

GRANT UPDATE (placements,popup_delay_seconds,popup_cooldown_minutes,popup_max_per_session)
 ON fbmn_catalog_private.cms_entries TO fbmn_admin_http_staging;
REVOKE ALL ON fbmn_catalog_private.cms_entry_media FROM PUBLIC;
GRANT SELECT,INSERT ON fbmn_catalog_private.cms_entry_media TO fbmn_admin_http_staging;
GRANT UPDATE (r2_key,mime_type,width,height,file_sha256,uploaded_by,updated_at)
 ON fbmn_catalog_private.cms_entry_media TO fbmn_admin_http_staging;
-- Public role has no access. Public projection must be separate and allowlisted.
COMMIT;
