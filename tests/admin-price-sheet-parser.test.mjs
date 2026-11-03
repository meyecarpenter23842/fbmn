import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import {readPriceXlsx} from "../apps/admin/app/api/pricing/sheet/price-sheet-parser.ts";

function prices(book,name="IMPORT_10_SKU"){
 const sheet=book.addWorksheet(name);
 sheet.addRow(["Mã công ty","Tên sản phẩm (đối chiếu)","Giá mới (VND)","Loại giá","VAT đã gồm?","Nguồn giá"]);
 const row=sheet.addRow(["0114","Sản phẩm đối chiếu",999102,"retail_public","no","TEST_ONLY"]);
 row.getCell(1).numFmt="@";
 return sheet;
}
async function encoded(book){return new Uint8Array(await book.xlsx.writeBuffer());}

test("minimal two-column price XLSX resolves SKU and price without extra columns",async()=>{
 const book=new ExcelJS.Workbook();
 const sheet=book.addWorksheet("GIÁ MỚI");
 sheet.addRow(["Mã công ty","Giá mới (VND)"]);
 sheet.addRow(["0114",22500]);
 sheet.getColumn(1).numFmt="@";
 const data=await readPriceXlsx(await encoded(book));
 assert.equal(data.columns.length,2);
 assert.deepEqual(data.columns.map(x=>x.suggested),["sku_cong_ty","amount_vnd"]);
 assert.equal(data.rows[0].cells[0].text,"0114");
 assert.equal(data.rows[0].cells[0].kind,"text");
 assert.equal(data.rows[0].cells[1].text,"22500");
});

test("two-column SKU/Giá bán sheet with an instruction tab auto-maps as NPP does",async()=>{
 const book=new ExcelJS.Workbook();
 const sheet=book.addWorksheet("NHAP_GIA");
 sheet.addRow(["SKU","Giá bán"]);
 sheet.addRow(["0007",15800]);
 book.addWorksheet("HUONG_DAN").addRow(["Không nhập dữ liệu ở đây"]);
 const data=await readPriceXlsx(await encoded(book));
 assert.equal(data.sheet_name,"NHAP_GIA");
 assert.deepEqual(data.columns.map(x=>x.suggested),["sku_cong_ty","amount_vnd"]);
 assert.equal(data.rows[0].cells[0].text,"0007");
});

test("numeric Excel SKU cells stay marked numeric rather than being zero-padded",async()=>{
 const book=new ExcelJS.Workbook();
 const sheet=book.addWorksheet("NHAP_GIA");
 sheet.addRow(["Mã","Giá mới"]);
 sheet.addRow([114,13000]);
 const data=await readPriceXlsx(await encoded(book));
 assert.equal(data.rows[0].cells[0].kind,"number");
 assert.equal(data.rows[0].cells[0].text,"114");
});

test("XLSX with data and instructions selects one price sheet without losing leading zeros",async()=>{
 const book=new ExcelJS.Workbook();
 prices(book);
 book.addWorksheet("HUONG_DAN").addRow(["HƯỚNG DẪN","Chỉ xem trước, không lưu giá"]);
 const data=await readPriceXlsx(await encoded(book));
 assert.equal(data.sheet_name,"IMPORT_10_SKU");
 assert.equal(data.total_rows,1);
 assert.equal(data.columns[0].suggested,"sku_cong_ty");
 assert.equal(data.columns[2].suggested,"amount_vnd");
 assert.equal(data.rows[0].cells[0].text,"0114");
 assert.equal(data.rows[0].cells[0].kind,"text");
 assert.equal(data.rows[0].cells[2].text,"999102");
});

test("instructions may contain formulas or oversized formatting without invalidating price import",async()=>{
 const book=new ExcelJS.Workbook();
 prices(book);
 const instructions=book.addWorksheet("HUONG_DAN");
 instructions.getCell("A1").value="HƯỚNG DẪN";
 instructions.getCell("B2").value={formula:"1+1",result:2};
 instructions.getCell("AM1250").value="Example unrelated note";
 const data=await readPriceXlsx(await encoded(book));
 assert.equal(data.sheet_name,"IMPORT_10_SKU");
 assert.equal(data.rows[0].cells[0].text,"0114");
});

test("XLSX with two recognized price sheets refuses ambiguous import",async()=>{
 const book=new ExcelJS.Workbook();
 prices(book,"BANG_GIA_1");
 prices(book,"BANG_GIA_2");
 const bytes=await encoded(book);
 await assert.rejects(()=>readPriceXlsx(bytes),/multiple_price_sheets/);
});

test("single-sheet custom columns still permits manual dropdown mapping",async()=>{
 const book=new ExcelJS.Workbook();
 const sheet=book.addWorksheet("TuyChon");
 sheet.addRow(["Ma noi bo","Gia ban"]);
 sheet.addRow(["00123",12345]);
 const data=await readPriceXlsx(await encoded(book));
 assert.equal(data.sheet_name,"TuyChon");
 assert.equal(data.rows[0].cells[0].text,"00123");
 assert.equal(data.columns[0].suggested,"ignore");
});

test("multi-sheet workbook without a unique price header fails closed",async()=>{
 const book=new ExcelJS.Workbook();
 book.addWorksheet("HUONG_DAN").addRow(["Mã công ty","Hướng dẫn"]);
 book.addWorksheet("LOI_NHAC").addRow(["Chú ý","Không phải giá"]);
 const bytes=await encoded(book);
 await assert.rejects(()=>readPriceXlsx(bytes),/missing_price_sheet/);
});

test("formula cells remain rejected in price sheets",async()=>{
 const book=new ExcelJS.Workbook();
 const sheet=prices(book);
 sheet.getRow(2).getCell(3).value={formula:"1000+2",result:1002};
 const bytes=await encoded(book);
 await assert.rejects(()=>readPriceXlsx(bytes),/formula_not_allowed/);
});
