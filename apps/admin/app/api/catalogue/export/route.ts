import ExcelJS from "exceljs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const HDR=["Mã công ty","Tên sản phẩm","Mã vạch","Khổ","Số trang","Dòng kẻ"];
const privateHeaders={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers:privateHeaders});
function baseUrl(){
  try{const u=new URL(process.env.FBMN_ADMIN_API_BASE_URL||"");
    if(u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==="/")return u.origin;
  }catch{}return null;
}
function cell(row:Record<string,unknown>,key:string){
  const v=key==="pages"||key==="ruling"?
    (row.product_spec && typeof row.product_spec==="object"?
      (row.product_spec as Record<string,unknown>)[key]:null):
    row[key];
  return typeof v==="string"?v:"";
}
function csvSafe(v:string){
  const value=/^[\s]*[=+\-@\t\r]/.test(v)?"'"+v:v;
  return '"'+value.replaceAll('"','""')+'"';
}
export async function GET(request:Request){
  const url=new URL(request.url);
  if([...url.searchParams.keys()].some(k=>k!=="format"))return fail(400,"invalid_query");
  const format=url.searchParams.get("format")||"xlsx";
  if(!["xlsx","csv"].includes(format))return fail(400,"invalid_format");
  const auth=request.headers.get("authorization")||"";
  if(!/^Bearer [A-Za-z0-9._~+/-]+=*$/.test(auth)||auth.length>12010)return fail(401,"invalid_bearer");
  const base=baseUrl();if(!base)return fail(503,"admin_api_unavailable");
  let rows:Record<string,unknown>[];
  try{
    const [session,snapshot]=await Promise.all([
      fetch(base+"/v1/admin/session",{headers:{Authorization:auth,Accept:"application/json"},
        cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(9000)}),
      fetch(base+"/v1/admin/catalogue/snapshot",{headers:{Authorization:auth,Accept:"application/json"},
        cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(10000)})
    ]);
    if(session.status===401||snapshot.status===401)return fail(401,"unauthenticated");
    if(session.status===403||snapshot.status===403)return fail(403,"forbidden");
    if(!session.ok||!snapshot.ok)return fail(503,"catalogue_unavailable");
    const role=(await session.json())?.data?.role;
    if(!["owner","admin","editor"].includes(role))return fail(403,"forbidden");
    rows=(await snapshot.json())?.data?.items;
    if(!Array.isArray(rows)||rows.length>20000 ||
       rows.some(x=>typeof x?.sku_cong_ty!=="string"))return fail(503,"invalid_catalogue");
  }catch{return fail(503,"catalogue_unavailable");}
  const lines=rows.map(row=>[
    cell(row,"sku_cong_ty"),
    cell(row,"ten_san_pham")||cell(row,"ten_goc_xnt")||cell(row,"ten_goc_bang_gia"),
    cell(row,"barcode"),cell(row,"paper_size"),cell(row,"pages"),cell(row,"ruling")
  ]);
  const name="Futurebook_DANH_MUC_SAN_PHAM_1_SHEET";
  if(format==="csv"){
    const content="\uFEFF"+[HDR,...lines].map(cells=>cells.map(csvSafe).join(",")).join("\r\n")+"\r\n";
    return new Response(content,{headers:{...privateHeaders,"Content-Type":"text/csv; charset=utf-8",
      "Content-Disposition":'attachment; filename="'+name+'.csv"'}});
  }
  const book=new ExcelJS.Workbook();const sheet=book.addWorksheet("SAN PHAM");
  sheet.addRow(HDR);sheet.getColumn(1).numFmt="@";sheet.getColumn(3).numFmt="@";
  sheet.getColumn(1).width=20;sheet.getColumn(2).width=46;sheet.getColumn(3).width=22;
  sheet.getColumn(4).width=18;sheet.getColumn(5).width=16;sheet.getColumn(6).width=22;
  for(const values of lines)sheet.addRow(values);
  for(let n=2;n<=sheet.rowCount;n++){
    sheet.getRow(n).getCell(1).numFmt="@";
    sheet.getRow(n).getCell(3).numFmt="@";
  }
  sheet.getRow(1).font={bold:true};
  sheet.views=[{state:"frozen",ySplit:1}];
  const output=await book.xlsx.writeBuffer();
  return new Response(new Uint8Array(output),{headers:{...privateHeaders,
    "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition":'attachment; filename="'+name+'.xlsx"'}});
}
