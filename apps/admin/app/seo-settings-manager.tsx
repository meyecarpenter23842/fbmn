"use client";
import {useCallback,useEffect,useState} from "react";
import Image from "next/image";
import ProductModal,{useProductModalClose} from "./product-modal";
import AdminToast from "./admin-toast";

type Kind="product"|"category"|"article"|"promotion";
type Mode="auto"|"custom"|"noindex";
type SeoItem={kind:Kind;slug:string;mode:Mode;title:string;description:string;
 ogImagePath:string|null;revision:number;updated_at?:string};
type Target={kind:Kind;slug:string;name:string;title:string;description:string;image:string;images:string[];searchText:string};
type Draft={mode:Mode;title:string;description:string;ogImagePath:string};
const ORIGIN="https://www.fbmn.vn";
const PATHS:Record<Kind,string>={product:"/san-pham/",category:"/danh-muc/",article:"/tin-tuc/",promotion:"/khuyen-mai/"};
const LABELS:Record<Kind,string>={product:"Sản phẩm",category:"Danh mục",article:"Bài viết",promotion:"Khuyến mãi"};
const MODES:Record<Mode,string>={auto:"Tự động",custom:"Đã chỉnh riêng",noindex:"Ẩn khỏi tìm kiếm"};
const key=(x:{kind:Kind;slug:string})=>x.kind+":"+x.slug;
const pageSize=20;
const normalize=(value:string)=>value.toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").trim();
const mediaPattern=/^\/api\/catalogue-image\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
function validTarget(x:Target){
 return x&&Object.hasOwn(LABELS,x.kind)&&typeof x.slug==="string"&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug)&&x.slug.length<=100&&
  typeof x.name==="string"&&typeof x.title==="string"&&typeof x.description==="string"&&typeof x.searchText==="string"&&
  typeof x.image==="string"&&x.image.startsWith("https://")&&Array.isArray(x.images)&&x.images.every(p=>typeof p==="string"&&mediaPattern.test(p));
}
async function loadTargets():Promise<Target[]>{
 const r=await fetch("/api/website/seo-targets",{cache:"no-store",credentials:"same-origin"});
 if(!r.ok)throw Error("Không tải được danh sách trang Website. Vui lòng tải lại.");
 const body=await r.json() as {data?:{items?:Target[]}};
 const items=body.data?.items;
 if(!Array.isArray(items)||items.length>13000||!items.every(validTarget)||new Set(items.map(key)).size!==items.length)
  throw Error("Danh sách trang Website không hợp lệ.");
 return items;
}
async function seoRequest<T>(body?:object,page=1):Promise<T>{
 const auth=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 if(!auth.ok)throw Error("Phiên đăng nhập đã hết hạn.");
 const token=(await auth.json().catch(()=>({}))) as {token?:unknown};
 if(typeof token.token!=="string"||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token.token))
  throw Error("Không xác thực được Owner.");
 const response=await fetch("/api/website/seo"+(body?"":"?page="+page),{method:body?"POST":"GET",credentials:"same-origin",
  cache:"no-store",headers:{Authorization:"Bearer "+token.token,Accept:"application/json",
   ...(body?{"Content-Type":"application/json"}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const json=await response.json().catch(()=>({})) as {data?:T;error?:{code?:string}};
 if(!response.ok){
  if(response.status===409)throw Error("Thiết lập đã có bản mới. Tải lại trước khi lưu.");
  if(response.status===403)throw Error("Chỉ Owner được chỉnh sửa SEO.");
  if(response.status===400)throw Error("Đường dẫn hoặc nội dung SEO không hợp lệ.");
  throw Error("API SEO chưa sẵn sàng. Không có dữ liệu nào được lưu.");
 }
 if(!json.data)throw Error("Dữ liệu SEO không hợp lệ.");
 return json.data;
}
function SeoModalFooter({saving,canSave,onSave}:{saving:boolean;canSave:boolean;onSave:()=>Promise<boolean|undefined>}){
 const close=useProductModalClose();
 const [closeAfterSave,setCloseAfterSave]=useState(false);
 useEffect(()=>{if(!closeAfterSave||saving)return;
  const frame=window.requestAnimationFrame(()=>{close();setCloseAfterSave(false);});
  return ()=>window.cancelAnimationFrame(frame);
 },[closeAfterSave,saving,close]);
 return <>
  <button className="fb-ui-button fb-ui-button--secondary" type="button"
   disabled={saving} onClick={close}>Đóng</button>
  <button className="fb-ui-button fb-ui-button--primary" type="button"
   disabled={saving||!canSave} onClick={()=>void onSave().then(ok=>{if(ok)setCloseAfterSave(true);})}>
   {saving?"Đang lưu…":"Lưu SEO"}</button>
 </>;
}

export default function SeoSettingsManager({owner,readable}:{owner:boolean;readable:boolean}){
 const [items,setItems]=useState<SeoItem[]>([]);
 const [targets,setTargets]=useState<Target[]>([]);
 const [page,setPage]=useState(1);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [editing,setEditing]=useState<Target|null>(null);
 const [draft,setDraft]=useState<Draft>({mode:"auto",title:"",description:"",ogImagePath:""});
 const [confirmed,setConfirmed]=useState(false);
 const [initialDraft,setInitialDraft]=useState<Draft|null>(null);
 const [search,setSearch]=useState("");
 const [kind,setKind]=useState<Kind|"all">("all");
 const [mode,setMode]=useState<Mode|"all">("all");
 const [error,setError]=useState("");
 const [toast,setToast]=useState("");
 const [toastId,setToastId]=useState(0);
 const [toastVariant,setToastVariant]=useState<"success"|"error">("success");
 const refresh=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const [pages,saved]=await Promise.all([loadTargets(),(async()=>{
    const all:SeoItem[]=[];
    for(let p=1;p<=50;p++){
     const result=await seoRequest<{items:SeoItem[];page:number;hasMore:boolean}>(undefined,p);
     if(!Array.isArray(result.items)||result.page!==p||typeof result.hasMore!=="boolean")throw Error("Danh sách thiết lập SEO không hợp lệ.");
     all.push(...result.items);
     if(!result.hasMore)return all;
    }
    throw Error("Danh sách thiết lập SEO vượt giới hạn tải.");
   })()]);
   setTargets(pages);setItems(saved);setPage(1);
  }catch(e){setError(e instanceof Error?e.message:"Không tải được dữ liệu SEO.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{if(!readable)return;let active=true;void Promise.resolve().then(()=>{if(active)void refresh();});
  return ()=>{active=false;};},[readable,refresh]);
 const saved=new Map(items.map(x=>[key(x),x]));
 const existing=editing?saved.get(key(editing)):undefined;
 const getMode=(x:Target)=>saved.get(key(x))?.mode??"auto";
 const filtered=targets.filter(x=>(kind==="all"||kind===x.kind)&&(mode==="all"||getMode(x)===mode)&&
  normalize([x.name,x.searchText,saved.get(key(x))?.title??""].join(" ")).includes(normalize(search)));
 const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
 const currentPage=Math.min(page,totalPages);
 const visible=filtered.slice((currentPage-1)*pageSize,currentPage*pageSize);
 const targetKeys=new Set(targets.map(key));
 const orphanCount=items.filter(x=>!targetKeys.has(key(x))).length;
 const open=(target:Target)=>{
  if(!owner||error||loading)return;
  const item=saved.get(key(target));
  setEditing(target);setConfirmed(false);
  const next:Draft={mode:item?.mode==="noindex"?"noindex":"custom",title:item?.title??"",
   description:item?.description??"",ogImagePath:item?.ogImagePath??""};
  setDraft(next);setInitialDraft(next);
 };
 const set=<K extends keyof Draft>(k:K,value:Draft[K])=>setDraft(prev=>({...prev,[k]:value}));
 const showToast=(message:string,variant:"success"|"error")=>{
  setToast(message);setToastVariant(variant);setToastId(n=>n+1);
 };
 const hasCustom=Boolean(draft.title.trim()||draft.description.trim()||draft.ogImagePath);
 const canSave=Boolean(editing)&&!error&&(draft.mode!=="custom"||hasCustom)&&
  (draft.mode!=="noindex"||existing?.mode==="noindex"||confirmed);
 const save=async()=>{
  if(!owner||!editing||!canSave||saving)return false;
  const title=draft.mode==="custom"?draft.title.trim().replace(/\s+/g," "):"";
  const description=draft.mode==="custom"?draft.description.trim().replace(/\s+/g," "):"";
  const image=draft.mode==="custom"&&editing.kind==="product"?draft.ogImagePath||null:null;
  if(image&&(!mediaPattern.test(image)||(!editing.images.includes(image)&&image!==existing?.ogImagePath))){
   showToast("Chỉ chọn ảnh đã công khai của sản phẩm.","error");return false;
  }
  setSaving(true);
  try{
   const result=await seoRequest<{item:SeoItem}>({operation:"save",kind:editing.kind,slug:editing.slug,
    mode:draft.mode,title,description,ogImagePath:image,revision:existing?.revision??0});
   setItems(prev=>[...prev.filter(x=>key(x)!==key(result.item)),result.item]);
   setInitialDraft(draft);
   showToast("Đã lưu. Google sẽ cập nhật khi đọc lại trang Website.","success");return true;
  }catch(e){showToast(e instanceof Error?e.message:"Không thể lưu.","error");return false;}
  finally{setSaving(false);}
 };
 const previewTitle=editing?(draft.mode==="custom"&&draft.title.trim()?draft.title:editing.title):"";
 const previewDescription=editing?(draft.mode==="custom"&&draft.description.trim()?draft.description:editing.description):"";
 const previewImage=editing?(draft.mode==="custom"&&draft.ogImagePath?ORIGIN+draft.ogImagePath:editing.image):"";
 if(!readable)return <section className="surface dl4-panel"><h1>SEO sản phẩm & nội dung</h1><p>Tài khoản chưa được cấp quyền xem SEO.</p></section>;
 return <div className="dl4-layout">
  <div className="page-title"><div><h1>SEO sản phẩm & nội dung</h1>
   <p>Quản lý nội dung khi khách tìm kiếm trên Google hoặc chia sẻ Website.</p></div>
   <div className="action-row"><button className="fb-ui-button fb-ui-button--secondary" type="button"
    disabled={saving||loading} onClick={()=>void refresh()}>Tải lại</button></div>
  </div>
  {error?<section className="surface dl4-panel" role="alert">{error} Dữ liệu đã lưu không bị thay đổi.</section>:
   loading?<section role="status" className="surface dl4-panel">Đang tải danh sách trang Website…</section>:
   <section className="surface dl4-panel">
    <h2>Trang đang công khai ({targets.length})</h2>
    <p>Website tự tối ưu mọi trang. Chỉ chỉnh khi muốn thay nội dung tìm kiếm hoặc ảnh chia sẻ.</p>
    <div className="cms-form-grid">
     <label className="cms-wide">Tìm theo tên hoặc mã hàng
      <input className="fb-ui-field" value={search} maxLength={120} onChange={e=>{setSearch(e.target.value);setPage(1);}}
       placeholder="Nhập tên sản phẩm, danh mục hoặc mã hàng"/></label>
     <label>Loại nội dung<select className="fb-ui-select" value={kind} onChange={e=>{setKind(e.target.value as Kind|"all");setPage(1);}}>
      <option value="all">Tất cả</option>{(Object.keys(LABELS) as Kind[]).map(k=><option key={k} value={k}>{LABELS[k]}</option>)}
     </select></label>
     <label>Trạng thái<select className="fb-ui-select" value={mode} onChange={e=>{setMode(e.target.value as Mode|"all");setPage(1);}}>
      <option value="all">Tất cả</option>{(Object.keys(MODES) as Mode[]).map(m=><option key={m} value={m}>{MODES[m]}</option>)}
     </select></label>
    </div>
    {!visible.length?<p>Không có trang phù hợp.</p>:<ul className="dl4-list">{visible.map(item=><li className="dl4-item" key={key(item)}>
     <div><strong>{item.name}</strong><small>{LABELS[item.kind]} · {MODES[getMode(item)]}</small></div>
     <div className="action-row">
      <a href={ORIGIN+PATHS[item.kind]+item.slug} target="_blank" rel="noopener noreferrer">Mở trang</a>
      <button className="fb-ui-button fb-ui-button--secondary" type="button" disabled={!owner} onClick={()=>open(item)}>Chỉnh SEO</button>
     </div></li>)}</ul>}
    <div className="action-row">
     <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={currentPage<=1} onClick={()=>setPage(currentPage-1)}>Trang trước</button>
     <span>Trang {currentPage}/{totalPages} · {filtered.length} kết quả</span>
     <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={currentPage>=totalPages} onClick={()=>setPage(currentPage+1)}>Trang tiếp</button>
    </div>
    {orphanCount>0&&<p>{orphanCount} thiết lập cũ không nằm trong danh sách trang hiện công khai. Các thiết lập này vẫn được giữ nguyên.</p>}
   </section>}
  {owner&&editing&&<ProductModal title={"Chỉnh SEO: "+editing.name} locked={saving} onClose={()=>setEditing(null)}
   beforeClose={()=>JSON.stringify(draft)===JSON.stringify(initialDraft)||window.confirm("Bỏ các thay đổi chưa lưu?")} wide
   footer={<SeoModalFooter saving={saving} canSave={canSave} onSave={save}/>}>
   <div className="cms-form-grid">
    <label className="cms-wide">Cách hiển thị trên Google
     <select className="fb-ui-select" value={draft.mode} disabled={saving}
      onChange={e=>{set("mode",e.target.value as Mode);setConfirmed(false);}}>
      <option value="auto">Dùng nội dung tự động</option>
      <option value="custom">Chỉnh nội dung theo ý muốn</option>
      <option value="noindex">Ẩn khỏi Google (nâng cao)</option>
     </select></label>
    {draft.mode==="auto"&&<p className="cms-wide">Khi lưu, hệ thống dùng lại tiêu đề, mô tả và ảnh tự động của Website.</p>}
    {draft.mode==="custom"&&<>
     <label className="cms-wide">Tiêu đề tìm kiếm ({draft.title.length}/180)
      <input className="fb-ui-field" value={draft.title} maxLength={180} disabled={saving}
       placeholder={editing.title} onChange={e=>set("title",e.target.value)}/></label>
     <label className="cms-wide">Mô tả ngắn ({draft.description.length}/400)
      <textarea rows={3} value={draft.description} maxLength={400} disabled={saving}
       placeholder={editing.description} onChange={e=>set("description",e.target.value)}/></label>
     <p className="cms-wide">Bỏ trống từng mục để dùng nội dung tự động. Nên viết tự nhiên, đúng sản phẩm.</p>
     {editing.kind==="product"&&<label className="cms-wide">Ảnh khi chia sẻ
      <select className="fb-ui-select" value={draft.ogImagePath} disabled={saving} onChange={e=>set("ogImagePath",e.target.value)}>
       <option value="">Dùng ảnh tự động</option>
       {draft.ogImagePath&&!editing.images.includes(draft.ogImagePath)&&<option value={draft.ogImagePath}>Giữ ảnh đã lưu trước đây</option>}
       {editing.images.map((p,i)=><option key={p} value={p}>Ảnh sản phẩm {i+1}</option>)}
      </select></label>}
    </>}
    {draft.mode==="noindex"&&<div className="cms-wide">
     <p>Trang vẫn mở được trên Website, nhưng Google sẽ được yêu cầu không đưa trang vào kết quả tìm kiếm.</p>
     {existing?.mode!=="noindex"&&<label><input type="checkbox" checked={confirmed} disabled={saving}
      onChange={e=>setConfirmed(e.target.checked)}/> Tôi xác nhận muốn ẩn trang khỏi kết quả tìm kiếm.</label>}
    </div>}
   </div>
   {draft.mode!=="noindex"&&<div className="surface dl4-panel">
    <h3>Xem trước trên Google</h3>
    <small>www.fbmn.vn · {LABELS[editing.kind]}</small>
    <strong>{previewTitle}</strong><p>{previewDescription}</p>
    <h3>Xem trước khi chia sẻ Facebook / Zalo</h3>
    <Image src={previewImage} alt="Ảnh xem trước khi chia sẻ" unoptimized width={240} height={126}
     style={{objectFit:"contain",maxWidth:"100%"}}/>
    <strong>{previewTitle}</strong><p>{previewDescription}</p>
    <small>Hình minh họa từ nội dung SEO; Google và mạng xã hội có thể hiển thị khác.</small>
   </div>}
  </ProductModal>}
  <AdminToast message={toast} variant={toastVariant} notificationId={toastId} onClose={()=>setToast("")}/>
 </div>;
}
