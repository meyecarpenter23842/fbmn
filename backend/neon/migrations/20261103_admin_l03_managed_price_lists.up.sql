-- ADMIN L03: additive user-defined private price list registry (no price writes).
BEGIN;
CREATE TABLE fbmn_catalog_private.managed_price_lists (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 list_code text NOT NULL UNIQUE CHECK(list_code ~ '^[A-Z0-9][A-Z0-9_-]{1,39}$'),
 list_name text NOT NULL CHECK(length(btrim(list_name)) BETWEEN 2 AND 120),
 note text NOT NULL DEFAULT '',
 audience text NOT NULL CHECK(audience IN ('internal','consumer','dealer')),
 channel_codes text[] NOT NULL DEFAULT '{}'::text[],
 scope_customer_type text,
 scope_customer_id uuid REFERENCES futurebook.customers(id) ON DELETE RESTRICT,
 approval_state text NOT NULL DEFAULT 'draft' CHECK(approval_state IN ('draft','approved','inactive')),
 approved_by text,
 approved_at timestamptz,
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 valid_from date NOT NULL,
 valid_until date,
 created_by text NOT NULL,
 updated_by text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(valid_until IS NULL OR valid_until>=valid_from),
 CHECK(channel_codes <@ ARRAY['public_web','dealer_app','consumer_app']::text[]),
 CHECK((audience='internal' AND cardinality(channel_codes)=0 AND scope_customer_type IS NULL AND scope_customer_id IS NULL)
 OR (audience='consumer' AND cardinality(channel_codes)>0 AND channel_codes <@ ARRAY['public_web','consumer_app']::text[] AND scope_customer_type IS NULL AND scope_customer_id IS NULL)
 OR (audience='dealer' AND cardinality(channel_codes)=1 AND channel_codes[1]='dealer_app')),
 CHECK(scope_customer_type IS NULL OR scope_customer_id IS NULL),
 CHECK(approval_state<>'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE INDEX managed_price_lists_scope_idx ON fbmn_catalog_private.managed_price_lists(audience,approval_state,valid_from);
REVOKE ALL ON fbmn_catalog_private.managed_price_lists FROM PUBLIC;
GRANT SELECT,INSERT ON fbmn_catalog_private.managed_price_lists TO fbmn_admin_http_staging;
GRANT UPDATE(list_name,note,audience,channel_codes,scope_customer_type,scope_customer_id,valid_from,valid_until,approval_state,approved_by,approved_at,revision,updated_by,updated_at) ON fbmn_catalog_private.managed_price_lists TO fbmn_admin_http_staging;
COMMIT;