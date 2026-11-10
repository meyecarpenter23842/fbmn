"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import AdminToast from "./admin-toast";
import ProductModal,{useProductModalClose} from "./product-modal";

type Book={id:string;title:string;edition:string;state:"draft"|"ready"|"hidden";revision:number;updated_at:string};
type Asset={id:string;kind:"page"|"cover";
 sort_order:number;width:number;height:number;byte_size:number};
type PdfInfo={byteSize:number;visible:boolean;downloadEnabled:boolean;updatedAt:string};
type Details={book:Book;assets:Asset[];pdf:PdfInfo|null};
type ListResult={books:Book[];page:number;totalPages:number;total:number};
type SavedResult={book:Book;asset?:Asset};
type ViewerSettings={flipDurationMs:number;soundEnabled:boolean;shadowOpacity:number;revision:number};
type ViewerDraft=Pick<ViewerSettings,"flipDurationMs"|"soundEnabled"|"shadowOpacity">;
type Kind=Asset["kind"];
const MAX_IMAGE=5*1024*1024;
const MAX_PDF=20*1024*1024;
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
 if(code==="invalid_pdf")return "Tệp PDF không hợp lệ; cần đúng chữ ký %PDF- và kết thúc %%EOF.";
 if(code==="pdf_required")return "Cần tải PDF lên bộ trước khi cài quyền hiển thị.";
 if(code==="invalid_pdf_settings")return "Chỉ bật Tải PDF khi đã bật công khai PDF.";
 if(status===413||code==="too_large")return "Tệp vượt giới hạn dung lượng được phép.";
 if(status===415||code==="invalid_content_type")return "Trình duyệt gửi sai Content-Type ảnh WebP.";
 if(code==="invalid_image")return "Nội dung WebP không hợp lệ hoặc kích thước ảnh nằm ngoài 64–6000 px.";
 if(code==="invalid_upload")return "Thông tin upload chưa hợp lệ (400 · invalid_upload). Nhấn Tải lại và thử lần nữa.";
 if(code==="invalid_query")return "Yêu cầu ảnh sai tham số (400 · invalid_query).";
 if(code==="invalid_settings")return "Thông số phải hợp lệ: tốc độ 750–1500ms, độ bóng 0,10–0,50.";
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

