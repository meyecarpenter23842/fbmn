declare module "@/lib/sku-xlsx-adapter.mjs" {
  export function readXlsxSkuRows(
    bytes: Uint8Array,
    options?: { sourceFile?: string; sheetName?: string }
  ): Promise<{
    rows: Array<Record<string, string>>;
    evidence: Array<{
      specifications: { pages: string | null; ruling: string | null };
      warnings: string[];
    }>;
  }>;
  export function previewXlsxImport(
    bytes: Uint8Array,
    existing?: readonly object[],
    options?: { sourceFile?: string; sheetName?: string }
  ): Promise<{
    applied: false;
    source_sheet: string;
    totals: Record<"create"|"update"|"unchanged"|"conflict"|"error",number>;
    counts: Record<string,number>;
    items: unknown[];
  }>;
}
