"use client";

import {useCallback,useEffect,useRef,useState} from "react";
import type {FormEvent,MutableRefObject} from "react";
import ProductModal,{useProductModalClose} from "./product-modal";
import AdminToast from "./admin-toast";
import CmsMediaEditor from "./cms-media-editor";
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

function CmsEditor({item,kind,onSaved,onSavingChange,dirtyRef}:{item:CmsItem|null;kind:CmsKind;onSaved:()=>void;onSavingChange:(saving:boolean)=>void;dirtyRef:MutableRefObject<boolean>}){
 const close=useProductModalClose();
 const [draft,setDraft]=useState<Draft>(()=>item?fromItem(item):blank(kind));
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [toastId,setToastId]=useState(0);
 const set=<K extends keyof Draft>(key:K,value:Draft[K])=>{
  dirtyRef.current=true;setDraft(prev=>({...prev,[key]:value}));
 };
 const submit=async(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();if(busy)return;
  setBusy(true);onSavingChange(true);setError("");
  let succeeded=false;
  try{
   const startsAt=draft.startsAt?new Date(draft.startsAt).toISOString():null;
   const endsAt=draft.endsAt?new Date(draft.endsAt).toISOString():null;
   const data={
    ...draft,startsAt,endsAt,ctaUrl:draft.ctaUrl.trim()||null,
    title:draft.title.trim(),summary:draft.summary.trim(),sourceRef:draft.sourceRef.trim(),
    paragraphs:draft.paragraphs.trim()?draft.paragraphs.trim().split(/\n\s*\n/).map(s=>s.trim()):[]
   };
   await cmsApi(item?"update":"create",{
    ...data,...(item?{id:item.id,expectedRevision:item.revision}:{})
   });
   dirtyRef.current=false;
   onSaved();
   succeeded=true;
  }catch(ex){
   setError(ex instanceof Error?ex.message:"Không lưu được nội dung.");
   setToastId(v=>v+1);
  }finally{
   setBusy(false);onSavingChange(false);
   if(succeeded)window.setTimeout(()=>close(),0);
  }
 };
 const canChangeKind=!item;
 return <form className="cms-editor" onSubmit={e=>void submit(e)}>
  <AdminToast variant="error" message={error} notificationId={toastId} onClose={()=>setError("")}/>
  <div className="cms-form-grid">
   <label>Loại nội dung
    <select value={draft.kind} disabled={!canChangeKind||busy}
     onChange={e=>set("kind",e.target.value as CmsKind)}>
     {([kind==="banner"||kind==="popup"?"banner":"article",
       kind==="banner"||kind==="popup"?"popup":"promotion"] as CmsKind[])
      .map(k=><option key={k} value={k}>{LABELS[k]}</option>)}
    </select>
   </label>
   <label>Đường dẫn (slug)
    <input required type="text" value={draft.slug} disabled={!canChangeKind||busy}
     pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} onChange={e=>set("slug",e.target.value)}
     placeholder="ten-noi-dung"/>
   </label>
   <label className="cms-wide">Tiêu đề
    <input required value={draft.title} maxLength={160} minLength={2}
     disabled={busy} onChange={e=>set("title",e.target.value)}/>
   </label>
   <label className="cms-wide">Mô tả ngắn
    <textarea rows={2} maxLength={400} value={draft.summary}
     disabled={busy} onChange={e=>set("summary",e.target.value)}/>
   </label>
   <label className="cms-wide">Nội dung chi tiết
    <textarea rows={5} value={draft.paragraphs} disabled={busy}
     onChange={e=>set("paragraphs",e.target.value)}
     placeholder="Mỗi đoạn văn cách nhau một dòng trống; không nhập HTML"/>
   </label>
   <label className="cms-wide">Liên kết CTA (https:// hoặc đường dẫn trong Website)
    <input type="text" value={draft.ctaUrl} disabled={busy}
     onChange={e=>set("ctaUrl",e.target.value)} placeholder="/san-pham"/>
   </label>
   <fieldset className="cms-channels cms-wide" disabled={busy}>
    <legend>Kênh hiển thị (chọn nhiều)</legend>
    {CHANNELS.map(ch=><label key={ch.code}>
     <input type="checkbox" checked={draft.channelTargets.includes(ch.code)}
      onChange={e=>set("channelTargets",e.target.checked?
       [...draft.channelTargets,ch.code]:draft.channelTargets.filter(v=>v!==ch.code))}/>
     {ch.label}
    </label>)}
   </fieldset>
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
     placeholder="Tên tài liệu / thông tin được Owner phê duyệt"/>
   </label>
  </div>
  <p className="cms-help">Lưu nháp không công khai. Owner chỉ được xuất bản sau khi có nguồn xác minh,
   chọn kênh và kiểm tra nội dung. Banner và popup chưa hiển thị trên Website khi chưa nối media.</p>
  <div className="cms-actions">
   <button type="button" className="fb-ui-button cms-secondary" disabled={busy} onClick={close}>Hủy</button>
   <button type="submit" className="fb-ui-button cms-primary" disabled={busy}>
    {busy?"Đang lưu…":item?"Lưu thay đổi":"Lưu bản nháp"}
   </button>
  </div>
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
 const [busy,setBusy]=useState(false);
 const [editorSaving,setEditorSaving]=useState(false);
 const [editing,setEditing]=useState<CmsItem|null|undefined>(undefined);
 const editorDirtyRef=useRef(false);
 const [message,setMessage]=useState("");
 const openEditor=async(item:CmsSummary|null)=>{
  if(opening)return;
  editorDirtyRef.current=false;
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
   setItems(v.items);setHasNext(v.hasNext===true);
  }
  catch(e){setError(e instanceof Error?e.message:"Không tải được CMS.");setToastId(v=>v+1);}
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
   <p>Tạo và quản lý nội dung thật, chỉ xuất bản sau khi Owner kiểm tra nguồn.</p></div>
   <button type="button" className="fb-ui-button cms-primary" onClick={()=>void openEditor(null)}>
    Thêm nội dung
   </button>
  </div>
  <div className="cms-table-wrap">
   <table className="cms-table">
    <thead><tr><th>Tiêu đề</th><th>Loại</th><th>Kênh</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>
     {loading?<tr><td colSpan={5}>Đang tải nội dung…</td></tr>:
      visible.length===0?<tr><td colSpan={5}>Chưa có nội dung. Chọn Thêm nội dung để tạo bản nháp.</td></tr>:
      visible.map(item=><tr key={item.id}>
       <td><strong>{item.title}</strong><small>{item.slug}</small></td>
       <td>{LABELS[item.kind]}</td>
       <td>{item.channel_targets.map(ch=>CHANNELS.find(c=>c.code===ch)?.label).join(", ")||"Chưa chọn"}</td>
       <td>{item.status==="published"?"Đã xuất bản":item.status==="hidden"?"Đã ẩn":"Bản nháp"}</td>
       <td><div className="cms-row-actions">
        <button type="button" className="fb-ui-button cms-secondary"
         disabled={busy||opening||item.status==="published"} onClick={()=>void openEditor(item)}>Sửa</button>
        {item.status==="published"?
         <button type="button" className="fb-ui-button cms-secondary" disabled={busy}
          onClick={()=>void change(item,"hide")}>Ẩn</button>:
         <button type="button" className="fb-ui-button cms-primary" disabled={busy}
          onClick={()=>void change(item,"publish")}>Xuất bản</button>}
       </div></td>
      </tr>)
     }
    </tbody>
   </table>
  </div>
  <div className="cms-actions" aria-label="Phân trang nội dung">
   <button type="button" className="fb-ui-button cms-secondary" disabled={loading||busy||page===1}
    onClick={()=>setPage(v=>v-1)}>Trang trước</button>
   <span>Trang {page}</span>
   <button type="button" className="fb-ui-button cms-secondary" disabled={loading||busy||!hasNext}
    onClick={()=>setPage(v=>v+1)}>Trang sau</button>
  </div>
  <p className="cms-help">Nội dung đang xuất bản cần Ẩn trước khi sửa. Các thay đổi đều lưu lịch sử và chống ghi đè phiên khác.
   Chưa có dữ liệu thực thì Website tiếp tục giữ trạng thái hiện tại.</p>
  {editing!==undefined&&<ProductModal title={editing?"Sửa "+LABELS[editing.kind]:"Thêm nội dung"}
   onClose={()=>setEditing(undefined)} wide locked={busy||editorSaving}
   beforeClose={()=>!editorDirtyRef.current || window.confirm("Nội dung chưa lưu. Anh có muốn đóng mà không lưu?")}>
   <CmsEditor item={editing} kind={editing?.kind||kind} dirtyRef={editorDirtyRef}
    onSavingChange={setEditorSaving}
    onSaved={()=>{notify(editing?"Đã lưu nội dung.":"Đã tạo bản nháp.");
     if(editing===null&&page!==1)setPage(1);else void refresh();}}/>
  </ProductModal>}
 </div>;
}
