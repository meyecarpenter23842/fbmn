-- DL6: private Owner inbox for website outsourcing enquiries.
-- Apply only after Owner migration approval. No public SELECT on PII.
BEGIN;
DO $pre$ BEGIN
 IF to_regnamespace('fbmn_catalog_private') IS NULL OR
    to_regnamespace('fbmn_public') IS NULL OR
    to_regrole('fbmn_p5_public_login') IS NULL OR
    to_regrole('fbmn_admin_http_staging') IS NULL
 THEN RAISE EXCEPTION 'DL6 prerequisites missing'; END IF;
END $pre$;
CREATE TABLE fbmn_catalog_private.outsourcing_requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK(length(name) BETWEEN 2 AND 100),
 email text NOT NULL CHECK(length(email) BETWEEN 5 AND 254),
 phone text NOT NULL DEFAULT '' CHECK(length(phone)<=30),
 product_type text NOT NULL CHECK(length(product_type) BETWEEN 2 AND 80),
 specifications text NOT NULL DEFAULT '' CHECK(length(specifications)<=600),
 quantity text NOT NULL DEFAULT '' CHECK(length(quantity)<=80),
 desired_date text NOT NULL DEFAULT '' CHECK(length(desired_date)<=80),
 details text NOT NULL CHECK(length(details) BETWEEN 10 AND 2000),
 consent_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','handled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by text
);
CREATE INDEX outsourcing_requests_recent ON fbmn_catalog_private.outsourcing_requests(created_at DESC);
CREATE INDEX outsourcing_requests_email_time ON fbmn_catalog_private.outsourcing_requests(email,created_at DESC);
CREATE TABLE fbmn_catalog_private.outsourcing_request_audit(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 request_id uuid NOT NULL,
 operation text NOT NULL CHECK(operation IN ('handled','reopen','delete','expire')),
 actor_subject text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON fbmn_catalog_private.outsourcing_requests,
 fbmn_catalog_private.outsourcing_request_audit FROM PUBLIC;
GRANT SELECT,DELETE ON fbmn_catalog_private.outsourcing_requests TO fbmn_admin_http_staging;
GRANT UPDATE(status,updated_at,updated_by) ON fbmn_catalog_private.outsourcing_requests TO fbmn_admin_http_staging;
GRANT INSERT ON fbmn_catalog_private.outsourcing_request_audit TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog_private.outsourcing_request_audit_id_seq TO fbmn_admin_http_staging;

CREATE FUNCTION fbmn_public.submit_outsourcing_request(
 p_name text,p_email text,p_phone text,p_product_type text,p_specifications text,
 p_quantity text,p_desired_date text,p_details text,p_consent boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog
AS $fn$
DECLARE new_id uuid;
BEGIN
 IF p_consent IS DISTINCT FROM true OR
    length(p_name) NOT BETWEEN 2 AND 100 OR length(p_email) NOT BETWEEN 5 AND 254 OR
    p_email !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$' OR
    length(p_phone)>30 OR length(p_product_type) NOT BETWEEN 2 AND 80 OR
    length(p_specifications)>600 OR length(p_quantity)>80 OR length(p_desired_date)>80 OR
    length(p_details) NOT BETWEEN 10 AND 2000 OR
    p_name IS NULL OR p_email IS NULL OR p_phone IS NULL OR p_product_type IS NULL OR
    p_specifications IS NULL OR p_quantity IS NULL OR p_desired_date IS NULL OR p_details IS NULL
 THEN RAISE EXCEPTION 'invalid_request' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM fbmn_catalog_private.outsourcing_requests
           WHERE email=lower(btrim(p_email)) AND created_at>now()-interval '10 minutes')
 THEN RAISE EXCEPTION 'request_limited' USING ERRCODE='P0001'; END IF;
 INSERT INTO fbmn_catalog_private.outsourcing_requests(
   name,email,phone,product_type,specifications,quantity,desired_date,details)
 VALUES(btrim(p_name),lower(btrim(p_email)),btrim(p_phone),btrim(p_product_type),
        btrim(p_specifications),btrim(p_quantity),btrim(p_desired_date),btrim(p_details))
 RETURNING id INTO new_id;
 RETURN new_id;
END $fn$;
REVOKE ALL ON FUNCTION fbmn_public.submit_outsourcing_request(text,text,text,text,text,text,text,text,boolean) FROM PUBLIC;
GRANT USAGE ON SCHEMA fbmn_public TO fbmn_p5_public_login;
GRANT EXECUTE ON FUNCTION fbmn_public.submit_outsourcing_request(text,text,text,text,text,text,text,text,boolean)
 TO fbmn_p5_public_login;
COMMIT;
