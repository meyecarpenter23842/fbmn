"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import AdminToast from "./admin-toast";
import ProductModal from "./product-modal";

type Book={id:string;title:string;edition:string;state:"draft"|"ready"|"hidden";revision:number;updated_at:string};
type Asset={id:string;kind:"page"|"cover"|"background_desktop"|"background_mobile";
 sort_order:number;width:number;height:number;byte_size:number};
type Details={book:Book;assets:Asset[]};
type ListResult={books:Book[]};
type SavedResult={book:Book;asset?:Asset};
type Kind=Asset["kind"];
const MAX_IMAGE=5*1024*1024;
const STATUS:Record<Book["state"],string>={draft:"Bản nháp",ready:"Sẵn sàng (chưa lên Web)",hidden:"Đã ẩn"};
const MIME="image/webp";

async function token(){
 const response=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 if(!response.ok)throw Error("Phiên Owner đã hết hạn. Đăng nhập lại.");
 const body=(await response.json().catch(()=>({}))) as {token?:unknown};
 if(typeof body.token!=="string"||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(body.token))
  throw Error("Không xác thực được Owner.");
 return body.token;
}
function apiError(status:number,code?:string){
 if(status===409)return "Dữ liệu đã đổi hoặc bộ đang khóa. Tải lại rồi thử lại.";
 if(status===403)return "Chỉ Owner có quyền quản lý Catalogue.";
 if(status===422)return "Phải tải ít nhất một trang sách trước khi đánh dấu sẵn sàng.";
 if(status===400||status===413||status===415)return "Ảnh hoặc dữ liệu không hợp lệ. Chỉ nhận WebP tối đa 5 MB.";
 if(code==="catalogue_worker_not_deployed")return "Worker DL7B chưa được triển khai.";
 return "Không kết nối được kho Catalogue. Dữ liệu chưa được lưu.";
}
async function requestCatalogue<T>(path="",body?:object,file?:File,headers?:Record<string,string>):Promise<T>{
 const jwt=await token();
 const r=await fetch("/api/website/catalogue"+path,{
  method:body||file?"POST":"GET",credentials:"same-origin",cache:"no-store",
  headers:{Authorization:"Bearer "+jwt,Accept:"application/json",
   ...(file?{"Content-Type":MIME,...headers}:body?{"Content-Type":"application/json"}:{})},
  ...(file?{body:file}:body?{body:JSON.stringify(body)}:{})
 });
 const json=(await r.json().catch(()=>({}))) as {data?:T;error?:{code?:string}};
 if(!r.ok)throw Error(apiError(r.status,json.error?.code));
 if(!json.data)throw Error("Phản hồi Catalogue chưa hợp lệ.");
 return json.data;
}
function CatalogueImage({id,alt}:{id:string;alt:string}){
 const [url,setUrl]=useState("");
 useEffect(()=>{
  let active=true,created="";
  void (async()=>{
   try{
    const jwt=await token();
    const r=await fetch("/api/website/catalogue/image?asset="+encodeURIComponent(id),{
     cache:"no-store",credentials:"same-origin",headers:{Authorization:"Bearer "+jwt,Accept:MIME}
    });
    if(!r.ok||r.headers.get("content-type")?.split(";")[0]!==MIME)return;
    const blob=await r.blob();
    if(blob.size>MAX_IMAGE)return;
    created=URL.createObjectURL(blob);
    if(active)setUrl(created);else URL.revokeObjectURL(created);
   }catch{ /* A private missing image leaves the neutral placeholder. */ }
  })();
  return ()=>{active=false;if(created)URL.revokeObjectURL(created);};
 },[id]);
 return url?<img src={url} alt={alt} loading="lazy"/>:<span className="dl7b-image-empty">Chưa tải được ảnh</span>;
}
const sortAssets=(a:Asset,b:Asset)=>a.sort_order-b.sort_order||a.id.localeCompare(b.id);
export default function CatalogueBookManager({owner,onBusyChange}:{
 owner:boolean;onBusyChange?:(busy:boolean)=>void;
}){
 const [books,setBooks]=useState<Book[]>([]);
 const [detail,setDetail]=useState<Details|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [readError,setReadError]=useState("");
 const [dialog,setDialog]=useState<"create"|"edit"|null>(null);
 const [deleteFile,setDeleteFile]=useState<Asset|null>(null);
 const [title,setTitle]=useState("");
 const [edition,setEdition]=useState("");
 const [notice,setNotice]=useState("");
 const [noticeId,setNoticeId]=useState(0);
 const [noticeType,setNoticeType]=useState<"success"|"error">("success");
 const loadId=useRef(0);
 const alert=(message:string,variant:"success"|"error")=>{
  setNotice(message);setNoticeType(variant);setNoticeId(i=>i+1);
 };
 const load=useCallback(async(preferred?:string)=>{
  const seq=++loadId.current;setLoading(true);setReadError("");
  try{
   const all=await requestCatalogue<ListResult>();
   const chosen=preferred&&all.books.some(b=>b.id===preferred)?preferred:(all.books[0]?.id||"");
   const data=chosen?await requestCatalogue<Details>("?id="+encodeURIComponent(chosen)):null;
   if(seq!==loadId.current)return;
   setBooks(all.books);setDetail(data);
  }catch(e){
   if(seq===loadId.current)setReadError(e instanceof Error?e.message:"Không tải được Catalogue.");
  }finally{if(seq===loadId.current)setLoading(false);}
 },[]);
 useEffect(()=>{
  if(!owner)return;
  void load();
  return ()=>{loadId.current+=1;};
 },[owner,load]);
 useEffect(()=>{onBusyChange?.(busy);return ()=>onBusyChange?.(false);},[busy,onBusyChange]);
 async function mutate(action:string,payload:object,success:string,choose?:string){
  if(busy)return;
  setBusy(true);
  try{
   const result=await requestCatalogue<SavedResult>("/"+action,payload);
   await load(choose||result.book.id);
   alert(success,"success");
   return true;
  }catch(e){alert(e instanceof Error?e.message:"Không lưu được Catalogue.","error");return false;}
  finally{setBusy(false);}
 }
 const book=detail?.book,assets=detail?.assets||[];
 const pages=assets.filter(f=>f.kind==="page").sort(sortAssets);
 const cover=assets.find(f=>f.kind==="cover");
 const desktop=assets.find(f=>f.kind==="background_desktop");
 const mobile=assets.find(f=>f.kind==="background_mobile");
 const canEdit=Boolean(book&&book.state!=="ready");
 const onSave=async()=>{
  const data={title:title.trim(),edition:edition.trim()};
  if(!data.title||data.title.length>120||data.edition.length>80){
   alert("Tên bộ bắt buộc (≤120 ký tự), phiên bản tối đa 80 ký tự.","error");return;
  }
  const ok=dialog==="create"
   ?await mutate("create",data,"Đã tạo bộ Catalogue.")
   :book?await mutate("save",{...data,id:book.id,revision:book.revision},"Đã cập nhật thông tin."):false;
  if(ok)setDialog(null);
 };
 const upload=async(kind:Kind,file?:File)=>{
  if(!file||!book||busy)return;
  if(file.type!==MIME||file.size>MAX_IMAGE||file.size<100){
   alert("Chỉ nhận ảnh WebP hợp lệ, tối đa 5 MB/ảnh.","error");return;
  }
  setBusy(true);
  try{
   await requestCatalogue<SavedResult>("/upload",undefined,file,{
    "X-Catalogue-Book-Id":book.id,
    "X-Catalogue-Revision":String(book.revision),
    "X-Catalogue-Kind":kind
   });
   await load(book.id);
   alert(kind==="page"?"Đã thêm trang vào kho R2.":"Đã lưu ảnh vào kho R2 Catalogue.","success");
  }catch(e){alert(e instanceof Error?e.message:"Không tải được ảnh.","error");}
  finally{setBusy(false);}
 };
 const move=async(index:number,delta:number)=>{
  if(!book||!canEdit)return;
  const j=index+delta;
  if(j<0||j>=pages.length)return;
  const ids=pages.map(f=>f.id);
  [ids[index],ids[j]]=[ids[j],ids[index]];
  await mutate("reorder",{id:book.id,revision:book.revision,assetIds:ids},"Đã cập nhật thứ tự trang.");
 };
 const fileInput=(kind:Kind,label:string)=><label className="dl7b-file-input">
  <span>{label}</span><input type="file" accept="image/webp,.webp" disabled={!canEdit||busy}
   aria-label={label} onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value="";void upload(kind,file);}}/>
 </label>;
 if(!owner)return <section className="surface dl7b-panel"><h1>Kho Catalogue</h1><p>Chỉ Owner được quản lý bộ Catalogue và ảnh nền.</p></section>;
 return <div className="dl7b-screen">
  <header className="page-title"><div><h1>Kho Catalogue</h1>
   <p>Quản lý bộ sách lật, trang và ảnh nền riêng trong R2 <strong>fbmn-catalogue</strong>. Không dùng kho ảnh SKU/CMS.</p>
   </div><div className="action-row">
    <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={busy||loading}
     onClick={()=>void load(book?.id)}>Tải lại</button>
    <button type="button" className="fb-ui-button fb-ui-button--primary" disabled={busy}
     onClick={()=>{setTitle("");setEdition("");setDialog("create");}}>Tạo bộ Catalogue</button>
   </div>
  </header>
  <p className="dl7b-note">DL7B chuẩn bị nội dung riêng cho tab Catalogue. Trạng thái “Sẵn sàng” là duyệt nội bộ; sách chưa hiển thị ngoài Website trước khi DL7C kết nối.</p>
  {loading&&<section className="surface dl7b-panel" role="status" aria-busy="true">Đang đọc kho Catalogue…</section>}
  {readError&&<section className="surface dl7b-panel" role="alert"><strong>Chưa kết nối được kho</strong><p>{readError}</p>
   <button type="button" className="fb-ui-button fb-ui-button--secondary" onClick={()=>void load(book?.id)}>Thử lại</button></section>}
  {!loading&&!readError&&<div className="dl7b-grid">
   <section className="surface dl7b-panel">
    <h2>Danh sách bộ</h2>
    {!books.length&&<p>Chưa có bộ Catalogue. Chọn “Tạo bộ Catalogue” để bắt đầu.</p>}
    <ul className="dl7b-books">{books.map(b=><li key={b.id}>
     <button type="button" className={"dl7b-book"+(b.id===book?.id?" is-selected":"")}
      aria-pressed={b.id===book?.id} onClick={()=>void load(b.id)}>
      <strong>{b.title}</strong><small>{b.edition||"Chưa đặt phiên bản"} · {STATUS[b.state]}</small>
     </button>
    </li>)}</ul>
   </section>
   {book&&<div className="dl7b-details">
    <section className="surface dl7b-panel">
     <div className="dl7b-panel-heading"><div><h2>{book.title}</h2><p>{book.edition||"Chưa đặt phiên bản"} · {STATUS[book.state]} · Revision {book.revision}</p></div>
      <div className="dl7b-actions">
       <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={!canEdit||busy}
        onClick={()=>{setTitle(book.title);setEdition(book.edition);setDialog("edit");}}>Sửa thông tin</button>
       {book.state==="ready"?
        <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={busy}
         onClick={()=>void mutate("hide",{id:book.id,revision:book.revision},"Đã ẩn bộ Catalogue.")}>Ẩn bộ</button>:
        <button type="button" className="fb-ui-button fb-ui-button--primary" disabled={busy||!pages.length}
         onClick={()=>void mutate("ready",{id:book.id,revision:book.revision},"Bộ đã sẵn sàng cho DL7C.")}>Đánh dấu sẵn sàng</button>}
      </div>
     </div>
     <p>Không chỉnh sửa bộ đã đánh dấu sẵn sàng. Chọn “Ẩn bộ” trước khi cập nhật hình ảnh hoặc thứ tự.</p>
    </section>
    <section className="surface dl7b-panel">
     <div className="dl7b-panel-heading"><div><h2>Trang sách</h2><p>{pages.length} / 200 trang · WebP riêng theo bộ</p></div>{fileInput("page","Thêm trang WebP")}</div>
     {!pages.length&&<p>Chưa có trang nào. Thêm ảnh từng trang theo đúng thứ tự đọc.</p>}
     <ol className="dl7b-pages">{pages.slice(0,100).map((p,i)=><li key={p.id}>
      <div className="dl7b-image"><CatalogueImage id={p.id} alt={"Trang "+(i+1)}/></div>
      <div className="dl7b-page-caption"><strong>Trang {i+1}</strong><small>{p.width} × {p.height}</small></div>
      <div className="dl7b-order">
       <button type="button" className="fb-ui-button fb-ui-button--secondary" aria-label={"Đưa trang "+(i+1)+" lên"} disabled={!canEdit||busy||i===0} onClick={()=>void move(i,-1)}>↑</button>
       <button type="button" className="fb-ui-button fb-ui-button--secondary" aria-label={"Đưa trang "+(i+1)+" xuống"} disabled={!canEdit||busy||i===pages.length-1} onClick={()=>void move(i,1)}>↓</button>
       <button type="button" className="fb-ui-button fb-ui-button--secondary" aria-label={"Xóa trang "+(i+1)} disabled={!canEdit||busy} onClick={()=>setDeleteFile(p)}>×</button>
      </div>
     </li>)}</ol>
     {pages.length>100&&<p>Đang hiển thị 100 trang đầu. Các trang khác vẫn được lưu trong kho.</p>}
    </section>
    <section className="surface dl7b-panel">
     <h2>Ảnh bìa</h2><div className="dl7b-single">
      <div className="dl7b-image">{cover?<CatalogueImage id={cover.id} alt="Ảnh bìa Catalogue"/>:<span className="dl7b-image-empty">Chưa có ảnh bìa</span>}</div>
      <div>{fileInput("cover",cover?"Thay ảnh bìa":"Chọn ảnh bìa")}
       {cover&&<button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={!canEdit||busy} onClick={()=>setDeleteFile(cover)}>Xóa ảnh bìa</button>}</div>
     </div>
    </section>
    <section className="surface dl7b-panel">
     <h2>Ảnh nền riêng tab Catalogue</h2><p>Hai lớp độc lập: nền lấy từ <code>backgrounds/</code>, sách từ <code>books/</code> trong bucket Catalogue. Không thay nền chung các tab khác.</p>
     <div className="dl7b-backgrounds">
      {([["background_desktop","Desktop",desktop],["background_mobile","Mobile",mobile]] as const).map(([kind,label,asset])=>
       <div className="dl7b-background" key={kind}><h3>{label}</h3>
        <div className="dl7b-image">{asset?<CatalogueImage id={asset.id} alt={"Nền "+label}/>:<span className="dl7b-image-empty">Chưa cấu hình</span>}</div>
        {fileInput(kind,asset?"Thay nền "+label:"Thêm nền "+label)}
        {asset&&<button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={!canEdit||busy} onClick={()=>setDeleteFile(asset)}>Xóa nền {label}</button>}
       </div>)}
     </div>
    </section>
   </div>}
  </div>}
  {dialog&&<ProductModal title={dialog==="create"?"Tạo bộ Catalogue":"Sửa bộ Catalogue"}
   locked={busy} onClose={()=>setDialog(null)}
   footer={<><button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={busy} onClick={()=>setDialog(null)}>Hủy</button>
    <button type="button" className="fb-ui-button fb-ui-button--primary" disabled={busy} onClick={()=>void onSave()}>{busy?"Đang lưu…":"Lưu"}</button></>}>
   <div className="dl7b-fields">
    <label>Tên bộ Catalogue<input type="text" maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} required placeholder="Nhập tên bộ chính thức"/></label>
    <label>Phiên bản / năm phát hành<input type="text" maxLength={80} value={edition} onChange={e=>setEdition(e.target.value)} placeholder="Phiên bản đã được duyệt"/></label>
    <p>Ảnh sẽ được tải riêng lên R2 sau khi tạo bộ. Không công khai giá NET.</p>
   </div>
  </ProductModal>}
  {deleteFile&&book&&<ProductModal title="Xóa ảnh khỏi bộ?" locked={busy}
   onClose={()=>setDeleteFile(null)}
   footer={<><button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={busy} onClick={()=>setDeleteFile(null)}>Hủy</button>
    <button type="button" className="fb-ui-button fb-ui-button--primary" disabled={busy} onClick={()=>void (async()=>{
     const ok=await mutate("remove",{id:book.id,revision:book.revision,assetId:deleteFile.id},"Đã xóa ảnh khỏi kho.");
     if(ok)setDeleteFile(null);
    })()}>Xác nhận xóa</button></>}>
   <p>Ảnh sẽ bị bỏ khỏi bộ Catalogue. Không ảnh hưởng đến kho ảnh sản phẩm, CMS hoặc tab khác.</p>
  </ProductModal>}
  <AdminToast message={notice} variant={noticeType} notificationId={noticeId} onClose={()=>setNotice("")}/>
 </div>;
}
