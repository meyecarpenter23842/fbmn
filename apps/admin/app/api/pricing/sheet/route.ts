import ExcelJS from "exceljs";
import JSZip from "jszip";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=20;
const PRIVATE={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(s:number,code:string)=>Response.json({error:{code}},{status:s,headers:PRIVATE});
const MAX_FILE=8_000_000,MAX_WIRE=8_065_536,MAX_ROWS=1000,MAX_COLS=30;
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
function baseUrl(){
 try{const u=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  return u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==="/"?u.origin:null;
 }catch{return null;}
}
async function readCapped(request:Request){
 const reader=request.body?.getReader();if(!reader)return null;
 const chunks:Uint8Array[]=[];let total=0;
 for(let chunk=await reader.read();!chunk.done;chunk=await reader.read()){
  total+=chunk.value.byteLength;
  if(total>MAX_WIRE){await reader.cancel().catch(()=>{});return null;}
  chunks.push(chunk.value);
 }
 const merged=new Uint8Array(total);let offset=0;
 for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.length;}
 return merged;
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
async function readXlsx(bytes:Uint8Array){
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
 const book=new ExcelJS.Workbook();await book.xlsx.load(Buffer.from(bytes) as never);
 if(book.worksheets.length!==1)throw Error("multiple_worksheets");
 const sheet=book.worksheets[0];
 if(sheet.rowCount>MAX_ROWS+16)throw Error("too_many_rows");
 const raw:{line:number;cells:Cell[]}[]=[];
 for(let index=1;index<=sheet.rowCount;index++){
  const r=sheet.getRow(index);
  // Formatting-only phantom Excel columns must not inflate column counts.
  let width=0;r.eachCell({includeEmpty:false},(cell,i)=>{if(cell.value!==null)width=Math.max(width,i);});
  if(width>MAX_COLS)throw Error("too_many_columns");
  const cells=Array.from({length:width},(_,i)=>excelCell(r.getCell(i+1).value));
  raw.push({line:index,cells});
 }
 return assemble(raw);
}
export async function POST(request:Request){
 const url=new URL(request.url);
 if(request.headers.get("origin")!==url.origin||request.headers.get("sec-fetch-site")==="cross-site")
  return fail(403,"origin_forbidden");
 const contentType=request.headers.get("content-type")||"";
 if(!/^multipart\/form-data;\s*boundary=/i.test(contentType))return fail(415,"unsupported_media_type");
 if(Number(request.headers.get("content-length")||0)>MAX_WIRE)return fail(413,"file_too_large");
 const auth=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(auth)||auth.length>12010)
  return fail(401,"invalid_bearer");
 const base=baseUrl();if(!base)return fail(503,"admin_api_unavailable");
 try{
  const check=await fetch(base+"/v1/admin/session",{
   headers:{Authorization:auth,Accept:"application/json"},
   cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(7000)});
  if(check.status===401)return fail(401,"unauthenticated");
  if(check.status===403)return fail(403,"forbidden");
  if(!check.ok||!check.headers.get("content-type")?.includes("application/json"))
   return fail(503,"admin_api_unavailable");
  if((await check.json())?.data?.role!=="owner")return fail(403,"owner_required");
 }catch{return fail(503,"admin_api_unavailable");}
 try{
  const incoming=await readCapped(request);if(!incoming)return fail(413,"file_too_large");
  const rebuilt=new Request(url.origin+"/api/pricing/sheet",{
   method:"POST",headers:{"content-type":contentType},body:new Uint8Array(incoming)});
  const form=await rebuilt.formData(),parts=[...form.entries()];
  if(parts.length!==1||parts[0][0]!=="file"||!(parts[0][1] instanceof File))
   return fail(400,"single_file_required");
  const file=parts[0][1] as File;
  if(!/\.(xlsx|csv)$/i.test(file.name)||file.size===0||file.size>MAX_FILE)
   return fail(400,"invalid_file");
  const bytes=new Uint8Array(await file.arrayBuffer());
  const data=/\.xlsx$/i.test(file.name)?
   bytes[0]===0x50&&bytes[1]===0x4b?await readXlsx(bytes):null:
   assemble(csvRows(new TextDecoder("utf-8",{fatal:true}).decode(bytes)));
  if(!data)return fail(422,"invalid_xlsx");
  return Response.json({data},{headers:PRIVATE});
 }catch{return fail(422,"invalid_price_sheet");}
}
