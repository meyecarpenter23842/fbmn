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

## 30/10/2026 — Independent reconciliation with private source workbooks

The 8-tab XLSX was read without modifying it and checked against the **separate original XNT 2810.xlsx** (both remain outside Git). This is a *local source audit*, not a proof that the Node/ExcelJS CLI parsed the source and not a query of existing Neon records:

| Source audit (no private price/stock values) | Verified |
| --- | ---: |
| Master unique company codes | 613 |
| Original XNT codes present in reconciliation | 609/609 |
| Exact XNT name mismatches | 0 |
| XNT stock snapshot mismatches | 0 |
| In both sources / XNT-only / price-only | 224 / 385 / 4 |
| Source-linked image candidates / without image | 72 / 541 |
| Blank stock snapshots (unknown, **not zero**) | 40 |
| Negative stock (review) | 2 |
| Pack/multipack or promotion unit review | 18 |
| Near-similar company codes (never auto-collapse) | 7 |
| Marked 'Sai Code' | 4 |
| Source line-spec mismatch | 2 |
| Regional-only SKU review | 2 |
| Shared image review | 12 |
| Merged-cell price evidence review | 6 |
| Distinct SKU with at least one targeted exception (excluding general missing media/unverified price) | 92 |

The follow-up adapter flags these anomalies **without emitting any private stock quantities, NET price values or original ZIP image filenames**. No SKU was deleted for missing media; shared media remains unapproved. Use `previewXlsxImport` with a vetted server-side snapshot of existing SKU records for actual create/update/unchanged/conflict figures. With an empty snapshot, `create:613` is only a hypothetical dry-run, **not** a statement about the database.

The CSV/JSON review artifacts are local/private and are **not** committed into the repository. No import into staging or production occurs in this verification PR.

## ADM-05 #41 — Browser-testable Admin XLSX import preview (read-only)

Menu: Products → Nhập Excel/CSV. Excel XLSX is supported in this slice; CSV import still not exposed. Existing Owner login unchanged; preview accepts only editor/admin/owner roles.

- Owner uploads the private 8-tab reconciliation XLSX over HTTPS to a **private Next.js Admin staging endpoint**. It checks same-origin, validates short-lived Neon JWT against staging Admin Worker and current DB principal role. Multipart and XLSX uploads capped; file parsed in memory only.
- Server runs the same read-only business parser as backend/catalogue/xlsx-adapter.mjs, bundled inside standalone Admin; CI tests enforce exact parser parity.
- Searchable, paginated 613-SKU list with source names, specification, missing-image count, review flags and safe CSV export. NET prices, warehouse quantities, raw image filenames, source workbook and customer data are not included in responses/exports.
- Create count is hypothetical assuming an empty existing catalogue; there is **no database snapshot query**, so update/unchanged/conflict are not yet reliable against live Neon.
- No DB writes, migrations, R2 uploads, publication, public API or login changes. Deployment must be manual to separate Admin preview project after 4/4 CI and Codex review clean.

### Owner acceptance steps after manual staging preview deploy

1. Sign in with the existing Owner account and open Products → Nhập Excel/CSV.
2. Choose the private XLSX matching the 613-SKU reconciliation workbook; click Phân tích & xem trước.
3. Verify 613 distinct codes, 541 image-missing codes, original 0114 and 0714, distinct C592/C5921, source breakdown 224/385/4 and required review exceptions.
4. Filter 'Ngoại lệ cần duyệt' and 'Thiếu ảnh', inspect source names/specification and export a **safe CSV** for review. Do not upload raw CSV to GitHub.
5. Verify no Neon product rows, R2 objects or website public catalogue entries were created.

The subsequent PR must add a protected DB snapshot comparison and owner-approved **draft-only** staging apply; media R2 and publishing remain separate approval gates. A working preview is NOT completed CRUD/import/publish.

## 30/10/2026 — Real XLSX E2E regression fix (Admin import preview)

Owner observed HTTP 422 and the generic "Excel chưa đúng cấu trúc" message when uploading the original **8-sheet**, 145,322-byte reconciliation XLSX. The source workbook is valid and already contains the exact `DOI CHIEU 613 SKU` header and 613 literal-text company codes. Removing other sheets is **not** required.

**Actual cause:** ExcelJS 4.4.0 cannot parse this exporter’s namespace-prefixed OOXML (`<x:workbook>`, `<x:worksheet>`) and raises `Cannot read properties of undefined (reading 'sheets')`. Once namespace tags are normalized, it also fails on presentation-only Excel tables (`reading 'name'` during worksheet model assignment). Normalization now runs **in memory** on only prefixed XLSX sources: replace equivalent main-namespace tag prefixes, strip purely presentational table parts, then let the existing strict importer validate headers/rows. Other workbook formats pass to ExcelJS unchanged. No source file is modified or committed.

**Reproduced end-to-end with the actual private XLSX bytes** on Node 22 + ExcelJS 4.4.0 in a temporary private Vercel diagnostic sandbox: `total_rows=613`, `unique_company_skus=613`, `totals.error=0`, `both=224`, `xnt_only=385`, `price_only=4`, `missing_images=541`, `image_candidates=72`; leading-zero `0114` retained. Source NET price, stock values and filenames do not appear in preview JSON. Diagnostic sandbox stored no Git commit or public share of the source.

**Release scope:** strict read-only preview remains; no Neon import, no R2 upload, no catalogue publication. Owner may upload the **original 8-sheet XLSX without editing anything**. A one-sheet copy is offered for convenience, not a prerequisite. Follow-up UI shows that other sheets are ignored automatically.
