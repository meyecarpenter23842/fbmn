-- SEO02B: private and audited SEO metadata. Public read model follows separately.
BEGIN;
DO $preflight$ BEGIN
 IF to_regrole('fbmn_admin_http_staging') IS NULL OR to_regnamespace('fbmn_catalog_private') IS NULL
 THEN RAISE EXCEPTION 'SEO02B prerequisites missing'; END IF;
END $preflight$;
CREATE TABLE fbmn_catalog_private.web_seo_settings (
 kind text NOT NULL CHECK(kind IN ('product','category','article','promotion')),
 slug text NOT NULL CHECK(length(slug) BETWEEN 1 AND 100 AND slug ~ '^[a-z0-9][a-z0-9-]*$'),
 mode text NOT NULL DEFAULT 'auto' CHECK(mode IN ('auto','custom','noindex')),
 seo_title text NOT NULL DEFAULT '' CHECK(length(seo_title)<=180 AND seo_title !~ '[<>]'),
 meta_description text NOT NULL DEFAULT '' CHECK(length(meta_description)<=400 AND meta_description !~ '[<>]'),
 og_image_path text CHECK(og_image_path IS NULL OR og_image_path ~ '^/api/catalogue-image/[0-9a-f-]{36}$'),
 revision integer NOT NULL DEFAULT 1 CHECK(revision >= 1),
 updated_by text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(kind,slug)
);
CREATE TABLE fbmn_catalog_private.web_seo_settings_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 kind text NOT NULL,slug text NOT NULL,actor_subject text NOT NULL,
 revision integer NOT NULL,before_data jsonb,after_data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON fbmn_catalog_private.web_seo_settings,
 fbmn_catalog_private.web_seo_settings_audit FROM PUBLIC;
GRANT SELECT,INSERT ON fbmn_catalog_private.web_seo_settings TO fbmn_admin_http_staging;
GRANT UPDATE(mode,seo_title,meta_description,og_image_path,revision,updated_by,updated_at)
 ON fbmn_catalog_private.web_seo_settings TO fbmn_admin_http_staging;
GRANT SELECT,INSERT ON fbmn_catalog_private.web_seo_settings_audit TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog_private.web_seo_settings_audit_id_seq TO fbmn_admin_http_staging;
COMMIT;
