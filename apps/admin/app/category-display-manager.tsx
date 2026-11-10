"use client";
import {useCallback,useEffect,useState} from "react";
import AdminToast from "./admin-toast";
import ProductModal from "./product-modal";

type Mode="family"|"sku";
type Category={categoryId:string;name:string;skuCount:number;mode:Mode;revision:number};
type Reply={categories:Category[]};
async function categoryRequest<T>(body?:object):Promise<T>{
 const auth=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 if(!auth.ok)throw Error("Phiên đăng nhập đã hết hạn.");
 const jwt=(await auth.json().catch(()=>({}))) as {token?:unknown};
 if(typeof jwt.token!=="string"||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jwt.token))
  throw Error("Không xác thực được Owner.");
 const response=await fetch("/api/website/category-display",{
  method:body?"POST":"GET",credentials:"same-origin",cache:"no-store",
  headers:{Authorization:"Bearer "+jwt.token,Accept:"application/json",...(body?{"Content-Type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
 });
 const value=await response.json().catch(()=>({})) as {data?:T};
 if(!response.ok){
  if(response.status===409)throw Error("Cấu hình đã thay đổi, hãy tải lại.");
  if(response.status===403)throw Error("Chỉ Owner có quyền đổi chế độ hiển thị.");
  if(response.status===400)throw Error("Danh mục không hợp lệ hoặc không còn xuất bản.");
  throw Error("API cấu hình danh mục chưa sẵn sàng. Chưa có thay đổi nào được lưu.");
 }
 if(!value.data)throw Error("Phản hồi cấu hình không hợp lệ.");
 return value.data;
}
export default function CategoryDisplayManager({owner}:{owner:boolean}){
 const [categories,setCategories]=useState<Category[]>([]);
 const [editing,setEditing]=useState<Category|null>(null);
 const [editMode,setEditMode]=useState<Mode>("family");
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [noticeId,setNoticeId]=useState(0);
 const [noticeVariant,setNoticeVariant]=useState<"success"|"error">("success");
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const response=await categoryRequest<Reply>();
   setCategories(response.categories);
   setEditing(null);
  }catch(e){setError(e instanceof Error?e.message:"Không tải được chế độ danh mục.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{if(!owner)return;let cancelled=false;void Promise.resolve().then(()=>{if(!cancelled)return load();});return ()=>{cancelled=true;};},[owner,load]);
 async function save(item:Category){
  if(saving||editMode===item.mode)return;
  setSaving(item.categoryId);setError("");
  try{
   const result=await categoryRequest<{category:{categoryId:string;mode:Mode;revision:number}}>({
    operation:"save",categoryId:item.categoryId,mode:editMode,revision:item.revision
   });
   setCategories(prev=>prev.map(c=>c.categoryId===item.categoryId?{...c,...result.category}:c));
   setEditing(null);
   setNoticeVariant("success");setNotice("Đã lưu chế độ hiển thị danh mục.");setNoticeId(x=>x+1);
  }catch(e){setNoticeVariant("error");setNotice(e instanceof Error?e.message:"Không lưu được.");setNoticeId(x=>x+1);}
  finally{setSaving("");}
 }
 if(!owner)return <section className="surface dl4-panel"><h1>Danh mục & hiển thị sản phẩm</h1><p>Chỉ Owner được thay đổi.</p></section>;
 return <div className="dl4-layout">
  <div className="page-title"><div><h1>Danh mục & hiển thị sản phẩm</h1>
   <p>Family (mặc định): một thẻ cho cả nhóm. SKU: mỗi mã công ty đã xuất bản là một thẻ riêng, dùng ảnh và quy cách đúng mã.</p></div>
   <div className="action-row"><button className="fb-ui-button fb-ui-button--secondary" type="button"
    disabled={loading||Boolean(saving)} onClick={()=>void load()}>Tải lại</button></div>
  </div>
  {loading&&<section className="surface dl4-panel" role="status" aria-busy="true">Đang tải các danh mục đã công khai…</section>}
  {error&&<p className="dl4-error" role="alert">{error}</p>}
  {!loading&&<section className="surface dl4-panel">
   <h2>Chế độ hiển thị theo từng danh mục</h2>
   <p>Chỉ áp dụng Website Futurebook. Không đổi SKU gốc, family, giá, R2 hay dữ liệu của hai App.</p>
   {!categories.length&&<p role="status">Chưa có danh mục có SKU đã công khai để cấu hình.</p>}
   <ul className="dl4-list">{categories.map(c=><li key={c.categoryId} className="dl4-item">
    <div><strong>{c.name}</strong><small>{c.skuCount} SKU công khai · Phiên bản {c.revision||"mặc định"}</small></div>
    <span>{c.mode==="sku"?"SKU — mỗi mã một thẻ":"Family — một thẻ/nhóm"}</span>
    <button type="button" className="fb-ui-button fb-ui-button--secondary"
     disabled={Boolean(saving)} onClick={()=>{setEditing(c);setEditMode(c.mode);}}>Chỉnh sửa</button>
   </li>)}</ul>
   <p>Đã lưu thì mở trang danh mục trên Website để kiểm ảnh, lọc và phân trang thực tế. Chế độ Family luôn là lựa chọn an toàn khi API cấu hình gián đoạn.</p>
  </section>}
  {editing&&<ProductModal title={"Hiển thị danh mục: "+editing.name} locked={Boolean(saving)}
   onClose={()=>setEditing(null)}
   footer={<><button type="button" className="fb-ui-button fb-ui-button--secondary"
    disabled={Boolean(saving)} onClick={()=>setEditing(null)}>Hủy</button>
    <button type="button" className="fb-ui-button fb-ui-button--primary"
     disabled={Boolean(saving)||editMode===editing.mode} onClick={()=>void save(editing)}>
     {saving?"Đang lưu…":"Lưu cấu hình"}</button></>}>
   <p>Chỉ đổi cách hiển thị của {editing.skuCount} SKU đã công khai; không sửa mã, family hoặc giá.</p>
   <label className="dl4-field">Kiểu thẻ
    <select value={editMode} disabled={Boolean(saving)} onChange={e=>setEditMode(e.target.value as Mode)}>
     <option value="family">Family — một thẻ/nhóm</option>
     <option value="sku">SKU — mỗi mã một thẻ</option>
    </select>
   </label>
  </ProductModal>}
  <AdminToast message={notice} variant={noticeVariant} notificationId={noticeId} onClose={()=>setNotice("")}/>
 </div>;
}
