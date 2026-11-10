-- DL7C-S Owner-only flipbook settings, read-only public projection; DL7B/DL7C required.
BEGIN;
DO $check$ BEGIN
 IF to_regclass('fbmn_catalog_private.website_catalogue_books') IS NULL
 OR to_regrole('fbmn_admin_http_staging') IS NULL OR to_regrole('fbmn_public_reader') IS NULL
 THEN RAISE EXCEPTION 'DL7C-S needs DL7B and roles'; END IF;
END $check$;
CREATE TABLE fbmn_catalog_private.website_catalogue_viewer_settings (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 flip_duration_ms integer NOT NULL DEFAULT 950 CHECK(flip_duration_ms BETWEEN 750 AND 1500 AND flip_duration_ms % 50=0),
 sound_enabled boolean NOT NULL DEFAULT false,
 shadow_opacity numeric(3,2) NOT NULL DEFAULT 0.26 CHECK(shadow_opacity BETWEEN 0.10 AND 0.50),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 updated_by text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO fbmn_catalog_private.website_catalogue_viewer_settings
 (singleton,flip_duration_ms,sound_enabled,shadow_opacity,revision,updated_by)
 VALUES (true,950,false,0.26,1,'migration');
CREATE TABLE fbmn_catalog_private.website_catalogue_viewer_settings_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 revision integer NOT NULL CHECK(revision>=1),
 actor_subject text NOT NULL,
 before_data jsonb NOT NULL,
 after_data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON fbmn_catalog_private.website_catalogue_viewer_settings,
 fbmn_catalog_private.website_catalogue_viewer_settings_audit FROM PUBLIC;
GRANT SELECT ON fbmn_catalog_private.website_catalogue_viewer_settings TO fbmn_admin_http_staging;
GRANT UPDATE(flip_duration_ms,sound_enabled,shadow_opacity,revision,updated_by,updated_at)
 ON fbmn_catalog_private.website_catalogue_viewer_settings TO fbmn_admin_http_staging;
GRANT SELECT,INSERT ON fbmn_catalog_private.website_catalogue_viewer_settings_audit TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog_private.website_catalogue_viewer_settings_audit_id_seq TO fbmn_admin_http_staging;
CREATE VIEW fbmn_public.v_catalogue_viewer_settings WITH (security_barrier=true) AS
 SELECT flip_duration_ms,sound_enabled,shadow_opacity
 FROM fbmn_catalog_private.website_catalogue_viewer_settings WHERE singleton=true;
REVOKE ALL ON fbmn_public.v_catalogue_viewer_settings FROM PUBLIC;
GRANT SELECT ON fbmn_public.v_catalogue_viewer_settings TO fbmn_public_reader;
COMMIT;
