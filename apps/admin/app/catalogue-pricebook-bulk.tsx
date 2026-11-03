"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import AdminToast from "./admin-toast";
import "./pricebook-bulk.css";

type PriceKind="source"|"net_internal"|"retail_public"|"dealer_contract";
type Field="ignore"|"sku_cong_ty"|"amount_vnd"|"price_kind"|"vat_included"|
 "vat_rate_bps"|"source_document"|"effective_from"|"effective_until"|"customer_id";
type Cell={text:string;kind:"text"|"number"|"blank"};
type Sheet={sheet_name?:string;columns:{index:number;header:string;suggested:string}[];
 rows:{line:number;cells:Cell[]}[];total_rows:number};
type Change={line:number;sku_cong_ty:string;price_kind:PriceKind;amount_vnd:string;
 old_amount_vnd:string|null;status:"new"|"updated"|"unchanged"|"invalid"|"conflict";
 issue:string|null;effective_from:string};
type Preview={changes:Change[];updated:number;created:number;unchanged:number;
 invalid:number;conflicts?:number;preview_fingerprint:string};
type Audit={id:string;created_at:string;actor_subject:string;sku_cong_ty:string;
 action:string;old_amount_vnd:string|null;new_amount_vnd:string|null;
 source_document:string|null;price_kind:PriceKind;batch_id:string|null};
type Batch={id:string;created_at:string;actor_subject:string;source_document:string;
 rows_total:number;created_count:number;updated_count:number;unchanged_count:number};
type Envelope<T>={data?:T;error?:{code?:string}};
const kindOptions:[PriceKind,string][]=[
 ["source","Giá bảng công ty"],["net_internal","Giá NET nội bộ"],
 ["retail_public","Giá bán lẻ"],["dealer_contract","Giá đại lý"]
];
const fields:[Field,string][]=[
 ["ignore","Bỏ qua cột"],["sku_cong_ty","Mã công ty (SKU)"],
 ["amount_vnd","Giá mới (VND)"],["price_kind","Loại giá"],
 ["vat_included","Đã gồm VAT?"],["vat_rate_bps","Thuế suất VAT (%)"],
 ["source_document","Nguồn giá"],["effective_from","Ngày hiệu lực"],
 ["effective_until","Ngày hết hạn"],["customer_id","ID đại lý"]
];
const money=(v:string|null)=>v===null?"Chưa có giá":
 /^\d+$/.test(v)?new Intl.NumberFormat("vi-VN").format(Number(v))+" ₫":v;
