"use client";
import {useCallback,useEffect,useState} from "react";

type PriceKind="source"|"net_internal"|"retail_public"|"dealer_contract";
type PriceEntry={id:string;sku_cong_ty:string;price_kind:PriceKind;customer_id:string|null;
 amount_vnd:string;currency:"VND";vat_included:boolean;vat_rate_bps:number|null;
 source_document:string;effective_from:string;effective_until:string|null;
 approval_state:"draft";revision:number};
type PriceList={entries:PriceEntry[];currency:string;empty:boolean};
type Data<T>={data?:T;error?:{code?:string}};
const KINDS:[PriceKind,string][]=[
 ["source","Giá nguồn / bảng giá"],
 ["net_internal","Giá NET nội bộ"],
 ["retail_public","Giá bán lẻ (chưa công bố)"],
 ["dealer_contract","Giá theo đại lý"]
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
 const [kind,setKind]=useState<PriceKind>("source");
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
  if(!/^\d+$/.test(form.amount)||!Number.isSafeInteger(amount)||amount>1000000000000||
      !form.source.trim()||form.source.trim().length>300||!form.date||
      form.vatIncluded===""||form.vatPercent!==""&&
       (!Number.isFinite(percent)||percent<0||percent>100||
        !Number.isInteger(percent*100))){
    setError("Cần nhập số tiền VND, nguồn giá, ngày hiệu lực và tình trạng VAT rõ ràng.");return;
  }
  if(kind==="dealer_contract"&&!editing&&!validUuid(form.customerId)){
    setError("Giá đại lý cần đúng ID tài khoản đã có, không được tự suy khách hàng.");return;
  }
  if(form.until&&form.until<form.date){setError("Ngày kết thúc phải từ ngày hiệu lực trở đi.");return;}
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
     source_document:form.source.trim(),effective_from:form.date,effective_until:form.until||null,
     confirm:"LUU_GIA_NHAP"
   };
   const response=await fetch("/api/pricing/entries",{
     method:editing?"PATCH":"POST",cache:"no-store",credentials:"same-origin",
     headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json",Accept:"application/json"},
     body:JSON.stringify(payload)
   });
   if(!response.ok)throw new Error(response.status===409?
     "Giá đã có hoặc có người cập nhật. Tải lại trước khi sửa.":
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
   <div><h4>Giá sản phẩm</h4><small>Chỉ nội bộ · VND · Không tự công bố</small></div>
   <button type="button" className="import-btn import-secondary" disabled={saving||loading}
      onClick={()=>{setLoading(true);void refresh().catch(e=>setError(e instanceof Error?e.message:"Không tải được giá.")).finally(()=>setLoading(false));}}>
      Làm mới giá
   </button>
  </div>
  {loading?<p className="catalogue-pricebook-muted">Đang kiểm tra quyền và tải bảng giá…</p>:
   authorized?<div className="catalogue-pricebook-body">
    <div className="catalogue-pricebook-kinds" role="tablist" aria-label="Phân loại bảng giá">
     {KINDS.map(([code,label])=><button key={code} type="button"
       role="tab" aria-selected={kind===code} className={kind===code?"active":""}
       onClick={()=>{setKind(code);startNew();}}>
       {label}
       <small>{entries.filter(e=>e.price_kind===code).length?entries.filter(e=>e.price_kind===code).length+" bản nháp":"Chưa thiết lập"}</small>
      </button>)}
    </div>
    <div className="catalogue-pricebook-content">
     <div className="catalogue-pricebook-notice">
       <strong>{KINDS.find(k=>k[0]===kind)?.[1]}</strong>
       <span>{kind==="retail_public"?"Giá lẻ chưa công khai, không suy từ giá NET.":
         kind==="dealer_contract"?"Giá theo từng tài khoản. Chưa mở quyền B2B.":"Giá nguồn và NET được lưu độc lập, không tự tính từ nhau."}</span>
     </div>
     {selected.length===0?<p className="catalogue-pricebook-empty">Chưa thiết lập. Không đồng nghĩa 0 đồng.</p>:
       <div className="catalogue-pricebook-entries">
        {selected.map(entry=><div className="catalogue-pricebook-entry" key={entry.id}>
         <div><strong>{formatVnd(entry.amount_vnd)}</strong>
          <small>{entry.effective_from}{entry.effective_until?" – "+entry.effective_until:""} ·
           {entry.vat_included?" Đã gồm VAT":" Chưa gồm VAT"} · Nháp #{entry.revision}</small>
          <small>Nguồn: {entry.source_document}</small>
          {entry.customer_id&&<small>Tài khoản: {entry.customer_id}</small>}
         </div>
         {owner&&<button type="button" className="import-btn import-secondary" onClick={()=>edit(entry)}
           disabled={saving}>Sửa nháp</button>}
        </div>)}
       </div>}
     {owner?<div className="catalogue-pricebook-form">
       <div className="catalogue-pricebook-form-title">
         <strong>{editing?"Sửa bản nháp (có kiểm tra phiên bản)":"Thêm giá nháp"}</strong>
         {editing&&<button type="button" className="import-btn import-secondary" onClick={startNew}>Thêm giá mới</button>}
       </div>
       <div className="catalogue-pricebook-form-grid">
        <label>Giá (VND)<input type="text" inputMode="numeric" placeholder="Nhập số tiền, kể cả 0 nếu đúng nguồn"
          value={form.amount} onChange={e=>set("amount",e.target.value.replace(/[^0-9]/g,""))}/></label>
        <label>Tình trạng VAT<select value={form.vatIncluded} onChange={e=>set("vatIncluded",e.target.value)}>
          <option value="">Chọn tình trạng VAT…</option>
          <option value="yes">Đã gồm VAT</option><option value="no">Chưa gồm VAT</option>
        </select></label>
        <label>Thuế suất VAT (%)<input type="number" min="0" max="100" step="0.01" value={form.vatPercent}
          onChange={e=>set("vatPercent",e.target.value)} placeholder="Để trống nếu chưa xác minh"/></label>
        <label>Hiệu lực từ<input type="date" value={form.date}
          disabled={!!editing} onChange={e=>set("date",e.target.value)}/></label>
        <label>Đến ngày<input type="date" value={form.until} onChange={e=>set("until",e.target.value)}/></label>
        {kind==="dealer_contract"&&<label className="catalogue-pricebook-wide">
          ID khách hàng đã xác minh
          <input value={form.customerId} disabled={!!editing} onChange={e=>set("customerId",e.target.value)}
           placeholder="UUID khách hàng; không nhập tên phỏng đoán"/>
        </label>}
        <label className="catalogue-pricebook-wide">Chứng từ / nguồn giá
         <input value={form.source} maxLength={300} onChange={e=>set("source",e.target.value)}
          placeholder="Tên bảng giá, tài liệu hoặc mã chứng từ đã xác minh"/>
        </label>
       </div>
       <button type="button" className="import-btn import-primary" disabled={saving}
         onClick={()=>void save()}>{saving?"Đang lưu…":"Lưu giá nháp (không công khai)"}</button>
      </div>:
      <p className="catalogue-pricebook-muted">Chỉ Owner được tạo hoặc sửa giá nháp.</p>}
    </div>
   </div>:null}
  {error&&<p className="import-error" role="alert">{error}</p>}
  {notice&&<p className="catalogue-workspace-notice" role="status">{notice}</p>}
 </section>;
}
