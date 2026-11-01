-- Roll back P2 category links without deleting SKU records. WARNING: deletes taxonomy labels.
BEGIN;
ALTER TABLE fbmn_catalog.skus DROP COLUMN IF EXISTS category_id;
DROP TABLE IF EXISTS fbmn_catalog.categories;
COMMIT;
