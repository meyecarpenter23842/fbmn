// SKU công ty là khóa gốc: không được đổi sang số hoặc bỏ số 0 đầu.
export function exactCompanySku(input) {
  if (typeof input !== "string" || input.length === 0 || input.length > 80 ||
      input.trim() !== input) throw new Error("invalid_original_company_sku");
  return input;
}

export function previewAgainstCatalogue(rows, savedRows) {
  const snapshot = new Map();
  for (const row of savedRows) snapshot.set(exactCompanySku(row.sku_cong_ty), row);
  const seen = new Set();
  const totals = { create: 0, unchanged: 0, conflict: 0, error: 0 };
  const items = rows.map(row => {
    let status, sku = null;
    try {
      sku = exactCompanySku(row.sku_cong_ty);
      if (seen.has(sku)) throw new Error("duplicate_company_sku");
      seen.add(sku);
      const previous = snapshot.get(sku);
      if (!previous) status = "create";
      else if (previous.review_status === "approved" ||
               previous.review_status === "withdrawn") status = "conflict";
      else status = "unchanged";
    } catch { status = "error"; }
    totals[status]++;
    return { sku_cong_ty: sku, status };
  });
  return { totals, items, applied: false, database_queried: true };
}

export function selectManualFamily(codes, familyId) {
  if (typeof familyId !== "string" || !familyId) throw new Error("invalid_family");
  const selected = codes.map(exactCompanySku);
  if (new Set(selected).size !== selected.length || selected.length < 2)
    throw new Error("invalid_selected_skus");
  return { familyId, codes: selected };
}
