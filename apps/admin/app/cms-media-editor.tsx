"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import AdminToast from "./admin-toast";

type CmsChannel="public_web"|"dealer_app"|"consumer_app";
type CmsDevice="desktop"|"mobile";
type Media={channel:CmsChannel;device:CmsDevice;width:number;height:number;updated_at:string};
const CHANNEL_NAMES:Record<CmsChannel,string>={
 public_web:"Website",dealer_app:"App đại lý",consumer_app:"App người tiêu dùng"
};
async function token(){
 const res=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 if(!res.ok)throw Error("Phiên đăng nhập đã hết hạn.");
 const t=(await res.json()) as {token?:unknown};
 if(typeof t.token!=="string")throw Error("Không có phiên Owner hợp lệ.");
 return t.token;
}
async function getAssets(id:string){
 const bearer=await token();
 const res=await fetch("/api/cms/assets?id="+encodeURIComponent(id),{
  cache:"no-store",credentials:"same-origin",headers:{Authorization:"Bearer "+bearer}
 });
 if(!res.ok)throw Error("Không tải được thư viện ảnh CMS.");
 return (await res.json()).data as {items:Media[]};
}
async function convertToWebP(file:File,longest:number){
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5*1024*1024)
  throw Error("Chỉ nhận JPG/PNG/WebP dưới 5MB.");
 const bitmap=await createImageBitmap(file);
 try{
  if(Math.min(bitmap.width,bitmap.height)<64)throw Error("Ảnh phải lớn hơn 64px.");
  const ratio=Math.min(1,longest/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.round(bitmap.width*ratio);
  canvas.height=Math.round(bitmap.height*ratio);
  const ctx=canvas.getContext("2d");
  if(!ctx)throw Error("Không thể xử lý ảnh trên thiết bị.");
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const blob=await new Promise<Blob>((resolve,reject)=>
   canvas.toBlob(result=>result?resolve(result):reject(Error("Không xuất được WebP.")),"image/webp",0.84));
  if(blob.type!=="image/webp"||blob.size>5*1024*1024)throw Error("Ảnh WebP không hợp lệ.");
  return blob;
 }finally{bitmap.close();}
}
function CmsPrivateImage({id,channel,device,stamp}:{id:string;channel:CmsChannel;device:CmsDevice;stamp:string}){
 const [url,setUrl]=useState<string|null>(null);
 useEffect(()=>{
  let active=true;
  let blobUrl:string|null=null;
  const run=async()=>{
   try{
    const bearer=await token();
    const res=await fetch("/api/cms/image?id="+encodeURIComponent(id)+"&channel="+channel+"&device="+device,{
     credentials:"same-origin",cache:"no-store",headers:{Authorization:"Bearer "+bearer}
    });
    if(!res.ok||res.headers.get("content-type")?.split(";")[0]!=="image/webp")return;
    const file=await res.blob();
    if(file.size>5*1024*1024)return;
    blobUrl=URL.createObjectURL(file);
    if(active)setUrl(blobUrl);
   }catch{/* Keep a clear placeholder when private preview is unavailable. */}
  };
  void run();
  return()=>{active=false;if(blobUrl)URL.revokeObjectURL(blobUrl);};
 },[id,channel,device,stamp]);
 return url?<img className="cms-media-image" src={url} alt={"Ảnh "+CHANNEL_NAMES[channel]+" "+device}/>:
  <span className="cms-media-placeholder">Ảnh chưa tải được</span>;
}
export default function CmsMediaEditor({id,revision,channels,onRevision,onBusyChange}:{
 id:string|null;revision:number;channels:CmsChannel[];
 onRevision:(revision:number)=>void;onBusyChange:(busy:boolean)=>void;
}){
 const [items,setItems]=useState<Media[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [notificationId,setNotificationId]=useState(0);
 const fileInputs=useRef<Record<string,HTMLInputElement|null>>({});
 const refresh=useCallback(async()=>{
  if(!id)return;
  const result=await getAssets(id);
  setItems(result.items);
 },[id]);
 useEffect(()=>{
  const handle=window.setTimeout(()=>{void refresh().catch(()=>{
   setError("Không tải được ảnh CMS. Kiểm tra kết nối API.");setNotificationId(v=>v+1);
  });},0);
  return()=>window.clearTimeout(handle);
 },[refresh]);
 const upload=async(channel:CmsChannel,device:CmsDevice,file:File|undefined)=>{
  if(!id||!file||busy)return;
  setBusy(true);onBusyChange(true);setError("");setMessage("");
  try{
   const image=await convertToWebP(file,device==="mobile"?1100:2000);
   const bearer=await token();
   const res=await fetch("/api/cms/image-upload",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{Authorization:"Bearer "+bearer,"Content-Type":"image/webp",
     "X-CMS-ID":id,"X-CMS-Channel":channel,"X-CMS-Device":device,
     "X-CMS-Revision":String(revision)},
    body:image
   });
   const data=(await res.json().catch(()=>({}))) as {data?:{revision:number};error?:{code:string}};
   if(!res.ok||typeof data.data?.revision!=="number"||!Number.isSafeInteger(data.data.revision))
    throw Error(res.status===409?"Nội dung đã thay đổi. Tải lại bản nháp trước khi thay ảnh.":
     "Không tải được ảnh lên R2. "+(data.error?.code||""));
   onRevision(data.data!.revision);
   await refresh();
   setMessage("Đã lưu ảnh "+(device==="desktop"?"desktop":"mobile")+" vào kho R2 riêng.");
   setNotificationId(v=>v+1);
  }catch(e){
   setError(e instanceof Error?e.message:"Không tải được ảnh lên R2.");
   setNotificationId(v=>v+1);
  }finally{
   const node=fileInputs.current[channel+":"+device];
   if(node)node.value="";
   setBusy(false);onBusyChange(false);
  }
 };
 return <section className="cms-media-panel" aria-label="Ảnh theo kênh và thiết bị">
  <AdminToast variant={error?"error":"success"} message={error||message}
   notificationId={notificationId} onClose={()=>{setError("");setMessage("");}}/>
  <div className="cms-section-heading"><strong>Ảnh theo kênh & thiết bị</strong>
   <p>Mỗi kênh dùng ảnh desktop và mobile riêng. Ảnh lưu trong R2, không trộn với ảnh SKU.</p>
  </div>
  {!id?<p className="cms-help">Lưu bản nháp trước để kích hoạt tải ảnh tại đây.</p>:
   channels.length===0?<p className="cms-help">Chọn kênh hiển thị và lưu lại trước khi tải ảnh.</p>:
   <div className="cms-media-grid">
    {channels.flatMap(ch=>(["desktop","mobile"] as CmsDevice[]).map(device=>{
     const asset=items.find(a=>a.channel===ch&&a.device===device);
     const identifier=ch+":"+device;
     return <div className="cms-media-slot" key={identifier}>
      <div className="cms-media-title"><strong>{CHANNEL_NAMES[ch]}</strong>
       <span>{device==="desktop"?"Desktop":"Mobile"}</span></div>
      <div className={"cms-media-canvas"+(device==="mobile"?" cms-media-canvas--mobile":"")}>
       {asset?<CmsPrivateImage id={id} channel={ch} device={device} stamp={asset.updated_at}/>:
        <span className="cms-media-placeholder">Chưa có ảnh {device==="desktop"?"desktop":"mobile"}</span>}
      </div>
      <label className="fb-ui-button fb-ui-button--secondary cms-media-upload">
       <span>{asset?"Thay ảnh":"Chọn ảnh"}</span>
       <input ref={node=>{fileInputs.current[identifier]=node;}}
        type="file" accept="image/jpeg,image/png,image/webp" disabled={busy}
        onChange={e=>void upload(ch,device,e.target.files?.[0])}/>
      </label>
      <small>{asset?asset.width+" × "+asset.height+" px":"JPG/PNG/WebP · tối đa 5MB"}</small>
     </div>;
    }))}
   </div>}
 </section>;
}
