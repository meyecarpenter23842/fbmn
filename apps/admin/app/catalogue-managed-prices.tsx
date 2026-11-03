"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import AdminToast from "./admin-toast";
import "./managed-price-lists.css";

type Audience="internal"|"consumer"|"dealer";
type State="draft"|"approved"|"inactive";
type List={
 id:string;list_code:string;list_name:string;note:string;audience:Audience;
 channel_codes:string[];scope_customer_type:string|null;scope_customer_id:string|null;
 customer_code:string|null;customer_name:string|null;priority:number;valid_from:string;
 valid_until:string|null;revision:number;approval_state:State;price_count:number;
};
type Item={
 id:string;list_id:string;sku_cong_ty:string;ten_san_pham:string|null;ten_goc_xnt:string|null;
 amount_vnd:string;vat_included:boolean;source_document:string;valid_from:string;valid_until:string|null;
 approval_state:"draft"|"approved";revision:number;
};
type Customer={id:string;customer_code:string;display_name:string;customer_type:string;status:string};
type Envelope<T>={data?:T;error?:{code?:string}};
type ListForm={
 list_code:string;list_name:string;note:string;audience:Audience;channel_codes:string[];
 scope_customer_type:string;scope_customer_id:string;priority:string;valid_from:string;valid_until:string;
};
type PriceForm={sku_cong_ty:string;amount_vnd:string;vat_included:""|"yes"|"no";
 source_document:string;valid_from:string;valid_until:string;id:string;revision:number};
const CHANNELS:[string,string][]=[
 ["public_web","Website"],["dealer_app","App đại lý"],["consumer_app","App người tiêu dùng"]
];
const CATEGORIES:[string,string][]=[
 ["","Tất cả nhóm khách"],["distributor","Nhà phân phối"],["dealer","Đại lý"],
 ["bookstore","Nhà sách"],["school","Trường học"],["enterprise","Doanh nghiệp"],
 ["factory","Nhà máy"],["other","Khác"]
];
const INITIAL_LIST:ListForm={list_code:"",list_name:"",note:"",audience:"internal",channel_codes:[],
 scope_customer_type:"",scope_customer_id:"",priority:"100",valid_from:"",valid_until:""};
const INITIAL_PRICE:PriceForm={sku_cong_ty:"",amount_vnd:"",vat_included:"",source_document:"",
 valid_from:"",valid_until:"",id:"",revision:0};
