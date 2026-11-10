"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import type {KeyboardEvent} from "react";
import Link from "next/link";
import {GlassButtonLink} from "@/components/glass-ui";
import type {PageFlip,SizeType,FlipCorner} from "page-flip";
import {canFlipForward,canFlipBackward} from "@/lib/catalogue/spread-navigation";
import {PaperSound} from "@/lib/catalogue/paper-sound";

type Asset={id:string;width:number;height:number};
type Book={id:string;title:string;edition:string;hasPages?:boolean;hasPdf?:boolean;pdfDownloadEnabled?:boolean};
type Detail={book:Book;pages:Asset[];cover:Asset|null};
type ViewerSettings={flipDurationMs:number;soundEnabled:boolean;soundVolume:number;shadowOpacity:number};
const DEFAULT_VIEWER:ViewerSettings={flipDurationMs:950,soundEnabled:false,soundVolume:35,shadowOpacity:0.26};
type Leaf={asset:Asset;label:string};
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const image=(id:string)=>"/api/catalogue-books/image?asset="+encodeURIComponent(id);
const validBook=(x:unknown):x is Book=>{
 if(!x||typeof x!=="object")return false;
 const v=x as Record<string,unknown>;
 return typeof v.id==="string"&&UUID.test(v.id)&&typeof v.title==="string"&&
 v.title.length>0&&v.title.length<=120&&typeof v.edition==="string"&&v.edition.length<=80&&
 (v.hasPages===undefined||typeof v.hasPages==="boolean")&&
 (v.hasPdf===undefined||typeof v.hasPdf==="boolean")&&
 (v.pdfDownloadEnabled===undefined||typeof v.pdfDownloadEnabled==="boolean")&&
 (!v.pdfDownloadEnabled||v.hasPdf===true);
};
const validAsset=(x:unknown):x is Asset=>{
 if(!x||typeof x!=="object")return false;
 const v=x as Record<string,unknown>;
 return typeof v.id==="string"&&UUID.test(v.id)&&typeof v.width==="number"&&
 v.width>=64&&v.width<=6000&&typeof v.height==="number"&&v.height>=64&&v.height<=6000;
};
const validViewer=(v:ViewerSettings)=>Boolean(v&&Number.isSafeInteger(v.flipDurationMs)&&
 v.flipDurationMs>=750&&v.flipDurationMs<=1500&&v.flipDurationMs%50===0&&
 typeof v.soundEnabled==="boolean"&&Number.isInteger(v.soundVolume)&&v.soundVolume>=0&&v.soundVolume<=100&&typeof v.shadowOpacity==="number"&&
 Number.isFinite(v.shadowOpacity)&&v.shadowOpacity>=0.10&&v.shadowOpacity<=0.50);
const validDetail=(v:Detail)=>validBook(v?.book)&&Array.isArray(v.pages)&&
 (v.pages.length>0||v.book.hasPdf)&&v.pages.length<=200&&v.pages.every(validAsset)&&
 (v.cover===null||validAsset(v.cover));
async function fetchCatalogue<T>(path:string):Promise<T>{
 const res=await fetch(path,{cache:"no-store",headers:{Accept:"application/json"}});
 if(!res.ok)throw Error(res.status===404?"Catalogue chưa được mở công khai.":"Không kết nối được kho Catalogue.");
 const data=(await res.json()) as {data?:T};
 if(!data?.data)throw Error("Dữ liệu Catalogue không hợp lệ.");
 return data.data;
}
function currentRequestedPage(){
 const value=new URLSearchParams(window.location.search).get("page")||"1";
 return /^[1-9]\d{0,2}$/.test(value)?Number(value):1;
}
function deepLink(id:string,index:number){
 const url=new URL(window.location.href);
 url.searchParams.set("book",id);url.searchParams.set("page",String(index+1));
 return url.toString();
}

