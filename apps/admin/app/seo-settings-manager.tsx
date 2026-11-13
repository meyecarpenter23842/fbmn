"use client";
import {useCallback,useEffect,useState} from "react";
import ProductModal from "./product-modal";
import AdminToast from "./admin-toast";

type Kind="product"|"category"|"article"|"promotion";
type Mode="auto"|"custom"|"noindex";
type SeoItem={kind:Kind;slug:string;mode:Mode;title:string;description:string;
 ogImagePath:string|null;revision:number;updated_at?:string};
type Draft={kind:Kind;url:string;mode:Mode;title:string;description:string;ogImagePath:string};
const ORIGIN="https://www.fbmn.vn";
const PATHS:Record<Kind,string>={product:"/san-pham/",category:"/danh-muc/",
 article:"/tin-tuc/",promotion:"/khuyen-mai/"};
const LABELS:Record<Kind,string>={product:"Sản phẩm",category:"Danh mục",
 article:"Bài viết",promotion:"Khuyến mãi"};
const blank=():Draft=>({kind:"product",url:"",mode:"auto",title:"",description:"",ogImagePath:""});
function parsePath(input:string,kind:Kind):string|null{
 try{
  const trimmed=input.trim();
  const path=trimmed.startsWith("/")?trimmed:trimmed.startsWith("https://")?
   (()=>{const uri=new URL(trimmed);if(uri.origin!==ORIGIN||uri.search||uri.hash)throw Error();return uri.pathname})():
   PATHS[kind]+trimmed;
  if(!path.startsWith(PATHS[kind]))return null;
  const slug=decodeURIComponent(path.slice(PATHS[kind].length));
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>100)return null;
  if(kind==="product"&&!/^sku-[a-f0-9]{32}$/.test(slug))return null;
  if(kind==="category"&&!/^cat-[a-f0-9]{32}$/.test(slug)&&slug!=="chua-phan-loai")return null;
  return slug;
 }catch{return null;}
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
export default function SeoSettingsManager({owner}:{owner:boolean}){
 const [items,setItems]=useState<SeoItem[]>([]);
 const [page,setPage]=useState(1);
 const [hasMore,setHasMore]=useState(false);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [editing,setEditing]=useState<SeoItem|null|undefined>(undefined);
 const [draft,setDraft]=useState<Draft>(blank);
 const [search,setSearch]=useState("");
 const [error,setError]=useState("");
 const [toast,setToast]=useState("");
 const [toastId,setToastId]=useState(0);
 const [toastVariant,setToastVariant]=useState<"success"|"error">("success");
 const refresh=useCallback(async(pageNumber=1)=>{
  setLoading(true);setError("");
  try{
   const result=await seoRequest<{items:SeoItem[];page:number;hasMore:boolean}>(undefined,pageNumber);
   if(!Array.isArray(result.items)||result.page!==pageNumber||typeof result.hasMore!=="boolean")
    throw Error("Danh sách SEO không hợp lệ.");
   setItems(result.items);setPage(result.page);setHasMore(result.hasMore);
  }catch(e){setError(e instanceof Error?e.message:"Không tải được dữ liệu SEO.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{if(!owner)return;let active=true;void Promise.resolve().then(()=>{if(active)void refresh();});
  return ()=>{active=false;};},[owner,refresh]);
 const set=<K extends keyof Draft>(key:K,value:Draft[K])=>setDraft(prev=>({...prev,[key]:value}));
 const open=(item:SeoItem|null)=>{
  setEditing(item);
  setDraft(item?{kind:item.kind,url:ORIGIN+PATHS[item.kind]+item.slug,mode:item.mode,
   title:item.title,description:item.description,ogImagePath:item.ogImagePath||""}:blank());
 };
 const slug=editing?editing.slug:parsePath(draft.url,draft.kind);
 const target=slug?ORIGIN+PATHS[draft.kind]+slug:null;
 const duplicate=!editing&&items.some(x=>x.kind===draft.kind&&x.slug===slug);
 const resultItems=items.filter(x=>(LABELS[x.kind]+" "+x.slug+" "+x.title)
  .toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi"))).slice(0,200);
 const showToast=(message:string,variant:"success"|"error")=>{
  setToast(message);setToastVariant(variant);setToastId(n=>n+1);
 };
 const save=async()=>{
  if(!slug||!target||saving||duplicate)return;
  const title=draft.mode==="auto"?"":draft.title.trim();
  const description=draft.mode==="auto"?"":draft.description.trim();
  const image=draft.mode==="auto"||draft.kind!=="product"?null:draft.ogImagePath.trim()||null;
  if(draft.mode==="custom"&&!title&&!description&&!image){
   showToast("Chế độ tùy chỉnh cần ít nhất một trường SEO.","error");return;
  }
  let imagePath:string|null=null;
  if(image){
   try{
    const u=new URL(image,ORIGIN);
    if(u.origin!==ORIGIN||u.search||u.hash||
      !/^\/api\/catalogue-image\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(u.pathname))
      throw Error();
    imagePath=u.pathname;
   }catch{showToast("Ảnh chia sẻ phải là ảnh sản phẩm công khai trên fbmn.vn.","error");return;}
  }
  setSaving(true);
  try{
   const result=await seoRequest<{item:SeoItem}>({operation:"save",kind:draft.kind,slug,
    mode:draft.mode,title,description,ogImagePath:imagePath,revision:editing?.revision??0});
   setItems(prev=>[...prev.filter(x=>!(x.kind===result.item.kind&&x.slug===result.item.slug)),result.item]
    .sort((a,b)=>(a.kind+":"+a.slug).localeCompare(b.kind+":"+b.slug)));
   setEditing(undefined);
   showToast("Đã lưu thiết lập trong Admin. Chưa áp dụng công khai cho đến khi SEO02C được triển khai.","success");
  }catch(e){showToast(e instanceof Error?e.message:"Không thể lưu.","error");}
  finally{setSaving(false);}
 };
 if(!owner)return <section className="surface dl4-panel"><h1>SEO sản phẩm & nội dung</h1>
  <p>Chỉ Owner có quyền sửa thiết lập SEO.</p></section>;
 return <div className="dl4-layout">
  <div className="page-title"><div><h1>SEO sản phẩm & nội dung</h1>
   <p>Quản lý SEO theo URL thực của sản phẩm, danh mục, tin tức và khuyến mãi.</p></div>
   <div className="action-row">
    <button className="fb-ui-button fb-ui-button--secondary" type="button"
     disabled={saving||loading} onClick={()=>void refresh()}>Tải lại</button>
    <button className="fb-ui-button fb-ui-button--primary" type="button"
     disabled={saving||loading||Boolean(error)} onClick={()=>open(null)}>+ Thêm SEO</button>
   </div>
  </div>
  <section className="surface dl4-panel" role="note">
   <strong>Giai đoạn SEO02B</strong>
   <p>Thông tin dưới đây được lưu trong Admin. Chế độ noindex, sitemap và metadata chỉ có hiệu lực
    khi migration, Public Worker và Website của SEO02C được nghiệm thu và triển khai. Không thay
    thế quyền công khai sản phẩm hiện có.</p>
  </section>
  {error&&<p role="alert" className="dl4-error">{error}</p>}
  {loading?<section role="status" className="surface dl4-panel">Đang tải thiết lập SEO…</section>:
   <section className="surface dl4-panel">
    <h2>Thiết lập đã lưu · trang {page} ({items.length} mục đang xem)</h2>
    <label className="dl4-field">Tìm theo đường dẫn hoặc tiêu đề
     <input value={search} maxLength={120} onChange={e=>setSearch(e.target.value)}
      placeholder="Nhập URL hoặc tên nhóm"/></label>
    {!items.length?<p>Chưa có thiết lập riêng. Website mặc định sử dụng SEO tự động.</p>:
     <ul className="dl4-list">{resultItems.map(item=><li className="dl4-item"
      key={item.kind+":"+item.slug}>
      <div><strong>{LABELS[item.kind]} · {item.slug}</strong>
       <small>{item.mode==="noindex"?"Không lập chỉ mục":item.mode==="custom"?"Tùy chỉnh":"Tự động"}
        {" · Phiên bản "+item.revision}</small></div>
      <a href={ORIGIN+PATHS[item.kind]+item.slug} target="_blank" rel="noopener noreferrer">
       Mở trang</a>
      <button className="fb-ui-button fb-ui-button--secondary" type="button"
       onClick={()=>open(item)}>Sửa</button>
     </li>)}</ul>}
    <div className="action-row">
     <button type="button" className="fb-ui-button fb-ui-button--secondary"
      disabled={page<=1||loading} onClick={()=>void refresh(page-1)}>Trang trước</button>
     <span>Trang {page}</span>
     <button type="button" className="fb-ui-button fb-ui-button--secondary"
      disabled={!hasMore||loading} onClick={()=>void refresh(page+1)}>Trang tiếp</button>
    </div>
   </section>}
  {editing!==undefined&&<ProductModal title={editing?"Chỉnh SEO: "+editing.slug:"Thêm thiết lập SEO"}
   locked={saving} onClose={()=>setEditing(undefined)} wide
   footer={<>
    <button className="fb-ui-button fb-ui-button--secondary" type="button" disabled={saving}
     onClick={()=>setEditing(undefined)}>Đóng</button>
    <button className="fb-ui-button fb-ui-button--primary" type="button"
     disabled={saving||!slug||duplicate} onClick={()=>void save()}>{saving?"Đang lưu…":"Lưu SEO"}</button>
   </>}>
   <div className="cms-form-grid">
    <label>Loại trang
     <select value={draft.kind} disabled={Boolean(editing)||saving}
      onChange={e=>{set("kind",e.target.value as Kind);set("url","");set("ogImagePath","");}}>
      {(Object.keys(LABELS) as Kind[]).map(k=><option key={k} value={k}>{LABELS[k]}</option>)}
     </select></label>
    <label className="cms-wide">Đường dẫn trên Website (dán URL hoặc slug)
     <input value={draft.url} disabled={Boolean(editing)||saving} maxLength={250}
      onChange={e=>set("url",e.target.value)}
      placeholder={ORIGIN+PATHS[draft.kind]+"..."}/></label>
    <p className="cms-wide">{target?"Canonical tự động: "+target:
     "Chọn đúng trang đã xuất bản. Canonical không thể trỏ đến tên miền khác."}</p>
    {duplicate&&<p className="cms-wide" role="alert">Trang này đã được cấu hình, vui lòng sửa bản ghi hiện tại.</p>}
    <label className="cms-wide">Chế độ SEO
     <select value={draft.mode} disabled={saving}
      onChange={e=>setDraft(prev=>({...prev,mode:e.target.value as Mode,
       ...(e.target.value==="auto"?{title:"",description:"",ogImagePath:""}:{})}))}>
      <option value="auto">Tự động — lấy tên và nội dung đã xuất bản</option>
      <option value="custom">Tùy chỉnh — chỉnh thông tin tìm kiếm</option>
      <option value="noindex">Không lập chỉ mục — vẫn hiển thị trên Website</option>
     </select></label>
    {draft.mode!=="auto"&&<>
     <label className="cms-wide">SEO Title ({draft.title.length}/180)
      <input value={draft.title} maxLength={180} disabled={saving}
       onChange={e=>set("title",e.target.value)}/></label>
     <label className="cms-wide">Meta Description ({draft.description.length}/400)
      <textarea rows={3} value={draft.description} maxLength={400} disabled={saving}
       onChange={e=>set("description",e.target.value)}/></label>
     {draft.kind==="product"&&<label className="cms-wide">Ảnh chia sẻ (URL ảnh sản phẩm đã công khai)
      <input value={draft.ogImagePath} disabled={saving}
       onChange={e=>set("ogImagePath",e.target.value)} placeholder={ORIGIN+"/api/catalogue-image/..."}/>
     </label>}
    </>}
   </div>
   <div className="surface dl4-panel">
    <h3>Xem trước thông tin tìm kiếm</h3>
    {draft.mode==="noindex"?<p>Trang sẽ yêu cầu Google không lập chỉ mục sau khi SEO02C được kích hoạt.</p>:
     <><strong>{draft.mode==="custom"&&draft.title?draft.title:"Tự lấy tên từ dữ liệu đã duyệt"}</strong>
      <p>{target||"Đường dẫn canonical sau khi chọn trang"}</p>
      <p>{draft.mode==="custom"&&draft.description?draft.description:
       "Mô tả tự động sẽ lấy từ sản phẩm/danh mục/bài viết đã xuất bản."}</p></>}
   </div>
  </ProductModal>}
  <AdminToast message={toast} variant={toastVariant} notificationId={toastId}
   onClose={()=>setToast("")}/>
 </div>;
}
