"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import AdminToast from "./admin-toast";
import ProductModal,{useProductModalClose} from "./product-modal";

type Book={id:string;title:string;edition:string;state:"draft"|"ready"|"hidden";revision:number;updated_at:string};
type Asset={id:string;kind:"page"|"cover";
 sort_order:number;width:number;height:number;byte_size:number};
type Details={book:Book;assets:Asset[]};
type ListResult={books:Book[];page:number;totalPages:number;total:number};
type SavedResult={book:Book;asset?:Asset};
type Kind=Asset["kind"];
const MAX_IMAGE=5*1024*1024;
const STATUS:Record<Book["state"],string>={draft:"Bản nháp",ready:"Sẵn sàng (đã duyệt)",hidden:"Đã ẩn"};
const MIME="image/webp";

/* 30 requests/min is the staging Admin Worker budget for ALL actions.
 * Limit private image previews to 14/min, leaving room for editing operations.
 * Lazy intersection + cancellation avoids spending the budget on offscreen pages. */
const PREVIEW_PER_MINUTE=14;
const PREVIEW_WINDOW=61000;
let previewTimes:number[]=[];
async function claimPreviewSlot(signal:AbortSignal){
 for(;;){
  if(signal.aborted)throw Error("cancelled");
  const now=Date.now();
  previewTimes=previewTimes.filter(t=>now-t<PREVIEW_WINDOW);
  if(previewTimes.length<PREVIEW_PER_MINUTE){previewTimes.push(now);return;}
  const delay=Math.max(100,previewTimes[0]+PREVIEW_WINDOW-now);
  await new Promise<void>((resolve,reject)=>{
   const cancel=()=>{clearTimeout(timer);reject(Error("cancelled"));};
   const timer=setTimeout(()=>{signal.removeEventListener("abort",cancel);resolve();},delay);
   signal.addEventListener("abort",cancel,{once:true});
  });
 }
}
function ModalCancel({busy}:{busy:boolean}){
 const close=useProductModalClose();
 return <button type="button" className="fb-ui-button fb-ui-button--secondary"
  disabled={busy} onClick={close}>Hủy</button>;
}


