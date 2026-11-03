import ExcelJS from "exceljs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=20;
const PRIVATE={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(s:number,code:string)=>Response.json({error:{code}},{status:s,headers:PRIVATE});
const KINDS=new Set(["source","net_internal","retail_public","dealer_contract"]);
function baseUrl(){
 try{const u=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
  return u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==="/"?u.origin:null;
 }catch{return null;}
}
// XLSX cells are written as literal strings (ExcelJS formula objects are never used).
// Do not CSV-escape in XLSX: adding apostrophes would change immutable SKU/source text.
const safe=(value:unknown)=>typeof value==="string"?value:"";
export async function GET(request:Request){
 const url=new URL(request.url);
 if([...url.searchParams.keys()].some(k=>!["kind","customer_id","template"].includes(k)))return fail(400,"invalid_query");
 const kind=url.searchParams.get("kind"),customer=url.searchParams.get("customer_id");
 const template=url.searchParams.get("template");
 if(template!==null&&template!=="1")return fail(400,"invalid_query");
 if(!kind||!KINDS.has(kind)||(kind==="dealer_contract"?
  !/^[a-f0-9-]{36}$/i.test(customer||""):customer!==null))
  return fail(400,"invalid_price_scope");
 const auth=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(auth)||auth.length>12010)
  return fail(401,"invalid_bearer");
 const base=baseUrl();if(!base)return fail(503,"admin_api_unavailable");
 let items:Record<string,unknown>[];
 try{
  // template is a local XLSX presentation option, never a Worker query field.
  const remoteQuery=new URLSearchParams({kind});
  if(customer)remoteQuery.set("customer_id",customer);
  const remote=await fetch(base+"/v1/admin/pricing/bulk?"+remoteQuery.toString(),{
   headers:{Authorization:auth,Accept:"application/json"},cache:"no-store",
   redirect:"manual",signal:AbortSignal.timeout(14000)
  });
  if(remote.status===401)return fail(401,"unauthenticated");
  if(remote.status===403)return fail(403,"owner_required");
  if(!remote.ok)return fail(503,"pricebook_unavailable");
  const payload=await remote.json() as {data?:{items?:Record<string,unknown>[]}};
  items=payload.data?.items||[];
  if(!Array.isArray(items)||items.length>10000||
   items.some(x=>typeof x?.sku_cong_ty!=="string"||
    x.amount_vnd!==null&&x.amount_vnd!==undefined&&typeof x.amount_vnd!=="string"))
   return fail(503,"invalid_pricebook_response");
 }catch{return fail(503,"pricebook_unavailable");}
 const book=new ExcelJS.Workbook();
 book.creator="Futurebook Miền Nam";
 const sheet=book.addWorksheet("GIA NOI BO");
 sheet.addRow(["Mã công ty","Giá mới (VND)"]);
 sheet.getColumn(1).width=24;sheet.getColumn(1).numFmt="@";
 sheet.getColumn(2).width=24;
 sheet.getColumn(2).numFmt="#,##0";
 if(!template)for(const item of items){
  const code=String(item.sku_cong_ty);
  const price=item.amount_vnd===null||item.amount_vnd===undefined?"":Number(item.amount_vnd);
  const row=sheet.addRow([safe(code),price]);
  row.getCell(1).numFmt="@";
  row.getCell(2).numFmt="#,##0";
 }
 sheet.getRow(1).font={bold:true,color:{argb:"FFFFFFFF"}};
 sheet.getRow(1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF61258D"}};
 sheet.views=[{state:"frozen",ySplit:1}];
 sheet.autoFilter={from:"A1",to:"B1"};
 const bytes=await book.xlsx.writeBuffer();
 return new Response(new Uint8Array(bytes),{headers:{...PRIVATE,
  "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "Content-Disposition":'attachment; filename="'+(template?"Futurebook_MAU_2_COT":"Futurebook_GIA_NOI_BO_"+kind)+'.xlsx"'}});
}
