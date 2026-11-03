import ExcelJS from "exceljs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const PRIVATE={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:PRIVATE});
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
function baseUrl(){
 try{
  const uri=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  return uri.protocol==="https:"&&!uri.username&&!uri.password&&!uri.hash&&
   !uri.search&&uri.pathname==="/"?uri.origin:null;
 }catch{return null;}
}
type PriceList={id:string;list_code:string;list_name:string};
type PriceItem={sku_cong_ty:string;amount_vnd:string;valid_from:string};
async function privateGet<T>(base:string,authorization:string,path:string):Promise<T>{
 const result=await fetch(base+path,{headers:{Authorization:authorization,Accept:"application/json"},
  cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(14000)});
 if(!result.ok)throw Error(result.status===401?"unauthenticated":
  result.status===403?"owner_required":"managed_price_export_unavailable");
 const payload=await result.json() as {data?:T};
 if(!payload.data)throw Error("managed_price_export_unavailable");
 return payload.data;
}
export async function GET(request:Request){
 const url=new URL(request.url);
 if([...url.searchParams.keys()].some(k=>!["list_id","format","template","period"].includes(k)))
  return fail(400,"invalid_query");
 const listId=url.searchParams.get("list_id")||"";
 const period=url.searchParams.get("period")||"";
 const format=url.searchParams.get("format")||"xlsx";
 const template=url.searchParams.get("template")||"0";
 if(!UUID.test(listId)||!/^\d{4}-\d{2}-\d{2}$/.test(period)||
  Number.isNaN(Date.parse(period))||!["xlsx","csv"].includes(format)||!["0","1"].includes(template))
  return fail(400,"invalid_query");
 const auth=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(auth)||auth.length>12010)
  return fail(401,"unauthenticated");
 const base=baseUrl();if(!base)return fail(503,"admin_api_unavailable");
 let target:PriceList,items:PriceItem[]=[];
 try{
  const lists=await privateGet<{items:PriceList[]}>(base,auth,"/v1/admin/pricing/managed");
  const found=lists.items.find(x=>x.id===listId);
  if(!found)return fail(404,"price_list_not_found");
  target=found;
  if(template!=="1"){
   const results=await privateGet<{items:PriceItem[]}>(base,auth,
    "/v1/admin/pricing/managed/prices-export?list_id="+encodeURIComponent(listId)+
    "&period="+encodeURIComponent(period));
   if(!Array.isArray(results.items)||results.items.length>10000||
    results.items.some(x=>typeof x.sku_cong_ty!=="string"||
     !/^(0|[1-9]\d{0,12})$/.test(x.amount_vnd)))
    return fail(503,"managed_price_export_unavailable");
   // Newest effective date wins for a duplicated SKU in an export.
   const bySku=new Map<string,PriceItem>();
   for(const item of results.items){
    if(!bySku.has(item.sku_cong_ty))bySku.set(item.sku_cong_ty,item);
   }
   items=[...bySku.values()];
  }
 }catch(e){
  const code=e instanceof Error?e.message:"managed_price_export_unavailable";
  return fail(code==="unauthenticated"?401:code==="owner_required"?403:503,
   ["unauthenticated","owner_required"].includes(code)?code:"managed_price_export_unavailable");
 }
 const rows=items.map(x=>[x.sku_cong_ty,Number(x.amount_vnd)] as [string,number]);
 const basename="Futurebook_"+target.list_code+"_"+period+"_"+
  (template==="1"?"MAU_NHAP_GIA":"BANG_GIA");
 if(format==="csv"){
  // Excel evaluates formula-prefixed content even when the CSV value is quoted.
  // Fail closed rather than changing a company SKU with an apostrophe.
  if(rows.some(([sku])=>/^\s*[=+\-@]/.test(sku)))
   return fail(422,"unsafe_csv_sku");
  const quote=(str:string)=>'"'+str.replaceAll('"','""')+'"';
  const lines=['"Mã công ty","Giá mới (VND)"',...rows.map(row=>
   quote(row[0])+","+quote(String(row[1])))];
  return new Response("\uFEFF"+lines.join("\r\n")+"\r\n",{headers:{...PRIVATE,
   "Content-Type":"text/csv; charset=utf-8",
   "Content-Disposition":'attachment; filename="'+basename+'.csv"'}});
 }
 const book=new ExcelJS.Workbook();book.creator="Futurebook Miền Nam";
 const sh=book.addWorksheet("NHAP_GIA");sh.addRow(["Mã công ty","Giá mới (VND)"]);
 sh.getColumn(1).width=24;sh.getColumn(1).numFmt="@";
 sh.getColumn(2).width=24;sh.getColumn(2).numFmt="#,##0";
 for(const [sku,amount] of rows){
  const row=sh.addRow([sku,amount]);row.getCell(1).numFmt="@";
  row.getCell(2).numFmt="#,##0";
 }
 sh.getRow(1).font={bold:true,color:{argb:"FFFFFFFF"}};
 sh.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF61258D"}};
 sh.views=[{state:"frozen",ySplit:1}];
 sh.autoFilter={from:"A1",to:"B1"};
 const data=await book.xlsx.writeBuffer();
 return new Response(new Uint8Array(data),{headers:{...PRIVATE,
  "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "Content-Disposition":'attachment; filename="'+basename+'.xlsx"'}});
}