async function isPdfFile(file:File):Promise<boolean>{
 if(file.size<100||file.size>MAX_PDF)return false;
 const first=new TextDecoder("ascii").decode(await file.slice(0,8).arrayBuffer());
 const last=new TextDecoder("ascii").decode(await file.slice(Math.max(0,file.size-1024)).arrayBuffer());
 return /^%PDF-[12]\.\d/.test(first)&&/%%EOF\s*$/.test(last);
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
 const [settings,setSettings]=useState<ViewerSettings|null>(null);
 const [draftSettings,setDraftSettings]=useState<ViewerDraft>({
  flipDurationMs:950,soundEnabled:false,shadowOpacity:0.26
 });
 const [settingsBusy,setSettingsBusy]=useState(false);
 const [settingsError,setSettingsError]=useState("");
 const [pageOffset,setPageOffset]=useState(0);
 const [readError,setReadError]=useState("");
 const [dialog,setDialog]=useState<"create"|"edit"|null>(null);
 const [deleteFile,setDeleteFile]=useState<Asset|null>(null);
 const [deletePdf,setDeletePdf]=useState(false);
 const [pdfDraft,setPdfDraft]=useState({visible:false,downloadEnabled:false});
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
 const loadSettings=useCallback(async()=>{
  setSettingsError("");
  try{
   const response=await requestCatalogue<{settings:ViewerSettings}>("/settings");
   const value=response.settings;
   if(!value||!Number.isSafeInteger(value.flipDurationMs)||
    typeof value.soundEnabled!=="boolean"||typeof value.shadowOpacity!=="number"||
    !Number.isSafeInteger(value.revision))throw Error("Cấu hình trả về không hợp lệ.");
   setSettings(value);
   setDraftSettings({flipDurationMs:value.flipDurationMs,soundEnabled:value.soundEnabled,
    shadowOpacity:value.shadowOpacity});
  }catch(e){setSettingsError(e instanceof Error?e.message:"Không đọc được cài đặt sách lật.");}
 },[]);
 const saveSettings=async()=>{
  if(!settings||settingsBusy||busy)return;
  setSettingsBusy(true);setSettingsError("");
  try{
   const result=await requestCatalogue<{settings:ViewerSettings}>("/settings",{
    ...draftSettings,revision:settings.revision
   });
   setSettings(result.settings);
   setDraftSettings({flipDurationMs:result.settings.flipDurationMs,
    soundEnabled:result.settings.soundEnabled,shadowOpacity:result.settings.shadowOpacity});
   alert("Đã lưu cấu hình sách lật. Website sẽ tự áp dụng khi mở/tải lại Catalogue.","success");
  }catch(e){setSettingsError(e instanceof Error?e.message:"Không lưu được cài đặt.");}
  finally{setSettingsBusy(false);}
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
   setPdfDraft({visible:data?.pdf?.visible===true,
    downloadEnabled:data?.pdf?.downloadEnabled===true});
  }catch(e){
   if(seq===loadId.current)setReadError(e instanceof Error?e.message:"Không tải được Catalogue.");
  }finally{if(seq===loadId.current)setLoading(false);}
 },[]);
 useEffect(()=>{
  if(!owner)return;
  let active=true;
  void Promise.resolve().then(()=>{if(active){void load();void loadSettings();}});
  return ()=>{active=false;loadId.current+=1;};
 },[owner,load,loadSettings]);
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
 const pdf=detail?.pdf||null;
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
 const uploadPdf=async(file?:File)=>{
  if(!file||!book||busy||!canEdit)return;
  if(!(await isPdfFile(file))){
   alert("PDF cần hợp lệ, dung lượng tối đa 20 MB. Không đổi đuôi tệp hoặc tải tài liệu chưa duyệt.","error");
   return;
  }
  setBusy(true);
  try{
   const jwt=await token();
   const target=await fetch("/api/website/catalogue/pdf-target",{
    method:"GET",cache:"no-store",credentials:"same-origin",
    headers:{Authorization:"Bearer "+jwt,Accept:"application/json"}
   });
   const targetJson=(await target.json().catch(()=>({}))) as {data?:{url?:string};error?:{code?:string}};
   if(!target.ok||typeof targetJson.data?.url!=="string")
    throw Error(apiError(target.status,targetJson.error?.code));
   const address=new URL(targetJson.data.url);
   if(address.protocol!=="https:"||address.username||address.password||address.search||address.hash||
      address.pathname!=="/v1/admin/website/catalogue/pdf-upload")
    throw Error("Địa chỉ Worker upload PDF chưa hợp lệ.");
   const response=await fetch(address.toString(),{
    method:"POST",mode:"cors",cache:"no-store",
    headers:{Authorization:"Bearer "+jwt,"Content-Type":"application/pdf",
     "X-Catalogue-Book-Id":book.id,"X-Catalogue-Revision":String(book.revision)},
    body:file
   });
   const result=(await response.json().catch(()=>({}))) as {data?:SavedResult;error?:{code?:string}};
   if(!response.ok||!result.data?.book)
    throw Error(apiError(response.status,result.error?.code));
   await load(book.id);
   alert("Đã tải PDF lên kho R2 riêng. Mặc định PDF chưa công khai; hãy kiểm tra và lưu quyền hiển thị.","success");
  }catch(e){alert(e instanceof Error?e.message:"Không tải được PDF; chưa ghi dữ liệu.","error");}
  finally{setBusy(false);}
 };
 const savePdfPermissions=async()=>{
  if(!book||!pdf||!canEdit||busy)return;
  await mutate("pdf-settings",{id:book.id,revision:book.revision,
   visible:pdfDraft.visible,downloadEnabled:pdfDraft.downloadEnabled},
   "Đã lưu quyền công khai PDF. Chỉ bộ Sẵn sàng mới hiển thị cho khách.");
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
 if(!owner)return <section className="surface dl7b-panel"><h1>Kho Catalogue</h1><p>Chỉ Owner được quản lý bộ Catalogue và ảnh bìa.</p></section>;
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
  <section className="surface dl7b-panel" aria-labelledby="dl7c-settings-heading">
   <div className="dl7b-panel-heading"><div>
    <h2 id="dl7c-settings-heading">Cài đặt sách lật</h2>
    <p>Cấu hình chung cho tất cả bộ Catalogue. Khách xem chỉ có các nút đọc sách, không thấy thông số.</p>
   </div></div>
   {settingsError&&<p role="alert" className="dl7b-settings-error">{settingsError}</p>}
   {!settings&&<button type="button" className="fb-ui-button fb-ui-button--secondary"
    onClick={()=>void loadSettings()}>Tải cài đặt</button>}
   {settings&&<form className="dl7b-settings-form" onSubmit={e=>{e.preventDefault();void saveSettings();}}>
    <label>Tốc độ lật trang
     <select value={draftSettings.flipDurationMs} disabled={settingsBusy||busy}
      onChange={e=>setDraftSettings(p=>({...p,flipDurationMs:Number(e.target.value)}))}>
      {Array.from({length:16},(_,i)=>750+i*50).map(ms=>
       <option value={ms} key={ms}>{ms} ms{ms===950?" · Đề xuất":""}</option>)}
     </select>
    </label>
    <label>Độ bóng khi lật
     <select value={draftSettings.shadowOpacity.toFixed(2)} disabled={settingsBusy||busy}
      onChange={e=>setDraftSettings(p=>({...p,shadowOpacity:Number(e.target.value)}))}>
      {[0.10,0.15,0.20,0.26,0.30,0.35,0.40,0.45,0.50].map(n=>
       <option value={n.toFixed(2)} key={n}>{Math.round(n*100)}%</option>)}
     </select>
    </label>
    <label className="dl7b-settings-toggle">
     <input type="checkbox" checked={draftSettings.soundEnabled} disabled={settingsBusy||busy}
      onChange={e=>setDraftSettings(p=>({...p,soundEnabled:e.target.checked}))}/>
     <span>Cho phép tiếng giấy khi khách lật trang</span>
    </label>
    <div className="dl7b-settings-actions">
     <button type="submit" className="fb-ui-button fb-ui-button--primary"
      disabled={settingsBusy||busy||(
       draftSettings.flipDurationMs===settings.flipDurationMs&&
       draftSettings.soundEnabled===settings.soundEnabled&&
       draftSettings.shadowOpacity===settings.shadowOpacity
      )}>{settingsBusy?"Đang lưu…":"Lưu cài đặt"}</button>
     <button type="button" className="fb-ui-button fb-ui-button--secondary"
      disabled={settingsBusy||busy} onClick={()=>void loadSettings()}>Tải lại cấu hình</button>
    </div>
    <p>Âm thanh chỉ phát khi trình duyệt cho phép sau thao tác lật của khách. Không phát tự động khi mở trang.</p>
   </form>}
  </section>
  <p className="dl7b-note">Trang/bìa WebP và PDF theo bộ/phiên bản dùng bucket R2 Catalogue riêng. Nền dùng G05 chung toàn website.</p>
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
         onClick={()=>void mutate("hide",{id:book.id,revision:book.revision},"Đã ẩn bộ Catalogue và thu hồi quyền xem/tải PDF.")}>Ẩn bộ để chỉnh sửa</button>:
        <button type="button" className="fb-ui-button fb-ui-button--primary" disabled={busy||(!pages.length&&!pdf?.visible)}
         onClick={()=>void mutate("ready",{id:book.id,revision:book.revision},"Đã phát hành bộ Catalogue.")}>Đánh dấu sẵn sàng</button>}
      </div>
     </div>
     <p>{book.state==="ready"?"Bộ đang công khai và bị khóa chỉnh sửa. Chọn Ẩn bộ để chỉnh ảnh/PDF/quyền tải, sau đó đánh dấu Sẵn sàng lại.":"Có thể cập nhật ảnh khi là bản nháp hoặc đã ẩn. Đánh dấu Sẵn sàng sau khi kiểm tra đủ ảnh."}</p>
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
    <section className="surface dl7b-panel" aria-labelledby="dl7a-pdf-heading">
     <div className="dl7b-panel-heading">
      <div><h2 id="dl7a-pdf-heading">Catalogue PDF · {book.edition||"Phiên bản hiện hành"}</h2>
       <p>PDF tối đa 20 MB · bucket fbmn-catalogue · không làm thay đổi sách lật.</p></div>
      <label className="dl7b-file-input">
       <span>{pdf?"Thay PDF":"Tải PDF"}</span>
       <input type="file" accept="application/pdf,.pdf" disabled={!canEdit||busy}
        aria-label="Tải tệp Catalogue PDF" onChange={e=>{
         const file=e.currentTarget.files?.[0];e.currentTarget.value="";
         void uploadPdf(file);
        }}/>
      </label>
     </div>
     {!pdf?<p>Chưa gắn PDF cho bộ này. Bộ vẫn có thể hiển thị bằng sách lật WebP.</p>:<>
      <p>Đã lưu PDF · {(pdf.byteSize/1024/1024).toFixed(2)} MB ·
       {pdf.visible?" Đã chọn công khai":" Chưa công khai"} ·
       {pdf.downloadEnabled?" Có nút tải":" Không hiện nút tải"}</p>
      <div className="dl7a-pdf-options">
       <label><input type="checkbox" checked={pdfDraft.visible} disabled={!canEdit||busy}
        onChange={e=>setPdfDraft({visible:e.target.checked,downloadEnabled:e.target.checked?pdfDraft.downloadEnabled:false})}/>
        <span>Công khai PDF khi bộ ở trạng thái Sẵn sàng</span></label>
       <label><input type="checkbox" checked={pdfDraft.downloadEnabled} disabled={!canEdit||busy||!pdfDraft.visible}
        onChange={e=>setPdfDraft(p=>({...p,downloadEnabled:e.target.checked}))}/>
        <span>Hiện nút Tải PDF cho khách</span></label>
      </div>
      <div className="dl7b-actions">
       <button type="button" className="fb-ui-button fb-ui-button--primary"
        disabled={!canEdit||busy||(pdfDraft.visible===pdf.visible&&pdfDraft.downloadEnabled===pdf.downloadEnabled)}
        onClick={()=>void savePdfPermissions()}>Lưu quyền PDF</button>
       <button type="button" className="fb-ui-button fb-ui-button--secondary"
        disabled={!canEdit||busy} onClick={()=>setDeletePdf(true)}>Xóa PDF khỏi bộ</button>
      </div>
     </>}
     <p className="dl7a-pdf-warning">Chỉ đưa tài liệu đã được duyệt để phát hành. Không tải PDF giá NET,
      tồn kho hoặc dữ liệu đại lý lên kho công khai. Việc tắt nút Tải không ngăn người xem lưu
      lại tài liệu đã mở trong trình duyệt.</p>
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
  {deletePdf&&book&&<ProductModal title="Xóa Catalogue PDF?" locked={busy}
   onClose={()=>setDeletePdf(false)}
   footer={<><ModalCancel busy={busy}/>
    <button type="button" className="fb-ui-button fb-ui-button--primary" disabled={busy}
     onClick={()=>void (async()=>{
      const ok=await mutate("pdf-remove",{id:book.id,revision:book.revision},
       "Đã gỡ PDF khỏi bộ. Trang sách WebP vẫn được giữ.");
      if(ok)setDeletePdf(false);
     })()}>Xác nhận xóa PDF</button></>}>
    <p>PDF của bộ sẽ được gỡ khỏi kho R2. Hành động này không xóa các trang và bìa WebP.</p>
   </ProductModal>}
  <AdminToast message={notice} variant={noticeType} notificationId={noticeId} onClose={()=>setNotice("")}/>
 </div>;
}
