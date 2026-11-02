"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import AdminToast from "./admin-toast";

type Media={id:string;source_filename:string;mime_type:string;media_role:string;sort_order:number;sku_cong_ty:string;file_sha256:string};
type R2Candidate={key:string;bytes:number|null;status:string;sku?:string;filename?:string};
type Result<T>={data?:T;error?:{code?:string}};
async function token(){
  const response=await fetch("/api/auth/token",{cache:"no-store",credentials:"same-origin"});
  if(!response.ok)throw Error("Phiên Admin đã hết hạn. Hãy đăng nhập lại.");
  const result=await response.json() as {token?:string};
  if(!result.token)throw Error("Không xác thực được tài khoản Admin.");
  return result.token;
}
async function mediaApi<T>(action:string,method:"GET"|"POST"|"PATCH"|"DELETE"="GET",
  body?:object):Promise<T>{
  const key=await token();
  const response=await fetch("/api/media/"+action,{
    method,credentials:"same-origin",cache:"no-store",
    headers:{Authorization:"Bearer "+key,...(body?{"Content-Type":"application/json"}:{})},
    ...(body?{body:JSON.stringify(body)}:{})
  });
  const payload=await response.json() as Result<T>;
  if(!response.ok)throw Error("Không thực hiện được thao tác với ảnh. Vui lòng thử lại.");
  if(!payload.data)throw Error("Chưa nhận được thông tin ảnh. Vui lòng thử lại.");
  return payload.data;
}
async function webpVariant(input:Blob,longest:number):Promise<Blob>{
  const bitmap=await createImageBitmap(input);
  try{
    const ratio=Math.min(1,longest/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(bitmap.width*ratio));
    canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
    const ctx=canvas.getContext("2d",{alpha:true});
    if(!ctx)throw Error("Không tạo được ảnh tối ưu.");
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const image=await new Promise<Blob>((resolve,reject)=>
      canvas.toBlob(blob=>blob?resolve(blob):reject(Error("WebP không được hỗ trợ.")),
        "image/webp",0.82));
    if(image.type!=="image/webp"||image.size>5*1024*1024)
      throw Error("Trình duyệt không hỗ trợ xuất WebP hợp lệ.");
    return image;
  }finally{bitmap.close();}
}
export function PrivateImage({id,alt,signature}:{id:string;alt:string;signature:string}){
  const [src,setSrc]=useState<string|null>(null);
  const [nearViewport,setNearViewport]=useState(false);
  const placeholder=useRef<HTMLSpanElement|null>(null);
  useEffect(()=>{
    const node=placeholder.current;
    if(!node||typeof IntersectionObserver==="undefined"){
      setNearViewport(true);
      return;
    }
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){
        setNearViewport(true);
        observer.disconnect();
      }
    },{rootMargin:"150px"});
    observer.observe(node);
    return()=>observer.disconnect();
  },[id]);
  useEffect(()=>{
    if(!nearViewport)return;
    let active=true;
    let objectUrl:string|null=null;
    (async()=>{
      try{
        const key=await token();
        const response=await fetch("/api/media/file?id="+encodeURIComponent(id),{
          headers:{Authorization:"Bearer "+key},credentials:"same-origin",cache:"no-store"});
        if(!response.ok)throw Error("not_found");
        const blob=await response.blob();
        if(!["image/png","image/jpeg","image/webp"].includes(blob.type)||blob.size>5*1024*1024)
          throw Error("invalid_image");
        const url=URL.createObjectURL(blob);
        if(active){objectUrl=url;setSrc(url);}
        else URL.revokeObjectURL(url);
      }catch{/* Fail to a neutral placeholder, never infer another image. */}
    })();
    return()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[id,signature,nearViewport]);
  return src?<img src={src} alt={alt} loading="lazy" className="catalogue-media-preview"/>:
    <span ref={placeholder} className="catalogue-media-placeholder" role="img" aria-label="Ảnh chưa tải được">▧</span>;
}
export default function CatalogueMediaManager({sku,onChanged,onBusyChange}:{
  sku:string;onChanged:()=>void;onBusyChange?:(busy:boolean)=>void
}){
  const [items,setItems]=useState<Media[]>([]);
  const [candidates,setCandidates]=useState<R2Candidate[]|null>(null);
  const [selectedKeys,setSelectedKeys]=useState<string[]>([]);
  const [scanTruncated,setScanTruncated]=useState(false);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const clearToast=useCallback(()=>setMessage(""),[]);
  const fileInput=useRef<HTMLInputElement>(null);
  const replaceFileInput=useRef<HTMLInputElement>(null);
  const replaceAssetRef=useRef<string|null>(null);
  const refresh=useCallback(async()=>{
    const result=await mediaApi<{items:Media[]}>("list?sku="+encodeURIComponent(sku));
    setItems(result.items);
  },[sku]);
  useEffect(()=>{
    let active=true;
    const start=async()=>{
      try{
        const result=await mediaApi<{items:Media[]}>("list?sku="+encodeURIComponent(sku));
        if(active)setItems(result.items);
      }catch(e){if(active)setError(e instanceof Error?e.message:"Không tải được ảnh.");}
      finally{if(active)setLoading(false);}
    };
    void start();return()=>{active=false;};
  },[sku]);
  useEffect(()=>{onBusyChange?.(busy);return()=>onBusyChange?.(false);},[busy,onBusyChange]);
  async function work(fn:()=>Promise<void>){
    if(busy)return;
    setBusy(true);setError("");setMessage("");
    try{await fn();await refresh();onChanged();}
    catch(e){
      // Earlier files in a multi-upload may already be committed. Always
      // reconcile the gallery and count after a partial batch failure.
      try{await refresh();onChanged();}catch{/* report the original error */}
      setError(e instanceof Error?e.message:"Lỗi cập nhật ảnh.");
    }
    finally{if(fileInput.current)fileInput.current.value="";if(replaceFileInput.current)replaceFileInput.current.value="";replaceAssetRef.current=null;setBusy(false);}
  }
  const upload=(files:FileList|null,replacing:string|null=null)=>void work(async()=>{
    const list=Array.from(files||[]);
    if(!list.length)return;
    if((replacing&&list.length!==1)||list.length>5||
       items.length+list.length-(replacing?1:0)>20)
      throw Error("Tối đa 5 ảnh mỗi lần, 20 mẫu/SKU. Thay ảnh chỉ chọn 1 tệp.");
    let completed=0;
    for(const file of list){
      if(!["image/png","image/jpeg","image/webp"].includes(file.type)||
        file.size<32||file.size>5*1024*1024)
        throw Error("Chỉ nhận JPG/PNG/WebP tối đa 5 MB.");
      const optimized=await webpVariant(file,1600);
      const key=await token();
      const response=await fetch("/api/media/upload",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{Authorization:"Bearer "+key,"Content-Type":"image/webp",
          "X-FBMN-Sku":sku,"X-FBMN-File-Name":encodeURIComponent(file.name.replace(/\.[^.]+$/,"")+".webp"),
          ...(replacing?{"X-FBMN-Asset-ID":replacing}:{})},
        body:optimized
      });
      const result=await response.json() as Result<{id:string}>;
      if(!response.ok)throw Error("Ảnh "+file.name+": "+(result.error?.code||response.status));
      completed++;
    }
    setMessage((replacing?"Đã thay":"Đã lưu")+" "+completed+" ảnh.");
  });
  const scanBucket=()=>void work(async()=>{
    const result=await mediaApi<{items:R2Candidate[];truncated:boolean;scanned:number}>("scan");
    setCandidates(result.items);
    setSelectedKeys([]);
    setScanTruncated(result.truncated);
    setMessage("Đã tìm thấy "+result.scanned+" ảnh trong kho. Chưa gắn ảnh nào.");
  });
  const adoptSelected=()=>void work(async()=>{
    if(!selectedKeys.length)return;
    const chosen=(candidates||[]).filter(x=>selectedKeys.includes(x.key)&&x.status==="matched");
    if(chosen.length!==selectedKeys.length||chosen.length>10)
      throw Error("Mỗi lần chỉ gắn tối đa 10 ảnh khớp chính xác.");
    if(!window.confirm("Gắn "+chosen.length+" ảnh vào các mã sản phẩm đã nhận diện? Ảnh chưa tự hiển thị trên website."))
      return;
    const result=await mediaApi<{count:number;items:{sku:string;asset_id:string}[]}>("adopt","POST",
      {confirm:"GAN_ANH_R2",keys:chosen.map(x=>x.key)});
    setSelectedKeys([]);
    // Re-scan to clear already registered keys; never show stale matches.
    const latest=await mediaApi<{items:R2Candidate[];truncated:boolean}>("scan");
    setCandidates(latest.items);
    setScanTruncated(latest.truncated);
    setMessage("Đã gắn "+result.count+" ảnh đúng mã sản phẩm.");
  });
  const toggleCandidate=(key:string,checked:boolean)=>{
    setSelectedKeys(current=>checked?[...current.filter(x=>x!==key),key].slice(0,10):
      current.filter(x=>x!==key));
  };
  const remove=(asset:Media)=>void work(async()=>{
    if(!window.confirm("Xóa ảnh '"+asset.source_filename+"' của SKU "+sku+
      "? Ảnh sẽ được xóa nếu không còn sản phẩm nào sử dụng."))return;
    const outcome=await mediaApi<{unlinked:boolean;file_deleted:boolean;pending:boolean}>("link","DELETE",{sku_cong_ty:sku,asset_id:asset.id});
    setMessage(outcome.pending?"Đã gỡ ảnh. Có thể dọn ảnh không sử dụng sau.":
      "Đã xóa ảnh không còn được sử dụng.");
  });
  const cleanOrphans=()=>void work(async()=>{
    const r=await mediaApi<{completed:number;remaining:number}>("cleanup","POST",{confirm:"DON_ANH_THUA"});
    setMessage("Đã dọn "+r.completed+" ảnh không còn dùng; "+r.remaining+" ảnh chưa dọn được.");
  });
  const reorder=(ids:string[],cover:string)=>void work(async()=>{
    await mediaApi("order","PATCH",{sku_cong_ty:sku,asset_ids:ids,cover_id:cover});
    setMessage("Đã lưu thứ tự và ảnh đại diện.");
  });
  const ordered=[...items].sort((a,b)=>a.sort_order-b.sort_order);
  const cover=ordered.find(item=>item.media_role==="cover")?.id||ordered[0]?.id;
  return <section className="catalogue-media-manager" aria-label={"Ảnh SKU "+sku}>
    <p><strong>Mã công ty: {sku}.</strong> Có thể tải nhiều ảnh, sắp xếp và chọn ảnh đại diện. Hỗ trợ JPG, PNG và WebP.</p>
    {error&&<div className="import-error" role="alert">{error}</div>}
    <AdminToast message={message} onClose={clearToast}/>
    <div className="catalogue-media-actions">
      <label className="import-btn import-primary catalogue-media-upload">
        + Chọn tối đa 5 ảnh
        <input ref={fileInput} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple disabled={busy} onChange={event=>upload(event.currentTarget.files)}/>
      </label>
      <input ref={replaceFileInput} type="file" hidden
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        disabled={busy} onChange={event=>upload(event.currentTarget.files,replaceAssetRef.current)}/>
      <span>{ordered.length}/20 ảnh</span>
    </div>
    <div className="catalogue-media-actions">
      <button className="import-btn import-secondary" type="button" disabled={busy}
        onClick={scanBucket}>Tìm ảnh có sẵn</button>
      <button className="import-btn import-secondary" type="button" disabled={busy}
        onClick={cleanOrphans}>Dọn file dư</button>
      {selectedKeys.length>0&&<button className="import-btn import-primary"
        type="button" disabled={busy} onClick={adoptSelected}>
        Gắn {selectedKeys.length} ảnh đúng mã
      </button>}
    </div>
    {candidates!==null&&<section className="catalogue-media-library"
      aria-label="Đối chiếu ảnh trong kho">
      <strong>Ảnh chưa gắn: {candidates.length}</strong>
      <p>Ảnh có tên theo mã sản phẩm sẽ được đề xuất ghép. Vui lòng kiểm tra trước khi xác nhận.</p>
      {scanTruncated&&<p role="alert">Kho có quá nhiều ảnh: kết quả tìm kiếm chưa bao quát toàn bộ.
        Không gắn dựa trên kết quả thiếu.</p>}
      <div className="catalogue-media-scan-list" style={{maxHeight:260,overflowY:"auto"}}>
        {candidates.slice(0,1000).map(item=><label key={item.key}
          style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0"}}>
          <input type="checkbox" disabled={busy||item.status!=="matched"||
            (!selectedKeys.includes(item.key)&&selectedKeys.length>=10)}
            checked={selectedKeys.includes(item.key)}
            onChange={event=>toggleCandidate(item.key,event.target.checked)}/>
          <span style={{overflowWrap:"anywhere"}}>
            {item.key.split("/").pop()} · {item.status==="matched"?
              "SKU "+item.sku:item.status==="ambiguous"?"Trùng cách hiểu mã":
              item.status==="unmatched"?"Chưa có mã SKU khớp":item.status==="needs_webp"?"Cần đổi sang WebP":"Không nhận diện"}
          </span>
        </label>)}
      </div>
    </section>}
    {loading&&<p>Đang tải thư viện ảnh…</p>}
    {!loading&&ordered.length===0&&<div className="catalogue-media-empty">
      <span aria-hidden="true">▧</span><p>Chưa có ảnh cho mã {sku}. Có thể bổ sung bất cứ lúc nào.</p>
    </div>}
    <div className="catalogue-media-grid">
      {ordered.map((asset,index)=><article className="catalogue-media-card" key={asset.id}>
        <PrivateImage id={asset.id} signature={asset.file_sha256} alt={"Ảnh "+asset.source_filename+" của "+sku}/>
        <strong title={asset.source_filename}>{asset.source_filename}</strong>
        <label className="catalogue-cover-label">
          <input type="radio" name={"cover-"+sku} checked={asset.id===cover}
            disabled={busy} onChange={()=>reorder(ordered.map(x=>x.id),asset.id)}/> Ảnh đại diện
        </label>
        <div className="catalogue-media-card-controls">
          <button type="button" disabled={busy||index===0}
            aria-label={"Đưa ảnh "+asset.source_filename+" lên trước"}
            onClick={()=>{
              const ids=ordered.map(x=>x.id);[ids[index-1],ids[index]]=[ids[index],ids[index-1]];
              reorder(ids,cover);
            }}>↑</button>
          <button type="button" disabled={busy||index===ordered.length-1}
            aria-label={"Đưa ảnh "+asset.source_filename+" xuống sau"}
            onClick={()=>{
              const ids=ordered.map(x=>x.id);[ids[index+1],ids[index]]=[ids[index],ids[index+1]];
              reorder(ids,cover);
            }}>↓</button>
          <button type="button" disabled={busy} onClick={()=>{
            replaceAssetRef.current=asset.id;replaceFileInput.current?.click();
          }}>Thay ảnh</button>
          <button type="button" disabled={busy} onClick={()=>remove(asset)}>Xóa ảnh</button>
        </div>
      </article>)}
    </div>
  </section>;
}
