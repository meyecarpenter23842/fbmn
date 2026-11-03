-- L03B: priced SKUs belong to owner-defined lists; no synthetic price or publication.
BEGIN;
CREATE TABLE fbmn_catalog_private.managed_price_list_prices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 list_id uuid NOT NULL REFERENCES fbmn_catalog_private.managed_price_lists(id) ON DELETE RESTRICT,
 sku_cong_ty text NOT NULL REFERENCES fbmn_catalog.skus(sku_cong_ty) ON DELETE RESTRICT,
 amount_vnd bigint NOT NULL CHECK(amount_vnd BETWEEN 0 AND 1000000000000),
 vat_included boolean NOT NULL,
 source_document text NOT NULL CHECK(length(btrim(source_document)) BETWEEN 1 AND 300),
 valid_from date NOT NULL,
 valid_until date,
 approval_state text NOT NULL DEFAULT 'draft' CHECK(approval_state IN ('draft','approved')),
 approved_by text,
 approved_at timestamptz,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 updated_by text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(list_id,sku_cong_ty,valid_from),
 CHECK(valid_until IS NULL OR valid_until>=valid_from),
 CHECK(approval_state<>'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE TABLE fbmn_catalog_private.managed_price_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_subject text NOT NULL,
 action text NOT NULL,
 list_id uuid,
 price_id uuid,
 old_value jsonb,
 new_value jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX managed_price_item_idx ON fbmn_catalog_private.managed_price_list_prices(list_id,sku_cong_ty,valid_from DESC);
CREATE INDEX managed_price_audit_recent_idx ON fbmn_catalog_private.managed_price_audit(created_at DESC);
REVOKE ALL ON fbmn_catalog_private.managed_price_list_prices,fbmn_catalog_private.managed_price_audit FROM PUBLIC;
GRANT SELECT,INSERT ON fbmn_catalog_private.managed_price_list_prices,fbmn_catalog_private.managed_price_audit TO fbmn_admin_http_staging;
GRANT UPDATE(amount_vnd,vat_included,source_document,valid_until,approval_state,approved_by,approved_at,revision,updated_by,updated_at) ON fbmn_catalog_private.managed_price_list_prices TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog_private.managed_price_audit_id_seq TO fbmn_admin_http_staging;
GRANT USAGE ON SCHEMA futurebook TO fbmn_admin_http_staging;
GRANT SELECT(id,customer_code,display_name,customer_type,status) ON futurebook.customers TO fbmn_admin_http_staging;
COMMIT;