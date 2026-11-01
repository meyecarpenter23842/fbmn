-- ADM-05 P2: category hierarchy and category reference for private SKUs.
-- Schema-only until deliberately applied to Admin Neon staging; no product writes.
BEGIN;
CREATE TABLE fbmn_catalog.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES fbmn_catalog.categories(id) ON DELETE RESTRICT,
  category_label text NOT NULL CHECK (length(trim(category_label)) BETWEEN 1 AND 160),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX fbmn_category_sibling_name_unique
  ON fbmn_catalog.categories (coalesce(parent_id,'00000000-0000-0000-0000-000000000000'::uuid),lower(category_label));
CREATE INDEX fbmn_categories_parent_idx ON fbmn_catalog.categories(parent_id);
ALTER TABLE fbmn_catalog.skus
  ADD COLUMN category_id uuid REFERENCES fbmn_catalog.categories(id) ON DELETE RESTRICT;
CREATE INDEX fbmn_skus_category_idx ON fbmn_catalog.skus(category_id);
-- Same narrowly scoped staging role; deliberately NO grants on pricebook, media, publication.
GRANT SELECT,INSERT ON fbmn_catalog.categories TO fbmn_admin_http_staging;
COMMIT;