async function bearer(){
 const response=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 if(!response.ok)throw Error("Phiên đăng nhập đã hết hạn.");
 const data=await response.json() as {token?:string};
 if(!data.token)throw Error("Không lấy được token Admin.");
 return data.token;
}
async function jsonRequest<T>(url:string,method:"GET"|"POST",data?:unknown):Promise<T>{
 const token=await bearer();
 const response=await fetch(url,{method,cache:"no-store",credentials:"same-origin",
  headers:{Authorization:"Bearer "+token,Accept:"application/json",
   ...(method==="POST"?{"Content-Type":"application/json"}:{})},
  ...(method==="POST"?{body:JSON.stringify(data)}:{})});
 const payload=await response.json() as Envelope<T>;
 if(!response.ok||!payload.data)throw Error(
  response.status===403?"Chỉ Owner được sử dụng công cụ giá Excel.":
  response.status===409?"Dữ liệu giá đã thay đổi hoặc có xung đột. Hãy xem trước lại.":
  response.status===401?"Phiên đăng nhập đã hết hạn.":"Không xử lý được yêu cầu giá.");
 return payload.data;
}
const parseBoolean=(str:string):boolean|string=>{
 const v=str.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replaceAll("đ","d").trim().toLowerCase();
 if(["1","true","yes","co","da gom","da gom vat"].includes(v))return true;
 if(["0","false","no","khong","chua gom","chua gom vat"].includes(v))return false;
 return "invalid";
};
const asBps=(str:string):number=>{
 const n=Number(str);return Number.isFinite(n)&&n>=0&&n<=100&&Math.round(n*100)===n*100?
  Math.round(n*100):-1;
};
export default function CataloguePricebookBulk({onBusyChange}:{onBusyChange?:(busy:boolean)=>void}){
 const invalidation=useRef(0);
 const [sheet,setSheet]=useState<Sheet|null>(null);
 const [mapping,setMapping]=useState<Field[]>([]);
 const [kind,setKind]=useState<PriceKind>("net_internal");
 const [source,setSource]=useState("");
 const [vat,setVat]=useState<""|"yes"|"no">("");
 const [vatPercent,setVatPercent]=useState("");
 const [from,setFrom]=useState("");
 const [until,setUntil]=useState("");
 const [customer,setCustomer]=useState("");
 const [overwriteMeta,setOverwriteMeta]=useState(false);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{onBusyChange?.(busy);},[busy,onBusyChange]);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [prepared,setPrepared]=useState<Record<string,unknown>|null>(null);
 const [requestId,setRequestId]=useState("");
 const [showHistory,setShowHistory]=useState(false);
 const [history,setHistory]=useState<{events:Audit[];batches:Batch[]}|null>(null);
 const [toast,setToast]=useState<{message:string;variant:"success"|"error"|"info"}|null>(null);
 const notify=useCallback((message:string,variant:"success"|"error"|"info"="error")=>
  setToast({message,variant}),[]);
 const invalidate=()=>{invalidation.current+=1;setPreview(null);setPrepared(null);setRequestId("");};
 const setMapped=(index:number,value:Field)=>{
  setMapping(before=>before.map((v,i)=>i===index?value:
   value!=="ignore"&&v===value?"ignore":v));
  invalidate();
 };
 const readFile=async(file:File)=>{
  if(!/\.(xlsx|csv)$/i.test(file.name))throw Error("Chỉ hỗ trợ XLSX và CSV.");
  const token=await bearer();
  const data=new FormData();data.append("file",file);
  const resp=await fetch("/api/pricing/sheet",{method:"POST",body:data,
   credentials:"same-origin",headers:{Authorization:"Bearer "+token},cache:"no-store"});
  const payload=await resp.json() as Envelope<Sheet>;
  if(!resp.ok||!payload.data){
   const details:Record<string,string>={
    multiple_price_sheets:"File có nhiều sheet chứa SKU và giá. Hãy giữ đúng một sheet dữ liệu giá.",
    missing_price_sheet:"Không tìm thấy sheet có cả cột Mã công ty và Giá mới.",
    missing_columns:"Không xác định được hàng tiêu đề của file.",
    too_many_rows:"File vượt giới hạn 1.000 dòng giá.",
    too_many_columns:"File vượt giới hạn 30 cột.",
    xlsx_too_large:"File Excel quá lớn để kiểm tra an toàn.",
    formula_not_allowed:"File có ô công thức; hãy dán giá trị trước khi nhập."
   };
   throw Error(resp.status===403?"Chỉ Owner được đọc file bảng giá.":
    details[payload.error?.code||""]||"Không đọc được file Excel/CSV. Kiểm tra định dạng và công thức.");
  }
  if(payload.data.total_rows>1000)throw Error("Tối đa 1.000 dòng trong một lô.");
  setSheet(payload.data);
  const used=new Set<string>();
  setMapping(payload.data.columns.map(c=>{
   const v=c.suggested as Field;
   if(v==="ignore"||used.has(v))return "ignore";
   used.add(v);return v;
  }));
  invalidate();
 };
 const buildPayload=()=>{
  if(!sheet)throw Error("Chưa chọn file.");
  if(mapping.filter(v=>v==="sku_cong_ty").length!==1||
   mapping.filter(v=>v==="amount_vnd").length!==1)
   throw Error("Phải ánh xạ một cột Mã công ty và một cột Giá mới.");
  const has=(key:Field)=>mapping.includes(key);
  if(!has("vat_included")&&!vat)throw Error("Chưa chọn trạng thái VAT.");
  if(!has("source_document")&&!source.trim())throw Error("Chưa nhập tên chứng từ/nguồn giá.");
  if(kind==="dealer_contract"&&!has("customer_id")&&!customer.trim())
   throw Error("Giá đại lý cần ID khách hàng đã tồn tại.");
  if(vatPercent!==""&&asBps(vatPercent)<0)throw Error("Thuế suất VAT chưa hợp lệ.");
  const at=(cells:Cell[],key:Field)=>{
   const index=mapping.indexOf(key);return index<0?null:cells[index]||{text:"",kind:"blank"};
  };
  const rows=sheet.rows.map(r=>{
   const company=at(r.cells,"sku_cong_ty");
   const amount=at(r.cells,"amount_vnd");
   const row:Record<string,unknown>={
    line:r.line,sku_cong_ty:company?.kind==="number"?Number(company.text):company?.text??"",
    amount_vnd:amount?.text??""
   };
   const type=at(r.cells,"price_kind")?.text;
   const v=at(r.cells,"vat_included")?.text;
   const rate=at(r.cells,"vat_rate_bps")?.text;
   const doc=at(r.cells,"source_document")?.text;
   const start=at(r.cells,"effective_from")?.text;
   const end=at(r.cells,"effective_until")?.text;
   const client=at(r.cells,"customer_id")?.text;
   if(mapping.includes("price_kind"))row.price_kind=type||"";
   if(mapping.includes("vat_included"))row.vat_included=v?parseBoolean(v):null;
   if(mapping.includes("vat_rate_bps"))row.vat_rate_bps=rate?asBps(rate):null;
   if(mapping.includes("source_document"))row.source_document=doc||"";
   if(mapping.includes("effective_from"))row.effective_from=start||"";
   if(mapping.includes("effective_until"))row.effective_until=end||null;
   if(mapping.includes("customer_id"))row.customer_id=client||null;
   // Only an unmapped column is skipped. A mapped blank clears an optional
   // field (VAT rate / expiry), or fails validation for required fields.
   row.preserve_existing_fields=overwriteMeta?[]:(["vat_included","vat_rate_bps","source_document","effective_until"] as Field[])
    .filter(key=>!mapping.includes(key));
   return row;
  });
  return {price_kind:kind,customer_id:customer||null,
   vat_included:vat==="yes"?true:vat==="no"?false:null,
   vat_rate_bps:vatPercent===""?null:asBps(vatPercent),
   source_document:source.trim(),effective_from:from||null,
   effective_until:until||null,rows};
 };
 const doPreview=async()=>{
  setBusy(true);invalidate();
  const generation=invalidation.current;
  try{
   const payload=buildPayload();
   const result=await jsonRequest<Preview>("/api/pricing/bulk/preview","POST",payload);
   // Mapping, file or metadata changed while the request was running:
   // never re-enable Apply for the obsolete settings snapshot.
   if(invalidation.current!==generation)return;
   setPreview(result);setPrepared(payload);setRequestId(crypto.randomUUID());
   if(result.invalid)notify("Có "+result.invalid+" dòng không hợp lệ. Xem lỗi trong bảng.","info");
  }catch(e){if(invalidation.current===generation)
    notify(e instanceof Error?e.message:"Không thể xem trước.");}
  finally{setBusy(false);}
 };
 const doApply=async()=>{
  if(!preview||!prepared||preview.invalid||!requestId)return;
  if(!window.confirm("Xác nhận lưu giá nháp cho "+(preview.created+preview.updated)+
   " mục thay đổi? File này không tự công khai giá."))return;
  setBusy(true);
  try{
   const result=await jsonRequest<{created_count:number;updated_count:number;unchanged_count:number}>(
    "/api/pricing/bulk/apply","POST",{...prepared,preview_fingerprint:preview.preview_fingerprint,
     request_id:requestId,confirm:"XAC_NHAN_GIA_NHAP"});
   notify("Đã lưu "+(result.created_count+result.updated_count)+" giá nháp. Không công khai NET.","success");
   invalidate();setSheet(null);setMapping([]);
   if(showHistory)void loadHistory();
  }catch(e){notify(e instanceof Error?e.message:"Không lưu được giá.");}
  finally{setBusy(false);}
 };
 const doExport=async()=>{
  setBusy(true);
  try{
   if(kind==="dealer_contract"&&!customer.trim())throw Error("Chọn ID đại lý trước khi xuất.");
   const params=new URLSearchParams({kind});
   if(kind==="dealer_contract")params.set("customer_id",customer.trim());
   const token=await bearer();
   const result=await fetch("/api/pricing/export?"+params.toString(),{
    headers:{Authorization:"Bearer "+token},credentials:"same-origin",cache:"no-store"});
   if(!result.ok)throw Error(result.status===403?
    "Chỉ Owner được xuất bảng giá riêng tư.":"Không xuất được bảng giá.");
   const blob=await result.blob();
   const link=document.createElement("a");
   const url=URL.createObjectURL(blob);link.href=url;
   link.download="Futurebook_GIA_NOI_BO_"+kind+".xlsx";
   document.body.append(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),1000);
   notify("Đã tạo file Excel giá nội bộ. Lưu trữ và chia sẻ đúng quyền.","success");
  }catch(e){notify(e instanceof Error?e.message:"Không xuất được Excel.");}
  finally{setBusy(false);}
 };
 const loadHistory=async()=>{
  setBusy(true);
  try{
   const result=await jsonRequest<{events:Audit[];batches:Batch[]}>(
    "/api/pricing/bulk/history?limit=50","GET");
   setHistory(result);setShowHistory(true);
  }catch(e){notify(e instanceof Error?e.message:"Không đọc được lịch sử.");}
  finally{setBusy(false);}
 };
 return <section className="fb-price-bulk" aria-label="Excel giá hàng loạt">
  {toast&&<AdminToast message={toast.message} variant={toast.variant} onClose={()=>setToast(null)}/>}
  <div className="fb-price-bulk-heading">
   <div><strong>Excel giá hàng loạt</strong>
    <small>Xuất, ánh xạ cột, xem giá cũ → mới rồi xác nhận. Chỉ lưu nội bộ.</small></div>
   <div className="fb-price-bulk-tools">
    <button type="button" className="import-btn import-secondary"
     onClick={()=>void loadHistory()} disabled={busy}>Lịch sử</button>
    <button type="button" className="import-btn import-secondary"
     onClick={()=>void doExport()} disabled={busy}>Xuất XLSX</button>
   </div>
  </div>
  <div className="fb-price-bulk-form">
   <div className="fb-price-bulk-settings">
    <label>Loại giá
     <select value={kind} onChange={e=>{setKind(e.target.value as PriceKind);invalidate();}}>
      {kindOptions.map(([id,label])=><option key={id} value={id}>{label}</option>)}
     </select></label>
    <label>VAT của giá trong file
     <select value={vat} onChange={e=>{setVat(e.target.value as ""|"yes"|"no");invalidate();}}>
      <option value="">Chưa chọn</option><option value="yes">Đã gồm VAT</option>
      <option value="no">Chưa gồm VAT</option>
     </select></label>
    <label className="fb-price-bulk-doc">Nguồn giá / chứng từ
     <input value={source} maxLength={300} onChange={e=>{setSource(e.target.value);invalidate();}}
      placeholder="Tên bảng giá/chứng từ đã được xác minh"/></label>
    <label>Ngày hiệu lực
     <input type="date" value={from} onChange={e=>{setFrom(e.target.value);invalidate();}}/>
     <small>Để trống: ngày lưu theo giờ Việt Nam</small></label>
    <label>Ngày hết hạn
     <input type="date" value={until} onChange={e=>{setUntil(e.target.value);invalidate();}}/></label>
    <label>VAT (% nếu xác minh)
     <input type="number" min="0" max="100" step="0.01" value={vatPercent}
      onChange={e=>{setVatPercent(e.target.value);invalidate();}} placeholder="Để trống nếu chưa biết"/></label>
    {kind==="dealer_contract"&&<label className="fb-price-bulk-doc">ID đại lý
     <input value={customer} onChange={e=>{setCustomer(e.target.value);invalidate();}}
      placeholder="UUID tài khoản đại lý đã được cấp"/></label>}
   </div>
   <label className="fb-price-bulk-keep-meta"><input type="checkbox" checked={overwriteMeta}
    onChange={e=>{setOverwriteMeta(e.target.checked);invalidate();}}/>
    Áp dụng VAT, nguồn và ngày hết hạn chung cho cả giá nháp đã có (nếu không tích chọn, giữ nguyên giá trị cũ khi bỏ qua cột).</label>
   <label className="fb-price-bulk-file">Chọn file giá XLSX hoặc CSV (tối đa 1.000 dòng)
    <input type="file" accept=".xlsx,.csv" disabled={busy} onChange={e=>{
     const file=e.target.files?.[0];if(!file)return;
     e.currentTarget.value="";
     setSheet(null);setMapping([]);invalidate();
     setBusy(true);void readFile(file).catch(err=>notify(err instanceof Error?
      err.message:"Không đọc được file.")).finally(()=>setBusy(false));
    }}/></label>
   <small className="fb-price-bulk-hint">Mã công ty phải là text trong Excel (0114 khác 114).
    Ô giá trống = bỏ qua, không xóa giá cũ. Không suy NET từ giá nguồn.</small>
   {sheet&&<div className="fb-price-bulk-map">
    <strong>Ánh xạ cột · {sheet.total_rows} dòng{sheet.sheet_name?" · sheet "+sheet.sheet_name:""}</strong>
    <div className="fb-price-bulk-scroll"><table><thead><tr>
     {sheet.columns.map((c,i)=><th key={i}><select aria-label={"Cột "+(i+1)+": "+c.header}
      value={mapping[i]||"ignore"} disabled={busy}
      onChange={e=>setMapped(i,e.target.value as Field)}>
      {fields.map(([id,label])=><option key={id} value={id}>{label}</option>)}
     </select></th>)}
    </tr></thead><tbody>{sheet.rows.slice(0,3).map(r=><tr key={r.line}>
     {r.cells.map((cell,i)=><td key={i}>{cell.text||"—"}</td>)}
    </tr>)}</tbody></table></div>
    <small>Chọn trực tiếp trường cho mỗi cột bằng dropdown. “Bỏ qua” không thay đổi trường đó.</small>
    <div className="fb-price-bulk-actions">
     <button type="button" className="import-btn import-secondary" disabled={busy}
      onClick={()=>{setSheet(null);invalidate();}}>Bỏ file</button>
     <button type="button" className="import-btn import-primary" disabled={busy}
      onClick={()=>void doPreview()}>{busy?"Đang kiểm tra…":"Xem trước giá cũ / mới"}</button>
    </div>
   </div>}
   {preview&&<div className="fb-price-bulk-preview">
    <strong>Đối chiếu trước khi lưu</strong>
    <div className="fb-price-bulk-summary">
     <span>Mới: <b>{preview.created}</b></span>
     <span>Cập nhật: <b>{preview.updated}</b></span>
     <span>Không đổi: <b>{preview.unchanged}</b></span>
     <span>Lỗi/xung đột: <b>{preview.invalid}</b></span>
    </div>
    <div className="fb-price-bulk-scroll"><table><thead><tr>
     <th>Dòng</th><th>Mã công ty</th><th>Loại giá</th><th>Giá cũ</th>
     <th>Giá mới</th><th>Chênh lệch</th><th>Trạng thái / lỗi</th>
    </tr></thead><tbody>
     {preview.changes.slice(0,100).map((r,i)=>{
      const delta=r.old_amount_vnd!==null&&/^\d+$/.test(r.amount_vnd)?
       String(BigInt(r.amount_vnd)-BigInt(r.old_amount_vnd)):null;
      return <tr key={i}>
       <td>{r.line}</td><td><strong>{r.sku_cong_ty}</strong></td>
       <td>{kindOptions.find(o=>o[0]===r.price_kind)?.[1]||r.price_kind}</td>
       <td>{money(r.old_amount_vnd)}</td><td>{r.status==="unchanged"&&r.issue==="empty_skip"?"Bỏ qua":money(r.amount_vnd)}</td>
       <td>{delta===null?"—":(BigInt(delta)>BigInt(0)?"+":"")+money(delta)}</td>
       <td><span className={"fb-price-bulk-status fb-price-bulk-status--"+r.status}>
        {r.issue||({new:"Mới",updated:"Cập nhật",unchanged:"Không đổi",
          invalid:"Lỗi",conflict:"Xung đột"}[r.status])}
       </span></td></tr>;
     })}
    </tbody></table></div>
    {preview.changes.length>100&&<small>Hiển thị 100/{preview.changes.length} dòng đầu;
     các dòng còn lại đã được kiểm tra trong tổng kết.</small>}
    <div className="fb-price-bulk-actions">
     <button type="button" className="import-btn import-secondary" onClick={()=>invalidate()} disabled={busy}>
      Sửa file / xem lại</button>
     <button type="button" className="import-btn import-primary"
      disabled={busy||preview.invalid>0||preview.created+preview.updated===0}
      onClick={()=>void doApply()}>{busy?"Đang lưu…":"Xác nhận lưu giá nháp"}</button>
    </div>
   </div>}
  </div>
  {showHistory&&history&&<div className="fb-price-bulk-history">
   <div className="fb-price-bulk-history-head"><strong>Lịch sử thay đổi giá</strong>
    <button className="import-btn import-secondary" type="button"
     onClick={()=>setShowHistory(false)}>Đóng</button></div>
   <small>Nhật ký chỉ đọc, không thể sửa hoặc xóa.</small>
   {history.batches.length>0&&<div className="fb-price-bulk-batch-list">
    {history.batches.slice(0,10).map(b=><p key={b.id}>
     {new Date(b.created_at).toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"})} ·
     {b.created_count} mới / {b.updated_count} cập nhật / {b.unchanged_count} bỏ qua
     · {b.source_document}</p>)}
   </div>}
   <div className="fb-price-bulk-scroll"><table><thead><tr>
    <th>Thời gian</th><th>Người sửa</th><th>SKU</th><th>Loại</th>
    <th>Giá cũ</th><th>Giá mới</th><th>Hành động</th><th>Nguồn</th>
   </tr></thead><tbody>{history.events.map(event=><tr key={event.id}>
    <td>{new Date(event.created_at).toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"})}</td>
    <td>{event.actor_subject}</td><td>{event.sku_cong_ty}</td>
    <td>{kindOptions.find(o=>o[0]===event.price_kind)?.[1]}</td>
    <td>{money(event.old_amount_vnd)}</td><td>{money(event.new_amount_vnd)}</td>
    <td>{event.action}</td><td>{event.source_document||"Trước khi có Lô 02"}</td>
   </tr>)}</tbody></table></div>
  </div>}
 </section>;
}
