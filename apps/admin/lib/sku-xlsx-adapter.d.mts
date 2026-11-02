declare module "@/lib/sku-xlsx-adapter.mjs" {
  export function inspectXlsxColumns(bytes: Uint8Array): Promise<{
    source_sheet:"SAN PHAM"; total_rows:number;
    columns:Array<{index:number;header:string;suggested:string;samples:string[]}>;
  }>;
  export function validateColumnMapping(mapping: unknown, columnCount:number):string[];
  export function readXlsxSkuRows(
    bytes: Uint8Array,
    options?: { sourceFile?: string; sheetName?: string; columnMapping?: string[] }
  ): Promise<{
    source_sheet: string;
    rows: Array<Record<string, string>>;
    evidence: Array<{
      specifications: { pages: string | null; ruling: string | null };
      warnings: string[];
    }>;
  }>;
  export function previewXlsxImport(
    bytes: Uint8Array,
    existing?: readonly object[],
    options?: { sourceFile?: string; sheetName?: string; columnMapping?: string[] }
  ): Promise<{
    applied: false;
    source_sheet: string;
    totals: Record<"create"|"update"|"unchanged"|"conflict"|"error",number>;
    counts: Record<string,number>;
    items: unknown[];
  }>;
}
