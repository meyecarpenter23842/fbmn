"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import type {CSSProperties,KeyboardEvent,TouchEvent} from "react";
import Link from "next/link";

type Asset={id:string;width:number;height:number};
type Book={id:string;title:string;edition:string};
type Detail={book:Book;pages:Asset[];cover:Asset|null;backgrounds:{desktop:Asset|null;mobile:Asset|null}};
type Leaf={asset:Asset;label:string};
type Turn={direction:"next"|"prev";to:number;asset:Asset|null};
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const image=(id:string)=>"/api/catalogue-books/image?asset="+encodeURIComponent(id);
const validBook=(x:unknown):x is Book=>{
 if(!x||typeof x!=="object")return false;
 const b=x as Record<string,unknown>;
 return typeof b.id==="string"&&UUID.test(b.id)&&typeof b.title==="string"&&
 b.title.length>0&&b.title.length<=120&&typeof b.edition==="string"&&b.edition.length<=80;
};
const validAsset=(x:unknown):x is Asset=>{
 if(!x||typeof x!=="object")return false;
 const a=x as Record<string,unknown>;
 return typeof a.id==="string"&&UUID.test(a.id)&&typeof a.width==="number"&&
 a.width>=64&&a.width<=6000&&typeof a.height==="number"&&a.height>=64&&a.height<=6000;
};
async function read<T>(path:string):Promise<T>{
 const result=await fetch(path,{cache:"no-store",headers:{Accept:"application/json"}});
 if(!result.ok)throw Error(result.status===404?
  "Catalogue chưa được mở công khai.":"Không kết nối được kho Catalogue.");
 const json=(await result.json()) as {data?:T};
 if(!json?.data)throw Error("Dữ liệu Catalogue không hợp lệ.");
 return json.data;
}
function validDetail(x:Detail){
 return validBook(x?.book)&&Array.isArray(x.pages)&&x.pages.length>0&&x.pages.length<=200&&
 x.pages.every(validAsset)&&(x.cover===null||validAsset(x.cover))&&
 Boolean(x.backgrounds)&&(x.backgrounds.desktop===null||validAsset(x.backgrounds.desktop))&&
 (x.backgrounds.mobile===null||validAsset(x.backgrounds.mobile));
}
function spread(position:number,cover:boolean,mobile:boolean){
 if(mobile||cover&&position===0)return position;
 return cover?1+Math.floor(Math.max(0,position-1)/2)*2:Math.floor(position/2)*2;
}
function pageQuery(){
 const value=new URLSearchParams(window.location.search).get("page")||"1";
 return /^[1-9]\d{0,2}$/.test(value)?Number(value):1;
}
function pageUrl(bookId:string,page:number){
 const u=new URL(window.location.href);
 u.searchParams.set("book",bookId);u.searchParams.set("page",String(page+1));
 return u.toString();
}
export default function CatalogueFlipbook(){
 const [books,setBooks]=useState<Book[]>([]);
 const [detail,setDetail]=useState<Detail|null>(null);
 const [active,setActive]=useState(0);
 const [zoomPosition,setZoomPosition]=useState(0);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [mobile,setMobile]=useState(false);
 const [reduceMotion,setReduceMotion]=useState(false);
 const [fullscreen,setFullscreen]=useState(false);
 const [thumbnails,setThumbnails]=useState(true);
 const [turn,setTurn]=useState<Turn|null>(null);
 const [message,setMessage]=useState("");
 const [manualLink,setManualLink]=useState("");
 const stage=useRef<HTMLDivElement>(null);
 const zoom=useRef<HTMLDialogElement>(null);
 const swipeStart=useRef<number|null>(null);
 const turnTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const requestSeq=useRef(0);
 const leaves=useMemo<Leaf[]>(()=>{
  if(!detail)return [];
  return [...(detail.cover?[{asset:detail.cover,label:"Bìa"}]:[]),
   ...detail.pages.map((asset,i)=>({asset,label:"Trang "+(i+1)}))];
 },[detail]);
 const cover=Boolean(detail?.cover);
 const start=spread(active,cover,mobile);
 const left=cover&&!mobile&&start===0?null:leaves[start]||null;
 const right=mobile?null:cover&&start===0?leaves[0]||null:leaves[start+1]||null;
 const hasPrev=start>0;
 const hasNext=mobile?start+1<leaves.length:cover&&start===0?leaves.length>1:start+2<leaves.length;
 const displayLabel=mobile?left?.label||"":cover&&start===0?"Bìa":
  (left?.label||"")+(right?" – "+right.label:"");
 const zoomLeaf=leaves[zoomPosition]||right||left;
 const openZoom=(position:number)=>{setZoomPosition(position);zoom.current?.showModal();};
 useEffect(()=>{
  const m=window.matchMedia("(max-width: 700px)");
  const r=window.matchMedia("(prefers-reduced-motion: reduce)");
  const set=()=>{setMobile(m.matches);setReduceMotion(r.matches);};
  set();m.addEventListener("change",set);r.addEventListener("change",set);
  const onFullscreen=()=>setFullscreen(Boolean(document.fullscreenElement));
  document.addEventListener("fullscreenchange",onFullscreen);
  return ()=>{m.removeEventListener("change",set);r.removeEventListener("change",set);
   document.removeEventListener("fullscreenchange",onFullscreen);};
 },[]);
 const loadBook=useCallback(async(id:string,requested=1)=>{
  const seq=++requestSeq.current;
  setLoading(true);setError("");setTurn(null);
  if(turnTimer.current)clearTimeout(turnTimer.current);
  try{
   const d=await read<Detail>("/api/catalogue-books?id="+encodeURIComponent(id));
   if(!validDetail(d))throw Error("Bộ Catalogue chưa có đủ trang hợp lệ.");
   if(seq!==requestSeq.current)return;
   const position=Math.max(0,Math.min(requested-1,d.pages.length+(d.cover?1:0)-1));
   setDetail(d);setActive(position);
   window.history.replaceState(window.history.state,"",pageUrl(d.book.id,position));
  }catch(e){
   if(seq===requestSeq.current){setDetail(null);setError(e instanceof Error?e.message:"Không mở được Catalogue.");}
  }finally{if(seq===requestSeq.current)setLoading(false);}
 },[]);
 useEffect(()=>{
  let alive=true;
  void (async()=>{
   try{
    const x=await read<{books:Book[]}>("/api/catalogue-books");
    if(!alive)return;
    if(!Array.isArray(x.books)||x.books.length>100||!x.books.every(validBook))
     throw Error("Danh sách Catalogue không hợp lệ.");
    setBooks(x.books);
    if(!x.books.length){setLoading(false);return;}
    const id=new URLSearchParams(window.location.search).get("book");
    const selected=x.books.find(b=>b.id===id)||x.books[0];
    await loadBook(selected.id,pageQuery());
   }catch(e){if(alive){setError(e instanceof Error?e.message:"Không mở được Catalogue.");setLoading(false);}}
  })();
  return ()=>{alive=false;requestSeq.current++;};
 },[loadBook]);
 useEffect(()=>()=>{if(turnTimer.current)clearTimeout(turnTimer.current);},[]);
 const go=useCallback((position:number)=>{
  if(!detail||!leaves.length)return;
  const next=Math.max(0,Math.min(leaves.length-1,position));
  if(turnTimer.current)clearTimeout(turnTimer.current);
  setActive(next);setTurn(null);
  window.history.replaceState(window.history.state,"",pageUrl(detail.book.id,next));
 },[detail,leaves.length]);
 const flip=useCallback((direction:"next"|"prev")=>{
  if(!detail||turn||!leaves.length)return;
  const p=spread(active,cover,mobile);
  const next=direction==="next"?(mobile?p+1:cover&&p===0?1:p+2):
   (mobile?p-1:cover&&p===1?0:p-2);
  if(next<0||next>=leaves.length)return;
  if(reduceMotion){go(next);return;}
  const asset=(direction==="next"?(right||left):left)?.asset||null;
  setTurn({direction,to:next,asset});
  if(turnTimer.current)clearTimeout(turnTimer.current);
  turnTimer.current=setTimeout(()=>{go(next);turnTimer.current=null;},450);
 },[detail,turn,leaves,active,cover,mobile,reduceMotion,go,right,left]);
 const handleKey=(e:KeyboardEvent<HTMLElement>)=>{
  if(e.altKey||e.metaKey||e.ctrlKey||e.target instanceof HTMLSelectElement||
   e.target instanceof HTMLInputElement)return;
  if(e.key==="ArrowRight"){e.preventDefault();flip("next");}
  else if(e.key==="ArrowLeft"){e.preventDefault();flip("prev");}
  else if(e.key==="Home"){e.preventDefault();go(0);}
  else if(e.key==="End"){e.preventDefault();go(leaves.length-1);}
 };
 const touchEnd=(e:TouchEvent)=>{
  if(swipeStart.current===null)return;
  const delta=e.changedTouches[0].clientX-swipeStart.current;
  swipeStart.current=null;
  if(Math.abs(delta)>55)flip(delta<0?"next":"prev");
 };
 const full=async()=>{
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else await stage.current?.requestFullscreen();
  }catch{setMessage("Không thể mở toàn màn hình trên thiết bị này.");}
 };
 const share=async()=>{
  if(!detail)return;
  const url=pageUrl(detail.book.id,active);
  setManualLink("");setMessage("");
  try{
   if(navigator.share){await navigator.share({title:detail.book.title,url});}
   else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);setMessage("Đã sao chép liên kết trang.");}
   else setManualLink(url);
  }catch(e){
   if(e instanceof DOMException&&e.name==="AbortError")return;
   setManualLink(url);
  }
 };
 const bg=detail?.backgrounds;
 const sceneStyle=bg?({
  "--dl7c-bg-desktop":bg.desktop?'url("'+image(bg.desktop.id)+'")':"none",
  "--dl7c-bg-mobile":bg.mobile?'url("'+image(bg.mobile.id)+'")':
   bg.desktop?'url("'+image(bg.desktop.id)+'")':"none"
 } as CSSProperties):undefined;
 return <div className="fb-catalogue-viewer" onKeyDown={handleKey}>
  <div className="fb-catalogue-topbar">
   <nav aria-label="Đường dẫn" className="fb-catalogue-identity">
    <Link href="/">Trang chủ</Link><span aria-hidden="true">/</span><span>Catalogue</span>
   </nav>
   {books.length>0&&<label className="fb-catalogue-picker">
    <span>Bộ Catalogue</span>
    <select value={detail?.book.id||books[0].id} disabled={loading}
     onChange={e=>void loadBook(e.target.value)}>
     {books.map(b=><option value={b.id} key={b.id}>{b.title}{b.edition?" · "+b.edition:""}</option>)}
    </select>
   </label>}
  </div>
  {loading&&<div className="fb-catalogue-state" role="status">Đang mở cuốn Catalogue…</div>}
  {!loading&&error&&<div className="fb-catalogue-state" role="alert">
   <h2>Chưa thể mở cuốn sách</h2><p>{error}</p>
   <Link className="fb-glass-button fb-glass-button--secondary" href="/san-pham">Xem sản phẩm công khai</Link>
  </div>}
  {!loading&&!error&&!detail&&<div className="fb-catalogue-state" role="status">
   <h2>Catalogue đang được cập nhật</h2>
   <p>Chưa có cuốn sách nào được Futurebook phê duyệt để hiển thị.</p>
   <Link className="fb-glass-button fb-glass-button--primary" href="/san-pham">Xem danh mục sản phẩm</Link>
  </div>}
  {!loading&&detail&&<div ref={stage} style={sceneStyle} className="fb-catalogue-scene">
   <div className="fb-catalogue-scene-overlay" aria-hidden="true"/>
   <div className="fb-catalogue-scene-content">
    <div className="fb-catalogue-heading">
     <div><span className="fb-catalogue-overline">FUTUREBOOK MIỀN NAM · CATALOGUE</span>
      <h2>{detail.book.title}</h2>{detail.book.edition&&<p>{detail.book.edition}</p>}</div>
     <span className="fb-catalogue-count" aria-live="polite">{displayLabel}</span>
    </div>
    <div className="fb-catalogue-reader" role="region" aria-label={"Sách "+detail.book.title}
     onTouchStart={e=>{swipeStart.current=e.touches[0]?.clientX??null;}}
     onTouchEnd={touchEnd} onTouchCancel={()=>{swipeStart.current=null;}}>
     <button type="button" className="fb-catalogue-nav fb-catalogue-nav--prev"
      aria-label="Trang trước" disabled={!hasPrev||Boolean(turn)} onClick={()=>flip("prev")}>‹</button>
     <div className="fb-catalogue-book">
      {left?<button type="button" className="fb-catalogue-leaf fb-catalogue-leaf--left"
       onClick={()=>openZoom(start)} aria-label={"Phóng to "+left.label}>
        <img src={image(left.asset.id)} alt={left.label+" "+detail.book.title}
         width={left.asset.width} height={left.asset.height} loading="eager"/>
       </button>:<div className="fb-catalogue-leaf fb-catalogue-leaf--blank" aria-hidden="true"/>}
      {right?<button type="button" className="fb-catalogue-leaf fb-catalogue-leaf--right"
       onClick={()=>openZoom(cover&&start===0?0:start+1)} aria-label={"Phóng to "+right.label}>
        <img src={image(right.asset.id)} alt={right.label+" "+detail.book.title}
         width={right.asset.width} height={right.asset.height} loading="eager"/>
       </button>:<div className="fb-catalogue-leaf fb-catalogue-leaf--blank fb-catalogue-leaf--right" aria-hidden="true"/>}
      {turn&&<div className={"fb-catalogue-turn fb-catalogue-turn--"+turn.direction} aria-hidden="true">
       <div className="fb-catalogue-turn-front">{turn.asset&&<img src={image(turn.asset.id)} alt=""/>}</div>
       <div className="fb-catalogue-turn-back"/>
      </div>}
      {!mobile&&<span className="fb-catalogue-spine" aria-hidden="true"/>}
     </div>
     <button type="button" className="fb-catalogue-nav fb-catalogue-nav--next"
      aria-label="Trang sau" disabled={!hasNext||Boolean(turn)} onClick={()=>flip("next")}>›</button>
    </div>
    <div className="fb-catalogue-toolbar" role="toolbar" aria-label="Công cụ xem sách">
     <button type="button" className="fb-glass-button fb-glass-button--secondary"
      onClick={()=>setThumbnails(x=>!x)} aria-expanded={thumbnails}>☷ <span>Mục lục</span></button>
     <button type="button" className="fb-glass-button fb-glass-button--secondary"
      onClick={()=>openZoom(active)}>⌕ <span>Phóng to</span></button>
     <button type="button" className="fb-glass-button fb-glass-button--secondary"
      onClick={()=>void full()}>{fullscreen?"⤢":"⛶"} <span>{fullscreen?"Thu nhỏ":"Toàn màn hình"}</span></button>
     <button type="button" className="fb-glass-button fb-glass-button--secondary"
      onClick={()=>void share()}>↗ <span>Chia sẻ trang</span></button>
    </div>
    {message&&<p role="status" className="fb-catalogue-status">{message}</p>}
    {manualLink&&<label className="fb-catalogue-share-fallback">Liên kết trang
     <input readOnly value={manualLink} onFocus={e=>e.target.select()}/></label>}
    {thumbnails&&<div className="fb-catalogue-index" aria-label="Mục lục theo trang">
     {leaves.map((item,i)=><button type="button" key={item.asset.id}
       className={"fb-catalogue-thumb"+(spread(i,cover,mobile)===start?" is-active":"")}
       aria-current={spread(i,cover,mobile)===start?"page":undefined}
       onClick={()=>go(i)}>
       <img src={image(item.asset.id)} alt="" loading="lazy" width={item.asset.width} height={item.asset.height}/>
       <span>{item.label}</span>
      </button>)}
    </div>}
   </div>
   <dialog ref={zoom} className="fb-catalogue-zoom" aria-label="Xem ảnh trang phóng to">
    <div className="fb-glass-dialog-header"><h2 className="fb-glass-dialog-header__title">{zoomLeaf?.label||"Trang Catalogue"}</h2>
     <button type="button" className="fb-glass-button fb-glass-button--secondary"
      onClick={()=>zoom.current?.close()}>Đóng ×</button>
    </div>
    {zoomLeaf&&<div className="fb-catalogue-zoom-image"><img src={image(zoomLeaf.asset.id)}
      alt={zoomLeaf.label+" "+detail.book.title} width={zoomLeaf.asset.width} height={zoomLeaf.asset.height}/></div>}
   </dialog>
  </div>}
 </div>;
}
