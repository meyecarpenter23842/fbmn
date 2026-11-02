declare module "@/lib/sheet-sync.mjs" {
  export function planSheetSync(
    parsed: {source_sheet:string;rows:readonly unknown[];evidence:readonly unknown[]},
    existing?:readonly unknown[],
    categories?:readonly {id:string;parent_id:string|null;category_label:string;category_code?:string}[],
    options?:{mappedFields?:readonly string[];clearFields?:readonly string[];families?:readonly {id:string;family_code:string}[]}
  ): {
    source_sheet:"SAN PHAM";
    totals:Record<"create"|"update"|"unchanged"|"conflict"|"error",number>;
    items:unknown[];
    operations:unknown[];
    applied:false;
  };
}
