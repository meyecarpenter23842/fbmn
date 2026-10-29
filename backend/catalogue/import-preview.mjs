// ADM-02 #19. Read-only CSV import preview; no DB write, no invented SKU/price.
const MAX_CSV_BYTES = 8_000_000;
const MAX_ROWS = 20_000;
const HEADERS = new Set([
  "sku_cong_ty", "ten_goc_xnt", "ten_goc_bang_gia", "ten_san_pham",
  "barcode", "paper_size", "expected_revision",
]);
const FIELDS = ["ten_goc_xnt","ten_goc_bang_gia","ten_san_pham","barcode","paper_size"];
const keyOf = sku => sku.toUpperCase();

/** Quote-aware CSV parser. Every cell stays STRING; 0114 never becomes number 114. */
export function parseCsv(csv) {
  if (typeof csv !== "string" || Buffer.byteLength(csv,"utf8") > MAX_CSV_BYTES) throw new Error("invalid_csv_size");
  const source = csv.charCodeAt(0) === 0xFEFF ? csv.slice(1) : csv;
  const records = [];
  let cells = [], value = "", quoted = false, closedQuote = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i+1] === '"') { value += '"'; i++; }
        else { quoted = false; closedQuote = true; }
      } else value += char;
    } else if (char === ',' || char === '\n' || char === '\r') {
      cells.push(value); value = ""; closedQuote = false;
      if (char === ',' ) continue;
      if (char === '\r' && source[i+1] === '\n') i++;
      if (cells.some(cell=>cell !== "")) records.push(cells);
      cells = [];
      if (records.length > MAX_ROWS + 1) throw new Error("too_many_rows");
    } else if (char === '"' && value === "" && !closedQuote) {
      quoted = true;
    } else if (closedQuote || char === '"') {
      throw new Error("malformed_csv_quote");
    } else value += char;
  }
  if (quoted) throw new Error("unclosed_csv_quote");
  if (value !== "" || cells.length) {
    cells.push(value);
    if (cells.some(cell=>cell !== "")) records.push(cells);
  }
  if (!records.length) throw new Error("empty_csv");
  const header = records.shift().map(h => h.trim());
  if (!header.includes("sku_cong_ty") || new Set(header).size !== header.length ||
      header.some(h => !HEADERS.has(h))) throw new Error("invalid_columns");
  return records.map((cells, index) => {
    if (cells.length !== header.length) return { __error: "column_count", __row: index+2 };
    const result = { __row: index+2 };
    header.forEach((h,i)=> {result[h] = cells[i];});
    return result;
  });
}

/** Import preview is pure; supplied existing rows must come from server-side DB. */
export function previewSkuRows(incoming, existing = []) {
  if (!Array.isArray(incoming) || !Array.isArray(existing)) throw new Error("invalid_input");
  const existingMap = new Map();
  for (const record of existing) {
    if (typeof record.sku_cong_ty !== "string") throw new Error("invalid_existing");
    const key = keyOf(record.sku_cong_ty);
    if (existingMap.has(key)) throw new Error("duplicate_existing");
    existingMap.set(key,record);
  }
  const seen = new Set();
  const totals = {create:0,update:0,unchanged:0,conflict:0,error:0};
  const items = incoming.map((row,index)=> {
    const sku = row?.sku_cong_ty;
    const line = row?.__row || index+2;
    const validSku = typeof sku === "string" && sku.length>0 && sku.length<=80 &&
      sku===sku.trim() && !/[\x00-\x1f\x7f]/.test(sku);
    let status, reason = null, changes = [];
    if (row?.__error || !validSku) {
      status="error";reason=row?.__error || "missing_or_invalid_source";
    } else if (seen.has(keyOf(sku))) {
      status="error";reason="duplicate_sku_in_upload";
    } else {
      seen.add(keyOf(sku));
      const old=existingMap.get(keyOf(sku));
      // Mirror the DB constraint: names must be present on CREATE and after UPDATE.
      // A barcode-only or size-only record is not a valid new company product.
      const names=["ten_goc_xnt","ten_goc_bang_gia","ten_san_pham"];
      const hasName=names.some(field => {
        const next=Object.hasOwn(row,field) ? row[field] : old?.[field];
        return typeof next==="string" && next.trim().length>0;
      });
      if (!hasName) {
        status="error";reason="missing_product_name";
      } else if (!old) status="create";
      else {
        changes=FIELDS.filter(f => Object.hasOwn(row,f) && (row[f] || "") !== (old[f] || ""));
        if (!changes.length) status="unchanged";
        else if ((row.expected_revision && String(old.revision)!==row.expected_revision) ||
                 !["draft","needs_review"].includes(old.review_status)) {
          status="conflict";reason="approved_or_revision_changed";
        } else status="update";
      }
    }
    totals[status]++;
    return { row:line,sku_cong_ty:validSku?sku:null,status,reason,changes,
      // Empty image is allowed, never fabricate or join by barcode.
      media_missing:true };
  });
  return {totals,items,applied:false};
}
export const previewCsvImport = (csv, existing = []) => previewSkuRows(parseCsv(csv),existing);
