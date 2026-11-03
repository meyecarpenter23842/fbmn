"use client";
import {useCallback,useEffect,useState} from "react";

type PriceKind="source"|"net_internal"|"retail_public"|"dealer_contract";
type PriceEntry={id:string;sku_cong_ty:string;price_kind:PriceKind;customer_id:string|null;
 amount_vnd:string;currency:"VND";vat_included:boolean;vat_rate_bps:number|null;
 source_document:string;effective_from:string;effective_until:string|null;
 approval_state:"draft";revision:number};
type PriceList={entries:PriceEntry[];currency:string;empty:boolean};
type Data<T>={data?:T;error?:{code?:string}};
const KINDS:[PriceKind,string,string][]=[
 ["source","Giá bảng giá","Theo tài liệu gốc của công ty, chưa chắc là giá NET."],
 ["net_internal","Giá NET","Giá NET nội bộ đã xác minh, không tự trừ chiết khấu."],
 ["retail_public","Giá bán lẻ","Giá dành cho người tiêu dùng, chưa công khai."],
 ["dealer_contract","Giá đại lý","Giá riêng cho tài khoản đại lý đã có."]
];
const validUuid=(value:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
const formatVnd=(value:string)=>/^[0-9]+$/.test(value)?
  new Intl.NumberFormat("vi-VN",{maximumFractionDigits:0}).format(Number(value))+" ₫":"—";
async function bearer(){
 const response=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 if(!response.ok)throw new Error("Phiên đăng nhập đã hết hạn.");
 const payload=await response.json() as {token?:string};
 if(!payload.token||!/^[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+$/.test(payload.token))
   throw new Error("Không lấy được xác thực Admin.");
 return payload.token;
}
const emptyForm=()=>({amount:"",source:"",date:"",until:"",vatIncluded:"" as ""|"yes"|"no",
 vatPercent:"",customerId:""});
export default function CataloguePricebookPanel({sku}:{sku:string}){
 const [authorized,setAuthorized]=useState(false);
 const [owner,setOwner]=useState(false);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [entries,setEntries]=useState<PriceEntry[]>([]);
 const [kind,setKind]=useState<PriceKind>("net_internal");
 const [editing,setEditing]=useState<PriceEntry|null>(null);
 const [form,setForm]=useState(emptyForm);
 const set=(key:keyof ReturnType<typeof emptyForm>,value:string)=>
   setForm(prev=>({...prev,[key]:value}));
 const refresh=useCallback(async(signal?:AbortSignal)=>{
  const token=await bearer();
  const headers={Authorization:"Bearer "+token,Accept:"application/json"};
  const [session,prices]=await Promise.all([
   fetch("/api/admin/session",{headers,cache:"no-store",credentials:"same-origin",signal}),
   fetch("/api/pricing/entries?sku="+encodeURIComponent(sku),
     {headers,cache:"no-store",credentials:"same-origin",signal})
  ]);
  if(signal?.aborted)return;
  if(prices.status===403||session.status===403){setAuthorized(false);setEntries([]);return;}
  if(!session.ok||!prices.ok)throw new Error(
    prices.status===401?"Phiên đăng nhập đã hết hạn.":"Không tải được bảng giá riêng tư.");
  const identity=await session.json() as Data<{role?:string}>;
  const payload=await prices.json() as Data<PriceList>;
  if(!payload.data||!Array.isArray(payload.data.entries))
    throw new Error("Dữ liệu giá không hợp lệ.");
  setAuthorized(true);
  setOwner(identity.data?.role==="owner");
  setEntries(payload.data.entries);
 },[sku]);
 useEffect(()=>{
  const controller=new AbortController();
  // The parent keys this component by SKU: each SKU mounts with clean initial
  // state. Avoid synchronous state updates inside an effect.
  // Schedule after the effect callback: React forbids a direct state-changing
  // function call from an effect, even when that function returns a Promise.
  void Promise.resolve().then(()=>{
    if(!controller.signal.aborted)return refresh(controller.signal);
  }).catch(e=>{
    if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Không tải được dữ liệu giá.");
  }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[refresh]);
 const selected=entries.filter(item=>item.price_kind===kind);
 const edit=(item:PriceEntry)=>{
  setKind(item.price_kind);setEditing(item);setError("");setNotice("");
  setForm({amount:item.amount_vnd,source:item.source_document,date:item.effective_from,
   until:item.effective_until||"",vatIncluded:item.vat_included?"yes":"no",
   vatPercent:item.vat_rate_bps===null?"":String(item.vat_rate_bps/100),
   customerId:item.customer_id||""});
 };
 const startNew=()=>{setEditing(null);setForm(emptyForm());setError("");setNotice("");};
 const save=async()=>{
  if(!owner||saving||loading)return;
  const amount=Number(form.amount);
  const percent=Number(form.vatPercent);
  // Viet Nam has a fixed UTC+07 offset; choose the local calendar date at save time.
  // Do not force Owner to enter a date for ordinary price entry.
  const effectiveFrom=editing?.effective_from||form.date||
    new Date(Date.now()+7*60*60*1000).toISOString().slice(0,10);
  if(!/^\d+$/.test(form.amount)||!Number.isSafeInteger(amount)||amount>1000000000000){
    setError("Vui lòng nhập giá bằng số nguyên VND.");return;
  }
  if(form.vatIncluded===""){
    setError("Vui lòng chọn giá đã gồm VAT hay chưa gồm VAT.");return;
  }
  if(!form.source.trim()||form.source.trim().length>300){
    setError("Vui lòng ghi nguồn giá, ví dụ tên bảng giá hoặc mã chứng từ.");return;
  }
  if(form.vatPercent!==""&&
     (!Number.isFinite(percent)||percent<0||percent>100||!Number.isInteger(percent*100))){
    setError("Thuế suất VAT phải từ 0 đến 100%, tối đa hai chữ số thập phân.");return;
  }
  if(kind==="dealer_contract"&&!editing&&!validUuid(form.customerId)){
    setError("Giá đại lý cần đúng ID tài khoản đã có, không được tự suy khách hàng.");return;
  }
  if(form.until&&form.until<effectiveFrom){setError("Ngày kết thúc phải từ ngày hiệu lực trở đi.");return;}
  setSaving(true);setError("");setNotice("");
  try{
   const token=await bearer();
   const payload=editing?{
     id:editing.id,expected_revision:editing.revision,amount_vnd:amount,
     vat_included:form.vatIncluded==="yes",vat_rate_bps:form.vatPercent===""?null:percent*100,
     source_document:form.source.trim(),effective_until:form.until||null,
     confirm:"CAP_NHAT_GIA_NHAP"
   }:{
     sku_cong_ty:sku,price_kind:kind,customer_id:kind==="dealer_contract"?form.customerId:null,
     amount_vnd:amount,currency:"VND",vat_included:form.vatIncluded==="yes",
     vat_rate_bps:form.vatPercent===""?null:percent*100,
     source_document:form.source.trim(),effective_from:effectiveFrom,effective_until:form.until||null,
     confirm:"LUU_GIA_NHAP"
   };
   const response=await fetch("/api/pricing/entries",{
     method:editing?"PATCH":"POST",cache:"no-store",credentials:"same-origin",
     headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json",Accept:"application/json"},
     body:JSON.stringify(payload)
   });
   if(!response.ok)throw new Error(response.status===409?
     (editing?"Giá đã được cập nhật bởi người khác. Hãy tải lại trước khi sửa.":"Đã có giá nháp với ngày áp dụng này. Chọn Sửa giá ở bản nháp bên trên."):
     response.status===403?"Chỉ Owner có quyền lưu giá.":"Không lưu được giá, kiểm tra thông tin và nguồn.");
   await refresh();
   startNew();
   setNotice("Đã lưu giá nháp nội bộ. Chưa được duyệt hoặc công khai.");
  }catch(e){setError(e instanceof Error?e.message:"Không lưu được giá.");}
  finally{setSaving(false);}
 };
 if(!loading&&!authorized&&!error)return null;
 return <section className="catalogue-pricebook" aria-label="Giá sản phẩm nội bộ">
  <div className="catalogue-pricebook-head">
   <div><h4>Giá sản phẩm</h4><small>Giá nội bộ · Chỉ Owner được sửa · Chưa công khai</small></div>
   <button type="button" className="import-btn import-secondary" disabled={saving||loading}
     onClick={()=>{setLoading(true);void refresh().catch(e=>setError(e instanceof Error?e.message:"Không tải được giá.")).finally(()=>setLoading(false));}}>
     Làm mới
   </button>
  </div>
  {loading?<p className="catalogue-pricebook-muted">Đang tải dữ liệu giá…</p>:
   authorized?<div className="catalogue-pricebook-body">
    <p className="catalogue-pricebook-lead">Chọn loại giá cần nhập cho mã <strong>{sku}</strong>. Mỗi loại giá được lưu riêng, không tự tính từ nhau.</p>
    <div className="catalogue-pricebook-kinds" role="tablist" aria-label="Chọn loại giá">
     {KINDS.map(([code,label,description])=><button key={code} type="button"
       role="tab" aria-selected={kind===code} className={kind===code?"active":""}
       onClick={()=>{setKind(code);startNew();}}>
       <strong>{label}</strong>
       <small>{description}</small>
       <span>{entries.filter(e=>e.price_kind===code).length?entries.filter(e=>e.price_kind===code).length+" bản nháp":"Chưa có giá"}</span>
      </button>)}
    </div>
    <div className="catalogue-pricebook-content">
     <div className="catalogue-pricebook-selection">
       <strong>{KINDS.find(k=>k[0]===kind)?.[1]}</strong>
       <small>{kind==="dealer_contract"?"Chỉ dùng cho đại lý đã có tài khoản. Chưa bật giá B2B.":"Bản nháp nội bộ — lưu không đồng nghĩa công khai giá."}</small>
     </div>
     {selected.length===0?<p className="catalogue-pricebook-empty">Chưa có giá cho loại này. Không có giá không có nghĩa là 0 đồng.</p>:
       <div className="catalogue-pricebook-entries">
        {selected.map(entry=><div className="catalogue-pricebook-entry" key={entry.id}>
         <div><strong>{formatVnd(entry.amount_vnd)}</strong>
          <small>Áp dụng từ {entry.effective_from}{entry.effective_until?" đến "+entry.effective_until:""} ·
           {entry.vat_included?" Đã gồm VAT":" Chưa gồm VAT"} · Nháp #{entry.revision}</small>
          <small>Nguồn: {entry.source_document}</small>
          {entry.customer_id&&<small>Đại lý: {entry.customer_id}</small>}
         </div>
         {owner&&<button type="button" className="import-btn import-secondary" onClick={()=>edit(entry)}
           disabled={saving}>Sửa giá</button>}
        </div>)}
       </div>}
     {owner?<div className="catalogue-pricebook-form">
       <div className="catalogue-pricebook-form-title">
         <strong>{editing?"Đang sửa giá nháp":"Nhập giá nhanh"}</strong>
         {editing&&<button type="button" className="import-btn import-secondary" onClick={startNew}>Nhập giá mới</button>}
       </div>
       <div className="catalogue-pricebook-quick-grid">
         <label className="catalogue-pricebook-amount">Số tiền (VND) <span aria-hidden="true">*</span>
           <input type="text" inputMode="numeric" placeholder="Ví dụ: 11200" autoComplete="off"
             value={form.amount} onChange={e=>set("amount",e.target.value.replace(/[^0-9]/g,""))}/>
         </label>
         <fieldset className="catalogue-pricebook-vat">
           <legend>Giá này đã gồm VAT chưa? <span aria-hidden="true">*</span></legend>
           <div className="catalogue-pricebook-vat-options">
             <button type="button" aria-pressed={form.vatIncluded==="yes"} className={form.vatIncluded==="yes"?"active":""}
               onClick={()=>set("vatIncluded","yes")}>Đã gồm VAT</button>
             <button type="button" aria-pressed={form.vatIncluded==="no"} className={form.vatIncluded==="no"?"active":""}
               onClick={()=>set("vatIncluded","no")}>Chưa gồm VAT</button>
           </div>
         </fieldset>
         <label className="catalogue-pricebook-source">Nguồn giá <span aria-hidden="true">*</span>
           <input value={form.source} maxLength={300} onChange={e=>set("source",e.target.value)}
             placeholder="Ví dụ: BG NET VPP 05.10.2026"/>
           <small>Ghi tài liệu xác nhận số tiền này, không tự lấy từ loại giá khác.</small>
         </label>
         {kind==="dealer_contract"&&<label className="catalogue-pricebook-dealer">
           ID tài khoản đại lý <span aria-hidden="true">*</span>
           <input value={form.customerId} disabled={!!editing} onChange={e=>set("customerId",e.target.value)}
             placeholder="ID khách hàng đã tồn tại"/>
           <small>Giá đại lý chỉ tạo được khi có ID tài khoản hợp lệ.</small>
         </label>}
       </div>
       <details className="catalogue-pricebook-advanced">
         <summary>Tùy chọn nâng cao: ngày áp dụng, thuế suất VAT</summary>
         <div className="catalogue-pricebook-form-grid">
           <label>Áp dụng từ
             <input type="date" value={form.date} disabled={!!editing} onChange={e=>set("date",e.target.value)}/>
             <small>{editing?"Ngày áp dụng đã cố định ở bản giá này.":"Để trống sẽ tự lấy ngày lưu theo giờ Việt Nam."}</small>
           </label>
           <label>Đến ngày (nếu có)
             <input type="date" value={form.until} onChange={e=>set("until",e.target.value)}/>
           </label>
           <label>Thuế suất VAT (%)
             <input type="number" min="0" max="100" step="0.01" value={form.vatPercent}
               onChange={e=>set("vatPercent",e.target.value)} placeholder="Chưa xác minh thì để trống"/>
           </label>
         </div>
       </details>
       <div className="catalogue-pricebook-actions">
         <button type="button" className="import-btn import-primary" disabled={saving}
           onClick={()=>void save()}>{saving?"Đang lưu…":"Lưu giá"}</button>
         <span>Chỉ lưu bản nháp nội bộ, không hiển thị trên website hoặc app.</span>
       </div>
       {error&&<p className="catalogue-pricebook-inline-error" role="alert">{error}</p>}
       {notice&&<p className="catalogue-pricebook-inline-success" role="status">{notice}</p>}
      </div>:
      <p className="catalogue-pricebook-muted">Tài khoản này chỉ được xem giá. Owner mới có thể sửa.</p>}
    </div>
   </div>:null}
  {!owner&&error&&<p className="catalogue-pricebook-inline-error" role="alert">{error}</p>}
 </section>;
}
