-- ADM-02 issue #19: PRIVATE master catalogue staging migration; never auto-deploy.
-- Company SKU is the business key, never infer SKU from filename/colour.
BEGIN;
CREATE SCHEMA fbmn_catalog;
REVOKE ALL ON SCHEMA fbmn_catalog FROM PUBLIC;
CREATE TABLE fbmn_catalog.families (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 family_label text NOT NULL CHECK (length(trim(family_label)) BETWEEN 1 AND 160),
 created_at timestamptz NOT NULL DEFAULT now(),
 revision integer NOT NULL DEFAULT 1 CHECK (revision > 0)
);
CREATE TABLE fbmn_catalog.skus (
 sku_cong_ty text PRIMARY KEY CHECK (length(sku_cong_ty) BETWEEN 1 AND 80 AND sku_cong_ty = trim(sku_cong_ty) AND sku_cong_ty !~ '[[:cntrl:]]'),
 family_id uuid REFERENCES fbmn_catalog.families(id),
 ten_goc_xnt text,
 ten_goc_bang_gia text,
 ten_san_pham text,
 barcode text,
 paper_size text,
 product_spec jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(product_spec) = 'object'),
 evidence jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(evidence) = 'object'),
 price_verification text NOT NULL DEFAULT 'unverified' CHECK (price_verification IN ('unverified','source_checked')),
 review_status text NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft','needs_review','approved','withdrawn')),
 reviewed_by text,
 reviewed_at timestamptz,
 revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (ten_goc_xnt IS NOT NULL OR ten_goc_bang_gia IS NOT NULL OR ten_san_pham IS NOT NULL),
 CHECK (review_status <> 'approved' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE UNIQUE INDEX skus_casefold_unique ON fbmn_catalog.skus(upper(sku_cong_ty));
CREATE INDEX skus_review_status_idx ON fbmn_catalog.skus(review_status, updated_at DESC);
-- A single verified R2 object may link to multiple company SKUs after approval.
CREATE TABLE fbmn_catalog.media_assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_filename text NOT NULL CHECK (length(source_filename) BETWEEN 1 AND 500),
 r2_key text UNIQUE,
 mime_type text CHECK (mime_type IS NULL OR mime_type IN ('image/jpeg','image/png','image/webp','image/avif')),
 file_sha256 text CHECK (file_sha256 IS NULL OR file_sha256 ~ '^[a-f0-9]{64}$'),
 review_status text NOT NULL DEFAULT 'unreviewed' CHECK (review_status IN ('unreviewed','approved','rejected')),
 reviewed_by text,
 reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (review_status <> 'approved' OR (r2_key IS NOT NULL AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE TABLE fbmn_catalog.sku_media (
 sku_cong_ty text NOT NULL REFERENCES fbmn_catalog.skus(sku_cong_ty) ON DELETE RESTRICT,
 asset_id uuid NOT NULL REFERENCES fbmn_catalog.media_assets(id) ON DELETE RESTRICT,
 media_role text NOT NULL DEFAULT 'cover' CHECK (media_role IN ('cover','detail','support')),
 sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
 match_method text NOT NULL CHECK (match_method IN ('filename_exact','document_exact','name_inferred','manual','shared_candidate')),
 confidence numeric(5,4) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
 review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
 reviewed_by text,
 reviewed_at timestamptz,
 PRIMARY KEY (sku_cong_ty,asset_id),
 CHECK (review_status <> 'approved' OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE INDEX sku_media_asset_idx ON fbmn_catalog.sku_media(asset_id);
CREATE TABLE fbmn_catalog.publications (
 sku_cong_ty text NOT NULL REFERENCES fbmn_catalog.skus(sku_cong_ty) ON DELETE RESTRICT,
 channel_code text NOT NULL REFERENCES fbmn_admin.channels(code),
 state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','approved','published','hidden')),
 approved_by text,
 approved_at timestamptz,
 published_at timestamptz,
 revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
 PRIMARY KEY (sku_cong_ty,channel_code),
 CHECK (state NOT IN ('approved','published') OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
 CHECK (state <> 'published' OR published_at IS NOT NULL)
);
CREATE TABLE fbmn_catalog.import_batches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_filename text NOT NULL,
 source_sha256 text CHECK (source_sha256 IS NULL OR source_sha256 ~ '^[a-f0-9]{64}$'),
 actor_subject text NOT NULL,
 status text NOT NULL DEFAULT 'preview' CHECK (status IN ('preview','approved','applied','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 applied_at timestamptz
);
CREATE TABLE fbmn_catalog.audit_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_subject text NOT NULL,
 sku_cong_ty text,
 operation text NOT NULL,
 before_json jsonb,
 after_json jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX catalog_audit_by_sku_idx ON fbmn_catalog.audit_events(sku_cong_ty,created_at DESC);
-- Internal price evidence isolation: NO GRANT to fbmn_public_reader or generic admin runtime.
CREATE SCHEMA fbmn_catalog_private;
REVOKE ALL ON SCHEMA fbmn_catalog_private FROM PUBLIC;
CREATE TABLE fbmn_catalog_private.price_evidence (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sku_cong_ty text NOT NULL REFERENCES fbmn_catalog.skus(sku_cong_ty),
 source_document text NOT NULL,
 source_kind text NOT NULL CHECK (source_kind IN ('hs_sv_price_table','vpp_net_table','other_source')),
 source_vat_rate numeric(5,4),
 effective_from date,
 source_price_vnd bigint CHECK (source_price_vnd IS NULL OR source_price_vnd >= 0),
 verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','verified')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX price_evidence_sku_idx ON fbmn_catalog_private.price_evidence(sku_cong_ty);
COMMIT;
