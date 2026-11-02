-- ADM-05 G03 supplement: permanent human-facing identifiers, independent of labels.
-- No SKU value or relationship is modified. Safe to apply after taking a Neon branch backup.
BEGIN;
CREATE SEQUENCE fbmn_catalog.category_code_seq;
CREATE SEQUENCE fbmn_catalog.family_code_seq;
-- Exactly one nextval per code; numbers larger than 9999 must never truncate.
CREATE FUNCTION fbmn_catalog.next_stable_taxonomy_code(prefix text, code_sequence regclass)
RETURNS text LANGUAGE sql VOLATILE AS $taxonomy$
  SELECT prefix||'-'||lpad(v::text, greatest(4,length(v::text)), '0')
  FROM (SELECT nextval(code_sequence) AS v) AS next_number
$taxonomy$;
REVOKE ALL ON FUNCTION fbmn_catalog.next_stable_taxonomy_code(text,regclass) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fbmn_catalog.next_stable_taxonomy_code(text,regclass)
  TO fbmn_admin_http_staging;
ALTER TABLE fbmn_catalog.categories ADD COLUMN category_code text;
ALTER TABLE fbmn_catalog.families ADD COLUMN family_code text;
-- Stable assignments for existing IDs. IDs (and all SKU foreign keys) stay unchanged.
WITH numbered AS (
  SELECT id,row_number() OVER (ORDER BY (parent_id IS NOT NULL),created_at,id) AS seq
  FROM fbmn_catalog.categories
)
UPDATE fbmn_catalog.categories c SET category_code='DM-'||lpad(n.seq::text,greatest(4,length(n.seq::text)),'0')
FROM numbered n WHERE c.id=n.id;
WITH numbered AS (
  SELECT id,row_number() OVER (ORDER BY id) AS seq
  FROM fbmn_catalog.families
)
UPDATE fbmn_catalog.families f SET family_code='NM-'||lpad(n.seq::text,greatest(4,length(n.seq::text)),'0')
FROM numbered n WHERE f.id=n.id;
SELECT setval('fbmn_catalog.category_code_seq',
  greatest((SELECT count(*) FROM fbmn_catalog.categories),1),
  (SELECT count(*) FROM fbmn_catalog.categories)>0);
SELECT setval('fbmn_catalog.family_code_seq',
  greatest((SELECT count(*) FROM fbmn_catalog.families),1),
  (SELECT count(*) FROM fbmn_catalog.families)>0);
ALTER TABLE fbmn_catalog.categories
  ALTER COLUMN category_code SET NOT NULL,
  ALTER COLUMN category_code SET DEFAULT fbmn_catalog.next_stable_taxonomy_code('DM','fbmn_catalog.category_code_seq'::regclass),
  ADD CONSTRAINT fbmn_category_code_format CHECK (category_code ~ '^DM-[0-9]{4,}$'),
  ADD CONSTRAINT fbmn_category_code_unique UNIQUE(category_code);
ALTER TABLE fbmn_catalog.families
  ALTER COLUMN family_code SET NOT NULL,
  ALTER COLUMN family_code SET DEFAULT fbmn_catalog.next_stable_taxonomy_code('NM','fbmn_catalog.family_code_seq'::regclass),
  ADD CONSTRAINT fbmn_family_code_format CHECK (family_code ~ '^NM-[0-9]{4,}$'),
  ADD CONSTRAINT fbmn_family_code_unique UNIQUE(family_code);
GRANT USAGE ON SEQUENCE fbmn_catalog.category_code_seq TO fbmn_admin_http_staging;
GRANT USAGE ON SEQUENCE fbmn_catalog.family_code_seq TO fbmn_admin_http_staging;
-- Existing role has only SELECT/INSERT on categories and SELECT/INSERT plus
-- restricted label/revision UPDATE on families. Never grant code UPDATE.
COMMIT;
