"use client";

import {useEffect,useState} from "react";
import type {CmsDevice,CmsPendingImages,CmsStagedImage} from "./cms-media-editor";
import {bearerToken,convertToWebP} from "./cms-media-editor";
import AdminToast from "./admin-toast";

type SlideAsset={slide_no:number;device:CmsDevice;width:number;height:number;updated_at:string};
export type CmsSlideSettings={enabled:boolean;autoplay:boolean;effect:"fade"|"slide"|"fade-slide";
 interval_ms:number;duration_ms:number;slide_order:number[]};
type Settings=CmsSlideSettings;
type SlideResponse={revision:number;settings:Settings;images:SlideAsset[]};
const DEFAULT:Settings={enabled:true,autoplay:true,effect:"fade-slide",
 interval_ms:7000,duration_ms:480,slide_order:[1,2,3,4,5]};
const extraKey=(slide:number,device:CmsDevice)=>slide+":"+device;
async function slidesApi<T>(action:string,method:"GET"|"POST",params?:string,body?:object):Promise<T>{
 const token=await bearerToken();
 const response=await fetch("/api/cms/"+action+(params||""),{
  method,credentials:"same-origin",cache:"no-store",
  headers:{Authorization:"Bearer "+token,
   ...(method==="POST"?{"Content-Type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 const data=(await response.json().catch(()=>({}))) as {data?:T;error?:{code:string}};
 if(!response.ok||!data.data)
  throw Error(response.status===409?"Dữ liệu đã đổi hoặc Banner đang xuất bản. Tải lại trước khi sửa.":
   "Không lưu được Slide ("+(data.error?.code||response.status)+").");
 return data.data;
}
export async function saveCmsSlideSettings(id:string,revision:number,settings:CmsSlideSettings){
 return slidesApi<{revision:number}>("slide-settings","POST",undefined,{
  id,expectedRevision:revision,
  enabled:settings.enabled,autoplay:settings.autoplay,effect:settings.effect,
  intervalMs:settings.interval_ms,durationMs:settings.duration_ms,order:settings.slide_order
 });
}
export async function uploadCmsSlide(id:string,revision:number,slide:number,device:CmsDevice,file:File){
 if(slide<2||slide>5||!Number.isInteger(slide))throw Error("Số Slide không hợp lệ");
 const bytes=await convertToWebP(file,device==="mobile"?1100:2000);
 const token=await bearerToken();
 const response=await fetch("/api/cms/slide-upload",{
  method:"POST",credentials:"same-origin",cache:"no-store",
  headers:{Authorization:"Bearer "+token,"Content-Type":"image/webp","X-CMS-ID":id,
   "X-CMS-Slide":String(slide),"X-CMS-Device":device,"X-CMS-Revision":String(revision)},
  body:bytes
 });
 const result=(await response.json().catch(()=>({}))) as {data?:{revision:number};error?:{code:string}};
 if(!response.ok||!Number.isInteger(result.data?.revision))
  throw Error(response.status===409?"Slide đã đổi ở phiên khác. Tải lại Banner trước khi lưu.":
   "Lưu Slide "+slide+" "+device+" lỗi ("+(result.error?.code||response.status)+").");
 return result.data!.revision;
}
export function CmsSlideImagePreview({recordId,revision,slide,device,pending}:{
 recordId:string|null;revision:number;slide:number;device:CmsDevice;pending?:CmsStagedImage
}){
 const [url,setUrl]=useState<string|null>(null);
 useEffect(()=>{
  if(!recordId||slide<2)return;
  let alive=true,obj:string|null=null;const controller=new AbortController();
  void (async()=>{
   try{
    const token=await bearerToken();
    const response=await fetch("/api/cms/slide-image?id="+encodeURIComponent(recordId)+
     "&slide="+slide+"&device="+device,{credentials:"same-origin",cache:"no-store",
      headers:{Authorization:"Bearer "+token},signal:controller.signal});
    if(!response.ok||response.headers.get("content-type")?.split(";")[0]!=="image/webp")return;
    const blob=await response.blob();
    if(blob.size>5*1024*1024)return;
    obj=URL.createObjectURL(blob);
    if(alive)setUrl(obj);
   }catch{/* Fail closed: no private image on error. */}
  })();
  return()=>{alive=false;controller.abort();if(obj)URL.revokeObjectURL(obj);};
 },[recordId,revision,slide,device]);
 if(pending)return <img className="cms-media-image" src={pending.url}
  alt={"Ảnh Slide "+slide+" "+device+" đang chọn"}/>;
 return url?<img className="cms-media-image" src={url} alt={"Ảnh Slide "+slide+" "+device}/>:
  <span className="cms-media-placeholder">Chưa có ảnh Slide {slide}</span>;
}
export default function CmsSlideEditor({recordId,revision,disabled,pending,onStage,
 onRevision,onUpdated,previewSlide,onPreviewSlide,settingsDraft,onSettingsDraft}:{
 recordId:string|null;revision:number;disabled:boolean;
 pending:CmsPendingImages;
 onStage:(slide:number,device:CmsDevice,file:File)=>void;
 onRevision:(revision:number)=>void;onUpdated:()=>void;
 previewSlide:number;onPreviewSlide:(slide:number)=>void;
 settingsDraft?:CmsSlideSettings|null;onSettingsDraft:(value:CmsSlideSettings|null)=>void
}){
 const [assets,setAssets]=useState<SlideAsset[]>([]);
 const [added,setAdded]=useState<number[]>([]);
 const [settings,setSettings]=useState<Settings>(()=>settingsDraft??DEFAULT);
 const settingsDirty=Boolean(settingsDraft);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState(""),[notificationId,setNotificationId]=useState(0);
 useEffect(()=>{
  if(!recordId)return;
  let alive=true;
  void slidesApi<SlideResponse>("slides","GET","?id="+encodeURIComponent(recordId))
   .then(result=>{if(!alive)return;
    setAssets(result.images);
    if(!settingsDirty){
     setSettings({...DEFAULT,...result.settings,
      slide_order:result.settings.slide_order??DEFAULT.slide_order});
    }
   })
   .catch(ex=>{if(alive){setError(ex instanceof Error?ex.message:"Không tải được Slide.");
    setNotificationId(v=>v+1);}});
  return()=>{alive=false;};
 },[recordId,revision,settingsDirty]);
 const known=new Set([
  1,...assets.map(a=>a.slide_no),...added,
  ...Object.keys(pending).map(key=>Number(key.split(":")[0])).filter(n=>n>=2&&n<=5)
 ]);
 const slides=[...known].sort((a,b)=>
  settings.slide_order.indexOf(a)-settings.slide_order.indexOf(b));
 const canEdit=Boolean(recordId)&&!disabled&&!saving;
 const change=(patch:Partial<Settings>)=>{const next={...settings,...patch};setSettings(next);onSettingsDraft(next);};
 const orderMove=(slide:number,step:-1|1)=>{
  const current=settings.slide_order.indexOf(slide),next=current+step;
  if(next<0||next>=5)return;
  const arr=[...settings.slide_order];[arr[current],arr[next]]=[arr[next],arr[current]];
  change({slide_order:arr});
 };
 const saveSettings=async()=>{
  if(!recordId||!canEdit)return;
  setSaving(true);setError("");
  try{
   const result=await saveCmsSlideSettings(recordId,revision,settings);
   onSettingsDraft(null);onRevision(result.revision);onUpdated();
  }catch(ex){setError(ex instanceof Error?ex.message:"Không lưu được motion.");setNotificationId(v=>v+1);}
  finally{setSaving(false);}
 };
 const remove=async(slide:number)=>{
  if(!recordId||!canEdit||slide===1)return;
  if(assets.some(a=>a.slide_no===slide)&&!window.confirm("Xóa cả ảnh Desktop/Mobile của Slide "+slide+"?"))return;
  if(!assets.some(a=>a.slide_no===slide)){setAdded(prev=>prev.filter(n=>n!==slide));return;}
  setSaving(true);setError("");
  try{
   const result=await slidesApi<{revision:number}>("slide-remove","POST",undefined,{
    id:recordId,expectedRevision:revision,slide
   });
   setAssets(prev=>prev.filter(a=>a.slide_no!==slide));
   setAdded(prev=>prev.filter(n=>n!==slide));
   onPreviewSlide(1);
   onRevision(result.revision);onUpdated();
  }catch(ex){setError(ex instanceof Error?ex.message:"Không xóa được Slide.");setNotificationId(v=>v+1);}
  finally{setSaving(false);}
 };
 const add=()=>{
  const free=[2,3,4,5].find(n=>!known.has(n));if(!free)return;
  setAdded(prev=>[...prev,free]);onPreviewSlide(free);
 };
 return <section className="cms-slides-editor" aria-label="Bộ ảnh Banner và cấu hình motion">
  <AdminToast variant="error" message={error} notificationId={notificationId}
   onClose={()=>setError("")}/>
  <div className="cms-section-heading">
   <strong>Bộ ảnh Banner · tối đa 5 Slide</strong>
   <p>Slide 1 là ảnh Desktop/Mobile bên trên. Mỗi Slide mới có hai ảnh riêng.
    Ảnh sẽ tải vào R2 khi bấm <b>Lưu bản nháp & ảnh</b>.</p>
  </div>
  <div className="cms-slide-items">
   {slides.map(slide=><div className="cms-slide-item" key={slide}>
    <div className="cms-slide-item-head">
     <strong>Slide {slide}{slide===1?" · ảnh chính":""}</strong>
     <div className="cms-slide-actions">
      <button type="button" className="fb-ui-button fb-ui-button--secondary"
       onClick={()=>onPreviewSlide(slide)} disabled={disabled}
       aria-pressed={previewSlide===slide}>Xem trước</button>
      <button type="button" className="fb-ui-button fb-ui-button--secondary"
       onClick={()=>orderMove(slide,-1)} disabled={disabled||settings.slide_order.indexOf(slide)===0}
       aria-label={"Đưa Slide "+slide+" lên trước"}>↑</button>
      <button type="button" className="fb-ui-button fb-ui-button--secondary"
       onClick={()=>orderMove(slide,1)} disabled={disabled||settings.slide_order.indexOf(slide)===4}
       aria-label={"Đưa Slide "+slide+" xuống sau"}>↓</button>
      {slide>1&&<button type="button" className="fb-ui-button fb-ui-button--secondary"
       disabled={!canEdit||Boolean(pending[extraKey(slide,"desktop")])||
        Boolean(pending[extraKey(slide,"mobile")])}
       onClick={()=>void remove(slide)}>Xóa</button>}
     </div>
    </div>
    {slide===1?<p className="cms-help">Dùng cặp ảnh Desktop/Mobile ở mục Ảnh Website phía trên.</p>:
    <div className="cms-media-grid">
     {(["desktop","mobile"] as CmsDevice[]).map(device=>{
      const key=extraKey(slide,device),stored=assets.find(a=>a.slide_no===slide&&a.device===device);
      return <div className="cms-media-slot" key={key}>
       <div className="cms-media-title"><strong>Slide {slide}</strong>
        <span>{device==="desktop"?"Desktop":"Mobile"}</span></div>
       <div className={"cms-media-canvas"+(device==="mobile"?" cms-media-canvas--mobile":"")}>
        {pending[key]||stored?
         <CmsSlideImagePreview recordId={recordId} revision={revision} slide={slide}
          device={device} pending={pending[key]}/>:
         <span className="cms-media-placeholder">Chưa có ảnh {device}</span>}
       </div>
       <label className="fb-ui-button fb-ui-button--secondary cms-media-upload">
        <span>{pending[key]?"Đổi ảnh đang chọn":stored?"Thay ảnh":"Chọn ảnh"}</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled}
         onChange={event=>{
          const file=event.target.files?.[0];event.currentTarget.value="";
          if(!file)return;
          if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>5*1024*1024){
           setError("Chỉ nhận JPG/PNG/WebP dưới 5 MB.");setNotificationId(n=>n+1);return;
          }
          onStage(slide,device,file);
         }}/>
       </label>
       <small>{pending[key]?"Đã chọn · lưu cùng bản nháp":stored?
        stored.width+" × "+stored.height+" · đã lưu R2":"Chưa tải lên"}</small>
      </div>;
     })}
    </div>}
   </div>)}
  </div>
  <button type="button" className="fb-ui-button fb-ui-button--secondary cms-slide-add"
   disabled={disabled||known.size>=5} onClick={add}>＋ Thêm Slide</button>
  <fieldset className="cms-motion-settings">
   <legend>Thiết lập motion Hero</legend>
   <div className="cms-motion-switches">
    <label><input type="checkbox" checked={settings.enabled} disabled={disabled}
     onChange={event=>change({enabled:event.target.checked})}/> Bật hiệu ứng</label>
    <label><input type="checkbox" checked={settings.autoplay} disabled={disabled}
     onChange={event=>change({autoplay:event.target.checked})}/> Tự chuyển Slide</label>
   </div>
   <div className="cms-form-grid">
    <label>Hiệu ứng
     <select value={settings.effect} disabled={disabled}
      onChange={event=>change({effect:event.target.value as Settings["effect"]})}>
      <option value="fade-slide">Mờ + trượt nhẹ</option>
      <option value="fade">Mờ dần</option>
      <option value="slide">Trượt ngang</option>
     </select>
    </label>
    <label>Chuyển mỗi (giây)
     <input type="number" min={3} max={15} step={1} disabled={disabled}
      value={settings.interval_ms/1000}
      onChange={event=>change({interval_ms:Number(event.target.value)*1000})}/>
    </label>
    <label>Thời gian hiệu ứng (ms)
     <input type="number" min={300} max={800} step={20} disabled={disabled}
      value={settings.duration_ms}
      onChange={event=>change({duration_ms:Number(event.target.value)})}/>
    </label>
   </div>
   <button type="button" className="fb-ui-button fb-ui-button--primary"
    disabled={!canEdit||!settingsDirty||settings.interval_ms<3000||settings.interval_ms>15000||
     settings.duration_ms<300||settings.duration_ms>800}
    onClick={()=>void saveSettings()}>{saving?"Đang lưu…":"Lưu motion & thứ tự"}</button>
   <small>Hệ thống tạm dừng khi rê chuột/focus và tắt tự chạy theo tùy chọn giảm chuyển động.
    {!recordId?" Lưu bản nháp trước khi lưu cấu hình.":""}</small>
  </fieldset>
 </section>;
}
