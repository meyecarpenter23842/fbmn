-- DL7B: isolated R2 Catalogue metadata. Do not apply without Owner migration approval.
-- Requires DL4 migration and existing fbmn_admin role/audit schema.
BEGIN;
DO $guard$ BEGIN
 IF to_regclass('fbmn_catalog_private.web_home_layout') IS NULL OR
    to_regrole('fbmn_admin_http_staging') IS NULL OR
    to_regclass('fbmn_admin.audit_events') IS NULL
 THEN RAISE EXCEPTION 'DL7B prerequisites: DL4 migration and Admin role'; END IF;
END $guard$;

ALTER TABLE fbmn_admin.audit_events DROP CONSTRAINT audit_events_action_check;
ALTER TABLE fbmn_admin.audit_events ADD CONSTRAINT audit_events_action_check
 CHECK(action IN ('session.read','channels.read','publish.check','pricing.check',
  'catalogue.manage','pricing.private','cms.manage','website.layout','website.catalogue'));

CREATE TABLE fbmn_catalog_private.website_catalogue_books (
 id uuid PRIMARY KEY,
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 120 AND title=btrim(title)),
 edition text NOT NULL DEFAULT '' CHECK(length(edition)<=80 AND edition=btrim(edition)),
 state text NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','ready','hidden')),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 created_by text NOT NULL,
 updated_by text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE fbmn_catalog_private.website_catalogue_assets (
 id uuid PRIMARY KEY,
 book_id uuid NOT NULL REFERENCES fbmn_catalog_private.website_catalogue_books(id) ON DELETE RESTRICT,
 kind text NOT NULL CHECK(kind IN ('page','cover','background_desktop','background_mobile')),
 sort_order integer NOT NULL DEFAULT 0 CHECK(sort_order BETWEEN 0 AND 200),
 r2_key text NOT NULL UNIQUE,
 mime_type text NOT NULL DEFAULT 'image/webp' CHECK(mime_type='image/webp'),
 byte_size integer NOT NULL CHECK(byte_size BETWEEN 100 AND 5242880),
 width integer NOT NULL CHECK(width BETWEEN 64 AND 6000),
 height integer NOT NULL CHECK(height BETWEEN 64 AND 6000),
 file_sha256 text NOT NULL CHECK(file_sha256 ~ '^[0-9a-f]{64}$'),
 uploaded_by text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT website_catalogue_key_scope CHECK (
  (kind='page' AND r2_key ~ '^books/[0-9a-f-]{36}/pages/[0-9a-f-]{36}\.webp$') OR
  (kind='cover' AND r2_key ~ '^books/[0-9a-f-]{36}/covers/[0-9a-f-]{36}\.webp$') OR
  (kind='background_desktop' AND r2_key ~ '^backgrounds/desktop/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$') OR
  (kind='background_mobile' AND r2_key ~ '^backgrounds/mobile/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$')
 )
);
CREATE INDEX website_catalogue_assets_book_idx
 ON fbmn_catalog_private.website_catalogue_assets(book_id,kind,sort_order,id);
CREATE UNIQUE INDEX website_catalogue_singleton_asset
 ON fbmn_catalog_private.website_catalogue_assets(book_id,kind) WHERE kind<>'page';
CREATE TABLE fbmn_catalog_private.website_catalogue_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 book_id uuid NOT NULL REFERENCES fbmn_catalog_private.website_catalogue_books(id) ON DELETE RESTRICT,
 revision integer NOT NULL,
 actor_subject text NOT NULL,
 operation text NOT NULL CHECK(operation IN ('create','save','upload','reorder','remove','ready','hide')),
 before_data jsonb NOT NULL,
 after_data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON fbmn_catalog_private.website_catalogue_books,
 fbmn_catalog_private.website_catalogue_assets,
 fbmn_catalog_private.website_catalogue_audit FROM PUBLIC;
GRANT SELECT,INSERT ON fbmn_catalog_private.website_catalogue_books TO fbmn_admin_http_staging;
GRANT UPDATE (title,edition,state,revision,updated_by,updated_at)
 ON fbmn_catalog_private.website_catalogue_books TO fbmn_admin_http_staging;
GRANT SELECT,INSERT,DELETE ON fbmn_catalog_private.website_catalogue_assets TO fbmn_admin_http_staging;
GRANT UPDATE(sort_order) ON fbmn_catalog_private.website_catalogue_assets TO fbmn_admin_http_staging;
GRANT SELECT,INSERT ON fbmn_catalog_private.website_catalogue_audit TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog_private.website_catalogue_audit_id_seq TO fbmn_admin_http_staging;
-- NO public schema view/GRANT until DL7C publication renderer is approved.
COMMIT;
