"use client";
import {useEffect,useState} from "react";
import AdminToast from "./admin-toast";

export type CmsChannel="public_web"|"dealer_app"|"consumer_app";
export type CmsDevice="desktop"|"mobile";
export type CmsStagedImage={file:File;url:string};
export type CmsPendingImages=Record<string,CmsStagedImage>;
type Media={channel:CmsChannel;device:CmsDevice;width:number;height:number;updated_at:string};
const CHANNEL_NAMES:Record<CmsChannel,string>={
 public_web:"Website",dealer_app:"App đại lý",consumer_app:"App người tiêu dùng"
};
export const cmsMediaKey=(ch:CmsChannel,device:CmsDevice)=>ch+":"+device;
async function bearerToken(){
 const res=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 if(!res.ok)throw Error("Phiên đăng nhập đã hết hạn.");
 const data=(await res.json()) as {token?:unknown};
 if(typeof data.token!=="string"||!data.token)throw Error("Không xác thực được Owner.");
 return data.token;
}
async function convertToWebP(file:File,longest:number){
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5*1024*1024)
  throw Error("Ảnh phải là JPG/PNG/WebP, dung lượng tối đa 5 MB.");
 const bitmap=await createImageBitmap(file);
 try{
  if(Math.min(bitmap.width,bitmap.height)<64)throw Error("Ảnh cần có mỗi chiều tối thiểu 64 px.");
  const ratio=Math.min(1,longest/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");
  const width=Math.round(bitmap.width*ratio),height=Math.round(bitmap.height*ratio);
  if(width<64||height<64)throw Error("Ảnh quá dài hoặc quá hẹp cho thiết bị này. Chọn ảnh có tỷ lệ phù hợp để không bị méo.");
  canvas.width=width;
  canvas.height=height;
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("Trình duyệt không hỗ trợ xử lý ảnh.");
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const image=await new Promise<Blob>((resolve,reject)=>
   canvas.toBlob(x=>x?resolve(x):reject(Error("Không chuyển được ảnh sang WebP.")),"image/webp",0.84));
  if(image.type!=="image/webp"||image.size>5*1024*1024)throw Error("Không thể nén ảnh trong giới hạn 5 MB.");
  return image;
 }finally{bitmap.close();}
}
export async function uploadCmsImage(id:string,revision:number,ch:CmsChannel,device:CmsDevice,file:File){
 const bytes=await convertToWebP(file,device==="mobile"?1100:2000);
 const token=await bearerToken();
 const res=await fetch("/api/cms/image-upload",{
  method:"POST",credentials:"same-origin",cache:"no-store",
  headers:{Authorization:"Bearer "+token,"Content-Type":"image/webp",
   "X-CMS-ID":id,"X-CMS-Channel":ch,"X-CMS-Device":device,"X-CMS-Revision":String(revision)},
  body:bytes
 });
 const value=(await res.json().catch(()=>({}))) as {data?:{revision:number};error?:{code:string}};
 if(!res.ok||!Number.isSafeInteger(value.data?.revision)){
  if(res.status===409)throw Error("Ảnh đã bị thay đổi ở phiên khác. Tải lại nội dung trước khi lưu.");
  throw Error("Lưu ảnh "+CHANNEL_NAMES[ch]+" "+device+" thất bại ("+(value.error?.code??res.status)+").");
 }
 return value.data!.revision;
}
async function getAssets(id:string){
 const token=await bearerToken();
 const res=await fetch("/api/cms/assets?id="+encodeURIComponent(id),{
  credentials:"same-origin",cache:"no-store",headers:{Authorization:"Bearer "+token}
 });
 if(!res.ok)throw Error("Không đọc được ảnh CMS trên R2.");
 const data=(await res.json()) as {data?:{items?:Media[]}};
 if(!Array.isArray(data.data?.items))throw Error("Danh sách ảnh trả về không hợp lệ.");
 return data.data.items;
}
export function CmsPrivateImage({id,channel,device,stamp}:{
 id:string;channel:CmsChannel;device:CmsDevice;stamp:string
}){
 const [url,setUrl]=useState<string|null>(null);
 useEffect(()=>{
  let active=true;let activeUrl:string|null=null;
  const run=async()=>{
   try{
    const token=await bearerToken();
    const res=await fetch("/api/cms/image?id="+encodeURIComponent(id)+
     "&channel="+channel+"&device="+device,{
      credentials:"same-origin",cache:"no-store",headers:{Authorization:"Bearer "+token}
     });
    if(!res.ok||res.headers.get("content-type")?.split(";")[0]!=="image/webp")return;
    const blob=await res.blob();
    if(blob.size>5*1024*1024)return;
    activeUrl=URL.createObjectURL(blob);
    if(active)setUrl(activeUrl);
   }catch{/* Private preview stays blank if this asset does not exist. */}
  };
  void run();
  return()=>{active=false;if(activeUrl)URL.revokeObjectURL(activeUrl);};
 },[id,channel,device,stamp]);
 return url?<img className="cms-media-image" src={url} alt={"Ảnh "+CHANNEL_NAMES[channel]+" "+device}/>:
  <span className="cms-media-placeholder">Chưa có ảnh</span>;
}
export function CmsImagePreview({recordId,revision,channel,device,pending}:{
 recordId:string|null;revision:number;channel:CmsChannel;device:CmsDevice;pending?:CmsStagedImage
}){
 if(pending)return <img className="cms-media-image" src={pending.url} alt={"Ảnh đang chọn "+device}/>;
 if(recordId)return <CmsPrivateImage key={recordId+":"+channel+":"+device+":"+revision}
  id={recordId} channel={channel} device={device} stamp={String(revision)}/>;
 return <span className="cms-media-placeholder">Chọn ảnh để xem trước</span>;
}
export default function CmsMediaEditor({recordId,revision,channels,pending,onStage,disabled}:{
 recordId:string|null;revision:number;channels:CmsChannel[];
 pending:CmsPendingImages;onStage:(channel:CmsChannel,device:CmsDevice,file:File)=>void;disabled:boolean;
}){
 const [assets,setAssets]=useState<Media[]>([]);
 const [error,setError]=useState("");
 const [notificationId,setNotificationId]=useState(0);
 useEffect(()=>{
  if(!recordId)return;
  let active=true;
  const job=window.setTimeout(()=>{
   void getAssets(recordId).then(items=>{if(active)setAssets(items);}).catch(()=>{
    if(active){setError("Không tải được danh sách ảnh đã lưu.");setNotificationId(v=>v+1);}
   });
  },0);
  return()=>{active=false;window.clearTimeout(job);};
 },[recordId,revision]);
 return <section className="cms-media-panel" aria-label="Ảnh theo kênh và thiết bị">
  <AdminToast variant="error" message={error} notificationId={notificationId} onClose={()=>setError("")}/>
  <div className="cms-section-heading">
   <strong>Ảnh desktop và mobile theo từng kênh</strong>
   <p>Chọn ảnh ngay, không cần lưu nháp trước. Khi bấm Lưu, ảnh sẽ được chuyển sang WebP và lưu vào R2.</p>
  </div>
  {channels.length===0?<p className="cms-help">Chọn kênh hiển thị ở bước 2 để thêm ảnh.</p>:
  <div className="cms-media-grid">
   {channels.flatMap(ch=>(["desktop","mobile"] as CmsDevice[]).map(device=>{
    const key=cmsMediaKey(ch,device);
    const staged=pending[key],stored=assets.find(a=>a.channel===ch&&a.device===device);
    return <div className="cms-media-slot" key={key}>
     <div className="cms-media-title"><strong>{CHANNEL_NAMES[ch]}</strong>
      <span>{device==="desktop"?"Desktop":"Mobile"}</span>
     </div>
     <div className={"cms-media-canvas"+(device==="mobile"?" cms-media-canvas--mobile":"")}>
      {staged||stored?<CmsImagePreview recordId={recordId} revision={revision}
       channel={ch} device={device} pending={staged}/>:
       <span className="cms-media-placeholder">Chưa chọn ảnh {device}</span>}
     </div>
     <label className="fb-ui-button fb-ui-button--secondary cms-media-upload">
      <span>{staged?"Đổi ảnh đang chọn":stored?"Thay ảnh":"Chọn ảnh"}</span>
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled}
       onChange={e=>{
        const file=e.target.files?.[0];e.currentTarget.value="";
        if(!file)return;
        if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5*1024*1024){
         setError("Ảnh phải là JPG/PNG/WebP dưới 5 MB.");setNotificationId(v=>v+1);return;
        }
        onStage(ch,device,file);
       }}/>
     </label>
     <small>{staged?"Đã chọn · sẽ tải lên khi Lưu":stored?
      stored.width+" × "+stored.height+" px · đã lưu R2":"JPG/PNG/WebP · tối đa 5 MB"}</small>
    </div>;
   }))}
  </div>}
 </section>;
}
