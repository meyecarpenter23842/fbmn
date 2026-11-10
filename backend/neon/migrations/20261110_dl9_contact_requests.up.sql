BEGIN;
CREATE TABLE fbmn_catalog_private.contact_requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK(length(name) BETWEEN 2 AND 100),
 company text NOT NULL CHECK(length(company)<=150),
 email text NOT NULL CHECK(length(email)<=254),
 phone text NOT NULL CHECK(length(phone)<=30),
 province text NOT NULL CHECK(province IN ('01','04','08','11','12','14','15','19','20','22','24','25','31','33','37','38','40','42','44','46','48','51','52','56','66','68','75','79','80','82','86','91','92','96')),
 customer_group text NOT NULL CHECK(customer_group IN ('Nhà phân phối','Đại lý','Nhà sách','Cửa hàng văn phòng phẩm','Trường học','Doanh nghiệp','Nhà máy','Khác')),
 interests text[] NOT NULL CHECK(cardinality(interests) BETWEEN 1 AND 8 AND interests <@ ARRAY['Tập vở học sinh','Tập sinh viên','Sổ tay / Notebook','Giấy in / giấy văn phòng','Giấy và tập vở khác','Văn phòng phẩm','Gia công theo yêu cầu','Khác']::text[] AND array_position(interests,NULL) IS NULL),
 message text NOT NULL CHECK(length(message)<=2000),
 consent_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','handled')),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),updated_by text,
 CHECK(email<>'' OR phone<>'')
);
CREATE INDEX contact_requests_recent ON fbmn_catalog_private.contact_requests(created_at DESC);
CREATE INDEX contact_requests_email_time ON fbmn_catalog_private.contact_requests(email,created_at DESC);
CREATE INDEX contact_requests_phone_time ON fbmn_catalog_private.contact_requests(phone,created_at DESC);
CREATE TABLE fbmn_catalog_private.contact_request_audit(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,request_id uuid NOT NULL,
 operation text NOT NULL CHECK(operation IN ('handled','reopen','delete','expire')),
 actor_subject text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON fbmn_catalog_private.contact_requests,fbmn_catalog_private.contact_request_audit FROM PUBLIC;
GRANT SELECT,DELETE ON fbmn_catalog_private.contact_requests TO fbmn_admin_http_staging;
GRANT UPDATE(status,updated_at,updated_by) ON fbmn_catalog_private.contact_requests TO fbmn_admin_http_staging;
GRANT INSERT ON fbmn_catalog_private.contact_request_audit TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog_private.contact_request_audit_id_seq TO fbmn_admin_http_staging;
CREATE FUNCTION fbmn_public.submit_contact_request(p_name text,p_company text,p_email text,p_phone text,p_province text,p_group text,p_interests text[],p_message text,p_consent boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $fn$
DECLARE new_id uuid; e text:=lower(btrim(p_email)); ph text:=regexp_replace(p_phone,'[^0-9]','','g');
BEGIN
 IF p_consent IS DISTINCT FROM true OR p_name IS NULL OR p_company IS NULL OR e IS NULL OR ph IS NULL OR p_province IS NULL OR p_group IS NULL OR p_interests IS NULL OR p_message IS NULL OR
 length(btrim(p_name)) NOT BETWEEN 2 AND 100 OR length(p_company)>150 OR length(e)>254 OR length(p_phone)>30 OR length(p_message)>2000 OR
 (e='' AND ph='') OR (e<>'' AND e !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$') OR (p_phone<>'' AND (p_phone !~ '^\+?[0-9 ().-]+$' OR length(ph) NOT BETWEEN 8 AND 15)) OR
 p_province NOT IN ('01','04','08','11','12','14','15','19','20','22','24','25','31','33','37','38','40','42','44','46','48','51','52','56','66','68','75','79','80','82','86','91','92','96') OR p_group NOT IN ('Nhà phân phối','Đại lý','Nhà sách','Cửa hàng văn phòng phẩm','Trường học','Doanh nghiệp','Nhà máy','Khác') OR cardinality(p_interests) NOT BETWEEN 1 AND 8 OR NOT (p_interests <@ ARRAY['Tập vở học sinh','Tập sinh viên','Sổ tay / Notebook','Giấy in / giấy văn phòng','Giấy và tập vở khác','Văn phòng phẩm','Gia công theo yêu cầu','Khác']::text[]) OR array_position(p_interests,NULL) IS NOT NULL OR cardinality(p_interests)<>(SELECT count(DISTINCT x) FROM unnest(p_interests) x)
 THEN RAISE EXCEPTION 'invalid_request' USING ERRCODE='22023'; END IF;
 -- Serialize matching identities to prevent concurrent bypass of the cooldown.
 IF e<>'' THEN PERFORM pg_advisory_xact_lock(hashtextextended('dl9-email:'||e,0)); END IF;
 IF ph<>'' THEN PERFORM pg_advisory_xact_lock(hashtextextended('dl9-phone:'||ph,0)); END IF;
 IF EXISTS(SELECT 1 FROM fbmn_catalog_private.contact_requests WHERE created_at>now()-interval '10 minutes' AND ((e<>'' AND email=e) OR (ph<>'' AND phone=ph))) THEN RAISE EXCEPTION 'request_limited' USING ERRCODE='P0001'; END IF;
 INSERT INTO fbmn_catalog_private.contact_requests(name,company,email,phone,province,customer_group,interests,message)
 VALUES(btrim(p_name),btrim(p_company),e,ph,p_province,p_group,p_interests,btrim(p_message)) RETURNING id INTO new_id;
 RETURN new_id;
END $fn$;
REVOKE ALL ON FUNCTION fbmn_public.submit_contact_request(text,text,text,text,text,text,text[],text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fbmn_public.submit_contact_request(text,text,text,text,text,text,text[],text,boolean) TO fbmn_p5_public_login;
COMMIT;
