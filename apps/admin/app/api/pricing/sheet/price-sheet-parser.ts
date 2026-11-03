import ExcelJS from "exceljs";
import JSZip from "jszip";
// Confidential Owner-only Excel inspector. This parser never writes to the database.
const MAX_ROWS=1000,MAX_COLS=30;
const FIELD_LIST=["sku_cong_ty","amount_vnd","price_kind","vat_included","vat_rate_bps",
 "source_document","effective_from","effective_until","customer_id"];
const normalize=(s:string)=>s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replaceAll("đ","d")
 .toLowerCase().replace(/[_\s-]+/g," ").trim();
const labels:Record<string,string[]>={
 sku_cong_ty:["ma cong ty","ma sp cong ty","ma san pham","sku","sku cong ty"],
 amount_vnd:["gia moi (vnd)","gia moi","gia","don gia","amount vnd"],
 price_kind:["loai gia","price kind"],vat_included:["vat da gom?","vat da gom","da gom vat"],
 vat_rate_bps:["thue suat vat (%)","vat (%)"],
 source_document:["nguon gia","tai lieu nguon","source document"],
 effective_from:["tu ngay","ngay hieu luc"],effective_until:["den ngay","ngay het han"],
 customer_id:["ma tai khoan dai ly","customer id","id dai ly"]
};
function suggest(header:string){
 const n=normalize(header);
 return FIELD_LIST.find(key=>labels[key]?.includes(n))||"ignore";
}
type Cell={text:string;kind:"text"|"number"|"blank"};
function excelCell(value:unknown):Cell{
 if(value===null||value===undefined||value==="")return {text:"",kind:"blank"};
 if(value instanceof Date)return {text:value.toISOString().slice(0,10),kind:"text"};
 if(typeof value==="string")return {text:value.slice(0,1200),kind:"text"};
 if(typeof value==="number"&&Number.isFinite(value))return {text:String(value),kind:"number"};
 if(typeof value==="object"){
  const v=value as Record<string,unknown>;
  if("formula" in v||"sharedFormula" in v)throw Error("formula_not_allowed");
  if(Array.isArray(v.richText))return {text:v.richText.map(x=>
   typeof x==="object"&&x&&"text" in x?String(x.text):"").join("").slice(0,1200),kind:"text"};
  if(typeof v.text==="string")return {text:v.text.slice(0,1200),kind:"text"};
 }
 throw Error("unsupported_cell");
}
function csvRows(csv:string){
 const rows:string[][]=[];let current:string[]=[],field="",quoted=false;
 if(csv.startsWith("\uFEFF"))csv=csv.slice(1);
 for(let i=0;i<csv.length;i++){
  const c=csv[i];
  if(quoted){
   if(c==='"'&&csv[i+1]==='"'){field+='"';i++;}
   else if(c==='"')quoted=false;
   else field+=c;
  }else if(c==='"'){if(field!=="")throw Error("invalid_csv");quoted=true;}
  else if(c===","){current.push(field);field="";}
  else if(c==="\r"||c==="\n"){
   if(c==="\r"&&csv[i+1]==="\n")i++;
   current.push(field);rows.push(current);current=[];field="";
   if(rows.length>MAX_ROWS+16)throw Error("too_many_rows");
  }else field+=c;
  if(field.length>1200)throw Error("cell_too_long");
 }
 if(quoted)throw Error("invalid_csv");
 if(field!==""||current.length){current.push(field);rows.push(current);}
 return rows.map((values,i)=>({line:i+1,cells:values.map(text=>({
  text,kind:text===""?"blank":"text" as "blank"|"text"}))}));
}
function assemble(raw:{line:number;cells:Cell[]}[]){
 const candidates=raw.filter(x=>x.line<=8&&x.cells.filter(c=>c.text.trim()).length>=2);
 const header=candidates.find(r=>r.cells.some(c=>suggest(c.text)==="sku_cong_ty"))||
  candidates[0];
 if(!header)throw Error("missing_columns");
 const width=header.cells.map((c,i)=>c.text.trim()?i+1:0).reduce((a,b)=>Math.max(a,b),0);
 if(width<2||width>MAX_COLS)throw Error("too_many_columns");
 const columns=Array.from({length:width},(_,i)=>({
  index:i,header:header.cells[i]?.text||"Cột "+(i+1),
  suggested:suggest(header.cells[i]?.text||"")
 }));
 const rows=raw.filter(r=>r.line>header.line&&r.cells.some(c=>c.text!==""))
  .map(r=>({line:r.line,cells:Array.from({length:width},(_,i)=>
   r.cells[i]||{text:"",kind:"blank" as const})}));
 if(!rows.length||rows.length>MAX_ROWS)throw Error("too_many_rows");
 return {columns,rows,total_rows:rows.length,header_row:header.line,
  persisted:false};
}
function rowsOf(sheet:ExcelJS.Worksheet){
 if(sheet.rowCount>MAX_ROWS+16)throw Error("too_many_rows");
 const raw:{line:number;cells:Cell[]}[]=[];
 for(let index=1;index<=sheet.rowCount;index++){
  const row=sheet.getRow(index);
  // Formatting-only phantom Excel columns must not inflate column counts.
  let width=0;
  row.eachCell({includeEmpty:false},(cell,i)=>{if(cell.value!==null)width=Math.max(width,i);});
  if(width>MAX_COLS)throw Error("too_many_columns");
  raw.push({line:index,cells:Array.from({length:width},(_,i)=>excelCell(row.getCell(i+1).value))});
 }
 return raw;
}
export function readPriceCsv(csv:string){return assemble(csvRows(csv));}
export async function readPriceXlsx(bytes:Uint8Array){
 const zip=await JSZip.loadAsync(Buffer.from(bytes));
 const entries=Object.values(zip.files);
 if(entries.length>500||!zip.file("xl/workbook.xml"))throw Error("invalid_xlsx");
 let expanded=0;
 for(const part of entries){
  if(part.dir)continue;
  const size=(part as unknown as {_data?:{uncompressedSize?:number}})._data?.uncompressedSize;
  if(typeof size!=="number"||size<0||size>36_000_000)throw Error("xlsx_too_large");
  if(part.name.startsWith("xl/")&&part.name.endsWith(".xml"))expanded+=size;
  if(expanded>36_000_000)throw Error("xlsx_too_large");
 }
 const book=new ExcelJS.Workbook();
 await book.xlsx.load(Buffer.from(bytes) as never);
 if(book.worksheets.length<1||book.worksheets.length>20)throw Error("invalid_xlsx");
 if(book.worksheets.length===1){
  const sheet=book.worksheets[0];
  return {...assemble(rowsOf(sheet)),sheet_name:sheet.name};
 }
 // Only examine header text in non-selected sheets. Their formulas and
 // formatting must never invalidate a valid price-data worksheet.
 const headerText=(value:unknown)=>{
  if(typeof value==="string")return value;
  if(value&&typeof value==="object"&&"richText" in value){
   const rich=(value as {richText?:{text:string}[]}).richText;
   return Array.isArray(rich)?rich.map(item=>item.text||"").join(""):"";
  }
  return "";
 };
 const isPriceSheet=(sheet:ExcelJS.Worksheet)=>{
  for(let index=1;index<=Math.min(sheet.rowCount,8);index++){
   const row=sheet.getRow(index);let sku=false,amount=false;
   for(let i=1;i<=Math.min(row.cellCount,MAX_COLS);i++){
    const field=suggest(headerText(row.getCell(i).value));
    if(field==="sku_cong_ty")sku=true;
    if(field==="amount_vnd")amount=true;
   }
   if(sku&&amount)return true;
  }
  return false;
 };
 // Multiple price sheets are ambiguous. Fail before accessing any price rows.
 const candidates=book.worksheets.filter(isPriceSheet);
 if(candidates.length===0)throw Error("missing_price_sheet");
 if(candidates.length>1)throw Error("multiple_price_sheets");
 const sheet=candidates[0];
 return {...assemble(rowsOf(sheet)),sheet_name:sheet.name};
}
