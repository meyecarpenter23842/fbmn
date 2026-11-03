-- Owner pricing UX: allow a generic price list to explicitly cover both
-- consumer and dealer channels. This does not publish any price to public APIs.
-- Mixed-channel lists MUST have no customer-specific scope to prevent leaking
-- a customer's private negotiated rate across consumer channels.
-- Existing audience values and all rows remain valid. Atomic DDL only.
BEGIN;
ALTER TABLE fbmn_catalog_private.managed_price_lists
 DROP CONSTRAINT managed_price_lists_audience_check,
 DROP CONSTRAINT managed_price_lists_check1,
 ADD CONSTRAINT managed_price_lists_audience_check
  CHECK(audience IN ('internal','consumer','dealer','mixed')),
 ADD CONSTRAINT managed_price_lists_check1
  CHECK(
   (audience='internal' AND cardinality(channel_codes)=0
    AND scope_customer_type IS NULL AND scope_customer_id IS NULL)
   OR
   (audience='consumer' AND cardinality(channel_codes)>0
    AND channel_codes <@ ARRAY['public_web','consumer_app']::text[]
    AND scope_customer_type IS NULL AND scope_customer_id IS NULL)
   OR
   (audience='dealer' AND cardinality(channel_codes)=1
    AND channel_codes[1]='dealer_app')
   OR
   (audience='mixed' AND cardinality(channel_codes)>=2
    AND 'dealer_app'=ANY(channel_codes)
    AND ( 'public_web'=ANY(channel_codes)
      OR 'consumer_app'=ANY(channel_codes) )
    AND scope_customer_type IS NULL AND scope_customer_id IS NULL)
  );
COMMIT;
