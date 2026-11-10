BEGIN;
CREATE TABLE fbmn_catalog_private.website_chatbot_config(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(config)='object'),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 updated_by text NOT NULL DEFAULT 'migration',
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO fbmn_catalog_private.website_chatbot_config(singleton) VALUES(true);
CREATE TABLE fbmn_catalog_private.website_chatbot_config_audit(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 revision integer NOT NULL,actor_subject text NOT NULL,
 before_data jsonb NOT NULL,after_data jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON fbmn_catalog_private.website_chatbot_config,fbmn_catalog_private.website_chatbot_config_audit FROM PUBLIC;
GRANT SELECT ON fbmn_catalog_private.website_chatbot_config TO fbmn_admin_http_staging;
GRANT UPDATE(config,revision,updated_by,updated_at) ON fbmn_catalog_private.website_chatbot_config TO fbmn_admin_http_staging;
GRANT INSERT ON fbmn_catalog_private.website_chatbot_config_audit TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog_private.website_chatbot_config_audit_id_seq TO fbmn_admin_http_staging;
COMMIT;