async function token(){
 const response=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 if(!response.ok)throw Error("Phiên Owner đã hết hạn. Đăng nhập lại.");
 const body=(await response.json().catch(()=>({}))) as {token?:unknown};
 if(typeof body.token!=="string"||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(body.token))
  throw Error("Không xác thực được Owner.");
 return body.token;
}
function apiError(status:number,code?:string){
 if(status===409&&code==="ready_locked")return "Bộ đã Sẵn sàng nên ảnh bị khóa. Chọn “Ẩn bộ để sửa ảnh” rồi tải ảnh và xuất bản lại.";
 if(status===409)return "Dữ liệu đã thay đổi; nhấn Tải lại rồi thử lại.";
 if(status===403)return "Chỉ Owner được quản lý Catalogue.";
 if(status===422)return "Phải tải ít nhất một trang trước khi đánh dấu Sẵn sàng.";
 if(status===413||code==="too_large")return "Ảnh vượt giới hạn dung lượng 5 MB.";
 if(status===415||code==="invalid_content_type")return "Trình duyệt gửi sai Content-Type ảnh WebP.";
 if(code==="invalid_image")return "Nội dung WebP không hợp lệ hoặc kích thước ảnh nằm ngoài 64–6000 px.";
 if(code==="invalid_upload")return "Thông tin upload chưa hợp lệ (400 · invalid_upload). Nhấn Tải lại và thử lần nữa.";
 if(code==="invalid_query")return "Yêu cầu ảnh sai tham số (400 · invalid_query).";
 if(status===400)return "Yêu cầu ảnh bị từ chối (400 · "+(code&&/^[a-z0-9_]{1,50}$/.test(code)?code:"unknown")+").";
 if(status===429)return "API tạm giới hạn thao tác. Vui lòng thử lại sau.";
 if(code==="catalogue_worker_not_deployed")return "Worker DL7B chưa được triển khai.";
 return "Không kết nối được kho Catalogue. Dữ liệu chưa được lưu.";
}
/** Validate file contents instead of depending on Windows MIME metadata. */
async function isWebpFile(file:File):Promise<boolean>{
 if(file.size<100||file.size>MAX_IMAGE)return false;
 const header=new Uint8Array(await file.slice(0,32).arrayBuffer());
 if(header.length<20)return false;
 const four=(i:number)=>String.fromCharCode(...header.subarray(i,i+4));
 if(four(0)!=="RIFF"||four(8)!=="WEBP")return false;
 const data=new DataView(header.buffer,header.byteOffset,header.byteLength);
 if(data.getUint32(4,true)+8!==file.size)return false;
 return ["VP8 ","VP8L","VP8X"].includes(four(12));
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
 const [visible,setVisible]=useState(false);
 const viewport=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const element=viewport.current;
  if(!element)return;
  if(!("IntersectionObserver" in window)){
   void Promise.resolve().then(()=>setVisible(true));return;
  }
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}
  },{rootMargin:"120px"});
  observer.observe(element);
  return ()=>observer.disconnect();
 },[]);
 useEffect(()=>{
  if(!visible)return;
  const controller=new AbortController();
  let created="";
  void (async()=>{
   try{
    await claimPreviewSlot(controller.signal);
    const jwt=await token();
    if(controller.signal.aborted)return;
    const r=await fetch("/api/website/catalogue/image?asset="+encodeURIComponent(id),{
     cache:"no-store",credentials:"same-origin",signal:controller.signal,
     headers:{Authorization:"Bearer "+jwt,Accept:MIME}
    });
    if(!r.ok||r.headers.get("content-type")?.split(";")[0]!==MIME)return;
    const blob=await r.blob();
    if(blob.size>MAX_IMAGE||controller.signal.aborted)return;
    created=URL.createObjectURL(blob);
    setUrl(created);
   }catch{ /* A private missing image leaves the neutral placeholder. */ }
  })();
  return ()=>{controller.abort();if(created)URL.revokeObjectURL(created);};
 },[id,visible]);
 return <div ref={viewport} className="dl7b-asset-preview">
  {url?<img src={url} alt={alt} loading="lazy"/>:<span className="dl7b-image-empty">Đang chờ ảnh…</span>}
 </div>;
}
const sortAssets=(a:Asset,b:Asset)=>a.sort_order-b.sort_order||a.id.localeCompare(b.id);
export default function CatalogueBookManager({owner,onBusyChange}:{
 owner:boolean;onBusyChange?:(busy:boolean)=>void;
}){
 const [books,setBooks]=useState<Book[]>([]);
 const [bookPage,setBookPage]=useState(1);
 const [bookTotalPages,setBookTotalPages]=useState(1);
 const [bookTotal,setBookTotal]=useState(0);
 const [detail,setDetail]=useState<Details|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [pageOffset,setPageOffset]=useState(0);
 const [readError,setReadError]=useState("");
 const [dialog,setDialog]=useState<"create"|"edit"|null>(null);
 const [deleteFile,setDeleteFile]=useState<Asset|null>(null);
 const [title,setTitle]=useState("");
 const [edition,setEdition]=useState("");
 const [notice,setNotice]=useState("");
 const [noticeId,setNoticeId]=useState(0);
 const [noticeType,setNoticeType]=useState<"success"|"error">("success");
 const loadId=useRef(0);
 const selectedBook=useRef("");
 const alert=(message:string,variant:"success"|"error")=>{
  setNotice(message);setNoticeType(variant);setNoticeId(i=>i+1);
 };
 const load=useCallback(async(preferred?:string,requestedPage=1)=>{
  const seq=++loadId.current;setLoading(true);setReadError("");
  try{
   const all=await requestCatalogue<ListResult>(requestedPage===1?"":"?page="+requestedPage);
   const chosen=preferred&&all.books.some(b=>b.id===preferred)?preferred:(all.books[0]?.id||"");
   const data=chosen?await requestCatalogue<Details>("?id="+encodeURIComponent(chosen)):null;
   if(seq!==loadId.current)return;
   const changed=selectedBook.current!==chosen;
   selectedBook.current=chosen;
   const pagesCount=(data?.assets||[]).filter(a=>a.kind==="page").length;
   const maxOffset=Math.max(0,Math.floor((pagesCount-1)/12)*12);
   setPageOffset(prev=>changed?0:Math.min(prev,maxOffset));
   setBookPage(all.page);setBookTotalPages(all.totalPages);setBookTotal(all.total);
   setBooks(all.books);setDetail(data);
  }catch(e){
   if(seq===loadId.current)setReadError(e instanceof Error?e.message:"Không tải được Catalogue.");
  }finally{if(seq===loadId.current)setLoading(false);}
 },[]);
 useEffect(()=>{
  if(!owner)return;
  let active=true;
  void Promise.resolve().then(()=>{if(active)return load();});
  return ()=>{active=false;loadId.current+=1;};
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
 const visiblePages=pages.slice(pageOffset,pageOffset+12);
 const cover=assets.find(f=>f.kind==="cover");
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
  if(book.state==="ready"){
   alert("Bộ đã Sẵn sàng. Chọn “Ẩn bộ để sửa ảnh” trước khi upload.","error");return;
  }
  if(file.size<100||file.size>MAX_IMAGE){
   alert("Tệp cần từ 100 byte đến tối đa 5 MB.","error");return;
  }
  setBusy(true);
  try{
   if(!(await isWebpFile(file))){
    alert("File không phải WebP RIFF hợp lệ. Hãy tải lại ảnh .webp gốc, không chỉ đổi đuôi.","error");
    return;
   }
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
   <p>Quản lý bộ sách lật, trang và bìa trong R2 <strong>fbmn-catalogue</strong>. Không dùng kho ảnh SKU/CMS; Catalogue dùng nền chung toàn website.</p>
   </div><div className="action-row">
    <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={busy||loading}
     onClick={()=>void load(book?.id,bookPage)}>Tải lại</button>
    <button type="button" className="fb-ui-button fb-ui-button--primary" disabled={busy}
     onClick={()=>{setTitle("");setEdition("");setDialog("create");}}>Tạo bộ Catalogue</button>
   </div>
  </header>
  <p className="dl7b-note">DL7B chuẩn bị nội dung riêng cho tab Catalogue. Trạng thái “Sẵn sàng” là duyệt nội bộ; sách chưa hiển thị ngoài Website trước khi DL7C kết nối.</p>
  {loading&&<section className="surface dl7b-panel" role="status" aria-busy="true">Đang đọc kho Catalogue…</section>}
  {readError&&<section className="surface dl7b-panel" role="alert"><strong>Chưa kết nối được kho</strong><p>{readError}</p>
   <button type="button" className="fb-ui-button fb-ui-button--secondary" onClick={()=>void load(book?.id,bookPage)}>Thử lại</button></section>}
  {!loading&&!readError&&<div className="dl7b-grid">
   <section className="surface dl7b-panel">
    <h2>Danh sách bộ</h2>
    {!books.length&&<p>Chưa có bộ Catalogue. Chọn “Tạo bộ Catalogue” để bắt đầu.</p>}
    <p>Đang quản lý {bookTotal} bộ · Trang {bookPage}/{bookTotalPages}</p>
    <ul className="dl7b-books">{books.map(b=><li key={b.id}>
     <button type="button" className={"dl7b-book"+(b.id===book?.id?" is-selected":"")}
      aria-pressed={b.id===book?.id} onClick={()=>void load(b.id,bookPage)}>
      <strong>{b.title}</strong><small>{b.edition||"Chưa đặt phiên bản"} · {STATUS[b.state]}</small>
     </button>
    </li>)}</ul>
    {bookTotalPages>1&&<nav className="dl7b-book-nav" aria-label="Phân trang các bộ Catalogue">
     <button type="button" className="fb-ui-button fb-ui-button--secondary"
      disabled={bookPage<=1||busy} onClick={()=>void load(undefined,bookPage-1)}>Trước</button>
     <span>Trang {bookPage}/{bookTotalPages}</span>
     <button type="button" className="fb-ui-button fb-ui-button--secondary"
      disabled={bookPage>=bookTotalPages||busy} onClick={()=>void load(undefined,bookPage+1)}>Sau</button>
    </nav>}
   </section>
   {book&&<div className="dl7b-details">
    <section className="surface dl7b-panel">
     <div className="dl7b-panel-heading"><div><h2>{book.title}</h2><p>{book.edition||"Chưa đặt phiên bản"} · {STATUS[book.state]} · Revision {book.revision}</p></div>
      <div className="dl7b-actions">
       <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={!canEdit||busy}
        onClick={()=>{setTitle(book.title);setEdition(book.edition);setDialog("edit");}}>Sửa thông tin</button>
       {book.state==="ready"?
        <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={busy}
         onClick={()=>void mutate("hide",{id:book.id,revision:book.revision},"Đã ẩn bộ Catalogue.")}>Ẩn bộ để sửa ảnh</button>:
        <button type="button" className="fb-ui-button fb-ui-button--primary" disabled={busy||!pages.length}
         onClick={()=>void mutate("ready",{id:book.id,revision:book.revision},"Bộ đã sẵn sàng cho DL7C.")}>Đánh dấu sẵn sàng</button>}
      </div>
     </div>
     <p>{book.state==="ready"?"Bộ đang công khai và bị khóa chỉnh sửa. Chọn Ẩn bộ để sửa ảnh, tải bìa/nền rồi đánh dấu Sẵn sàng lại.":"Có thể cập nhật ảnh khi là bản nháp hoặc đã ẩn. Đánh dấu Sẵn sàng sau khi kiểm tra đủ ảnh."}</p>
    </section>
    <section className="surface dl7b-panel">
     <div className="dl7b-panel-heading"><div><h2>Trang sách</h2><p>{pages.length} / 200 trang · WebP riêng theo bộ</p></div>{fileInput("page","Thêm trang WebP")}</div>
     {!pages.length&&<p>Chưa có trang nào. Thêm ảnh từng trang theo đúng thứ tự đọc.</p>}
     <ol className="dl7b-pages">{visiblePages.map((p,localIndex)=>{const i=pageOffset+localIndex;return <li key={p.id}>
      <div className="dl7b-image"><CatalogueImage id={p.id} alt={"Trang "+(i+1)}/></div>
      <div className="dl7b-page-caption"><strong>Trang {i+1}</strong><small>{p.width} × {p.height}</small></div>
      <div className="dl7b-order">
       <button type="button" className="fb-ui-button fb-ui-button--secondary" aria-label={"Đưa trang "+(i+1)+" lên"} disabled={!canEdit||busy||i===0} onClick={()=>void move(i,-1)}>↑</button>
       <button type="button" className="fb-ui-button fb-ui-button--secondary" aria-label={"Đưa trang "+(i+1)+" xuống"} disabled={!canEdit||busy||i===pages.length-1} onClick={()=>void move(i,1)}>↓</button>
       <button type="button" className="fb-ui-button fb-ui-button--secondary" aria-label={"Xóa trang "+(i+1)} disabled={!canEdit||busy} onClick={()=>setDeleteFile(p)}>×</button>
      </div>
     </li>;})}</ol>
     {pages.length>12&&<div className="dl7b-pages-nav">
      <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={pageOffset===0} onClick={()=>setPageOffset(v=>Math.max(0,v-12))}>Trang trước</button>
      <span>Đang xem {pageOffset+1}–{Math.min(pages.length,pageOffset+12)} / {pages.length}</span>
      <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={pageOffset+12>=pages.length} onClick={()=>setPageOffset(v=>v+12)}>Trang sau</button>
     </div>}
    </section>
    <section className="surface dl7b-panel">
     <h2>Ảnh bìa</h2><div className="dl7b-single">
      <div className="dl7b-image">{cover?<CatalogueImage id={cover.id} alt="Ảnh bìa Catalogue"/>:<span className="dl7b-image-empty">Chưa có ảnh bìa</span>}</div>
      <div>{fileInput("cover",cover?"Thay ảnh bìa":"Chọn ảnh bìa")}
       {cover&&<button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={!canEdit||busy} onClick={()=>setDeleteFile(cover)}>Xóa ảnh bìa</button>}</div>
     </div>
    </section>
   </div>}
  </div>}
  {dialog&&<ProductModal title={dialog==="create"?"Tạo bộ Catalogue":"Sửa bộ Catalogue"}
   locked={busy} onClose={()=>setDialog(null)}
   footer={<><ModalCancel busy={busy}/>
    <button type="button" className="fb-ui-button fb-ui-button--primary" disabled={busy} onClick={()=>void onSave()}>{busy?"Đang lưu…":"Lưu"}</button></>}>
   <div className="dl7b-fields">
    <label>Tên bộ Catalogue<input type="text" maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} required placeholder="Nhập tên bộ chính thức"/></label>
    <label>Phiên bản / năm phát hành<input type="text" maxLength={80} value={edition} onChange={e=>setEdition(e.target.value)} placeholder="Phiên bản đã được duyệt"/></label>
    <p>Ảnh sẽ được tải riêng lên R2 sau khi tạo bộ. Không công khai giá NET.</p>
   </div>
  </ProductModal>}
  {deleteFile&&book&&<ProductModal title="Xóa ảnh khỏi bộ?" locked={busy}
   onClose={()=>setDeleteFile(null)}
   footer={<><ModalCancel busy={busy}/>
    <button type="button" className="fb-ui-button fb-ui-button--primary" disabled={busy} onClick={()=>void (async()=>{
     const ok=await mutate("remove",{id:book.id,revision:book.revision,assetId:deleteFile.id},"Đã xóa ảnh khỏi kho.");
     if(ok)setDeleteFile(null);
    })()}>Xác nhận xóa</button></>}>
   <p>Ảnh sẽ bị bỏ khỏi bộ Catalogue. Không ảnh hưởng đến kho ảnh sản phẩm, CMS hoặc tab khác.</p>
  </ProductModal>}
  <AdminToast message={notice} variant={noticeType} notificationId={noticeId} onClose={()=>setNotice("")}/>
 </div>;
}