const fmt=(v:string|null)=>v===null?"Chưa có":new Intl.NumberFormat("vi-VN").format(BigInt(v))+" ₫";
function vnDay(){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Ho_Chi_Minh",
  year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const pick=(key:string)=>parts.find(p=>p.type===key)?.value||"";
 return pick("year")+"-"+pick("month")+"-"+pick("day");
}
const labels:Record<string,string>={
 duplicate_price_list_code:"Mã bảng giá đã có. Hãy dùng mã khác.",
 invalid_price_list:"Kiểm tra mã, tên, ngày và kênh áp dụng.",
 invalid_channel_scope:"Kênh chưa phù hợp phạm vi người mua.",
 invalid_customer_scope:"Chọn một nhóm khách hoặc một khách cụ thể.",
 invalid_price_list_update:"Bảng giá chưa hợp lệ hoặc thiếu phiên bản.",
 customer_not_found:"Khách đã chọn không còn hoạt động.",
 revision_conflict:"Dữ liệu đã thay đổi. Tải lại rồi kiểm tra.",
 approved_list_locked:"Bảng giá đã duyệt, không thể sửa nội dung đã xác nhận.",
 approved_price_required:"Cần duyệt ít nhất một giá SKU trước khi duyệt bảng.",
 list_not_editable:"Chỉ sửa mức giá khi bảng còn là bản nháp.",
 sku_not_found:"Mã công ty không tồn tại.",
 approved_price_locked:"Mức giá đã duyệt không được ghi đè.",
 approved_period_overlap:"Mức giá đã duyệt bị trùng kỳ hiệu lực.",
 price_write_failed:"Không lưu được giá. Kiểm tra quyền và dữ liệu.",
 price_list_write_failed:"Không lưu được bảng giá.",
 pricing_unavailable:"Chưa kết nối được hệ thống bảng giá."
};
async function auth(){
 const response=await fetch("/api/auth/token",{cache:"no-store",credentials:"same-origin"});
 if(!response.ok)throw Error("Hết phiên đăng nhập Admin.");
 const result=await response.json() as {token?:string};
 if(!result.token)throw Error("Chưa xác thực Owner.");
 return result.token;
}
async function query<T>(path:string,method:"GET"|"POST"="GET",data?:unknown):Promise<T>{
 const token=await auth();
 const response=await fetch("/api/pricing/managed"+path,{
  method,cache:"no-store",credentials:"same-origin",
  headers:{Authorization:"Bearer "+token,Accept:"application/json",
   ...(method==="POST"?{"Content-Type":"application/json"}:{})},
  ...(method==="POST"?{body:JSON.stringify(data)}:{})
 });
 const payload=await response.json().catch(()=>({})) as Envelope<T>;
 if(!response.ok||!payload.data){
  const code=payload.error?.code||"pricing_unavailable";
  throw Error(response.status===403?"Chỉ Owner được quản lý bảng giá.":
   response.status===401?"Phiên đăng nhập đã hết hạn.":labels[code]||"Không xử lý được yêu cầu.");
 }
 return payload.data;
}
export default function CatalogueManagedPriceLists({onBusyChange}:{
 onBusyChange?:(busy:boolean)=>void;
}){
 const [lists,setLists]=useState<List[]>([]);
 const [chosenId,setChosenId]=useState("");
 const [prices,setPrices]=useState<Item[]>([]);
 const [loadedPriceListId,setLoadedPriceListId]=useState("");
 const [clients,setClients]=useState<Customer[]>([]);
 const [clientSearch,setClientSearch]=useState("");
 const [listForm,setListForm]=useState<ListForm>(INITIAL_LIST);
 const [priceForm,setPriceForm]=useState<PriceForm>(INITIAL_PRICE);
 const [editingId,setEditingId]=useState<string|null>(null);
 const [showEditor,setShowEditor]=useState(false);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [showPriceEditor,setShowPriceEditor]=useState(false);
 const [toast,setToast]=useState<{message:string;variant:"success"|"error"|"info"}|null>(null);
 const notify=useCallback((message:string,variant:"success"|"error"|"info"="error")=>
  setToast({message,variant}),[]);
 useEffect(()=>{onBusyChange?.(busy);},[busy,onBusyChange]);
 const chosen=useMemo(()=>lists.find(x=>x.id===chosenId)||null,[lists,chosenId]);
 const visiblePrices=loadedPriceListId===chosenId?prices:[];
 const refresh=useCallback(async(preferred?:string)=>{
  const data=await query<{items:List[]}>("");
  setLists(data.items);setChosenId(current=>
   data.items.some(x=>x.id===(preferred||current))?(preferred||current):data.items[0]?.id||"");
 },[]);
 useEffect(()=>{
  let mounted=true;
  void Promise.resolve().then(async()=>{
   await refresh();
   if(mounted)setLoading(false);
  }).catch(e=>{if(mounted){notify(e instanceof Error?e.message:"Không tải được bảng giá.");setLoading(false);}});
  return()=>{mounted=false};
 },[refresh,notify]);
 useEffect(()=>{
  if(!chosenId){return;}
  let cancelled=false;
  void query<{items:Item[]}>("/prices?list_id="+encodeURIComponent(chosenId))
   .then(data=>{if(!cancelled){setPrices(data.items);setLoadedPriceListId(chosenId);}})
   .catch(e=>{if(!cancelled)notify(e instanceof Error?e.message:"Không tải được giá SKU.");});
  return()=>{cancelled=true};
 },[chosenId,notify]);
 async function work(fn:()=>Promise<void>){
  setBusy(true);
  try{await fn();}catch(e){notify(e instanceof Error?e.message:"Thao tác thất bại.");}
  finally{setBusy(false);}
 }
 function newList(){
  setEditingId(null);setListForm({...INITIAL_LIST,valid_from:vnDay()});
  setClientSearch("");setShowPriceEditor(false);setShowEditor(true);
 }
 function editList(item:List){
  if(item.approval_state!=="draft")return;
  setEditingId(item.id);
  setListForm({list_code:item.list_code,list_name:item.list_name,note:item.note,audience:item.audience,
   channel_codes:item.channel_codes,scope_customer_type:item.scope_customer_type||"",
   scope_customer_id:item.scope_customer_id||"",priority:String(item.priority),
   valid_from:item.valid_from,valid_until:item.valid_until||""});
  setClientSearch(item.customer_code?item.customer_code+" — "+(item.customer_name||""):"");
  setShowEditor(true);
 }
 function changeAudience(audience:Audience){
  setListForm(v=>({...v,audience,channel_codes:[],scope_customer_type:"",scope_customer_id:""}));
  setClientSearch("");
 }
 function toggleChannel(code:string,checked:boolean){
  setListForm(v=>({...v,channel_codes:checked?[...v.channel_codes,code]:
   v.channel_codes.filter(x=>x!==code)}));
 }
 function clientType(value:string){
  setListForm(v=>({...v,scope_customer_type:value,scope_customer_id:""}));
  setClientSearch("");
 }
 async function findClients(){
  await work(async()=>{
   const data=await query<{items:Customer[]}>("/customers?q="+encodeURIComponent(clientSearch.trim()));
   setClients(data.items);
  });
 }
 async function saveList(){
  const code=listForm.list_code.trim();
  const name=listForm.list_name.trim();
  if(!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code)){
   notify("Anh tự nhập mã bảng giá 2–40 ký tự: chữ hoa, số, gạch dưới hoặc gạch ngang.");return;
  }
  if(name.length<2||!listForm.valid_from){notify("Nhập tên và ngày hiệu lực.");return;}
  if(listForm.audience!=="internal"&&!listForm.channel_codes.length){
   notify("Chưa chọn kênh áp dụng.");return;
  }
  await work(async()=>{
   const data={...listForm,list_code:code,list_name:name,priority:Number(listForm.priority),
    note:listForm.note.trim(),scope_customer_type:listForm.scope_customer_type||null,
    scope_customer_id:listForm.scope_customer_id||null,valid_until:listForm.valid_until||null};
   if(editingId){
    const row=lists.find(x=>x.id===editingId);
    if(!row)throw Error("Bảng giá không tồn tại.");
    await query("/update","POST",{...data,id:editingId,expected_revision:row.revision});
   }else{
    await query("/create","POST",data);
   }
   setShowEditor(false);await refresh(editingId||undefined);
   notify("Đã lưu bảng giá nội bộ. Chưa tự áp dụng ra Website/App.","success");
  });
 }
 async function approveList(item:List){
  if(!window.confirm("Duyệt bảng giá "+item.list_code+"? Chỉ mở trạng thái nội bộ, không tự công khai Web/App."))return;
  await work(async()=>{
   await query("/approve","POST",{id:item.id,expected_revision:item.revision});
   await refresh(item.id);notify("Đã duyệt cấu hình bảng giá. Kênh bán chưa tự công khai.","success");
  });
 }
 async function deactivateList(item:List){
  if(!window.confirm("Ngừng bảng giá "+item.list_code+"? Không xóa giá và lịch sử."))return;
  await work(async()=>{
   await query("/deactivate","POST",{id:item.id,expected_revision:item.revision});
   await refresh(item.id);notify("Đã ngừng bảng giá.","success");
  });
 }
 function newPrice(){
  if(!chosen||chosen.approval_state!=="draft")return;
  setPriceForm({...INITIAL_PRICE,valid_from:chosen.valid_from});
  setShowPriceEditor(true);
 }
 function editPrice(item:Item){
  if(!chosen||item.list_id!==chosen.id||chosen.approval_state!=="draft"||item.approval_state!=="draft")return;
  setPriceForm({sku_cong_ty:item.sku_cong_ty,amount_vnd:item.amount_vnd,
   vat_included:item.vat_included?"yes":"no",source_document:item.source_document,
   valid_from:item.valid_from,valid_until:item.valid_until||"",id:item.id,revision:item.revision});
  setShowPriceEditor(true);
 }
 async function savePrice(){
  if(!chosen||!priceForm.sku_cong_ty.trim()||
   !/^(0|[1-9]\d{0,12})$/.test(priceForm.amount_vnd)||!priceForm.vat_included||
   !priceForm.source_document.trim()||!priceForm.valid_from){
   notify("Nhập mã SKU, giá nguyên VND, VAT và tên chứng từ đã xác minh.");return;
  }
  if(!window.confirm("Lưu giá nháp cho mã "+priceForm.sku_cong_ty+" trong "+chosen.list_code+
   "? Chưa áp dụng cho khách."))return;
  await work(async()=>{
   await query("/price","POST",{list_id:chosen.id,sku_cong_ty:priceForm.sku_cong_ty.trim(),
    amount_vnd:priceForm.amount_vnd,vat_included:priceForm.vat_included==="yes",
    source_document:priceForm.source_document.trim(),valid_from:priceForm.valid_from,
    valid_until:priceForm.valid_until||null,
    ...(priceForm.id?{expected_revision:priceForm.revision}:{})});
   const p=await query<{items:Item[]}>("/prices?list_id="+encodeURIComponent(chosen.id));
   setPrices(p.items);setLoadedPriceListId(chosen.id);
   setShowPriceEditor(false);await refresh(chosen.id);
   notify("Đã lưu giá nháp. Chưa duyệt, chưa công khai.","success");
  });
 }
 async function approvePrice(item:Item){
  if(!chosen||item.list_id!==chosen.id||loadedPriceListId!==chosen.id)return;
  if(!window.confirm("Duyệt mức giá "+fmt(item.amount_vnd)+" cho SKU "+item.sku_cong_ty+
   "? Cần xác minh nguồn và VAT trước khi duyệt."))return;
  await work(async()=>{
   await query("/price-approve","POST",{id:item.id,expected_revision:item.revision});
   const p=await query<{items:Item[]}>("/prices?list_id="+encodeURIComponent(item.list_id));
   if(chosenId===item.list_id){setPrices(p.items);setLoadedPriceListId(item.list_id);}
   notify("Mức giá đã duyệt nội bộ.","success");
  });
 }
 return <section className="fb-managed-prices" aria-label="Bảng giá tự tạo">
  <AdminToast message={toast?.message||""} variant={toast?.variant||"info"} onClose={()=>setToast(null)}/>
  <div className="fb-managed-head">
   <div><h2>Bảng giá tự tạo</h2><p>Tự đặt mã, tên và kênh áp dụng. Không có bảng giá mặc định.</p></div>
   <button type="button" className="import-btn import-primary" disabled={busy} onClick={newList}>+ Tạo bảng giá</button>
  </div>
  <div className="fb-managed-layout">
   <div className="fb-managed-list" aria-label="Danh sách bảng giá">
    {loading&&<p className="fb-managed-empty">Đang tải bảng giá…</p>}
    {!loading&&!lists.length&&<p className="fb-managed-empty">
     Chưa có bảng giá kinh doanh. Chọn <strong>Tạo bảng giá</strong> và tự nhập mã, tên.
    </p>}
    {lists.map(item=><button type="button" key={item.id}
     className={"fb-managed-list-item"+(chosenId===item.id?" active":"")}
     onClick={()=>{setChosenId(item.id);setShowEditor(false);setShowPriceEditor(false);}}
     aria-current={chosenId===item.id?"true":undefined} disabled={busy}>
     <strong>{item.list_code}</strong><span>{item.list_name}</span>
     <small>{item.approval_state==="approved"?"Đã duyệt":
      item.approval_state==="inactive"?"Đã ngừng":"Bản nháp"} · {item.price_count} mức giá</small>
    </button>)}
   </div>
   <div className="fb-managed-detail">
    {chosen&&!showEditor&&<>
     <div className="fb-managed-summary">
      <div><span className="fb-managed-code">{chosen.list_code}</span>
       <h3>{chosen.list_name}</h3>
       <p>{chosen.channel_codes.length?chosen.channel_codes.map(code=>
        CHANNELS.find(c=>c[0]===code)?.[1]||code).join(" · "):"Chưa gán kênh — chỉ nội bộ"}</p>
       <small>{chosen.scope_customer_type?"Nhóm khách: "+(CATEGORIES.find(x=>x[0]===chosen.scope_customer_type)?.[1]||chosen.scope_customer_type):""}
        {chosen.scope_customer_id?"Khách: "+(chosen.customer_code||"")+" "+(chosen.customer_name||""):""}</small>
       <small>Hiệu lực {chosen.valid_from} {chosen.valid_until?"→ "+chosen.valid_until:""}</small>
      </div>
      <div className="fb-managed-actions">
       {chosen.approval_state==="draft"&&<button type="button" className="import-btn import-secondary"
        disabled={busy} onClick={()=>editList(chosen)}>Sửa cấu hình</button>}
       {chosen.approval_state==="draft"&&<button type="button" className="import-btn import-secondary"
        disabled={busy} onClick={()=>void approveList(chosen)}>Duyệt bảng giá</button>}
       {chosen.approval_state!=="inactive"&&<button type="button" className="import-btn import-secondary"
        disabled={busy} onClick={()=>void deactivateList(chosen)}>Ngừng áp dụng</button>}
      </div>
     </div>
     <p className="fb-managed-warning">Giá và kênh chỉ được lưu trong hệ thống nội bộ. Việc duyệt không tự đưa NET hoặc bảng giá này ra Website/App.</p>
     <div className="fb-managed-section-title">
      <div><h3>Mức giá theo SKU</h3><small>Giá VND độc lập, không tự tính từ NET/chiết khấu.</small></div>
      {chosen.approval_state==="draft"&&<button type="button" className="import-btn import-primary"
       disabled={busy} onClick={newPrice}>+ Thêm giá SKU</button>}
     </div>
     {loadedPriceListId!==chosenId?<p className="fb-managed-empty">Đang tải giá của bảng đã chọn…</p>:
     visiblePrices.length===0?<p className="fb-managed-empty">Chưa có mức giá cho bảng này.</p>:
     <div className="fb-managed-table-wrap"><table><thead><tr><th>Mã SKU</th>
      <th>Tên sản phẩm</th><th>Giá VND</th><th>VAT</th><th>Tình trạng</th><th>Thao tác</th></tr></thead>
      <tbody>{visiblePrices.map(item=><tr key={item.id}>
       <td><strong>{item.sku_cong_ty}</strong></td>
       <td>{item.ten_san_pham||item.ten_goc_xnt||"Chưa có tên"}</td>
       <td>{fmt(item.amount_vnd)}</td><td>{item.vat_included?"Đã gồm":"Chưa gồm"}</td>
       <td>{item.approval_state==="approved"?"Đã duyệt":"Nháp"}</td>
       <td><div className="fb-managed-row-actions">
        {chosen.approval_state==="draft"&&item.approval_state==="draft"&&<>
         <button type="button" className="import-btn import-secondary" disabled={busy}
          onClick={()=>editPrice(item)}>Sửa</button>
         <button type="button" className="import-btn import-secondary" disabled={busy}
          onClick={()=>void approvePrice(item)}>Duyệt</button>
        </>}
       </div></td>
      </tr>)}</tbody></table></div>}
    </>}
    {showEditor&&<div className="fb-managed-editor" aria-label="Thiết lập bảng giá">
     <h3>{editingId?"Chỉnh sửa bảng giá":"Tạo bảng giá mới"}</h3>
     <div className="fb-managed-fields">
      <label>Mã bảng giá (tự đặt)
       <input value={listForm.list_code} disabled={!!editingId||busy} maxLength={40}
        placeholder="VD: DL_MIEN_TAY" onChange={e=>setListForm(v=>({...v,list_code:e.target.value.toUpperCase()}))}/>
      </label>
      <label>Tên bảng giá
       <input value={listForm.list_name} maxLength={120}
        placeholder="Tên do anh lựa chọn" onChange={e=>setListForm(v=>({...v,list_name:e.target.value}))}/>
      </label>
      <label>Phạm vi bảo mật
       <select value={listForm.audience} onChange={e=>changeAudience(e.target.value as Audience)}>
        <option value="internal">Nội bộ — không gán kênh</option>
        <option value="consumer">Người tiêu dùng</option>
        <option value="dealer">Đại lý / khách B2B</option>
       </select>
      </label>
      <label>Mức ưu tiên (khi trùng điều kiện)
       <input type="number" min="0" max="10000" value={listForm.priority}
        onChange={e=>setListForm(v=>({...v,priority:e.target.value}))}/>
      </label>
      <label>Hiệu lực từ ngày
       <input type="date" value={listForm.valid_from}
        onChange={e=>setListForm(v=>({...v,valid_from:e.target.value}))}/>
      </label>
      <label>Đến ngày (có thể để trống)
       <input type="date" value={listForm.valid_until}
        onChange={e=>setListForm(v=>({...v,valid_until:e.target.value}))}/>
      </label>
      <label className="fb-managed-wide">Ghi chú
       <input value={listForm.note} maxLength={500}
        onChange={e=>setListForm(v=>({...v,note:e.target.value}))}/>
      </label>
     </div>
     {listForm.audience!=="internal"&&<fieldset className="fb-managed-channel-set">
      <legend>Chọn kênh áp dụng</legend>
      {CHANNELS.filter(([code])=>listForm.audience==="dealer"?code==="dealer_app":
       code!=="dealer_app").map(([code,label])=><label key={code}>
       <input type="checkbox" checked={listForm.channel_codes.includes(code)}
        onChange={e=>toggleChannel(code,e.target.checked)}/>{label}</label>)}
     </fieldset>}
     {listForm.audience==="dealer"&&<div className="fb-managed-fields">
      <label>Nhóm khách hàng
       <select value={listForm.scope_customer_type} onChange={e=>clientType(e.target.value)}>
        {CATEGORIES.map(([id,label])=><option value={id} key={id}>{label}</option>)}
       </select></label>
      <div className="fb-managed-customer">
       <label>Tìm khách cụ thể theo tên/mã
        <input value={clientSearch} onChange={e=>{setClientSearch(e.target.value);
         setListForm(v=>({...v,scope_customer_id:""}));}} placeholder="Nhập mã hoặc tên khách"/>
       </label>
       <button type="button" className="import-btn import-secondary" disabled={busy}
        onClick={()=>void findClients()}>Tìm khách</button>
       {clients.length>0&&<div className="fb-managed-customers">
        {clients.map(c=><button type="button" key={c.id} disabled={c.status!=="active"}
         className={listForm.scope_customer_id===c.id?"active":""}
         onClick={()=>{setListForm(v=>({...v,scope_customer_type:"",scope_customer_id:c.id}));
          setClientSearch(c.customer_code+" — "+c.display_name);setClients([]);}}>
         {c.customer_code} — {c.display_name}</button>)}
       </div>}
      </div>
      <small className="fb-managed-wide">Chọn nhóm khách hoặc một khách cụ thể, không cần nhập UUID.</small>
     </div>}
     <div className="fb-managed-footer">
      <button type="button" className="import-btn import-secondary" disabled={busy}
       onClick={()=>setShowEditor(false)}>Hủy</button>
      <button type="button" className="import-btn import-primary" disabled={busy}
       onClick={()=>void saveList()}>{busy?"Đang lưu…":"Lưu bảng giá"}</button>
     </div>
    </div>}
    {showPriceEditor&&chosen&&!showEditor&&<div className="fb-managed-editor">
     <h3>{priceForm.id?"Sửa giá nháp":"Thêm giá vào "+chosen.list_code}</h3>
     <div className="fb-managed-fields">
      <label>Mã công ty (SKU)
       <input value={priceForm.sku_cong_ty} disabled={!!priceForm.id||busy}
        placeholder="VD: 0114" onChange={e=>setPriceForm(v=>({...v,sku_cong_ty:e.target.value}))}/>
      </label>
      <label>Giá mới (VND)
       <input inputMode="numeric" value={priceForm.amount_vnd}
        onChange={e=>setPriceForm(v=>({...v,amount_vnd:e.target.value}))}/>
      </label>
      <label>VAT
       <select value={priceForm.vat_included}
        onChange={e=>setPriceForm(v=>({...v,vat_included:e.target.value as ""|"yes"|"no"}))}>
        <option value="">Chưa xác minh</option><option value="yes">Đã gồm VAT</option>
        <option value="no">Chưa gồm VAT</option>
       </select>
      </label>
      <label>Hiệu lực từ ngày
       <input type="date" value={priceForm.valid_from} disabled={!!priceForm.id}
        onChange={e=>setPriceForm(v=>({...v,valid_from:e.target.value}))}/>
      </label>
      <label>Ngày hết hạn
       <input type="date" value={priceForm.valid_until}
        onChange={e=>setPriceForm(v=>({...v,valid_until:e.target.value}))}/>
      </label>
      <label className="fb-managed-wide">Chứng từ / nguồn giá đã xác minh
       <input value={priceForm.source_document}
        onChange={e=>setPriceForm(v=>({...v,source_document:e.target.value}))}/>
      </label>
     </div>
     <div className="fb-managed-footer">
      <button type="button" className="import-btn import-secondary"
       onClick={()=>setShowPriceEditor(false)} disabled={busy}>Hủy</button>
      <button type="button" className="import-btn import-primary"
       onClick={()=>void savePrice()} disabled={busy}>Lưu giá nháp</button>
     </div>
    </div>}
   </div>
  </div>
 </section>;
}
