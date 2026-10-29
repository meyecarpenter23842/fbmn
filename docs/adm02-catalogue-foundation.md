# ADM-02 #19 — Master SKU / import preview foundation

**Scope of this PR:** private SQL schema + pure CSV preview only. No staging SQL applied, no product rows imported, no R2 bytes moved, no production deploy. Real verified 613-SKU workbook is still in Drive, never committed with internal NET/VAT prices.

- `sku_cong_ty` is text primary key: preserve `0114` / `0714`. Different company SKUs are never merged by barcode or image filename.
- Family groups multiple actual SKUs. A SKU can have multiple media associations. Each media relation stores method/confidence/review; approval does not follow automated matching.
- Missing image leaves no `sku_media` link and does not reject the draft SKU.
- Private `fbmn_catalog_private.price_evidence` keeps source price and NET outside the public read model and Admin general-reader grants.
- Public `fbmn_public.v_*` views are not changed. No automatic publication to any of the three channels.
- `previewCsvImport` returns create/update/unchanged/conflict/error counters, is read-only, preserves all SKU strings, does not import source prices. CSV adapter first; XLSX adapter, import commit and Admin UI are later parts of the existing issue #19/#41.
- Before applying staging: rehearse up/down on disposable Neon branch and verify the exact Drive 613-SKU workbook mapping. Do not upload/commit private source files.
