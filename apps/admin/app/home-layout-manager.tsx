"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import AdminToast from "./admin-toast";
import ProductModal from "./product-modal";

type Section="categories"|"products";
type Layout={categoryIds:string[];featuredSkus:string[];categoryLimit:number;productLimit:number;sectionOrder:Section[];revision:number};
type Category={id:string;name:string;productCount:number;sortOrder:number};
type Sku={sku:string;name:string;categoryId:string};
type Payload={layout:Layout;available:{categories:Category[];skus:Sku[]}};
const clone=(l:Layout):Layout=>({...l,categoryIds:[...l.categoryIds],featuredSkus:[...l.featuredSkus],sectionOrder:[...l.sectionOrder]});
function move<T>(items:T[],i:number,dir:number){
 const j=i+dir;
 if(i<0||j<0||j>=items.length)return items;
 const next=[...items];[next[i],next[j]]=[next[j],next[i]];return next;
}
async function requestLayout<T>(body?:object):Promise<T>{
 const auth=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 if(!auth.ok)throw Error("Phiên đăng nhập đã hết hạn.");
 const jwt=(await auth.json().catch(()=>({}))) as {token?:unknown};
 if(typeof jwt.token!=="string"||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jwt.token))
  throw Error("Không xác thực được Owner.");
 const r=await fetch("/api/website/home-layout",{method:body?"POST":"GET",credentials:"same-origin",cache:"no-store",
  headers:{Authorization:"Bearer "+jwt.token,Accept:"application/json",...(body?{"Content-Type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{})});
 const value=await r.json().catch(()=>({})) as {data?:T;error?:{code?:string}};
 if(!r.ok){
  if(r.status===409)throw Error("Cấu hình đã thay đổi. Hãy tải lại trước khi lưu.");
  if(r.status===403)throw Error("Chỉ Owner có quyền quản lý bố cục.");
  if(r.status===400)throw Error("Danh mục hoặc SKU không hợp lệ/không còn xuất bản.");
  if(value.error?.code==="layout_worker_not_deployed")throw Error("Admin Worker DL4 chưa phát hành.");
  throw Error("API bố cục chưa sẵn sàng. Không có thay đổi nào được lưu.");
 }
 if(!value.data)throw Error("Phản hồi API không hợp lệ.");
 return value.data;
}
export default function HomeLayoutManager({owner}:{owner:boolean}){
 const [saved,setSaved]=useState<Layout|null>(null);
 const [draft,setDraft]=useState<Layout|null>(null);
 const [catalog,setCatalog]=useState<Payload["available"]>({categories:[],skus:[]});
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [noticeId,setNoticeId]=useState(0);
 const [noticeVariant,setNoticeVariant]=useState<"success"|"error">("success");
 const [skuInput,setSkuInput]=useState("");
 const [device,setDevice]=useState<"desktop"|"mobile">("desktop");
 const [resetOpen,setResetOpen]=useState(false);
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const value=await requestLayout<Payload>();
   setSaved(clone(value.layout));setDraft(clone(value.layout));setCatalog(value.available);
  }catch(e){setError(e instanceof Error?e.message:"Không tải được cấu hình.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{if(!owner)return;let cancelled=false;void Promise.resolve().then(()=>{if(!cancelled)return load();});return ()=>{cancelled=true;};},[owner,load]);
 const dirty=useMemo(()=>draft&&saved&&JSON.stringify(draft)!==JSON.stringify(saved),[draft,saved]);
 const patch=(p:Partial<Layout>)=>setDraft(v=>v?{...v,...p}:v);
 async function save(operation:"save"|"reset"){
  if(!draft||!saved||busy)return;
  setBusy(true);setError("");
  try{
   const result=await requestLayout<{layout:Layout}>({operation,revision:saved.revision,
    categoryIds:draft.categoryIds,featuredSkus:draft.featuredSkus,
    categoryLimit:draft.categoryLimit,productLimit:draft.productLimit,sectionOrder:draft.sectionOrder});
   setSaved(clone(result.layout));setDraft(clone(result.layout));setResetOpen(false);
   setNoticeVariant("success");
   setNotice(operation==="reset"?"Đã khôi phục mặc định.":"Đã lưu bố cục Trang chủ.");
   setNoticeId(n=>n+1);
  }catch(e){setNoticeVariant("error");setNotice(e instanceof Error?e.message:"Lỗi lưu cấu hình.");setNoticeId(n=>n+1);}
  finally{setBusy(false);}
 }
 const chosenIds=draft?.categoryIds||[];
 const categories=useMemo(()=>{
  if(!draft)return [];
  const ids=draft.categoryIds.length?draft.categoryIds:catalog.categories.map(c=>c.id);
  const byId=new Map(catalog.categories.map(c=>[c.id,c]));
  return ids.map(id=>byId.get(id)).filter((x):x is Category=>Boolean(x)).slice(0,draft.categoryLimit);
 },[draft,catalog.categories]);
 const skuMap=new Map(catalog.skus.map(s=>[s.sku,s]));
 const validCategoryIds=new Set(categories.map(c=>c.id));
 const pinned=(draft?.featuredSkus||[]).map(id=>skuMap.get(id))
  .filter((s):s is Sku=>Boolean(s)).filter(s=>validCategoryIds.has(s.categoryId))
  .slice(0,draft?.productLimit||4);
 if(!owner)return <section className="surface dl4-panel"><h1>Trang chủ & bố cục</h1><p>Chỉ Owner được sử dụng tính năng này.</p></section>;
 return <div className="dl4-layout">
  <div className="page-title"><div><h1>Trang chủ & bố cục</h1><p>Cấu hình từ danh mục/SKU đã công khai. Không sửa SKU, family, giá hay CMS Hero.</p></div>
   <div className="action-row">
    <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={loading||busy} onClick={()=>void load()}>Tải lại</button>
    <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={!draft||busy} onClick={()=>setResetOpen(true)}>Mặc định</button>
    <button type="button" className="fb-ui-button fb-ui-button--primary" disabled={!dirty||busy} onClick={()=>void save("save")}>{busy?"Đang lưu…":"Lưu cấu hình"}</button>
   </div>
  </div>
  {saved&&<p className="dl4-version">Phiên bản {saved.revision} · Cấu hình có lịch sử audit · <a href="https://fbmn-web.vercel.app" target="_blank" rel="noreferrer">Mở Website</a></p>}
  {loading&&<div role="status" aria-busy="true" className="surface dl4-panel">Đang tải cấu hình thực tế…</div>}
  {error&&<div role="alert" className="dl4-error">{error} <button type="button" className="fb-ui-button fb-ui-button--secondary" onClick={()=>void load()}>Thử lại</button></div>}
  {!loading&&draft&&<div className="dl4-columns">
   <div className="dl4-settings"><fieldset className="dl4-edit-fields" disabled={busy} aria-busy={busy}>
    <section className="surface dl4-panel">
     <h2>Danh mục nổi bật</h2><p>Chỉ danh mục có SKU đã công khai. Bỏ chọn tất cả để dùng thứ tự tự động.</p>
     <label className="dl4-field">Số danh mục <select value={draft.categoryLimit} onChange={e=>patch({categoryLimit:Number(e.target.value)})}>
      {Array.from({length:6},(_,i)=>i+1).map(i=><option key={i} value={i}>{i}</option>)}</select></label>
     <div className="dl4-toolbar"><span>{chosenIds.length?"Thủ công · kéo thứ tự bằng mũi tên":"Tự động"}</span>
      <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={!chosenIds.length} onClick={()=>patch({categoryIds:[]})}>Dùng tự động</button></div>
     {!catalog.categories.length&&<p role="status">Chưa có danh mục công khai đủ điều kiện.</p>}
     <ul className="dl4-list">{catalog.categories.map(c=>{
      const i=chosenIds.indexOf(c.id),selected=i!==-1;
      return <li key={c.id} className="dl4-item">
       <label><input type="checkbox" checked={selected} disabled={!selected&&chosenIds.length===6}
         onChange={e=>patch({categoryIds:e.target.checked?[...chosenIds,c.id]:chosenIds.filter(id=>id!==c.id)})}/>
        <span>{c.name}<small>{c.productCount} nhóm sản phẩm</small></span></label>
       {selected&&<div className="dl4-arrows">
        <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={i===0} aria-label={"Đưa "+c.name+" lên"} onClick={()=>patch({categoryIds:move(chosenIds,i,-1)})}>↑</button>
        <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={i===chosenIds.length-1} aria-label={"Đưa "+c.name+" xuống"} onClick={()=>patch({categoryIds:move(chosenIds,i,1)})}>↓</button>
       </div>}
      </li>;
     })}</ul>
    </section>
    <section className="surface dl4-panel">
     <h2>Thứ tự thẻ sản phẩm</h2><p>Ghim SKU theo mã công ty: thẻ family chứa SKU được đưa lên trước, không tạo thẻ trùng.</p>
     <label className="dl4-field">Số thẻ tối đa <select value={draft.productLimit} onChange={e=>patch({productLimit:Number(e.target.value)})}>
      {Array.from({length:12},(_,i)=>i+1).map(i=><option key={i} value={i}>{i}</option>)}</select></label>
     <form className="dl4-add" onSubmit={e=>{e.preventDefault();const sku=skuInput.trim();
      if(!skuMap.has(sku)){setError("SKU phải đang xuất bản trên Website.");return;}
      if(draft.featuredSkus.includes(sku)||draft.featuredSkus.length===12){setError("SKU đã ghim hoặc vượt giới hạn 12.");return;}
      patch({featuredSkus:[...draft.featuredSkus,sku]});setSkuInput("");setError("");
     }}>
      <label htmlFor="dl4-sku">Ghim SKU công khai</label><input id="dl4-sku" value={skuInput} onChange={e=>setSkuInput(e.target.value)}
        maxLength={100} placeholder="Nhập chính xác mã công ty" list="dl4-eligible"/>
      <datalist id="dl4-eligible">{catalog.skus.slice(0,1000).map(s=><option key={s.sku} value={s.sku}>{s.name}</option>)}</datalist>
      <button type="submit" className="fb-ui-button fb-ui-button--secondary">Thêm</button>
     </form>
     {!draft.featuredSkus.length&&<p>Không ghim: Website tự chọn một family mỗi danh mục trước.</p>}
     <ol className="dl4-list">{draft.featuredSkus.map((sku,i)=><li key={sku} className="dl4-item">
      <span><strong>{sku}</strong><small>{skuMap.get(sku)?.name||"SKU không còn công khai"}</small></span>
      <div className="dl4-arrows">
       <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={i===0} aria-label={"Đưa "+sku+" lên"} onClick={()=>patch({featuredSkus:move(draft.featuredSkus,i,-1)})}>↑</button>
       <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={i===draft.featuredSkus.length-1} aria-label={"Đưa "+sku+" xuống"} onClick={()=>patch({featuredSkus:move(draft.featuredSkus,i,1)})}>↓</button>
       <button type="button" className="fb-ui-button fb-ui-button--secondary" aria-label={"Bỏ "+sku} onClick={()=>patch({featuredSkus:draft.featuredSkus.filter(s=>s!==sku)})}>×</button>
      </div>
     </li>)}</ol>
    </section>
    <section className="surface dl4-panel">
     <h2>Thứ tự khu vực</h2><p>Hero và CMS giữ nguyên. Chỉ đổi vị trí danh mục và sản phẩm.</p>
     <ol className="dl4-list">{draft.sectionOrder.map((x,i)=><li key={x} className="dl4-item">
      <strong>{x==="categories"?"Danh mục":"Sản phẩm"}</strong><div className="dl4-arrows">
       <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={i===0} onClick={()=>patch({sectionOrder:move(draft.sectionOrder,i,-1)})}>↑</button>
       <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={i===1} onClick={()=>patch({sectionOrder:move(draft.sectionOrder,i,1)})}>↓</button>
      </div>
     </li>)}</ol>
    </section>
   </fieldset></div>
   <section className="surface dl4-panel dl4-preview">
    <div className="dl4-toolbar"><h2>Preview bố cục</h2>
     <div role="group" aria-label="Thiết bị xem trước" className="dl4-arrows">
      <button type="button" aria-pressed={device==="desktop"} className={"fb-ui-button "+(device==="desktop"?"fb-ui-button--primary":"fb-ui-button--secondary")} onClick={()=>setDevice("desktop")}>Desktop</button>
      <button type="button" aria-pressed={device==="mobile"} className={"fb-ui-button "+(device==="mobile"?"fb-ui-button--primary":"fb-ui-button--secondary")} onClick={()=>setDevice("mobile")}>Mobile</button>
     </div>
    </div>
    <p>Preview theo dữ liệu thật; không thay thế ảnh chụp Website hoặc bản xem trước CMS.</p>
    <div className={"dl4-stage dl4-stage--"+device}>
     <div className="dl4-stage-banner">Hero CMS · giữ nguyên</div>
     {draft.sectionOrder.map(x=><div className="dl4-stage-section" key={x}><h3>{x==="categories"?"Danh mục sản phẩm":"Sản phẩm đã công khai"}</h3>
      <div className="dl4-stage-grid">{x==="categories"?
       (categories.length?categories.map(c=><div className="dl4-stage-card" key={c.id}>{c.name}<small>{c.productCount} nhóm sản phẩm</small></div>):<p>Chưa có danh mục công khai.</p>):
       (pinned.length?pinned.map(s=><div className="dl4-stage-card" key={s.sku}>{s.name}<small>SKU {s.sku}</small></div>):<p>Thẻ tự chọn từ family đã công khai (tối đa {draft.productLimit}).</p>)}
      </div>
     </div>)}
     <div className="dl4-stage-banner">CMS sau sản phẩm · Footer</div>
    </div>
    <p>Ảnh, biến thể và cách gộp family phải kiểm trực tiếp trên Website sau phát hành.</p>
   </section>
  </div>}
  {resetOpen&&<ProductModal title="Khôi phục mặc định?" locked={busy} onClose={()=>setResetOpen(false)}
   footer={<><button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={busy} onClick={()=>setResetOpen(false)}>Hủy</button>
    <button type="button" className="fb-ui-button fb-ui-button--primary" disabled={busy} onClick={()=>void save("reset")}>Xác nhận và lưu</button></>}>
    <p>Trở về 6 danh mục, 4 thẻ, không ghim SKU, danh mục trước sản phẩm. Thay đổi được ghi revision và audit.</p>
   </ProductModal>}
  <AdminToast message={notice} variant={noticeVariant} notificationId={noticeId} onClose={()=>setNotice("")}/>
 </div>;
}
