declare module "@/lib/sku-xlsx-adapter.mjs" {
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
