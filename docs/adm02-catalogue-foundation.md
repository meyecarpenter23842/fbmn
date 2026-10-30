# ADM-02 #19 — Master SKU / import preview foundation

**Scope of this PR:** private SQL schema + pure CSV preview only. No staging SQL applied, no product rows imported, no R2 bytes moved, no production deploy. Real verified 613-SKU workbook is still in Drive, never committed with internal NET/VAT prices.

- `sku_cong_ty` is text primary key: preserve `0114` / `0714`. Different company SKUs are never merged by barcode or image filename.
- Family groups multiple actual SKUs. A SKU can have multiple media associations. Each media relation stores method/confidence/review; approval does not follow automated matching.
- Missing image leaves no `sku_media` link and does not reject the draft SKU.
- Private `fbmn_catalog_private.price_evidence` keeps source price and NET outside the public read model and Admin general-reader grants.
- Public `fbmn_public.v_*` views are not changed. No automatic publication to any of the three channels.
- `previewCsvImport` returns create/update/unchanged/conflict/error counters, is read-only, preserves all SKU strings, does not import source prices. CSV adapter first; XLSX adapter, import commit and Admin UI are later parts of the existing issue #19/#41.
- Before applying staging: rehearse up/down on disposable Neon branch and verify the exact Drive 613-SKU workbook mapping. Do not upload/commit private source files.


## ADM-02 XLSX reconciliation adapter — offline dry-run only

- Reads **only** the exact `DOI CHIEU 613 SKU` tab of the private 8-tab reconciliation workbook; never imports the overview, missing-image/filter views or price-cell view as additional products.
- Uses actual XLSX cell types, rejects numeric/formula-based company SKU cells rather than inventing leading zeros. Preserves literal `0114`, `0714`, `C592` and `C5921` as separate company keys.
- `readXlsxSkuRows` maps the exact source columns to the existing import-preview allowlist. The XLSX proposed product title is `ten_san_pham`, **not** verified verbatim PDF `ten_goc_bang_gia`.
- `previewXlsxImport` reports create/update/unchanged/conflict/error, source-sheet/row, name/specification, image candidate count and review flags. Missing pictures are allowed. Image filenames and unapproved mappings are not applied to R2 or the database.
- XLSX price numbers and warehouse quantities are inspected only in memory to derive safe boolean review flags; **never** emitted in the import CSV, preview JSON or public API. Six merged PDF price cells are flagged for manual verification, **not** silently marked missing or approved.
- Local CLI (requires Node 22 and npm dependencies):
  `node backend/catalogue/preview-xlsx-cli.mjs /path/to/private-master.xlsx --csv-out /tmp/fbmn-import-preview.csv --report-out /tmp/fbmn-preview.json`
  Output files must be absolute paths **outside** the repository, are created with restricted permissions and cannot overwrite existing files. Without options the CLI prints only aggregate counts.
- **Independent read-only audit 30/10/2026** of the canonical XLSX + original XNT workbook: 613 distinct company SKU rows = 224 both-source + 385 XNT-only + 4 price-only. XNT holds 609 distinct SKUs; 541 rows have no linked image; 72 have image candidates, not approvals; 2 stock-negative source rows. Original PDFs/ZIP remain private in Drive. This is a workbook audit, **not** an imported DB count.
- Gate for later PR: approve exceptions/source names/media mapping, then import draft to **Neon staging only** after explicit sign-off. This PR has no database calls, migrations, API routes, production deployment or Auth/login changes.
