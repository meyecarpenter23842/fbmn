-- Owner 14/11/2026: revisioned Website App-download popup settings.
-- Run only after explicit production migration approval; no SKU, prices or CMS changes.
BEGIN;
DO $check$ BEGIN
 IF to_regrole('fbmn_admin_http_staging') IS NULL OR
    to_regrole('fbmn_public_reader') IS NULL OR
    to_regrole('fbmn_p5_public_login') IS NULL OR
    to_regnamespace('fbmn_catalog_private') IS NULL OR
    to_regnamespace('fbmn_public') IS NULL
 THEN RAISE EXCEPTION 'App download prerequisites missing'; END IF;
END $check$;
CREATE TABLE fbmn_catalog_private.web_app_download_settings (
 singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
 popup_enabled boolean NOT NULL DEFAULT true,
 button_enabled boolean NOT NULL DEFAULT true,
 first_delay_ms integer NOT NULL DEFAULT 1400 CHECK (first_delay_ms BETWEEN 500 AND 15000),
 cooldown_minutes integer NOT NULL DEFAULT 120 CHECK (cooldown_minutes BETWEEN 30 AND 1440),
 title text NOT NULL DEFAULT 'Ứng dụng Futurebook' CHECK (char_length(title) BETWEEN 1 AND 80),
 message text NOT NULL DEFAULT 'Ứng dụng chưa phát hành. Đường dẫn tải sẽ cập nhật khi có bản chính thức.'
  CHECK (char_length(message) BETWEEN 1 AND 240),
 ios_url text CHECK (ios_url IS NULL OR (char_length(ios_url)<=500 AND ios_url LIKE 'https://apps.apple.com/%')),
 android_url text CHECK (android_url IS NULL OR (char_length(android_url)<=500 AND android_url LIKE 'https://play.google.com/store/apps/details%')),
 revision integer NOT NULL DEFAULT 1 CHECK (revision >= 1),
 updated_by text NOT NULL DEFAULT 'migration',
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO fbmn_catalog_private.web_app_download_settings(singleton) VALUES (true);
CREATE TABLE fbmn_catalog_private.web_app_download_settings_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 revision integer NOT NULL CHECK (revision >= 1),
 actor_subject text NOT NULL,
 operation text NOT NULL CHECK (operation IN ('save','reset')),
 before_data jsonb NOT NULL,
 after_data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON fbmn_catalog_private.web_app_download_settings,
 fbmn_catalog_private.web_app_download_settings_audit FROM PUBLIC;
GRANT SELECT ON fbmn_catalog_private.web_app_download_settings TO fbmn_admin_http_staging;
GRANT UPDATE(popup_enabled,button_enabled,first_delay_ms,cooldown_minutes,title,message,ios_url,android_url,revision,updated_by,updated_at)
 ON fbmn_catalog_private.web_app_download_settings TO fbmn_admin_http_staging;
GRANT SELECT,INSERT ON fbmn_catalog_private.web_app_download_settings_audit TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog_private.web_app_download_settings_audit_id_seq TO fbmn_admin_http_staging;

-- Narrow allowlisted projection, without editor identity or audit metadata.
CREATE VIEW fbmn_public.v_web_app_download_settings WITH (security_barrier=true) AS
 SELECT popup_enabled,button_enabled,first_delay_ms,cooldown_minutes,title,message,ios_url,android_url,revision
 FROM fbmn_catalog_private.web_app_download_settings
 WHERE singleton=true;
REVOKE ALL ON fbmn_public.v_web_app_download_settings FROM PUBLIC;
GRANT SELECT ON fbmn_public.v_web_app_download_settings TO fbmn_public_reader,fbmn_p5_public_login;
COMMIT;
