"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import AdminToast from "./admin-toast";
import "./managed-price-import.css";

type PriceList={id:string;list_code:string;list_name:string;audience:string;channel_codes:string[];
 approval_state:"draft"|"approved"|"inactive";valid_from:string;valid_until:string|null};
type Cell={text:string;kind:"text"|"number"|"blank"};
type Sheet={sheet_name?:string;total_rows:number;
 columns:{index:number;header:string;suggested:string}[];
 rows:{line:number;cells:Cell[]}[]};
type Change={line:number;sku_cong_ty:string;ten_san_pham:string|null;amount_vnd:string;
 old_amount_vnd:string|null;vat_included:boolean|null;valid_until:string|null;
 status:"new"|"updated"|"unchanged"|"skipped"|"invalid";issue:string|null};
type Preview={changes:Change[];created:number;updated:number;unchanged:number;skipped:number;
 invalid:number;preview_fingerprint:string;target:{list_code:string;list_name:string}};
type Envelope<T>={data?:T;error?:{code?:string}};
const money=(v:string|null)=>v===null?"—":new Intl.NumberFormat("vi-VN").format(Number(v))+" ₫";
const channels:Record<string,string>={public_web:"Website",consumer_app:"App người tiêu dùng",dealer_app:"App đại lý"};
const issues:Record<string,string>={
 invalid_sku:"Mã SKU không hợp lệ",sku_not_found:"Không có mã trong danh mục",
 duplicate_sku:"Trùng mã trong file",invalid_amount:"Giá không hợp lệ",
 vat_required:"Chưa xác định VAT",approved_price_locked:"Giá đã duyệt — không ghi đè",
 invalid_bulk_input:"Dữ liệu nhập chưa hợp lệ",invalid_bulk_row:"Dòng Excel không hợp lệ",
 preview_stale:"Giá đã thay đổi. Xem trước lại trước khi lưu.",
 test_file_preview_only:"File thử nghiệm chỉ được xem trước, không thể lưu.",
 period_outside_price_list:"Ngày áp dụng nằm ngoài thời hạn của bảng giá.",
 list_not_editable:"Bảng giá đã duyệt hoặc ngừng áp dụng, không thể nhập thêm giá.",
 price_list_not_found:"Không tìm thấy bảng giá.",
 missing_price_sheet:"File thiếu sheet có cột Mã công ty và Giá mới.",
 invalid_price_sheet:"Không đọc được Excel. Anh thử tải mẫu từ hệ thống rồi nhập lại.",
 formula_not_allowed:"File có công thức. Hãy chuyển sang giá trị trước khi nhập."
};
async function bearer(){
 const response=await fetch("/api/auth/token",{cache:"no-store",credentials:"same-origin"});
 if(!response.ok)throw Error("Phiên đăng nhập đã hết hạn.");
 const payload=await response.json() as {token?:string};
 if(!payload.token)throw Error("Không xác thực được Owner.");
 return payload.token;
}
async function api<T>(path:string,method:"GET"|"POST"="GET",body?:unknown):Promise<T>{
 const auth=await bearer();
 const response=await fetch("/api/pricing/managed"+path,{
  method,credentials:"same-origin",cache:"no-store",
  headers:{Authorization:"Bearer "+auth,Accept:"application/json",
   ...(method==="POST"?{"Content-Type":"application/json"}:{})},
  ...(method==="POST"?{body:JSON.stringify(body)}:{})
 });
 const data=await response.json().catch(()=>({})) as Envelope<T>;
 if(!response.ok||!data.data)throw Error(response.status===403?
  "Chỉ Owner được nhập giá.":response.status===401?"Phiên đăng nhập đã hết hạn.":
  issues[data.error?.code||""]||"Không xử lý được bảng giá đã chọn.");
 return data.data;
}
function issueLabel(change:Change){
 if(change.issue)return issues[change.issue]||change.issue;
 return ({new:"Thêm mới",updated:"Cập nhật",unchanged:"Không đổi",
  skipped:"Bỏ qua",invalid:"Không hợp lệ"} as const)[change.status];
}
export default function CatalogueManagedPriceImport({initialListId,onBusyChange,onGoLists}:{
 initialListId:string;onBusyChange?:(busy:boolean)=>void;onGoLists?:()=>void
}){
 const [lists,setLists]=useState<PriceList[]>([]);
 const [chosenId,setChosenId]=useState(initialListId);
 const [priceDate,setPriceDate]=useState("");
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [fileName,setFileName]=useState("");
 const [sheet,setSheet]=useState<Sheet|null>(null);
 const [skuCol,setSkuCol]=useState(-1);
 const [priceCol,setPriceCol]=useState(-1);
 const [vat,setVat]=useState<""|"yes"|"no">("");
 const [exportFormat,setExportFormat]=useState<"xlsx"|"csv">("xlsx");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [prepared,setPrepared]=useState<Record<string,unknown>|null>(null);
 const [toast,setToast]=useState<{message:string;variant:"success"|"error"|"info"}|null>(null);
 const fileInput=useRef<HTMLInputElement|null>(null);
 const generation=useRef(0);
 const notify=useCallback((message:string,variant:"success"|"error"|"info"="error")=>
  setToast({message,variant}),[]);
 const selected=lists.find(item=>item.id===chosenId);
 // The selected list date is a derived fallback; only user selection changes it.
 const invalidate=()=>{generation.current++;setPreview(null);setPrepared(null);};
 useEffect(()=>{onBusyChange?.(busy);},[busy,onBusyChange]);
 useEffect(()=>{
  let cancelled=false;
  void api<{items:PriceList[]}>("").then(result=>{
   if(cancelled)return;
   setLists(result.items);setChosenId(current=>{
    const id=initialListId||current;
    return result.items.some(item=>item.id===id)?id:result.items[0]?.id||"";
   });
  }).catch(err=>{if(!cancelled)notify(err instanceof Error?err.message:"Không tải được bảng giá.");})
   .finally(()=>{if(!cancelled)setLoading(false);});
  return()=>{cancelled=true;};
 },[initialListId,notify]);
 const readFile=async(file:File)=>{
  if(!/\.(xlsx|csv)$/i.test(file.name))throw Error("Chỉ nhận Excel (.xlsx) hoặc CSV.");
  if(file.size>8_000_000)throw Error("File vượt giới hạn 8 MB.");
  const form=new FormData();form.append("file",file);
  const auth=await bearer();
  const response=await fetch("/api/pricing/sheet",{method:"POST",body:form,
   cache:"no-store",credentials:"same-origin",headers:{Authorization:"Bearer "+auth}});
  const payload=await response.json().catch(()=>({})) as Envelope<Sheet>;
  if(!response.ok||!payload.data)throw Error(issues[payload.error?.code||""]||
   "Không đọc được file. Dùng file mẫu tải trực tiếp từ Admin.");
  const data=payload.data;
  if(!data.columns?.length||!data.rows?.length)throw Error("File chưa có dòng dữ liệu.");
  const sku=data.columns.find(c=>c.suggested==="sku_cong_ty")?.index??-1;
  const price=data.columns.find(c=>c.suggested==="amount_vnd")?.index??-1;
  setSheet(data);setFileName(file.name);setSkuCol(sku);setPriceCol(price);
 };
 const selectFile=async(file:File)=>{
  const version=++generation.current;
  setSheet(null);setFileName("");setPreview(null);setPrepared(null);setBusy(true);
  try{await readFile(file);}
  catch(e){if(version===generation.current)notify(e instanceof Error?e.message:"Không đọc được file.");}
  finally{setBusy(false);}
 };
 const payload=()=>{
  if(!selected||selected.approval_state!=="draft")throw Error("Chọn bảng giá đang là bản nháp.");
  if(!sheet||skuCol<0||priceCol<0||skuCol===priceCol)
   throw Error("Cần xác định đúng cột Mã công ty và Giá mới.");
  if(sheet.rows.some(r=>r.cells[skuCol]?.kind==="number"))
   throw Error("Mã công ty đang là số trong Excel. Hãy định dạng cột mã là Text để giữ số 0 đầu.");
  return {list_id:selected.id,source_document:fileName,
   valid_from:priceDate||selected.valid_from,valid_until:selected.valid_until||null,
   vat_included:vat===""?null:vat==="yes",
   rows:sheet.rows.map(r=>({line:r.line,sku_cong_ty:r.cells[skuCol]?.text?.trim()||"",
    amount_vnd:r.cells[priceCol]?.text?.trim()||""}))};
 };
 async function doPreview(){
  // An in-flight response must never restore a preview after the file,
  // chosen list, VAT or column mapping has changed.
  const version=++generation.current;
  setBusy(true);setPreview(null);setPrepared(null);
  try{
   const input=payload();
   const result=await api<Preview>("/bulk-preview","POST",input);
   if(version!==generation.current)return;
   setPreview(result);setPrepared(input);
   notify("Đã đối chiếu "+result.changes.length+" mã với bảng giá "+result.target.list_code+".","info");
  }catch(e){
   if(version===generation.current)
    notify(e instanceof Error?e.message:"Không xem trước được giá.");
  }finally{setBusy(false);}
 }
 async function doApply(){
  if(!preview||!prepared||preview.invalid||preview.created+preview.updated===0)return;
  if(/TEST|KHONG_AP_DUNG/i.test(fileName)){
   notify("File này dùng để kiểm thử, không thể ghi giá giả lập.");return;
  }
  if(!window.confirm("Lưu "+(preview.created+preview.updated)+" mức giá NHÁP vào "+
   preview.target.list_code+" (ngày "+(priceDate||selected?.valid_from)+")? Không công khai lên Website hay App."))return;
  setBusy(true);
  try{
   const result=await api<{applied:number;list_code:string}>("/bulk-apply","POST",{
    ...prepared,preview_fingerprint:preview.preview_fingerprint,confirm:"XAC_NHAN_GIA_NHAP"});
   invalidate();setSheet(null);setFileName("");
   notify("Đã lưu "+result.applied+" giá nháp vào "+result.list_code+".","success");
  }catch(e){invalidate();notify(e instanceof Error?e.message:"Không lưu được giá.");}
  finally{setBusy(false);}
 }
 async function doExport(template:boolean){
  if(!selected)return;
  setBusy(true);
  try{
   const token=await bearer();
   const qs=new URLSearchParams({list_id:selected.id,format:exportFormat,
    period:priceDate||selected.valid_from,template:template?"1":"0"});
   const response=await fetch("/api/pricing/managed-export?"+qs.toString(),{
    cache:"no-store",credentials:"same-origin",headers:{Authorization:"Bearer "+token}});
   if(!response.ok){
    const payload=await response.json().catch(()=>({})) as Envelope<never>;
    throw Error(payload.error?.code==="unsafe_csv_sku"?
     "Mã sản phẩm có ký tự mà CSV có thể hiểu là công thức. Hãy chọn định dạng Excel (.xlsx).":
     "Không tải được file của bảng giá "+selected.list_code+".");
   }
   const url=URL.createObjectURL(await response.blob());
   const a=document.createElement("a");a.href=url;
   a.download="Futurebook_"+selected.list_code+"_"+(priceDate||selected.valid_from)+
    (template?"_MAU_NHAP_GIA":"_BANG_GIA")+"."+exportFormat;
   document.body.append(a);a.click();a.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),1500);
  }catch(e){notify(e instanceof Error?e.message:"Không tải được file.");}
  finally{setBusy(false);}
 }
 return <section className="fb-managed-import" aria-label="Nhập cập nhật giá theo bảng giá">
  <AdminToast message={toast?.message||""} variant={toast?.variant||"info"} onClose={()=>setToast(null)}/>
  <div className="fb-managed-import-header">
   <div><h2>Nhập / cập nhật giá</h2>
    <p>Chọn bảng giá đã tạo, nhập file chỉ gồm Mã công ty và Giá mới.</p></div>
   {onGoLists&&<button type="button" className="import-btn import-secondary"
    onClick={onGoLists} disabled={busy}>Quản lý bảng giá</button>}
  </div>
  {loading?<p>Đang tải bảng giá…</p>:!lists.length?
   <div className="fb-managed-import-empty">
    <strong>Chưa có bảng giá</strong>
    <p>Tạo bảng giá trước, sau đó quay lại đây để nhập giá.</p>
    <button type="button" className="import-btn import-primary" onClick={onGoLists}>
     Tạo bảng giá</button>
   </div>:
  <>
   <div className="fb-managed-import-primary">
    <label>Nhập giá vào bảng giá
     <select value={chosenId} disabled={busy} onChange={e=>{
      invalidate();setChosenId(e.target.value);
      setPriceDate(lists.find(item=>item.id===e.target.value)?.valid_from||"");
     }}>
      {lists.map(item=><option key={item.id} value={item.id}>
       {item.list_code} — {item.list_name}
       {item.approval_state==="draft"?" (Nháp)":item.approval_state==="approved"?" (Đã duyệt)":" (Đã ngừng)"}
      </option>)}
     </select>
    </label>
    <label>Ngày áp dụng giá
     <input type="date" value={priceDate||selected?.valid_from||""}
      disabled={busy||!selected} onChange={e=>{invalidate();setPriceDate(e.target.value);}}/>
    </label>
    <label>Chọn file Excel hoặc CSV
     <input ref={fileInput} type="file" accept=".xlsx,.csv" disabled={busy||
      selected?.approval_state!=="draft"} onChange={e=>{
       const file=e.target.files?.[0];e.target.value="";
       if(file)void selectFile(file);
      }}/>
    </label>
   </div>
   {selected&&<p className="fb-managed-import-scope">
    <strong>Phạm vi sử dụng:</strong> {selected.channel_codes.length?
     selected.channel_codes.map(code=>channels[code]||code).join(", "):
     "Chỉ quản lý nội bộ"} · {selected.approval_state==="draft"?"Bảng giá nháp":
      selected.approval_state==="approved"?"Bảng giá đã duyệt":"Bảng giá ngừng áp dụng"}
   </p>}
   <small className="fb-managed-import-note">
    File xuất và dữ liệu nhập chỉ thuộc kỳ giá bắt đầu từ ngày đã chọn phía trên.
    Đổi ngày khi cập nhật một kỳ giá khác.
   </small>
   <div className="fb-managed-import-export">
    <label>Định dạng tải về
     <select value={exportFormat} disabled={busy}
      onChange={e=>setExportFormat(e.target.value as "xlsx"|"csv")}>
      <option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV (.csv)</option>
     </select>
    </label>
    <button type="button" className="import-btn import-secondary" disabled={busy||!selected}
     onClick={()=>void doExport(true)}>Tải file mẫu</button>
    <button type="button" className="import-btn import-secondary" disabled={busy||!selected}
     onClick={()=>void doExport(false)}>Xuất giá bảng này</button>
   </div>
   {exportFormat==="csv"&&<small className="fb-managed-import-note">
    Khi mở CSV bằng Excel, cần đặt cột Mã công ty là Text để không mất số 0 đầu.</small>}
   {selected?.approval_state!=="draft"&&
    <p className="fb-managed-import-note">Bảng giá đã duyệt hoặc ngừng áp dụng không nhận giá mới.
     Hãy tạo bảng giá nháp để cập nhật.</p>}
   {sheet&&<>
    <div className="fb-managed-import-file">
     <strong>{fileName}</strong><span>{sheet.total_rows} dòng · {sheet.sheet_name||"CSV"}</span>
    </div>
    {(skuCol<0||priceCol<0)&&<div className="fb-managed-import-primary">
     <label>Cột mã công ty
      <select value={skuCol} disabled={busy} onChange={e=>{invalidate();setSkuCol(Number(e.target.value));}}>
       <option value={-1}>Chọn cột</option>
       {sheet.columns.map(c=><option key={c.index} value={c.index}>{c.header}</option>)}
      </select>
     </label>
     <label>Cột giá mới
      <select value={priceCol} disabled={busy} onChange={e=>{invalidate();setPriceCol(Number(e.target.value));}}>
       <option value={-1}>Chọn cột</option>
       {sheet.columns.map(c=><option key={c.index} value={c.index}>{c.header}</option>)}
      </select>
     </label>
    </div>}
    <div className="fb-managed-import-options">
     <label>VAT của giá nhập
      <select value={vat} disabled={busy} onChange={e=>{invalidate();setVat(e.target.value as ""|"yes"|"no");}}>
       <option value="">Giữ VAT đã có (nếu có)</option>
       <option value="yes">Giá đã gồm VAT</option>
       <option value="no">Giá chưa gồm VAT</option>
      </select>
     </label>
     <small>SKU chưa có VAT phải được xác nhận trước khi lưu. Hệ thống tự tra tên từ mã công ty.</small>
    </div>
    <div className="fb-managed-import-actions">
     <button type="button" className="import-btn import-primary" disabled={busy||
      selected?.approval_state!=="draft"||skuCol<0||priceCol<0||skuCol===priceCol}
      onClick={()=>void doPreview()}>{busy?"Đang xử lý…":"Xem trước giá cũ → mới"}</button>
    </div>
   </>}
   {preview&&<div className="fb-managed-import-preview">
    <h3>Xem trước — {preview.target.list_code} · Ngày áp dụng: {priceDate||selected?.valid_from}</h3>
    <small className="fb-managed-import-note">Mỗi SKU giữ nguyên ngày kết thúc đã lưu nếu cập nhật đúng kỳ giá.</small>
    <p>{preview.created} thêm mới · {preview.updated} cập nhật · {preview.unchanged} không đổi ·
     {preview.skipped} bỏ qua · {preview.invalid} lỗi</p>
    <div className="fb-managed-import-scroll"><table>
     <thead><tr><th>Mã công ty</th><th>Tên sản phẩm</th><th>Giá cũ</th>
      <th>Giá mới</th><th>Đến ngày</th><th>Kết quả</th></tr></thead>
     <tbody>{preview.changes.slice(0,100).map(row=><tr key={row.line}>
      <td>{row.sku_cong_ty||"—"}</td><td>{row.ten_san_pham||"Không có tên"}</td>
      <td>{money(row.old_amount_vnd)}</td><td>{money(row.amount_vnd||null)}</td>
      <td>{row.valid_until||"Không giới hạn"}</td>
      <td className={row.issue?"fb-managed-import-error":""}>{issueLabel(row)}</td>
     </tr>)}</tbody>
    </table></div>
    {preview.changes.length>100&&<small>Hiển thị 100/{preview.changes.length} dòng.
     Số lượng lỗi được tính trên toàn bộ file.</small>}
    {preview.invalid>0&&<p className="fb-managed-import-error">
     Cần sửa tất cả các dòng lỗi trước khi lưu.</p>}
    <div className="fb-managed-import-actions">
     <button type="button" className="import-btn import-primary" disabled={busy||preview.invalid>0||
      preview.created+preview.updated===0||/TEST|KHONG_AP_DUNG/i.test(fileName)}
      onClick={()=>void doApply()}>Xác nhận lưu giá nháp</button>
    </div>
   </div>}
  </>}
 </section>;
}
