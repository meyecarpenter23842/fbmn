import ExcelJS from "exceljs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS=["Mã công ty","Tên sản phẩm","Mã vạch","Khổ","Số trang","Dòng kẻ"];
export async function GET(){
  const workbook=new ExcelJS.Workbook();
  workbook.creator="Futurebook Miền Nam";
  const sheet=workbook.addWorksheet("SAN PHAM");
  const header=sheet.addRow(HEADERS);
  header.height=30;
  header.eachCell(cell=>{
    cell.font={bold:true,color:{argb:"FFFFFFFF"},size:11};
    cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF563CB2"}};
    cell.alignment={vertical:"middle",horizontal:"center"};
  });
  for(const [n,width] of [20,37,24,19,17,24].entries())
    sheet.getColumn(n+1).width=width;
  sheet.getColumn(1).numFmt="@";
  sheet.getColumn(3).numFmt="@";
  sheet.views=[{state:"frozen",ySplit:1}];
  // No fake SKU rows. Mã công ty must remain literal text (e.g. 0114).
  const bytes=await workbook.xlsx.writeBuffer();
  return new Response(new Uint8Array(bytes),{headers:{
    "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition":"attachment; filename=Futurebook_MAU_NHAP_SAN_PHAM_1_SHEET.xlsx",
    "Cache-Control":"private, no-store",
    "X-Content-Type-Options":"nosniff",
  }});
}
