"use client";
import {useCallback,useEffect,useRef,useState} from "react";

type Media={id:string;source_filename:string;mime_type:string;media_role:string;sort_order:number;sku_cong_ty:string};
type Library={id:string;source_filename:string;mime_type:string;linked_skus:number};
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
  if(!response.ok)throw Error("Không thao tác được ảnh ("+(payload.error?.code||response.status)+").");
  if(!payload.data)throw Error("API không trả dữ liệu ảnh.");
  return payload.data;
}
function PrivateImage({id,alt}:{id:string;alt:string}){
  const [src,setSrc]=useState<string|null>(null);
  useEffect(()=>{
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
  },[id]);
  return src?<img src={src} alt={alt} loading="lazy" className="catalogue-media-preview"/>:
    <span className="catalogue-media-placeholder" role="img" aria-label="Ảnh chưa tải được">▧</span>;
}
export default function CatalogueMediaManager({sku,onChanged,onBusyChange}:{
  sku:string;onChanged:()=>void;onBusyChange?:(busy:boolean)=>void
}){
  const [items,setItems]=useState<Media[]>([]);
  const [library,setLibrary]=useState<Library[]>([]);
  const [selectAsset,setSelectAsset]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const fileInput=useRef<HTMLInputElement>(null);
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
    finally{if(fileInput.current)fileInput.current.value="";setBusy(false);}
  }
  const upload=(files:FileList|null)=>void work(async()=>{
    const list=Array.from(files||[]);
    if(list.length===0)return;
    if(list.length>5||items.length+list.length>20)
      throw Error("Mỗi lần tối đa 5 ảnh, tối đa 20 ảnh cho một SKU.");
    for(const file of list){
      if(!["image/png","image/jpeg","image/webp"].includes(file.type)||
        file.size<32||file.size>5*1024*1024)throw Error("Chỉ nhận JPG/PNG/WebP tối đa 5 MB mỗi ảnh.");
    }
    let completed=0;
    for(const file of list){
      const key=await token();
      const response=await fetch("/api/media/upload",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{Authorization:"Bearer "+key,"Content-Type":file.type,
          "X-FBMN-Sku":sku,"X-FBMN-File-Name":encodeURIComponent(file.name)},
        body:file
      });
      const payload=await response.json() as Result<{id:string}>;
      if(!response.ok)throw Error("Tệp "+file.name+": "+(payload.error?.code||response.status)+
        ". "+(completed?completed+" tệp trước đã tải thành công.":""));
      completed++;
    }
    setMessage("Đã gắn "+completed+" ảnh vào SKU "+sku+". Chưa công khai lên website.");
    if(fileInput.current)fileInput.current.value="";
  });
  const loadLibrary=()=>void work(async()=>{
    const result=await mediaApi<{items:Library[]}>("library");
    setLibrary(result.items.filter(x=>!items.some(item=>item.id===x.id)));
  });
  const attach=()=>void work(async()=>{
    if(!selectAsset)return;
    await mediaApi("link","POST",{sku_cong_ty:sku,asset_id:selectAsset});
    setMessage("Đã gắn thủ công ảnh từ thư viện vào SKU "+sku+".");
    setSelectAsset("");setLibrary([]);
  });
  const remove=(asset:Media)=>void work(async()=>{
    if(!window.confirm("Gỡ ảnh '"+asset.source_filename+"' khỏi SKU "+sku+"?"+
      " Ảnh gốc vẫn giữ trong kho riêng để tránh ảnh hưởng SKU khác."))return;
    await mediaApi("link","DELETE",{sku_cong_ty:sku,asset_id:asset.id});
    setMessage("Đã gỡ ảnh khỏi SKU; ảnh gốc không tự xóa khỏi R2.");
  });
  const reorder=(ids:string[],cover:string)=>void work(async()=>{
    await mediaApi("order","PATCH",{sku_cong_ty:sku,asset_ids:ids,cover_id:cover});
    setMessage("Đã lưu thứ tự và ảnh đại diện.");
  });
  const ordered=[...items].sort((a,b)=>a.sort_order-b.sort_order);
  const cover=ordered.find(item=>item.media_role==="cover")?.id||ordered[0]?.id;
  return <section className="catalogue-media-manager" aria-label={"Ảnh SKU "+sku}>
    <p><strong>Mã công ty: {sku}.</strong> Ảnh lưu trên R2 riêng tư, gắn thủ công.
      Thiếu ảnh vẫn được phép lưu sản phẩm. Không đăng ảnh công khai ở P4.</p>
    {error&&<div className="import-error" role="alert">{error}</div>}
    {message&&<div className="import-review-banner" role="status">{message}</div>}
    <div className="catalogue-media-actions">
      <label className="import-btn import-primary catalogue-media-upload">
        + Chọn tối đa 5 ảnh
        <input ref={fileInput} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple disabled={busy} onChange={event=>upload(event.currentTarget.files)}/>
      </label>
      <button className="import-btn import-secondary" type="button" disabled={busy}
        onClick={loadLibrary}>Gắn từ thư viện R2</button>
      <span>{ordered.length}/20 ảnh</span>
    </div>
    {library.length>0&&<div className="catalogue-media-library">
      <label>Chọn ảnh đã tải lên (không tự suy luận từ tên)
        <select value={selectAsset} onChange={event=>setSelectAsset(event.target.value)}>
          <option value="">Chọn ảnh trong thư viện</option>
          {library.map(item=><option key={item.id} value={item.id}>
            {item.source_filename} · dùng ở {item.linked_skus} SKU
          </option>)}
        </select>
      </label>
      <button className="import-btn import-primary" disabled={!selectAsset||busy}
        onClick={attach}>Gắn ảnh được chọn</button>
    </div>}
    {loading&&<p>Đang tải thư viện ảnh…</p>}
    {!loading&&ordered.length===0&&<div className="catalogue-media-empty">
      <span aria-hidden="true">▧</span><p>Chưa có ảnh cho mã {sku}. Có thể bổ sung bất cứ lúc nào.</p>
    </div>}
    <div className="catalogue-media-grid">
      {ordered.map((asset,index)=><article className="catalogue-media-card" key={asset.id}>
        <PrivateImage id={asset.id} alt={"Ảnh "+asset.source_filename+" của "+sku}/>
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
          <button type="button" disabled={busy} onClick={()=>remove(asset)}>Gỡ khỏi SKU</button>
        </div>
      </article>)}
    </div>
  </section>;
}
