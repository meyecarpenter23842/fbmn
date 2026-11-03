-- G04: private explicit pricebook. Zero rows imported or published.
-- Existing futurebook.price_lists/sku_prices and price_evidence remain untouched.
BEGIN;
ALTER TABLE fbmn_admin.audit_events DROP CONSTRAINT audit_events_action_check;
ALTER TABLE fbmn_admin.audit_events ADD CONSTRAINT audit_events_action_check
 CHECK (action IN ('session.read','channels.read','publish.check','pricing.check',
                  'catalogue.manage','pricing.private'));
CREATE TABLE fbmn_catalog_private.pricebook_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sku_cong_ty text NOT NULL REFERENCES fbmn_catalog.skus(sku_cong_ty) ON DELETE RESTRICT,
 price_kind text NOT NULL CHECK (price_kind IN ('source','net_internal','retail_public','dealer_contract')),
 customer_id uuid,
 amount_vnd bigint NOT NULL CHECK (amount_vnd >= 0),
 currency text NOT NULL DEFAULT 'VND' CHECK (currency = 'VND'),
 vat_included boolean NOT NULL,
 vat_rate_bps integer CHECK (vat_rate_bps IS NULL OR vat_rate_bps BETWEEN 0 AND 10000),
 source_document text NOT NULL CHECK (length(btrim(source_document)) BETWEEN 1 AND 300),
 effective_from date NOT NULL,
 effective_until date,
 approval_state text NOT NULL DEFAULT 'draft' CHECK (approval_state = 'draft'),
 revision integer NOT NULL DEFAULT 1 CHECK (revision >= 1),
 updated_by text NOT NULL CHECK (length(updated_by) BETWEEN 1 AND 200),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((price_kind = 'dealer_contract') = (customer_id IS NOT NULL)),
 CHECK (effective_until IS NULL OR effective_until >= effective_from)
);
-- A draft is not a published/approved retail or dealer price.
-- Separate indexes make NULL customer scopes unique too.
CREATE UNIQUE INDEX g04_pricebook_non_dealer_unique ON fbmn_catalog_private.pricebook_entries(sku_cong_ty,price_kind,effective_from)
 WHERE customer_id IS NULL;
CREATE UNIQUE INDEX g04_pricebook_dealer_unique ON fbmn_catalog_private.pricebook_entries(sku_cong_ty,price_kind,customer_id,effective_from)
 WHERE customer_id IS NOT NULL;
CREATE INDEX g04_pricebook_sku_idx ON fbmn_catalog_private.pricebook_entries(sku_cong_ty,effective_from DESC);
CREATE TABLE fbmn_catalog_private.pricebook_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 entry_id uuid NOT NULL REFERENCES fbmn_catalog_private.pricebook_entries(id) ON DELETE RESTRICT,
 actor_subject text NOT NULL,
 action text NOT NULL CHECK (action IN ('create_draft','update_draft')),
 old_revision integer,
 new_revision integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON fbmn_catalog_private.pricebook_entries,fbmn_catalog_private.pricebook_audit FROM PUBLIC;
-- This runtime is reachable only from the authenticated Admin Worker; no
-- fbmn_public_reader, generic fbmn_admin_runtime or B2B access is granted.
GRANT USAGE ON SCHEMA fbmn_catalog_private TO fbmn_admin_http_staging;
GRANT SELECT,INSERT,UPDATE (amount_vnd,vat_included,vat_rate_bps,source_document,effective_until,revision,updated_by,updated_at)
 ON fbmn_catalog_private.pricebook_entries TO fbmn_admin_http_staging;
GRANT INSERT ON fbmn_catalog_private.pricebook_audit TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog_private.pricebook_audit_id_seq TO fbmn_admin_http_staging;
COMMIT;
