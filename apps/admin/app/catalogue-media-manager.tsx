"use client";
import {useCallback,useEffect,useRef,useState} from "react";

type Media={id:string;source_filename:string;mime_type:string;media_role:string;sort_order:number;sku_cong_ty:string};
type Library={id:string;source_filename:string;mime_type:string;linked_skus:number};
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
  if(!response.ok)throw Error("Không thao tác được ảnh ("+(payload.error?.code||response.status)+").");
  if(!payload.data)throw Error("API không trả dữ liệu ảnh.");
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
async function uploadOptimized(input:Blob,assetId:string){
  for(const [variant,size] of [["web",1600],["thumb",320]] as const){
    const optimized=await webpVariant(input,size);
    const key=await token();
    const response=await fetch("/api/media/variant",{
      method:"POST",credentials:"same-origin",cache:"no-store",
      headers:{Authorization:"Bearer "+key,"Content-Type":"image/webp",
        "X-FBMN-Asset-ID":assetId,"X-FBMN-Variant":variant},
      body:optimized
    });
    if(!response.ok)throw Error("Không tối ưu được ảnh "+variant+" ("+response.status+").");
  }
}
async function originalMedia(id:string):Promise<Blob>{
  const key=await token();
  const response=await fetch("/api/media/file?id="+encodeURIComponent(id),{
    credentials:"same-origin",cache:"no-store",
    headers:{Authorization:"Bearer "+key}});
  if(!response.ok)throw Error("Không đọc được ảnh gốc.");
  const blob=await response.blob();
  if(!["image/png","image/jpeg","image/webp"].includes(blob.type)||blob.size>5*1024*1024)
    throw Error("Định dạng hoặc dung lượng ảnh không hợp lệ.");
  return blob;
}
function PrivateImage({id,alt}:{id:string;alt:string}){
  const [src,setSrc]=useState<string|null>(null);
  useEffect(()=>{
    let active=true;
    let objectUrl:string|null=null;
    (async()=>{
      try{
        const key=await token();
        const response=await fetch("/api/media/file?id="+encodeURIComponent(id)+"&variant=thumb",{
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
  const [candidates,setCandidates]=useState<R2Candidate[]|null>(null);
  const [selectedKeys,setSelectedKeys]=useState<string[]>([]);
  const [scanTruncated,setScanTruncated]=useState(false);
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
    let completed=0,optimizedCount=0;
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
      if(!payload.data?.id)throw Error("Không nhận được mã ảnh để tối ưu.");
      completed++;
      try{await uploadOptimized(file,payload.data.id);optimizedCount++;}
      catch{/* The original is already linked. Keep it and permit retry. */}
    }
    setMessage("Đã gắn "+completed+" ảnh vào SKU "+sku+", tối ưu "+optimizedCount+
      " ảnh WebP. Ảnh gốc giữ nguyên, chưa công khai.");
    if(fileInput.current)fileInput.current.value="";
  });
  const scanBucket=()=>void work(async()=>{
    const result=await mediaApi<{items:R2Candidate[];truncated:boolean;scanned:number}>("scan");
    setCandidates(result.items);
    setSelectedKeys([]);
    setScanTruncated(result.truncated);
    setMessage("Đã quét "+result.scanned+" object trong private/catalogue. Chưa gắn ảnh nào.");
  });
  const adoptSelected=()=>void work(async()=>{
    if(!selectedKeys.length)return;
    const chosen=(candidates||[]).filter(x=>selectedKeys.includes(x.key)&&x.status==="matched");
    if(chosen.length!==selectedKeys.length||chosen.length>10)
      throw Error("Mỗi lần chỉ gắn tối đa 10 ảnh khớp chính xác.");
    if(!window.confirm("Gắn "+chosen.length+" ảnh R2 vào các mã SKU đã nhận diện? Không tự xuất bản website."))
      return;
    const result=await mediaApi<{count:number;items:{sku:string;asset_id:string}[]}>("adopt","POST",
      {confirm:"GAN_ANH_R2",keys:chosen.map(x=>x.key)});
    let optimized=0;
    for(const item of result.items){
      try{await uploadOptimized(await originalMedia(item.asset_id),item.asset_id);optimized++;}
      catch{/* Owner can retry optimized variants from the gallery. */}
    }
    setSelectedKeys([]);
    // Re-scan to clear already registered keys; never show stale matches.
    const latest=await mediaApi<{items:R2Candidate[];truncated:boolean}>("scan");
    setCandidates(latest.items);
    setScanTruncated(latest.truncated);
    setMessage("Đã gắn "+result.count+" ảnh đúng SKU, tối ưu "+optimized+" ảnh WebP. Chưa công khai.");
  });
  const toggleCandidate=(key:string,checked:boolean)=>{
    setSelectedKeys(current=>checked?[...current.filter(x=>x!==key),key].slice(0,10):
      current.filter(x=>x!==key));
  };
  const optimizeExisting=(assetId:string)=>void work(async()=>{
    await uploadOptimized(await originalMedia(assetId),assetId);
    setMessage("Đã tạo WebP và thumbnail. Ảnh gốc không thay đổi.");
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
    <div className="catalogue-media-actions">
      <button className="import-btn import-secondary" type="button" disabled={busy}
        onClick={scanBucket}>Quét ảnh đã tải thủ công lên R2</button>
      {selectedKeys.length>0&&<button className="import-btn import-primary"
        type="button" disabled={busy} onClick={adoptSelected}>
        Gắn {selectedKeys.length} ảnh đúng mã
      </button>}
    </div>
    {candidates!==null&&<section className="catalogue-media-library"
      aria-label="Đối chiếu ảnh trong R2">
      <strong>Ảnh R2 chưa gắn: {candidates.length}</strong>
      <p>Nhận đúng tên L536.webp hoặc L536-01.webp, L536-02.webp.
        Chỉ những mã công ty khớp chính xác mới được chọn; không gắn tự động.</p>
      {scanTruncated&&<p role="alert">Kho có hơn 1.000 object: lần quét này chưa bao quát toàn bộ.
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
              item.status==="unmatched"?"Chưa có mã SKU khớp":"Không nhận diện"}
          </span>
        </label>)}
      </div>
    </section>}
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
          <button type="button" disabled={busy} onClick={()=>optimizeExisting(asset.id)}>Tối ưu WebP</button>
          <button type="button" disabled={busy} onClick={()=>remove(asset)}>Gỡ khỏi SKU</button>
        </div>
      </article>)}
    </div>
  </section>;
}
