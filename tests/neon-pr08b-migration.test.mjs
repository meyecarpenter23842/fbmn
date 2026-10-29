import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../backend/neon/" + path, import.meta.url), "utf8");
const up = read("migrations/20261029_pr08b_public_readmodel.up.sql");
const down = read("migrations/20261029_pr08b_public_readmodel.down.sql");
const verify = read("verify-pr08b.sql");
const tables = ["categories","products","variants","media","articles","promotions","company","dealer_information"];
const views = ["v_categories","v_products","v_variants","v_media","v_articles","v_promotions","v_company","v_dealer_information"];
test("migration adds exactly eight public read-model base tables and gated views", () => {
  assert.equal((up.match(/CREATE TABLE fbmn_public\./g) ?? []).length, 8);
  assert.equal((up.match(/CREATE VIEW fbmn_public\./g) ?? []).length, 8);
  for (const table of tables) assert.ok(up.includes('CREATE TABLE fbmn_public."'+table+'"'), table);
  for (const view of views) assert.ok(up.includes('CREATE VIEW fbmn_public."'+view+'" WITH (security_barrier=true)'), view);
  assert.match(up, /approved_at IS NOT NULL/);
  assert.match(up, /verified_at IS NOT NULL/);
  assert.match(up, /CURRENT_TIMESTAMP/);
});
test("minimum privilege reader cannot log in or read source tables", () => {
  assert.match(up,/CREATE ROLE fbmn_public_reader NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;/);
  assert.match(up,/REVOKE ALL ON ALL TABLES IN SCHEMA fbmn_public FROM PUBLIC;/);
  assert.match(up,/GRANT USAGE ON SCHEMA fbmn_public TO fbmn_public_reader;/);
  assert.match(up,/GRANT SELECT ON [^;]+ TO fbmn_public_reader;/);
  assert.doesNotMatch(up,/ALTER DEFAULT PRIVILEGES|GRANT ALL|GRANT INSERT|GRANT UPDATE|GRANT DELETE/);
  const grant=up.match(/GRANT SELECT ON ([^;]+) TO fbmn_public_reader;/)?.[1] ?? "";
  for (const view of views) assert.ok(grant.includes('fbmn_public."'+view+'"'), view);
  for (const table of tables) assert.ok(!grant.includes('fbmn_public."'+table+'"'), table);
  assert.match(up,/EXECUTE 'REVOKE ALL ON SCHEMA futurebook FROM fbmn_public_reader'/);
});
test("all public view definitions hide internal/provenance columns", () => {
  const viewSql=up.split("CREATE VIEW fbmn_public.").slice(1).join(" CREATE VIEW fbmn_public.");
  for (const forbidden of ["source_ref","internal_note","customer_contacts","customer_price_lists","futurebook.customers","futurebook.sku_prices"]) {
    assert.ok(!viewSql.includes(forbidden), forbidden);
  }
  assert.match(up,/retail_price_approved_at/);
  assert.match(up,/ends_at >= CURRENT_TIMESTAMP/);
  assert.match(up,/variants_sku_casefold_key/);
});
test("retail price follows canonical effectiveFrom/effectiveTo windows", () => {
  assert.match(up, /"retail_price_valid_from" date/);
  assert.match(up, /"retail_price_valid_until" date/);
  assert.match(up, /variants_retail_price_validity_check/);
  assert.match(up, /retail_price_valid_from <= CURRENT_DATE/);
  assert.match(up, /retail_price_valid_until >= CURRENT_DATE/);
  assert.match(up, /THEN v\.retail_price_vnd/);
});
test("migration allows clean databases without the legacy futurebook schema", () => {
  assert.match(up, /IF EXISTS \(SELECT 1 FROM pg_namespace WHERE nspname = 'futurebook'\)/);
  assert.match(up, /EXECUTE 'REVOKE ALL ON SCHEMA futurebook FROM fbmn_public_reader'/);
  assert.match(up, /EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA futurebook FROM fbmn_public_reader'/);
  assert.doesNotMatch(up, /\nREVOKE ALL ON SCHEMA futurebook FROM fbmn_public_reader;/);
});

test("rollback explicitly gated, non-CASCADE, and matches schema", () => {
  assert.match(down,/rollback_confirmed/);
  assert.doesNotMatch(down,/\bCASCADE\b/);
  for (const view of views) assert.ok(down.includes('DROP VIEW fbmn_public."'+view+'";'));
  for (const table of tables) assert.ok(down.includes('DROP TABLE fbmn_public."'+table+'";'));
  assert.match(down,/DROP ROLE fbmn_public_reader;/);
  assert.match(down,/DROP SCHEMA fbmn_public;/);
});
test("verification script checks reader metadata instead of DB secrets", () => {
  assert.match(verify,/has_table_privilege/);
  assert.match(verify,/pg_roles/);
  assert.doesNotMatch(verify,/DATABASE_URL|PASSWORD\s*=|NEON_API_KEY/);
});
