-- C4: Allowlisted Website CMS projection. Review and stage manually; do not run on production without Owner approval.
-- Private CMS records and R2 keys are NOT public tables. These security-barrier
-- views are owned by the migration owner (not the public login); grants stay SELECT-only.
BEGIN;
DO $preflight$ BEGIN
 IF to_regclass('fbmn_catalog_private.cms_entries') IS NULL
    OR to_regclass('fbmn_catalog_private.cms_entry_media') IS NULL
    OR to_regrole('fbmn_public_reader') IS NULL
    OR to_regnamespace('fbmn_public') IS NULL
 THEN RAISE EXCEPTION 'C4 prerequisites missing: apply ADM-03 CMS and public read model first'; END IF;
END $preflight$;

-- Query-time publication gate means a hide, end-date or withdrawal takes effect
-- immediately; no materialized snapshot or browser-controlled timestamp.
CREATE VIEW fbmn_public.v_cms_web_entries WITH (security_barrier=true) AS
 SELECT c.id::text AS id,c.kind,c.slug,c.title,c.summary,c.paragraphs,
        c.cta_url,c.placements->>'public_web' AS slot,c.sort_order,
        c.published_at,c.starts_at,c.ends_at,
        c.popup_delay_seconds,c.popup_cooldown_minutes,c.popup_max_per_session,
        EXISTS (SELECT 1 FROM fbmn_catalog_private.cms_entry_media m
                WHERE m.entry_id=c.id AND m.channel='public_web'
                  AND m.device='desktop' AND m.mime_type='image/webp') AS has_desktop,
        EXISTS (SELECT 1 FROM fbmn_catalog_private.cms_entry_media m
                WHERE m.entry_id=c.id AND m.channel='public_web'
                  AND m.device='mobile' AND m.mime_type='image/webp') AS has_mobile
 FROM fbmn_catalog_private.cms_entries c
 WHERE c.status='published'
   AND c.channel_targets @> ARRAY['public_web']::text[]
   AND c.source_ref<>'' AND c.verified_at IS NOT NULL AND c.approved_at IS NOT NULL
   AND c.verified_at<=CURRENT_TIMESTAMP AND c.approved_at<=CURRENT_TIMESTAMP
   AND c.published_at IS NOT NULL AND c.published_at<=CURRENT_TIMESTAMP
   AND (c.starts_at IS NULL OR c.starts_at<=CURRENT_TIMESTAMP)
   AND (c.ends_at IS NULL OR c.ends_at>=CURRENT_TIMESTAMP)
   AND (c.withdrawn_at IS NULL OR c.withdrawn_at>CURRENT_TIMESTAMP)
   AND jsonb_typeof(c.placements)='object'
   AND CASE c.kind
    WHEN 'banner' THEN c.placements->>'public_web' IN ('home.hero','home.after_products','category.header')
    WHEN 'popup' THEN c.placements->>'public_web' IN ('home.entry','category.entry','all.entry')
    WHEN 'article' THEN c.placements->>'public_web' IN ('news.list','home.news_featured')
    WHEN 'promotion' THEN c.placements->>'public_web' IN ('promotions.list','home.promotion_featured')
    ELSE false END
   AND (c.kind NOT IN ('banner','popup') OR
        (EXISTS (SELECT 1 FROM fbmn_catalog_private.cms_entry_media m
                 WHERE m.entry_id=c.id AND m.channel='public_web' AND m.device='desktop'
                   AND m.mime_type='image/webp')
         AND EXISTS (SELECT 1 FROM fbmn_catalog_private.cms_entry_media m
                 WHERE m.entry_id=c.id AND m.channel='public_web' AND m.device='mobile'
                   AND m.mime_type='image/webp')))
   AND (c.kind<>'promotion' OR c.ends_at IS NOT NULL);

-- Image lookup only returns keys whose parent is still published at query time.
-- No caller-supplied R2 key, no bucket listing, no public access to private CMS.
CREATE VIEW fbmn_public.v_cms_web_images WITH (security_barrier=true) AS
 SELECT m.entry_id::text AS id,m.device,m.r2_key
 FROM fbmn_catalog_private.cms_entry_media m
 JOIN fbmn_public.v_cms_web_entries e ON e.id=m.entry_id::text
 WHERE m.channel='public_web' AND m.device IN ('desktop','mobile')
   AND m.mime_type='image/webp'
   AND m.r2_key ~ '^cms/[0-9a-f-]{36}/public_web/(desktop|mobile)/[0-9a-f-]{36}\.webp$';

REVOKE ALL ON fbmn_public.v_cms_web_entries,fbmn_public.v_cms_web_images FROM PUBLIC;
GRANT SELECT ON fbmn_public.v_cms_web_entries,fbmn_public.v_cms_web_images TO fbmn_public_reader;
-- Do NOT grant SELECT on fbmn_catalog_private tables to fbmn_public_reader
-- or fbmn_p5_public_login; security-barrier views use the view owner's rights.
COMMIT;