export default function CatalogueFlipbook(){
 const [books,setBooks]=useState<Book[]>([]);
 const [detail,setDetail]=useState<Detail|null>(null);
 const [active,setActive]=useState(0);
 const [selectedPage,setSelectedPage]=useState(0);
 const [zoomIndex,setZoomIndex]=useState(0);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [turning,setTurning]=useState(false);
 const [portrait,setPortrait]=useState(false);
 const [reduced,setReduced]=useState(false);
 const [fullScreen,setFullScreen]=useState(false);
 const [thumbnails,setThumbnails]=useState(false);
 const [viewerSettings,setViewerSettings]=useState<ViewerSettings>(DEFAULT_VIEWER);
 const [status,setStatus]=useState("");
 const [manualLink,setManualLink]=useState("");
 const sceneRef=useRef<HTMLDivElement>(null);
 const bookRef=useRef<HTMLDivElement>(null);
 const readerRef=useRef<HTMLDivElement>(null);
 const engineRef=useRef<PageFlip|null>(null);
 const zoomRef=useRef<HTMLDialogElement>(null);
 const zoomCloseTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const audioRef=useRef<PaperSound|null>(null);
 const viewerRef=useRef<ViewerSettings>(DEFAULT_VIEWER);
 const reducedRef=useRef(false);
 const turnLock=useRef(false);
 const sequence=useRef(0);
 const activeRef=useRef(0);
 const leaves=useMemo<Leaf[]>(()=>{
  if(!detail)return [];
  return [...(detail.cover?[{asset:detail.cover,label:"Bìa"}]:[]),
   ...detail.pages.map((asset,i)=>({asset,label:"Trang "+(i+1)}))];
 },[detail]);
 const zoomLeaf=leaves[zoomIndex]||leaves[active];
 // Every image-based book starts closed. Until an Owner uploads a dedicated cover,
 // the first already-approved page serves as the opening leaf without duplicating it.
 const hasOpeningCover=leaves.length>0;
 const canPrev=canFlipBackward(active,portrait,hasOpeningCover);
 const canNext=canFlipForward(active,leaves.length,portrait,hasOpeningCover);
 useEffect(()=>{viewerRef.current=viewerSettings;},[viewerSettings]);
 useEffect(()=>{reducedRef.current=reduced;if(reduced)audioRef.current?.silence();},[reduced]);

 // A real paper recording shared with the Admin preview.
 const unlockAudio=()=>{
  if(!viewerRef.current.soundEnabled||reducedRef.current)return;
  const player=audioRef.current??(audioRef.current=new PaperSound());
  void player.prepare().catch(()=>{});
 };
 const soundPlayer=useRef(()=>{});
 useEffect(()=>{soundPlayer.current=()=>{
  if(viewerRef.current.soundEnabled&&!reducedRef.current)
   void audioRef.current?.play(viewerRef.current.soundVolume).catch(()=>{});
 };});

 useEffect(()=>{
  const media=window.matchMedia("(prefers-reduced-motion: reduce)");
  const apply=()=>setReduced(media.matches);
  apply();media.addEventListener("change",apply);
  const sync=()=>setFullScreen(Boolean(document.fullscreenElement));
  document.addEventListener("fullscreenchange",sync);
  return ()=>{media.removeEventListener("change",apply);document.removeEventListener("fullscreenchange",sync);};
 },[]);
 useEffect(()=>()=>{if(zoomCloseTimer.current)clearTimeout(zoomCloseTimer.current);
  audioRef.current?.dispose();audioRef.current=null;},[]);
 const loadBook=useCallback(async(id:string,requested=1)=>{
  const idSequence=++sequence.current;
  audioRef.current?.silence();
  setLoading(true);setError("");setTurning(false);turnLock.current=false;
  try{
   const payload=await fetchCatalogue<Detail>("/api/catalogue-books?id="+encodeURIComponent(id));
   if(!validDetail(payload))throw Error("Bộ Catalogue chưa có đủ trang hợp lệ.");
   if(idSequence!==sequence.current)return;
   const count=payload.pages.length+(payload.cover?1:0);
   const position=Math.min(Math.max(0,requested-1),Math.max(0,count-1));
   activeRef.current=position;setActive(position);setSelectedPage(position);setDetail(payload);
   window.history.replaceState(window.history.state,"",deepLink(payload.book.id,position));
  }catch(e){if(idSequence===sequence.current){setDetail(null);
   setError(e instanceof Error?e.message:"Không mở được Catalogue.");}}
  finally{if(idSequence===sequence.current)setLoading(false);}
 },[]);
 useEffect(()=>{
  let alive=true;
  void (async()=>{
   try{
    const payload=await fetchCatalogue<{books:Book[];viewerSettings:ViewerSettings}>("/api/catalogue-books");
    if(!alive)return;
    if(!Array.isArray(payload.books)||payload.books.length>100||!payload.books.every(validBook)||
     !validViewer(payload.viewerSettings))
     throw Error("Danh sách hoặc cài đặt Catalogue không hợp lệ.");
    setViewerSettings(payload.viewerSettings);
    viewerRef.current=payload.viewerSettings;
    setBooks(payload.books);
    if(!payload.books.length){setLoading(false);return;}
    const selected=payload.books.find(b=>b.id===new URLSearchParams(location.search).get("book"))||payload.books[0];
    await loadBook(selected.id,currentRequestedPage());
   }catch(e){if(alive){setError(e instanceof Error?e.message:"Không thể mở Catalogue.");setLoading(false);}}
  })();
  return ()=>{alive=false;sequence.current++;};
 },[loadBook]);

 // StPageFlip owns its DOM. React never moves the engine's page elements.
 useEffect(()=>{
  const host=bookRef.current;
  if(!host||!detail||leaves.length===0)return;
  let cancelled=false;
  let initializing=true;
  let flip:PageFlip|null=null;
  const startIndex=activeRef.current;
  void (async()=>{
   try{
    const {PageFlip}=await import("page-flip");
    if(cancelled)return;
    host.replaceChildren();
    const disposable=document.createElement("div");
    disposable.className="fb-catalogue-engine-root";
    host.append(disposable);
    const nodes=leaves.map(({asset,label},i)=>{
     const leaf=document.createElement("div");
     leaf.className="fb-catalogue-paper";
     leaf.setAttribute("role","group");
     leaf.setAttribute("aria-label",label);
     if(i===0)leaf.dataset.density="hard";
     const img=document.createElement("img");
     img.src=image(asset.id);img.alt=label+" — "+detail.book.title;
     img.width=asset.width;img.height=asset.height;
     img.loading=i<4?"eager":"lazy";img.decoding="async";
     leaf.append(img);
     return leaf;
    });
    flip=new PageFlip(disposable,{
     width:440,height:610,size:"stretch" as SizeType,minWidth:220,maxWidth:640,
     minHeight:305,maxHeight:887,autoSize:false,
     flippingTime:viewerSettings.flipDurationMs,drawShadow:true,maxShadowOpacity:viewerSettings.shadowOpacity,
     showCover:true,usePortrait:true,swipeDistance:38,
     mobileScrollSupport:true,useMouseEvents:!reducedRef.current,
     disableFlipByClick:false,startPage:Math.min(startIndex,nodes.length-1)
    });
    flip.on("flip",event=>{
     if(cancelled)return;
     const n=Number(event.data);
     if(!Number.isInteger(n)||n<0||n>=nodes.length)return;
     // loadFromHTML emits flip synchronously with the spread's first leaf.
     // Keep the originally requested right-hand leaf and deep link intact.
     if(initializing){activeRef.current=n;setActive(n);return;}
     activeRef.current=n;setActive(n);setSelectedPage(n);
     window.history.replaceState(window.history.state,"",deepLink(detail.book.id,n));
    });
    flip.on("changeState",event=>{
     if(cancelled)return;
     const state=String(event.data);
     if(state==="flipping"){turnLock.current=true;setTurning(true);soundPlayer.current();}
     else if(state==="read"){turnLock.current=false;setTurning(false);}
    });
    flip.on("changeOrientation",event=>{if(!cancelled)setPortrait(event.data==="portrait");});
    flip.loadFromHTML(nodes);
    initializing=false;
    engineRef.current=flip;
    setPortrait(flip.getOrientation()==="portrait");
    // Covers can display only on the right. Keep the manifest index in the URL.
   }catch{if(!cancelled){setError("Không khởi tạo được hiệu ứng lật trang.");}}
  })();
  return ()=>{cancelled=true;engineRef.current=null;
   try{flip?.destroy();}catch{/* safe on partial initialization */}
   host.replaceChildren();};
 },[detail,reduced,leaves,viewerSettings.flipDurationMs,viewerSettings.shadowOpacity]);

 const go=(index:number)=>{
  if(!detail||!leaves.length||turning||turnLock.current)return;
  const next=Math.max(0,Math.min(leaves.length-1,index));
  const flip=engineRef.current;
  if(!flip)return;
  flip.turnToPage(next);
  const visible=flip.getCurrentPageIndex();
  activeRef.current=visible;setActive(visible);setSelectedPage(next);
  window.history.replaceState(window.history.state,"",deepLink(detail.book.id,next));
 };
 const turn=(direction:"next"|"prev")=>{
  if(turnLock.current||turning||!engineRef.current||!detail)return;
  const book=engineRef.current;
  const index=book.getCurrentPageIndex();
  const onePage=book.getOrientation()==="portrait";
  if(direction==="next"&&!canFlipForward(index,leaves.length,onePage,hasOpeningCover))return;
  if(direction==="prev"&&!canFlipBackward(index,onePage,hasOpeningCover))return;
  if(reduced){
   direction==="next"?book.turnToNextPage():book.turnToPrevPage();
   const n=book.getCurrentPageIndex();
   activeRef.current=n;setActive(n);setSelectedPage(n);
   window.history.replaceState(window.history.state,"",deepLink(detail.book.id,n));
  }else{
   direction==="next"?book.flipNext("bottom" as FlipCorner):book.flipPrev("bottom" as FlipCorner);
  }
 };
 const keyboard=(event:KeyboardEvent<HTMLElement>)=>{
  if(zoomRef.current?.open)return;
  if(event.altKey||event.metaKey||event.ctrlKey||
   event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement)return;
  if(event.key==="ArrowRight"){event.preventDefault();readerRef.current?.focus({preventScroll:true});unlockAudio();turn("next");}
  else if(event.key==="ArrowLeft"){event.preventDefault();readerRef.current?.focus({preventScroll:true});unlockAudio();turn("prev");}
  else if(event.key==="Home"){event.preventDefault();go(0);}
  else if(event.key==="End"){event.preventDefault();go(leaves.length-1);}
 };
 const openZoom=(index:number)=>{
  if(zoomRef.current?.open)return;
  setZoomIndex(Math.max(0,Math.min(leaves.length-1,index)));
  zoomRef.current?.showModal();
 };
 const closeZoom=()=>{
  const dialog=zoomRef.current;
  if(!dialog?.open)return;
  if(zoomCloseTimer.current)clearTimeout(zoomCloseTimer.current);
  if(reduced){dialog.close();return;}
  dialog.dataset.closing="true";
  zoomCloseTimer.current=setTimeout(()=>{
   dialog.close();delete dialog.dataset.closing;zoomCloseTimer.current=null;
  },220);
 };
 const toggleFullscreen=async()=>{
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else await sceneRef.current?.requestFullscreen();
  }catch{setStatus("Trình duyệt không hỗ trợ chế độ toàn màn hình.");}
 };
 const share=async()=>{
  if(!detail)return;
  const url=deepLink(detail.book.id,selectedPage);
  setManualLink("");setStatus("");
  try{
   if(navigator.share)await navigator.share({title:detail.book.title,url});
   else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);setStatus("Đã sao chép liên kết trang.");}
   else setManualLink(url);
  }catch(e){if(!(e instanceof DOMException&&e.name==="AbortError"))setManualLink(url);}
 };
 const pdfHref=(b:Book,download=false)=>"/api/catalogue-books/pdf?book="+
  encodeURIComponent(b.id)+(download?"&download=1":"");
 return <div className="fb-catalogue-viewer" onKeyDown={keyboard}>
  {!loading&&!error&&detail&&(books.length>1||detail.book.hasPdf)&&
   <div className="fb-catalogue-topbar">
    {books.length>1&&<label className="fb-catalogue-picker"><span>Bộ Catalogue</span>
     <select value={detail.book.id} onChange={e=>void loadBook(e.target.value)}>
      {books.map(b=><option value={b.id} key={b.id}>{b.title}{b.edition?" · "+b.edition:""}</option>)}
     </select></label>}
    {detail.book.hasPdf&&<div className="fb-catalogue-pdf-actions">
     <GlassButtonLink variant="secondary" href={pdfHref(detail.book)}
      target="_blank" rel="noopener noreferrer">Xem PDF</GlassButtonLink>
     {detail.book.pdfDownloadEnabled&&<GlassButtonLink variant="secondary"
      href={pdfHref(detail.book,true)} download>Tải PDF</GlassButtonLink>}
    </div>}
   </div>}
  {loading&&<div className="fb-catalogue-state" role="status">Đang mở Catalogue…</div>}
  {!loading&&error&&<div className="fb-catalogue-state" role="alert">
   <h2>Chưa thể mở cuốn sách</h2><p>{error}</p>
   <Link className="fb-glass-button fb-glass-button--secondary" href="/san-pham">Xem sản phẩm</Link>
  </div>}
  {!loading&&!error&&!detail&&<div className="fb-catalogue-state" role="status">
   <h2>Catalogue đang được cập nhật</h2>
   <p>Chưa có cuốn sách nào được Futurebook phê duyệt để hiển thị.</p>
   <Link className="fb-glass-button fb-glass-button--primary" href="/san-pham">Xem danh mục sản phẩm</Link>
  </div>}
  {!loading&&detail&&<div ref={sceneRef} className="fb-catalogue-scene">
   <div className="fb-catalogue-scene-content">
    <div className="fb-catalogue-heading">
     <h2 className="sr-only">{detail.book.title}</h2>
     <span className="fb-catalogue-count" aria-live="polite">{leaves[selectedPage]?.label||"Bản PDF"}</span>
    </div>
    {leaves.length>0?<div ref={readerRef} tabIndex={0} className="fb-catalogue-reader" data-closed={!portrait&&active===0&&!turning?"true":"false"} role="region" aria-label={"Sách lật "+detail.book.title}
     onPointerDownCapture={unlockAudio}>
     <button type="button" className="fb-glass-button fb-glass-button--secondary fb-catalogue-nav fb-catalogue-nav--prev"
      aria-label="Trang trước" disabled={turning||!canPrev} onClick={()=>{unlockAudio();turn("prev");}}>
      <span className="fb-catalogue-nav-glyph" aria-hidden="true">‹</span></button>
     <div className="fb-catalogue-book-shell">
      <div className="fb-catalogue-book-edge" aria-hidden="true"/>
      <div className="fb-catalogue-book-host" ref={bookRef} aria-label="Kéo mép hoặc góc giấy để lật trang"/>
     </div>
     <button type="button" className="fb-glass-button fb-glass-button--secondary fb-catalogue-nav fb-catalogue-nav--next"
      aria-label="Trang tiếp" disabled={turning||!canNext} onClick={()=>{unlockAudio();turn("next");}}>
      <span className="fb-catalogue-nav-glyph" aria-hidden="true">›</span></button>
    </div>:<p className="fb-catalogue-pdf-only">Chọn “Xem PDF” để mở Catalogue.</p>}
    {leaves.length>0&&<div className="fb-catalogue-toolbar" role="toolbar" aria-label="Công cụ sách">
     <button type="button" className="fb-glass-button fb-glass-button--secondary"
      onClick={()=>setThumbnails(x=>!x)} aria-expanded={thumbnails}>☷ <span>Mục lục</span></button>
     <button type="button" className="fb-glass-button fb-glass-button--secondary"
      onClick={()=>openZoom(selectedPage)}>⌕ <span>Phóng to trang chọn</span></button>
     <button type="button" className="fb-glass-button fb-glass-button--secondary"
      onClick={()=>void toggleFullscreen()}>{fullScreen?"⤢":"⛶"} <span>{fullScreen?"Thu nhỏ":"Toàn màn hình"}</span></button>
     <button type="button" className="fb-glass-button fb-glass-button--secondary"
      onClick={()=>void share()}>↗ <span>Chia sẻ trang</span></button>
    </div>}
    {status&&<p className="fb-catalogue-status" role="status">{status}</p>}
    {manualLink&&<label className="fb-catalogue-share-fallback">Liên kết trang
     <input readOnly value={manualLink} onFocus={e=>e.target.select()}/></label>}
    {leaves.length>0&&thumbnails&&<div className="fb-catalogue-index" aria-label="Chọn trang Catalogue">
     {leaves.map((leaf,i)=><button key={leaf.asset.id} type="button"
       className={"fb-catalogue-thumb"+(i===selectedPage?" is-active":"")}
       aria-current={i===selectedPage?"page":undefined} onClick={()=>go(i)}>
       <img src={image(leaf.asset.id)} alt="" loading="lazy" width={leaf.asset.width} height={leaf.asset.height}/>
       <span>{leaf.label}</span>
      </button>)}
    </div>}
    
   </div>
   {leaves.length>0&&<dialog ref={zoomRef} className="fb-catalogue-zoom fb-glass-dialog-motion" aria-label="Xem trang phóng to"
    onCancel={e=>{if(!reduced){e.preventDefault();closeZoom();}}}>
    <div className="fb-glass-dialog-header"><h2 className="fb-glass-dialog-header__title">{zoomLeaf?.label||"Trang Catalogue"}</h2>
     <button type="button" className="fb-glass-button fb-glass-button--secondary" onClick={closeZoom}>Đóng ×</button>
    </div>
    {zoomLeaf&&<div className="fb-catalogue-zoom-image"><img src={image(zoomLeaf.asset.id)}
     alt={zoomLeaf.label+" — "+detail.book.title} width={zoomLeaf.asset.width} height={zoomLeaf.asset.height}/></div>}
   </dialog>}
  </div>}
 </div>;
}
