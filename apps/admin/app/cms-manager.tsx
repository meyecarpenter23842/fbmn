"use client";

import {useCallback,useEffect,useId,useRef,useState} from "react";
import type {FormEvent,MutableRefObject} from "react";
import ProductModal from "./product-modal";
import AdminToast from "./admin-toast";
import CmsMediaEditor,{cmsMediaKey,uploadCmsImage} from "./cms-media-editor";
import type {CmsChannel as ImageChannel,CmsDevice,CmsPendingImages} from "./cms-media-editor";
import CmsVisualPreview from "./cms-visual-preview";
import {CMS_SLOTS} from "./cms-placement-options";

type CmsKind = "banner"|"popup"|"article"|"promotion";
type CmsStatus = "draft"|"published"|"hidden";
type CmsChannel = "public_web"|"dealer_app"|"consumer_app";
type CmsItem = {
 id:string;kind:CmsKind;slug:string;title:string;summary:string;paragraphs:string[];
 cta_url:string|null;channel_targets:CmsChannel[];sort_order:number;
 starts_at:string|null;ends_at:string|null;source_ref:string;status:CmsStatus;
 revision:number;updated_at:string;placements:Partial<Record<CmsChannel,string>>;
 popup_delay_seconds:number;popup_cooldown_minutes:number;popup_max_per_session:number;
};
type CmsSummary = Omit<CmsItem,"paragraphs"|"cta_url">;
type Draft = {
 kind:CmsKind;slug:string;title:string;summary:string;paragraphs:string;
 ctaUrl:string;channelTargets:CmsChannel[];sortOrder:number;
 startsAt:string;endsAt:string;sourceRef:string;
 placements:Partial<Record<CmsChannel,string>>;popupDelaySeconds:number;
 popupCooldownMinutes:number;popupMaxPerSession:number;
};
const LABELS:Record<CmsKind,string>={
 banner:"Banner",popup:"Popup",article:"Tin tức",promotion:"Khuyến mãi"
};
const CHANNELS:{code:CmsChannel;label:string}[]=[
 {code:"public_web",label:"Website"},
 {code:"dealer_app",label:"App đại lý"},
 {code:"consumer_app",label:"App người tiêu dùng"}
];
function localDate(value:string|null){
 if(!value)return "";
 const d=new Date(value);
 const pad=(n:number)=>String(n).padStart(2,"0");
 return Number.isNaN(d.getTime())?"":d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+
  "T"+pad(d.getHours())+":"+pad(d.getMinutes());
}
function blank(kind:CmsKind):Draft {
 return {kind,slug:"",title:"",summary:"",paragraphs:"",ctaUrl:"",
  channelTargets:[],sortOrder:0,startsAt:"",endsAt:"",sourceRef:"",
  placements:{},popupDelaySeconds:3,popupCooldownMinutes:1440,popupMaxPerSession:1};
}
function fromItem(item:CmsItem):Draft {
 return {kind:item.kind,slug:item.slug,title:item.title,summary:item.summary,
  paragraphs:item.paragraphs.join("\n\n"),ctaUrl:item.cta_url||"",
  channelTargets:item.channel_targets,sortOrder:item.sort_order,
  startsAt:localDate(item.starts_at),endsAt:localDate(item.ends_at),
  sourceRef:item.source_ref,placements:item.placements||{},
  popupDelaySeconds:item.popup_delay_seconds??3,popupCooldownMinutes:item.popup_cooldown_minutes??1440,
  popupMaxPerSession:item.popup_max_per_session??1};
}
function errorLabel(status:number,code?:string){
 if(code==="cms_worker_not_deployed"||status===404)return "Worker CMS chưa được triển khai. API chưa sẵn sàng; đây không phải danh sách trống.";
 if(code==="surface_unavailable")return "Nội dung mới chỉ có trong Admin. Chưa thể xuất bản vì Website/App chưa kết nối CMS.";
 if(code==="placements_required")return "Chọn vị trí cụ thể cho tất cả kênh trước khi xuất bản.";
 if(code==="media_required")return "Banner/popup cần ảnh desktop và mobile trước khi xuất bản.";
 if(status===401)return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
 if(status===403)return "Chỉ Owner được quản lý nội dung Website.";
 if(status===409)return "Nội dung đã thay đổi hoặc trùng đường dẫn. Hãy tải lại danh sách.";
 if(code==="source_required")return "Cần nhập tài liệu nguồn đã xác minh trước khi xuất bản.";
 if(code==="channels_required")return "Cần chọn ít nhất một kênh trước khi xuất bản.";
 if(status===400)return "Thông tin chưa hợp lệ. Kiểm tra nội dung, liên kết và lịch hiển thị.";
 return "Không kết nối được dịch vụ CMS. Vui lòng thử lại.";
}
async function cmsApi<T>(action="",body?:object):Promise<T>{
 const tokenResponse=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 if(!tokenResponse.ok)throw Error("Phiên đăng nhập hết hạn.");
 const credentials=await tokenResponse.json() as {token?:unknown};
 if(typeof credentials.token!=="string"||
    !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(credentials.token))
  throw Error("Không thể xác thực Owner.");
 const response=await fetch("/api/cms"+(action.startsWith("?")?action:action?"/"+action:""),{
  method:body?"POST":"GET",cache:"no-store",credentials:"same-origin",
  headers:{Authorization:"Bearer "+credentials.token,Accept:"application/json",
   ...(body?{"Content-Type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 const result=await response.json().catch(()=>({})) as {data?:T;error?:{code?:string}};
 if(!response.ok)throw Error(errorLabel(response.status,result.error?.code));
 if(!result.data)throw Error("Phản hồi CMS chưa hợp lệ.");
 return result.data;
}

function CmsEditor({item,kind,onSaved,onSavingChange,dirtyRef,step,onStep,formId}:{
 item:CmsItem|null;kind:CmsKind;onSaved:()=>void;onSavingChange:(saving:boolean)=>void;
 dirtyRef:MutableRefObject<boolean>;step:number;onStep:(step:number)=>void;formId:string;
}){
 const [draft,setDraft]=useState<Draft>(()=>item?fromItem(item):blank(kind));
 const [savedRecord,setSavedRecord]=useState<CmsItem|null>(item);
 const [pendingImages,setPendingImages]=useState<CmsPendingImages>({});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [toastId,setToastId]=useState(0);
 const [previewChannel,setPreviewChannel]=useState<CmsChannel>("public_web");
 const [previewDevice,setPreviewDevice]=useState<CmsDevice>("desktop");
 const contentDirty=useRef(false),operationLock=useRef(false);
 const previewUrls=useRef<Set<string>>(new Set());
 useEffect(()=>{
  const owned=previewUrls.current;
  return ()=>{for(const url of owned)URL.revokeObjectURL(url);owned.clear();};
 },[]);
 const set=<K extends keyof Draft>(key:K,value:Draft[K])=>{
  contentDirty.current=true;dirtyRef.current=true;
  setDraft(prev=>({...prev,[key]:value}));
 };
 const stageImage=(channel:ImageChannel,device:CmsDevice,file:File)=>{
  if(busy||operationLock.current)return;
  const key=cmsMediaKey(channel,device),url=URL.createObjectURL(file);
  previewUrls.current.add(url);
  const prior=pendingImages[key];
  if(prior){URL.revokeObjectURL(prior.url);previewUrls.current.delete(prior.url);}
  dirtyRef.current=true;
  setPendingImages(prev=>({...prev,[key]:{file,url}}));
 };
 const toggleChannel=(ch:CmsChannel,checked:boolean)=>{
  if(!checked){
   for(const device of ["desktop","mobile"] as CmsDevice[]){
    const key=cmsMediaKey(ch,device),pending=pendingImages[key];
    if(pending){URL.revokeObjectURL(pending.url);previewUrls.current.delete(pending.url);}
   }
   setPendingImages(prev=>Object.fromEntries(
    Object.entries(prev).filter(([key])=>!key.startsWith(ch+":"))));
  }
  contentDirty.current=true;dirtyRef.current=true;
  setDraft(prev=>{
   const targets=checked?[...prev.channelTargets,ch]:prev.channelTargets.filter(v=>v!==ch);
   const placements={...prev.placements};
   if(!checked)delete placements[ch];
   return {...prev,channelTargets:targets,placements};
  });
 };
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  if(busy||operationLock.current)return;
  operationLock.current=true;
  setBusy(true);onSavingChange(true);setError("");
  try{
   if(draft.title.trim().length<2 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.slug)){
    onStep(0);throw Error("Nhập tiêu đề tối thiểu 2 ký tự và đường dẫn chỉ gồm chữ thường, số, dấu gạch ngang.");
   }
   if(["article","promotion"].includes(draft.kind)&&!draft.paragraphs.trim()){
    onStep(0);throw Error("Tin tức và khuyến mãi cần có nội dung chi tiết.");
   }
   if(draft.endsAt&&draft.startsAt&&new Date(draft.endsAt)<new Date(draft.startsAt)){
    onStep(1);throw Error("Ngày kết thúc phải sau ngày bắt đầu.");
   }
   let current=savedRecord;
   if(!current||contentDirty.current){
    const data={
     ...draft,title:draft.title.trim(),summary:draft.summary.trim(),sourceRef:draft.sourceRef.trim(),
     startsAt:draft.startsAt?new Date(draft.startsAt).toISOString():null,
     endsAt:draft.endsAt?new Date(draft.endsAt).toISOString():null,
     ctaUrl:draft.ctaUrl.trim()||null,
     paragraphs:draft.paragraphs.trim()?
      draft.paragraphs.trim().split(/\n\s*\n/).map(p=>p.trim()):[]
    };
    const result=await cmsApi<{item:CmsItem}>(current?"update":"create",{
     ...data,...(current?{id:current.id,expectedRevision:current.revision}:{})
    });
    current=result.item;setSavedRecord(current);
    contentDirty.current=false;
   }
   const files=Object.entries(pendingImages);
   for(const [key,pending] of files){
    const [ch,device]=key.split(":") as [CmsChannel,CmsDevice];
    if(!draft.channelTargets.includes(ch))continue;
    const revision=await uploadCmsImage(current.id,current.revision,ch,device,pending.file);
    current={...current,revision};setSavedRecord(current);
    setPendingImages(prev=>{
     const next={...prev};delete next[key];return next;
    });
    // Preserve the selected preview until the saved R2 image can be loaded.
    URL.revokeObjectURL(pending.url);previewUrls.current.delete(pending.url);
   }
   dirtyRef.current=false;
   onSaved();
   onStep(2);
  }catch(ex){
   setError(ex instanceof Error?ex.message:"Không lưu được bản nháp hoặc ảnh.");
   setToastId(v=>v+1);
   dirtyRef.current=true;
  }finally{
   operationLock.current=false;
   setBusy(false);onSavingChange(false);
  }
 };
 const canChangeKind=!savedRecord;
 const activePreviewChannel=draft.channelTargets.includes(previewChannel)?
  previewChannel:draft.channelTargets[0]??"public_web";
 const STEPS=["Nội dung","Vị trí & lịch","Ảnh & xem trước"];
 return <form id={formId} className="cms-editor cms-wizard" onSubmit={e=>void submit(e)} noValidate>
  <AdminToast variant="error" message={error} notificationId={toastId} onClose={()=>setError("")}/>
  <nav className="cms-wizard-tabs" role="tablist" aria-label="Các bước tạo nội dung">
   {STEPS.map((label,index)=><button type="button" key={label} role="tab"
    aria-selected={step===index} aria-controls={formId+"-step-"+index}
    id={formId+"-tab-"+index} onClick={()=>onStep(index)} disabled={busy}>
    <span>{index+1}</span>{label}
   </button>)}
  </nav>
  <section id={formId+"-step-"+step} role="tabpanel"
   aria-labelledby={formId+"-tab-"+step} className="cms-wizard-panel">
   {step===0&&<>
    <div className="cms-wizard-intro"><strong>Thông tin nội dung</strong>
     <p>Nhập nội dung trước; có thể chuyển bước và chọn ảnh trước khi lưu.</p>
    </div>
    <div className="cms-form-grid">
     <label>Loại nội dung
      <select value={draft.kind} disabled={!canChangeKind||busy}
       onChange={e=>{set("kind",e.target.value as CmsKind);set("placements",{});}}>
       {([kind==="banner"||kind==="popup"?"banner":"article",
        kind==="banner"||kind==="popup"?"popup":"promotion"] as CmsKind[])
        .map(k=><option key={k} value={k}>{LABELS[k]}</option>)}
      </select>
     </label>
     <label>Đường dẫn (slug)
      <input value={draft.slug} disabled={!canChangeKind||busy} required
       pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100}
       onChange={e=>set("slug",e.target.value)} placeholder="ten-noi-dung"/>
     </label>
     <label className="cms-wide">Tiêu đề
      <input value={draft.title} maxLength={160} minLength={2} required disabled={busy}
       onChange={e=>set("title",e.target.value)}/>
     </label>
     <label className="cms-wide">Mô tả ngắn
      <textarea rows={2} maxLength={400} value={draft.summary} disabled={busy}
       onChange={e=>set("summary",e.target.value)}/>
     </label>
     <label className="cms-wide">Nội dung chi tiết
      <textarea rows={5} value={draft.paragraphs} disabled={busy}
       onChange={e=>set("paragraphs",e.target.value)}
       placeholder="Mỗi đoạn cách nhau một dòng trống; không dùng HTML"/>
     </label>
     <label className="cms-wide">Liên kết khi bấm (https:// hoặc đường dẫn Website)
      <input type="text" value={draft.ctaUrl} disabled={busy}
       onChange={e=>set("ctaUrl",e.target.value)} placeholder="/san-pham"/>
     </label>
    </div>
   </>}
   {step===1&&<>
    <div className="cms-wizard-intro"><strong>Trang, vị trí và thời gian hiển thị</strong>
     <p>Chọn kênh trước, sau đó chỉ định vị trí riêng; Web và App không bị ép cùng bố cục.</p>
    </div>
    <div className="cms-form-grid">
     <fieldset className="cms-channels cms-wide" disabled={busy}>
      <legend>Kênh hiển thị</legend>
      {CHANNELS.map(ch=><label key={ch.code}>
       <input type="checkbox" checked={draft.channelTargets.includes(ch.code)}
        onChange={e=>toggleChannel(ch.code,e.target.checked)}/>{ch.label}
      </label>)}
     </fieldset>
     <fieldset className="cms-placement-grid cms-wide">
      <legend>Vị trí theo từng kênh</legend>
      {draft.channelTargets.length===0?<p>Chọn kênh để hiện vị trí tương ứng.</p>:
       draft.channelTargets.map(ch=><label key={ch}>
        <span>{CHANNELS.find(x=>x.code===ch)?.label}</span>
        <select value={draft.placements[ch]||""} disabled={busy}
         onChange={e=>{
          const placements={...draft.placements};
          if(e.target.value)placements[ch]=e.target.value;else delete placements[ch];
          set("placements",placements);
         }}>
         <option value="">Chọn nơi hiển thị (có thể lưu nháp trước)</option>
         {CMS_SLOTS[draft.kind][ch].map(slot=>
          <option key={slot.value} value={slot.value}>{slot.label}</option>)}
        </select>
        {CMS_SLOTS[draft.kind][ch].filter(slot=>slot.value===draft.placements[ch]).map(slot=>
         <small key={slot.value}>{slot.description}</small>)}
       </label>)}
     </fieldset>
     {draft.kind==="popup"&&<fieldset className="cms-popup-frequency cms-wide">
      <legend>Popup quảng bá cho khách truy cập</legend>
      <p>Không phải popup thêm/sửa trong Admin. Chỉ có hiệu lực khi Website/App tích hợp CMS.</p>
      <div className="cms-form-grid">
       <label>Chờ sau khi vào trang (giây)
        <input type="number" min={0} max={120} value={draft.popupDelaySeconds}
         disabled={busy} onChange={e=>set("popupDelaySeconds",Number(e.target.value))}/>
       </label>
       <label>Tối đa mỗi phiên
        <input type="number" min={1} max={20} value={draft.popupMaxPerSession}
         disabled={busy} onChange={e=>set("popupMaxPerSession",Number(e.target.value))}/>
       </label>
       <label>Chờ sau khi đóng (phút)
        <input type="number" min={0} max={43200} value={draft.popupCooldownMinutes}
         disabled={busy} onChange={e=>set("popupCooldownMinutes",Number(e.target.value))}/>
       </label>
      </div>
     </fieldset>}
     <label>Bắt đầu hiển thị
      <input type="datetime-local" value={draft.startsAt} disabled={busy}
       onChange={e=>set("startsAt",e.target.value)}/>
     </label>
     <label>Kết thúc hiển thị
      <input type="datetime-local" value={draft.endsAt} disabled={busy}
       onChange={e=>set("endsAt",e.target.value)}/>
     </label>
     <label>Thứ tự sắp xếp
      <input type="number" min={0} max={10000} value={draft.sortOrder}
       disabled={busy} onChange={e=>set("sortOrder",Number(e.target.value))}/>
     </label>
     <label className="cms-wide">Nguồn xác minh nội dung
      <input maxLength={500} value={draft.sourceRef} disabled={busy}
       onChange={e=>set("sourceRef",e.target.value)}
       placeholder="Tài liệu / thông tin đã được Owner kiểm tra"/>
     </label>
    </div>
   </>}
   {step===2&&<>
    <div className="cms-wizard-intro"><strong>Chọn ảnh và kiểm tra bố cục</strong>
     <p>Ảnh hiện ngay trong bản xem trước. Bấm Lưu mới tải ảnh vào R2.</p>
    </div>
    <CmsMediaEditor recordId={savedRecord?.id??null} revision={savedRecord?.revision??0}
     channels={draft.channelTargets} pending={pendingImages} onStage={stageImage} disabled={busy}/>
    <CmsVisualPreview kind={draft.kind} title={draft.title} summary={draft.summary}
     ctaUrl={draft.ctaUrl} channelTargets={draft.channelTargets} placements={draft.placements}
     recordId={savedRecord?.id??null} revision={savedRecord?.revision??0}
     pending={pendingImages} channel={activePreviewChannel} device={previewDevice}
     onChannel={setPreviewChannel} onDevice={setPreviewDevice}/>
   </>}
  </section>
  <p className="cms-wizard-footnote">Chỉ lưu bản nháp trong Admin. Xuất bản sẽ được mở khi
   Website/App nhận CMS thật; không có thay đổi nào tự hiện trên trang công khai.</p>
 </form>;
}
export default function CmsManager({mode,owner}:{
 mode:"marketing"|"editorial";owner:boolean
}){
 const [items,setItems]=useState<CmsSummary[]>([]);
 const [page,setPage]=useState(1);
 const [hasNext,setHasNext]=useState(false);
 const [opening,setOpening]=useState(false);
 const [loading,setLoading]=useState(false);
 const [loadError,setLoadError]=useState("");
 const [busy,setBusy]=useState(false);
 const [editorSaving,setEditorSaving]=useState(false);
 const [editorStep,setEditorStep]=useState(0);
 const editorFormId=useId();
 const [editing,setEditing]=useState<CmsItem|null|undefined>(undefined);
 const editorDirtyRef=useRef(false);
 const [message,setMessage]=useState("");
 const openEditor=async(item:CmsSummary|null)=>{
  if(opening)return;
  editorDirtyRef.current=false;
  setEditorStep(0);
  if(!item){setEditing(null);return;}
  setOpening(true);
  try{
   const record=await cmsApi<{item:CmsItem}>("entry?id="+encodeURIComponent(item.id));
   if(record.item.id!==item.id)throw Error("Dữ liệu CMS không hợp lệ.");
   setEditing(record.item);
  }catch(e){setError(e instanceof Error?e.message:"Không tải được bài viết.");setToastId(v=>v+1);}
  finally{setOpening(false);}
 };
 const [error,setError]=useState("");
 const [toastId,setToastId]=useState(0);
 const refresh=useCallback(async()=>{
  if(!owner)return;
  setLoading(true);
  try{
   const v=await cmsApi<{items:CmsSummary[];page:number;hasNext:boolean}>(
    "?mode="+mode+"&page="+page);
   if(v.page!==page || !Array.isArray(v.items))throw Error("Danh sách CMS không hợp lệ.");
   setItems(v.items);setHasNext(v.hasNext===true);setLoadError("");
  }
  catch(e){
   const reason=e instanceof Error?e.message:"Không tải được CMS.";
   setLoadError(reason);setItems([]);setHasNext(false);
   setError(reason);setToastId(v=>v+1);
  }
  finally{setLoading(false);}
 },[owner,mode,page]);
 useEffect(()=>{const task=window.setTimeout(()=>{void refresh();},0);return()=>window.clearTimeout(task);},[refresh]);
 const visible=items;
 const kind:CmsKind=mode==="marketing"?"banner":"article";
 const title=mode==="marketing"?"Banner & Popup":"Tin tức & Khuyến mãi";
 const notify=(text:string,problem=false)=>{if(problem)setError(text);else setMessage(text);setToastId(v=>v+1);};
 const change=async(item:CmsSummary,action:"publish"|"hide")=>{
  if(busy || !window.confirm(action==="publish"?
    "Xác nhận nguồn nội dung đã được kiểm chứng và cho xuất bản theo các kênh đã chọn?":
    "Ẩn nội dung này khỏi các kênh đã chọn?"))return;
  setBusy(true);
  try{
   await cmsApi(action,{id:item.id,expectedRevision:item.revision});
   await refresh();
   notify(action==="publish"?"Đã xuất bản nội dung.":"Đã ẩn nội dung.");
  }catch(e){notify(e instanceof Error?e.message:"Không cập nhật được.",true);}
  finally{setBusy(false);}
 };
 if(!owner)return <div className="cms-panel"><div className="page-title"><h1>{title}</h1></div>
  <p>Chỉ Owner có quyền quản lý nội dung. Vui lòng dùng tài khoản được cấp quyền.</p></div>;
 return <div className="cms-panel">
  <AdminToast message={error||message} variant={error?"error":"success"}
   notificationId={toastId} onClose={()=>{setMessage("");setError("");}}/>
  <div className="page-title cms-heading"><div><h1>{title}</h1>
   <p>Chọn vị trí và ảnh riêng cho Web/App, desktop/mobile. Lưu nháp không tự xuất bản.</p></div>
   <button type="button" className="fb-ui-button fb-ui-button--primary" onClick={()=>void openEditor(null)}>
    Thêm nội dung
   </button>
  </div>
  <div className="cms-table-wrap">
   <table className="cms-table">
    <thead><tr><th>Tiêu đề</th><th>Loại</th><th>Kênh</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>
     {loading?<tr><td colSpan={5}>Đang tải nội dung…</td></tr>:
      loadError?<tr><td colSpan={5} role="alert" className="cms-error-state">{loadError} <button type="button" className="fb-ui-button fb-ui-button--secondary" onClick={()=>void refresh()}>Thử lại</button></td></tr>:
      visible.length===0?<tr><td colSpan={5}>Chưa có nội dung. Chọn Thêm nội dung để tạo bản nháp.</td></tr>:
      visible.map(item=><tr key={item.id}>
       <td><strong>{item.title}</strong><small>{item.slug}</small></td>
       <td>{LABELS[item.kind]}</td>
       <td>{item.channel_targets.map(ch=>CHANNELS.find(c=>c.code===ch)?.label).join(", ")||"Chưa chọn"}</td>
       <td>{item.status==="published"?"Đã xuất bản":item.status==="hidden"?"Đã ẩn":"Bản nháp"}</td>
       <td><div className="cms-row-actions">
        <button type="button" className="fb-ui-button fb-ui-button--secondary"
         disabled={busy||opening||item.status==="published"} onClick={()=>void openEditor(item)}>Sửa</button>
        {item.status==="published"?
         <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={busy}
          onClick={()=>void change(item,"hide")}>Ẩn</button>:
         <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled
          title="Chưa nối CMS với Website/App, không thể xuất bản">Chờ kết nối Web/App</button>}
       </div></td>
      </tr>)
     }
    </tbody>
   </table>
  </div>
  <div className="cms-actions" aria-label="Phân trang nội dung">
   <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={loading||busy||page===1}
    onClick={()=>setPage(v=>v-1)}>Trang trước</button>
   <span>Trang {page}</span>
   <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={loading||busy||!hasNext}
    onClick={()=>setPage(v=>v+1)}>Trang sau</button>
  </div>
  <p className="cms-help">Đã lưu nháp và có ảnh chưa đồng nghĩa đã xuất bản lên Website.
   Chỉ bật nút xuất bản sau khi public API và giao diện Web/App thực sự được kết nối, kiểm thử.</p>
  {editing!==undefined&&<ProductModal title={editing?"Sửa "+LABELS[editing.kind]:"Thêm nội dung"}
   onClose={()=>{setEditing(undefined);void refresh();}} wide locked={busy||editorSaving}
   beforeClose={()=>!editorDirtyRef.current || window.confirm("Nội dung hoặc ảnh chưa lưu. Đóng mà không lưu?")}
   footer={requestClose=><div className="cms-wizard-footer">
    <span className="cms-wizard-progress">Bước {editorStep+1}/3</span>
    <div className="cms-wizard-footer-actions">
     {editorStep>0&&<button type="button" className="fb-ui-button fb-ui-button--secondary"
      disabled={editorSaving} onClick={()=>setEditorStep(v=>Math.max(0,v-1))}>Quay lại</button>}
     <button type="button" className="fb-ui-button fb-ui-button--secondary"
      disabled={editorSaving} onClick={requestClose}>Đóng</button>
     <button type="submit" form={editorFormId} className={"fb-ui-button "+
      (editorStep===2?"fb-ui-button--primary":"fb-ui-button--secondary")}
      aria-busy={editorSaving} disabled={editorSaving}>
      {editorSaving?"Đang lưu…":"Lưu bản nháp & ảnh"}
     </button>
     {editorStep<2&&<button type="button" className="fb-ui-button fb-ui-button--primary"
      disabled={editorSaving} onClick={()=>setEditorStep(v=>Math.min(2,v+1))}>Tiếp tục</button>}
    </div>
   </div>}>
   <CmsEditor item={editing} kind={editing?.kind||kind} dirtyRef={editorDirtyRef}
    onSavingChange={setEditorSaving} step={editorStep} onStep={setEditorStep} formId={editorFormId}
    onSaved={()=>{notify("Đã lưu bản nháp và ảnh đã chọn.");
     if(editing===null&&page!==1)setPage(1);else void refresh();}}/>
  </ProductModal>}
 </div>;
}
