"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import AdminToast from "./admin-toast";

type Settings={popupEnabled:boolean;buttonEnabled:boolean;firstDelayMs:number;cooldownMinutes:number;
 title:string;message:string;iosUrl:string|null;androidUrl:string|null;revision:number};
function clone(saved:Settings):Settings{return {...saved};}
async function appDownloadRequest(body?:object):Promise<Settings>{
 const auth=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 if(!auth.ok)throw Error("Phiên đăng nhập đã hết hạn.");
 const jwt=await auth.json().catch(()=>({})) as {token?:unknown};
 if(typeof jwt.token!=="string"||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jwt.token))
  throw Error("Không xác thực được Owner.");
 const response=await fetch("/api/website/app-download",{
  method:body?"POST":"GET",credentials:"same-origin",cache:"no-store",
  headers:{Authorization:"Bearer "+jwt.token,Accept:"application/json",
   ...(body?{"Content-Type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 const result=await response.json().catch(()=>({})) as {data?:{settings?:Settings};error?:{code?:string}};
 if(!response.ok){
  if(response.status===409)throw Error("Thiết lập đã thay đổi. Bấm Tải lại trước khi lưu.");
  if(response.status===403)throw Error("Chỉ Owner được quản lý popup tải App.");
  if(response.status===400)throw Error("Cấu hình không hợp lệ. Kiểm tra thời gian và link cửa hàng.");
  if(result.error?.code==="worker_not_deployed")throw Error("Admin Worker chưa phát hành cấu hình popup tải App.");
  throw Error("Chưa kết nối được API popup tải App. Không có thay đổi nào được lưu.");
 }
 if(!result.data?.settings||typeof result.data.settings.revision!=="number")
  throw Error("Phản hồi cấu hình không hợp lệ.");
 return result.data.settings;
}
const acceptedLink=(url:string,platform:"ios"|"android")=>{
 if(!url)return true;
 try{
  const u=new URL(url);
  if(u.protocol!=="https:"||u.username||u.password||u.port||u.hash||u.searchParams.has("redirect"))return false;
  if(platform==="ios")return u.hostname==="apps.apple.com"&&u.pathname.length>2;
  return u.hostname==="play.google.com"&&u.pathname==="/store/apps/details"&&
   /^[a-zA-Z0-9_.]+$/.test(u.searchParams.get("id")||"");
 }catch{return false;}
};
export default function AppDownloadSettingsManager({owner}:{owner:boolean}){
 const [saved,setSaved]=useState<Settings|null>(null);
 const [draft,setDraft]=useState<Settings|null>(null);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [toast,setToast]=useState("");
 const [toastKind,setToastKind]=useState<"success"|"error">("success");
 const [toastId,setToastId]=useState(0);
 const patch=<K extends keyof Settings>(key:K,value:Settings[K])=>
  setDraft(current=>current?{...current,[key]:value}:null);
 const notify=(text:string,kind:"success"|"error")=>{
  setToast(text);setToastKind(kind);setToastId(n=>n+1);
 };
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{const value=await appDownloadRequest();setSaved(clone(value));setDraft(clone(value));}
  catch(e){setError(e instanceof Error?e.message:"Không tải được cấu hình.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{
  if(!owner)return;
  let active=true;void Promise.resolve().then(()=>{if(active)void load();});
  return ()=>{active=false;};
 },[owner,load]);
 const dirty=useMemo(()=>Boolean(saved&&draft&&JSON.stringify(saved)!==JSON.stringify(draft)),[saved,draft]);
 async function save(){
  if(!draft||!saved||saving)return;
  const next={...draft,title:draft.title.trim(),message:draft.message.trim(),
   iosUrl:draft.iosUrl?.trim()||null,androidUrl:draft.androidUrl?.trim()||null};
  if(next.title.length<1||next.title.length>80||next.message.length<1||next.message.length>240||
   !Number.isSafeInteger(next.firstDelayMs)||next.firstDelayMs<500||next.firstDelayMs>15000||
   !Number.isSafeInteger(next.cooldownMinutes)||next.cooldownMinutes<30||next.cooldownMinutes>1440||
   !acceptedLink(next.iosUrl||"","ios")||!acceptedLink(next.androidUrl||"","android")){
   notify("Vui lòng kiểm tra nội dung, thời gian hoặc link App Store/CH Play.","error");return;
  }
  setSaving(true);
  try{
   const updated=await appDownloadRequest({operation:"save",...next,revision:saved.revision});
   setSaved(clone(updated));setDraft(clone(updated));
   notify("Đã lưu. Popup Website đọc cấu hình mới khi khách mở trang.","success");
  }catch(e){notify(e instanceof Error?e.message:"Không lưu được cấu hình.","error");}
  finally{setSaving(false);}
 }
 if(!owner)return <section className="surface"><h1>Popup tải ứng dụng</h1><p>Chỉ Owner được quản lý.</p></section>;
 return <div className="appdl-layout">
  <div className="page-title"><div><h1>Popup tải ứng dụng</h1>
   <p>Thiết lập thật cho nút Tải ứng dụng và lời mời tự động trên Website; không phải popup CMS quảng bá.</p></div>
   <div className="action-row">
    <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={loading||saving} onClick={()=>void load()}>Tải lại</button>
    <button type="button" className="fb-ui-button fb-ui-button--primary" disabled={!dirty||saving||loading} onClick={()=>void save()}>{saving?"Đang lưu…":"Lưu cấu hình"}</button>
   </div>
  </div>
  {error&&<p className="surface appdl-error" role="alert">{error}</p>}
  {loading&&<section className="surface appdl-panel" aria-busy="true" role="status">Đang tải cấu hình từ Admin Worker…</section>}
  {!loading&&draft&&<div className="appdl-columns">
   <section className="surface appdl-panel">
    <h2>Hiển thị và thời gian</h2>
    <label className="appdl-check"><input type="checkbox" checked={draft.popupEnabled} disabled={saving} onChange={e=>patch("popupEnabled",e.target.checked)}/> <span><strong>Bật lời mời tự động</strong><small>Tắt là ngừng tự bật popup, không ảnh hưởng popup CMS khác.</small></span></label>
    <label className="appdl-check"><input type="checkbox" checked={draft.buttonEnabled} disabled={saving} onChange={e=>patch("buttonEnabled",e.target.checked)}/> <span><strong>Hiện nút Tải ứng dụng</strong><small>Nút ở menu/footer để khách tự mở popup.</small></span></label>
    <div className="appdl-grid">
     <label>Chờ lần đầu (mili giây)<input className="fb-ui-field" type="number" min={500} max={15000} step={100} disabled={saving} value={draft.firstDelayMs} onChange={e=>patch("firstDelayMs",Number(e.target.value))}/></label>
     <label>Không lặp trong (phút)<input className="fb-ui-field" type="number" min={30} max={1440} step={1} disabled={saving} value={draft.cooldownMinutes} onChange={e=>patch("cooldownMinutes",Number(e.target.value))}/></label>
    </div>
    <p className="appdl-note">Mặc định: 1,4 giây và 120 phút. Catalogue/Chính sách bảo mật không có popup tự động.</p>
    <h2>Nội dung popup</h2>
    <label className="appdl-field">Tiêu đề<input className="fb-ui-field" value={draft.title} maxLength={80} disabled={saving} onChange={e=>patch("title",e.target.value)}/></label>
    <label className="appdl-field">Mô tả<textarea className="fb-ui-field" rows={3} maxLength={240} disabled={saving} value={draft.message} onChange={e=>patch("message",e.target.value)}/></label>
   </section>
   <section className="surface appdl-panel">
    <h2>Liên kết cửa hàng chính thức</h2>
    <p className="appdl-note">Chưa có link thì cửa hàng hiển thị “Sắp có”, không dẫn sang đường link giả.</p>
    <label className="appdl-field">iOS — App Store<input className="fb-ui-field" type="url" value={draft.iosUrl||""} disabled={saving} maxLength={500} placeholder="https://apps.apple.com/…" onChange={e=>patch("iosUrl",e.target.value||null)}/></label>
    <label className="appdl-field">Android — CH Play<input className="fb-ui-field" type="url" value={draft.androidUrl||""} disabled={saving} maxLength={500} placeholder="https://play.google.com/store/apps/details?id=…" onChange={e=>patch("androidUrl",e.target.value||null)}/></label>
    <div className="appdl-preview" aria-label="Xem trước nội dung popup">
     <small>Bản xem trước nội dung · chưa phải thao tác xuất bản</small>
     <strong>{draft.title||"Ứng dụng Futurebook"}</strong>
     <div><span>iOS: {draft.iosUrl?"Có link":"Sắp có"}</span><span>CH Play: {draft.androidUrl?"Có link":"Sắp có"}</span></div>
     <p>{draft.message}</p>
    </div>
    <p className="appdl-note">Revision đang lưu: {saved?.revision}. Nếu người khác vừa lưu, Admin yêu cầu tải lại để không ghi đè.</p>
   </section>
  </div>}
  <AdminToast message={toast} variant={toastKind} notificationId={toastId} onClose={()=>setToast("")}/>
 </div>;
}
