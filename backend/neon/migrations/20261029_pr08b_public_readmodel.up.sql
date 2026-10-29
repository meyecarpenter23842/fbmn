-- WEB PR08b / Issue #10: isolated public read-model in Neon. NO LIVE DATABASE EXECUTION IN CI.

-- Source of truth: structure introspected from staging branch br-nameless-night-b5xnk5qx.

-- Only promote after independent approval, backup and rollback rehearsal on a fresh branch.

CREATE SCHEMA fbmn_public;

REVOKE ALL ON SCHEMA fbmn_public FROM PUBLIC;

CREATE ROLE fbmn_public_reader NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

CREATE TABLE fbmn_public."categories" (
  "id" text NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "product_group" text NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "verified_at" timestamp with time zone,
  "approved_at" timestamp with time zone,
  "published_at" timestamp with time zone,
  "withdrawn_at" timestamp with time zone,
  "source_ref" text,
  "internal_note" text,
  CONSTRAINT "categories_pkey" PRIMARY KEY (id),
  CONSTRAINT "categories_slug_key" UNIQUE (slug),
  CONSTRAINT "categories_check" CHECK (withdrawn_at IS NULL OR published_at IS NOT NULL),
  CONSTRAINT "categories_id_check" CHECK (id ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'::text),
  CONSTRAINT "categories_id_not_null" NOT NULL id,
  CONSTRAINT "categories_name_check" CHECK (length(name) >= 1 AND length(name) <= 160),
  CONSTRAINT "categories_name_not_null" NOT NULL name,
  CONSTRAINT "categories_product_group_check" CHECK (product_group = ANY (ARRAY['school_notebook'::text, 'student_notebook'::text, 'memo_book'::text, 'stationery'::text])),
  CONSTRAINT "categories_product_group_not_null" NOT NULL product_group,
  CONSTRAINT "categories_slug_check" CHECK (slug ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'::text),
  CONSTRAINT "categories_slug_not_null" NOT NULL slug,
  CONSTRAINT "categories_sort_order_not_null" NOT NULL sort_order
);

CREATE TABLE fbmn_public."products" (
  "id" text NOT NULL,
  "category_id" text NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "public_price_mode" text NOT NULL DEFAULT 'contact'::text,
  "verified_at" timestamp with time zone,
  "approved_at" timestamp with time zone,
  "published_at" timestamp with time zone,
  "withdrawn_at" timestamp with time zone,
  "source_ref" text,
  "internal_note" text,
  CONSTRAINT "products_pkey" PRIMARY KEY (id),
  CONSTRAINT "products_slug_key" UNIQUE (slug),
  CONSTRAINT "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES fbmn_public.categories(id),
  CONSTRAINT "products_category_id_not_null" NOT NULL category_id,
  CONSTRAINT "products_check" CHECK (withdrawn_at IS NULL OR published_at IS NOT NULL),
  CONSTRAINT "products_id_check" CHECK (id ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'::text),
  CONSTRAINT "products_id_not_null" NOT NULL id,
  CONSTRAINT "products_name_check" CHECK (length(name) >= 1 AND length(name) <= 160),
  CONSTRAINT "products_name_not_null" NOT NULL name,
  CONSTRAINT "products_public_price_mode_check" CHECK (public_price_mode = ANY (ARRAY['contact'::text, 'retail'::text])),
  CONSTRAINT "products_public_price_mode_not_null" NOT NULL public_price_mode,
  CONSTRAINT "products_slug_check" CHECK (slug ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'::text),
  CONSTRAINT "products_slug_not_null" NOT NULL slug
);

CREATE TABLE fbmn_public."variants" (
  "id" text NOT NULL,
  "product_id" text NOT NULL,
  "sku" text NOT NULL,
  "name" text NOT NULL,
  "paper_size" text,
  "page_count" integer,
  "paper_weight_gsm" numeric,
  "binding" text,
  "cover_finish" text,
  "sale_unit" text,
  "units_per_pack" integer,
  "units_per_carton" integer,
  "retail_price_vnd" bigint,
  "retail_price_verified_at" timestamp with time zone,
  "retail_price_approved_at" timestamp with time zone,
  "retail_price_valid_from" date,
  "retail_price_valid_until" date,
  "verified_at" timestamp with time zone,
  "approved_at" timestamp with time zone,
  "published_at" timestamp with time zone,
  "withdrawn_at" timestamp with time zone,
  "source_ref" text,
  "internal_note" text,
  CONSTRAINT "variants_pkey" PRIMARY KEY (id),
  CONSTRAINT "variants_product_id_fkey" FOREIGN KEY (product_id) REFERENCES fbmn_public.products(id),
  CONSTRAINT "variants_check" CHECK (units_per_pack IS NULL OR units_per_carton IS NULL OR units_per_carton >= units_per_pack),
  CONSTRAINT "variants_check1" CHECK (withdrawn_at IS NULL OR published_at IS NOT NULL),
  CONSTRAINT "variants_id_check" CHECK (id ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'::text),
  CONSTRAINT "variants_id_not_null" NOT NULL id,
  CONSTRAINT "variants_name_check" CHECK (length(name) >= 1 AND length(name) <= 160),
  CONSTRAINT "variants_name_not_null" NOT NULL name,
  CONSTRAINT "variants_page_count_check" CHECK (page_count > 0),
  CONSTRAINT "variants_paper_weight_gsm_check" CHECK (paper_weight_gsm > 0::numeric),
  CONSTRAINT "variants_product_id_not_null" NOT NULL product_id,
  CONSTRAINT "variants_retail_price_validity_check" CHECK (retail_price_vnd IS NULL OR retail_price_valid_from IS NOT NULL AND (retail_price_valid_until IS NULL OR retail_price_valid_until >= retail_price_valid_from)),
  CONSTRAINT "variants_retail_price_vnd_check" CHECK (retail_price_vnd >= 0),
  CONSTRAINT "variants_sku_check" CHECK (sku ~ '^[A-Za-z0-9][A-Za-z0-9._/-]*$'::text),
  CONSTRAINT "variants_sku_not_null" NOT NULL sku,
  CONSTRAINT "variants_units_per_carton_check" CHECK (units_per_carton > 0),
  CONSTRAINT "variants_units_per_pack_check" CHECK (units_per_pack > 0)
);

CREATE UNIQUE INDEX variants_sku_casefold_key ON fbmn_public.variants USING btree (upper(sku));

CREATE TABLE fbmn_public."media" (
  "id" text NOT NULL,
  "product_id" text NOT NULL,
  "r2_key" text NOT NULL,
  "alt" text NOT NULL,
  "position" integer NOT NULL,
  "verified_at" timestamp with time zone,
  "approved_at" timestamp with time zone,
  "published_at" timestamp with time zone,
  "withdrawn_at" timestamp with time zone,
  "source_ref" text,
  "internal_note" text,
  CONSTRAINT "media_pkey" PRIMARY KEY (id),
  CONSTRAINT "media_product_id_position_key" UNIQUE (product_id, "position"),
  CONSTRAINT "media_r2_key_key" UNIQUE (r2_key),
  CONSTRAINT "media_product_id_fkey" FOREIGN KEY (product_id) REFERENCES fbmn_public.products(id),
  CONSTRAINT "media_alt_check" CHECK (length(alt) >= 1 AND length(alt) <= 240),
  CONSTRAINT "media_alt_not_null" NOT NULL alt,
  CONSTRAINT "media_id_check" CHECK (id ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'::text),
  CONSTRAINT "media_id_not_null" NOT NULL id,
  CONSTRAINT "media_position_check" CHECK ("position" >= 0),
  CONSTRAINT "media_position_not_null" NOT NULL "position",
  CONSTRAINT "media_product_id_not_null" NOT NULL product_id,
  CONSTRAINT "media_r2_key_check" CHECK (r2_key ~ '^products/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+-v[1-9][0-9]*[.](webp|png|jpg|jpeg|avif)$'::text),
  CONSTRAINT "media_r2_key_not_null" NOT NULL r2_key
);

CREATE TABLE fbmn_public."articles" (
  "id" text NOT NULL,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "summary" text NOT NULL,
  "paragraphs" text[] NOT NULL,
  "verified_at" timestamp with time zone,
  "approved_at" timestamp with time zone,
  "published_at" timestamp with time zone NOT NULL,
  "withdrawn_at" timestamp with time zone,
  "source_ref" text,
  "internal_note" text,
  CONSTRAINT "articles_pkey" PRIMARY KEY (id),
  CONSTRAINT "articles_slug_key" UNIQUE (slug),
  CONSTRAINT "articles_id_check" CHECK (id ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'::text),
  CONSTRAINT "articles_id_not_null" NOT NULL id,
  CONSTRAINT "articles_paragraphs_check" CHECK (cardinality(paragraphs) >= 1 AND cardinality(paragraphs) <= 30),
  CONSTRAINT "articles_paragraphs_not_null" NOT NULL paragraphs,
  CONSTRAINT "articles_published_at_not_null" NOT NULL published_at,
  CONSTRAINT "articles_slug_check" CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text),
  CONSTRAINT "articles_slug_not_null" NOT NULL slug,
  CONSTRAINT "articles_summary_check" CHECK (length(summary) >= 1 AND length(summary) <= 400),
  CONSTRAINT "articles_summary_not_null" NOT NULL summary,
  CONSTRAINT "articles_title_check" CHECK (length(title) >= 1 AND length(title) <= 160),
  CONSTRAINT "articles_title_not_null" NOT NULL title
);

CREATE TABLE fbmn_public."promotions" (
  "id" text NOT NULL,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "summary" text NOT NULL,
  "detail" text NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "verified_at" timestamp with time zone,
  "approved_at" timestamp with time zone,
  "published_at" timestamp with time zone NOT NULL,
  "withdrawn_at" timestamp with time zone,
  "source_ref" text,
  "internal_note" text,
  CONSTRAINT "promotions_pkey" PRIMARY KEY (id),
  CONSTRAINT "promotions_slug_key" UNIQUE (slug),
  CONSTRAINT "promotions_check" CHECK (ends_at >= starts_at),
  CONSTRAINT "promotions_detail_check" CHECK (length(detail) >= 1 AND length(detail) <= 3000),
  CONSTRAINT "promotions_detail_not_null" NOT NULL detail,
  CONSTRAINT "promotions_ends_at_not_null" NOT NULL ends_at,
  CONSTRAINT "promotions_id_check" CHECK (id ~ '^[A-Za-z0-9][A-Za-z0-9_-]*$'::text),
  CONSTRAINT "promotions_id_not_null" NOT NULL id,
  CONSTRAINT "promotions_published_at_not_null" NOT NULL published_at,
  CONSTRAINT "promotions_slug_check" CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text),
  CONSTRAINT "promotions_slug_not_null" NOT NULL slug,
  CONSTRAINT "promotions_starts_at_not_null" NOT NULL starts_at,
  CONSTRAINT "promotions_summary_check" CHECK (length(summary) >= 1 AND length(summary) <= 400),
  CONSTRAINT "promotions_summary_not_null" NOT NULL summary,
  CONSTRAINT "promotions_title_check" CHECK (length(title) >= 1 AND length(title) <= 160),
  CONSTRAINT "promotions_title_not_null" NOT NULL title
);

CREATE TABLE fbmn_public."company" (
  "singleton" boolean NOT NULL DEFAULT true,
  "legal_name" text,
  "address" text,
  "phone" text,
  "email" text,
  "hours" text,
  "verified_at" timestamp with time zone,
  "approved_at" timestamp with time zone,
  "published_at" timestamp with time zone,
  "withdrawn_at" timestamp with time zone,
  "source_ref" text,
  "internal_note" text,
  CONSTRAINT "company_pkey" PRIMARY KEY (singleton),
  CONSTRAINT "company_check" CHECK (num_nonnulls(legal_name, address, phone, email, hours) >= 1),
  CONSTRAINT "company_singleton_check" CHECK (singleton),
  CONSTRAINT "company_singleton_not_null" NOT NULL singleton
);

CREATE TABLE fbmn_public."dealer_information" (
  "singleton" boolean NOT NULL DEFAULT true,
  "title" text NOT NULL,
  "paragraphs" text[] NOT NULL,
  "contact_instructions" text NOT NULL,
  "verified_at" timestamp with time zone,
  "approved_at" timestamp with time zone,
  "published_at" timestamp with time zone,
  "withdrawn_at" timestamp with time zone,
  "source_ref" text,
  "internal_note" text,
  CONSTRAINT "dealer_information_pkey" PRIMARY KEY (singleton),
  CONSTRAINT "dealer_information_contact_instructions_check" CHECK (length(contact_instructions) >= 1 AND length(contact_instructions) <= 800),
  CONSTRAINT "dealer_information_contact_instructions_not_null" NOT NULL contact_instructions,
  CONSTRAINT "dealer_information_paragraphs_check" CHECK (cardinality(paragraphs) >= 1 AND cardinality(paragraphs) <= 25),
  CONSTRAINT "dealer_information_paragraphs_not_null" NOT NULL paragraphs,
  CONSTRAINT "dealer_information_singleton_check" CHECK (singleton),
  CONSTRAINT "dealer_information_singleton_not_null" NOT NULL singleton,
  CONSTRAINT "dealer_information_title_check" CHECK (length(title) >= 1 AND length(title) <= 160),
  CONSTRAINT "dealer_information_title_not_null" NOT NULL title
);

CREATE VIEW fbmn_public."v_categories" WITH (security_barrier=true) AS
SELECT id,
    slug,
    name,
    product_group,
    sort_order
   FROM fbmn_public.categories
  WHERE verified_at IS NOT NULL AND approved_at IS NOT NULL AND published_at <= CURRENT_TIMESTAMP AND (withdrawn_at IS NULL OR withdrawn_at > CURRENT_TIMESTAMP);

CREATE VIEW fbmn_public."v_products" WITH (security_barrier=true) AS
SELECT p.id,
    p.category_id,
    p.slug,
    p.name,
    p.description,
    p.public_price_mode
   FROM fbmn_public.products p
     JOIN fbmn_public.v_categories c ON c.id = p.category_id
  WHERE p.verified_at IS NOT NULL AND p.approved_at IS NOT NULL AND p.published_at <= CURRENT_TIMESTAMP AND (p.withdrawn_at IS NULL OR p.withdrawn_at > CURRENT_TIMESTAMP);

CREATE VIEW fbmn_public."v_variants" WITH (security_barrier=true) AS
SELECT v.id,
    v.product_id,
    v.sku,
    v.name,
    v.paper_size,
    v.page_count,
    v.paper_weight_gsm,
    v.binding,
    v.cover_finish,
    v.sale_unit,
    v.units_per_pack,
    v.units_per_carton,
        CASE
            WHEN p.public_price_mode = 'retail'::text AND v.retail_price_verified_at IS NOT NULL AND v.retail_price_approved_at IS NOT NULL AND v.retail_price_approved_at <= CURRENT_TIMESTAMP AND v.retail_price_valid_from <= CURRENT_DATE AND (v.retail_price_valid_until IS NULL OR v.retail_price_valid_until >= CURRENT_DATE) THEN v.retail_price_vnd
            ELSE NULL::bigint
        END AS retail_price_vnd
   FROM fbmn_public.variants v
     JOIN fbmn_public.v_products p ON p.id = v.product_id
  WHERE v.verified_at IS NOT NULL AND v.approved_at IS NOT NULL AND v.published_at <= CURRENT_TIMESTAMP AND (v.withdrawn_at IS NULL OR v.withdrawn_at > CURRENT_TIMESTAMP);

CREATE VIEW fbmn_public."v_media" WITH (security_barrier=true) AS
SELECT m.product_id,
    m.r2_key,
    m.alt,
    m."position"
   FROM fbmn_public.media m
     JOIN fbmn_public.v_products p ON p.id = m.product_id
  WHERE m.verified_at IS NOT NULL AND m.approved_at IS NOT NULL AND m.published_at <= CURRENT_TIMESTAMP AND (m.withdrawn_at IS NULL OR m.withdrawn_at > CURRENT_TIMESTAMP);

CREATE VIEW fbmn_public."v_articles" WITH (security_barrier=true) AS
SELECT slug,
    title,
    summary,
    paragraphs,
    published_at
   FROM fbmn_public.articles
  WHERE verified_at IS NOT NULL AND approved_at IS NOT NULL AND published_at <= CURRENT_TIMESTAMP AND (withdrawn_at IS NULL OR withdrawn_at > CURRENT_TIMESTAMP);

CREATE VIEW fbmn_public."v_promotions" WITH (security_barrier=true) AS
SELECT slug,
    title,
    summary,
    detail,
    ends_at
   FROM fbmn_public.promotions
  WHERE verified_at IS NOT NULL AND approved_at IS NOT NULL AND published_at <= CURRENT_TIMESTAMP AND starts_at <= CURRENT_TIMESTAMP AND ends_at >= CURRENT_TIMESTAMP AND (withdrawn_at IS NULL OR withdrawn_at > CURRENT_TIMESTAMP);

CREATE VIEW fbmn_public."v_company" WITH (security_barrier=true) AS
SELECT legal_name,
    address,
    phone,
    email,
    hours
   FROM fbmn_public.company
  WHERE verified_at IS NOT NULL AND approved_at IS NOT NULL AND published_at <= CURRENT_TIMESTAMP AND (withdrawn_at IS NULL OR withdrawn_at > CURRENT_TIMESTAMP);

CREATE VIEW fbmn_public."v_dealer_information" WITH (security_barrier=true) AS
SELECT title,
    paragraphs,
    contact_instructions
   FROM fbmn_public.dealer_information
  WHERE verified_at IS NOT NULL AND approved_at IS NOT NULL AND published_at <= CURRENT_TIMESTAMP AND (withdrawn_at IS NULL OR withdrawn_at > CURRENT_TIMESTAMP);

REVOKE ALL ON ALL TABLES IN SCHEMA fbmn_public FROM PUBLIC;

GRANT USAGE ON SCHEMA fbmn_public TO fbmn_public_reader;

GRANT SELECT ON fbmn_public."v_categories", fbmn_public."v_products", fbmn_public."v_variants", fbmn_public."v_media", fbmn_public."v_articles", fbmn_public."v_promotions", fbmn_public."v_company", fbmn_public."v_dealer_information" TO fbmn_public_reader;

-- Legacy schema may not exist on clean staging / production. Do not require it.
DO $legacy$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'futurebook') THEN
    EXECUTE 'REVOKE ALL ON SCHEMA futurebook FROM fbmn_public_reader';
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA futurebook FROM fbmn_public_reader';
  END IF;
END $legacy$;
