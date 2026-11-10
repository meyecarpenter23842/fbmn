-- DL7A PDF: one private PDF per existing Catalogue book/edition, not a second CMS.
-- Apply only after reviewed staging rehearsal and separate Owner approval for production.
BEGIN;
DO $pre$ BEGIN
 IF to_regclass('fbmn_catalog_private.website_catalogue_books') IS NULL OR
    to_regclass('fbmn_catalog_private.website_catalogue_audit') IS NULL OR
    to_regclass('fbmn_public.v_catalogue_ready_books') IS NULL OR
    to_regrole('fbmn_admin_http_staging') IS NULL OR
    to_regrole('fbmn_public_reader') IS NULL
 THEN RAISE EXCEPTION 'DL7A PDF requires existing DL7B/DL7C Catalogue schema and roles'; END IF;
END $pre$;

CREATE TABLE fbmn_catalog_private.website_catalogue_pdfs (
 book_id uuid PRIMARY KEY REFERENCES fbmn_catalog_private.website_catalogue_books(id) ON DELETE RESTRICT,
 r2_key text NOT NULL UNIQUE CHECK(r2_key ~ '^books/[0-9a-f-]{36}/pdf/[0-9a-f-]{36}\.pdf$'),
 byte_size integer NOT NULL CHECK(byte_size BETWEEN 100 AND 20971520),
 file_sha256 text NOT NULL CHECK(file_sha256 ~ '^[0-9a-f]{64}$'),
 mime_type text NOT NULL DEFAULT 'application/pdf' CHECK(mime_type='application/pdf'),
 visible boolean NOT NULL DEFAULT false,
 download_enabled boolean NOT NULL DEFAULT false,
 uploaded_by text NOT NULL,
 uploaded_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT pdf_download_requires_visibility CHECK(NOT download_enabled OR visible)
);
REVOKE ALL ON fbmn_catalog_private.website_catalogue_pdfs FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE,DELETE
 ON fbmn_catalog_private.website_catalogue_pdfs TO fbmn_admin_http_staging;

-- Preserve the DL7C book projection columns; add PDF-only books when explicitly visible.
CREATE OR REPLACE VIEW fbmn_public.v_catalogue_ready_books WITH (security_barrier=true) AS
 SELECT b.id,b.title,b.edition,b.updated_at
 FROM fbmn_catalog_private.website_catalogue_books b
 WHERE b.state='ready' AND (
  EXISTS (SELECT 1 FROM fbmn_catalog_private.website_catalogue_assets a
          WHERE a.book_id=b.id AND a.kind='page')
  OR EXISTS (SELECT 1 FROM fbmn_catalog_private.website_catalogue_pdfs p
             WHERE p.book_id=b.id AND p.visible=true)
 );

-- Separate allowlisted view: no direct public grants on private PDF rows.
CREATE VIEW fbmn_public.v_catalogue_ready_pdfs WITH (security_barrier=true) AS
 SELECT p.book_id,p.r2_key,p.byte_size,p.mime_type,p.download_enabled
 FROM fbmn_catalog_private.website_catalogue_pdfs p
 JOIN fbmn_public.v_catalogue_ready_books b ON b.id=p.book_id
 WHERE p.visible=true AND p.mime_type='application/pdf';
REVOKE ALL ON fbmn_public.v_catalogue_ready_pdfs FROM PUBLIC;
GRANT SELECT ON fbmn_public.v_catalogue_ready_pdfs TO fbmn_public_reader;
COMMIT;