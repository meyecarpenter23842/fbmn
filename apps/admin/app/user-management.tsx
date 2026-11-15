"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import AdminToast from "./admin-toast";
import ProductModal from "./product-modal";

type Permission={key:string;group:string;label:string;detail:string};
type Staff={id:string;email:string;name:string;verified:boolean;role:string;enabled:boolean;revision:number;permissions:string[];channels:string[]};
type Catalog={users:Staff[];roles:string[];permissions:Permission[];defaults:Record<string,string[]>;channels:string[]};
type Draft={id?:string;email:string;name:string;role:string;enabled:boolean;permissions:string[];channels:string[];revision?:number};
const CHANNEL_LABELS:Record<string,string>={public_web:"Website",dealer_app:"App Đại lý",consumer_app:"App Người tiêu dùng"};
const ROLE_LABELS:Record<string,string>={viewer:"Chỉ xem",editor:"Biên tập",publisher:"Xuất bản",pricing:"Quản lý giá",admin:"Quản trị Admin",ceo:"Nhân sự CEO",owner:"Owner"};
const JWT=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
function friendlyError(status:number,code?:string){
 if(status===409)return "Dữ liệu vừa được thay đổi. Tải lại danh sách trước khi lưu.";
 if(status===404)return "Không tìm thấy tài khoản Neon Auth để cấp quyền.";
 if(status===403)return "Tài khoản của anh không được phép quản lý nhân sự.";
 if(status===401)return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
 if(code==="auth_user_create_failed")return "Neon Auth chưa tạo được tài khoản. Kiểm tra lại email và thử lại.";
 if(status===400)return "Dữ liệu nhân sự không hợp lệ. Kiểm tra email và các chức năng được chọn.";
 return "Dịch vụ quản lý tài khoản đang gián đoạn. Vui lòng thử lại.";
}
async function usersApi(method:"GET"|"POST"|"PATCH",body?:object){
 const tokenResponse=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store",headers:{Accept:"application/json"}});
 if(!tokenResponse.ok)throw new Error("Không đọc được phiên đăng nhập. Vui lòng đăng nhập lại.");
 const tokenBody=await tokenResponse.json() as {token?:unknown};
 const token=typeof tokenBody.token==="string"?tokenBody.token:"";
 if(!JWT.test(token))throw new Error("Phiên xác thực không hợp lệ.");
 const response=await fetch("/api/users",{method,credentials:"same-origin",cache:"no-store",
  headers:{Authorization:"Bearer "+token,Accept:"application/json",...(body?{"Content-Type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{})});
 const payload=await response.json().catch(()=>null) as {data?:unknown;error?:{code?:string}}|null;
 if(!response.ok)throw new Error(friendlyError(response.status,payload?.error?.code));
 return payload?.data;
}
function emptyDraft(defaults:Record<string,string[]>):Draft{
 return {email:"",name:"",role:"viewer",enabled:true,permissions:[...(defaults.viewer||[])],channels:["public_web"]};
}
export default function UserManagement({actorRole}:{actorRole:string}){
 const [catalog,setCatalog]=useState<Catalog|null>(null);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [query,setQuery]=useState("");
 const [draft,setDraft]=useState<Draft|null>(null);
 const [notice,setNotice]=useState<{message:string;variant:"success"|"error"|"info";id:number}|null>(null);
 const [persistentError,setPersistentError]=useState("");
 const openButton=useRef<HTMLButtonElement|null>(null);
 const isManager=actorRole==="owner"||actorRole==="admin";
 const toast=(message:string,variant:"success"|"error"|"info"="success")=>
  setNotice({message,variant,id:Date.now()});
 const load=useCallback(async()=>{
  setLoading(true);setPersistentError("");
  try{
   const data=await usersApi("GET") as Catalog;
   if(!Array.isArray(data?.users)||!Array.isArray(data?.permissions)||!data.defaults)throw new Error("Dữ liệu phân quyền không hợp lệ.");
   setCatalog(data);
  }catch(error){setPersistentError(error instanceof Error?error.message:"Không tải được nhân sự.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{queueMicrotask(()=>{void load();});},[load]);
 const filtered=useMemo(()=>catalog?.users.filter(u=>(u.email+" "+u.name+" "+u.role).toLowerCase().includes(query.trim().toLowerCase()))||[],[catalog,query]);
 const groups=useMemo(()=>{
  const results:Record<string,Permission[]>={};
  for(const p of catalog?.permissions||[])(results[p.group] ||= []).push(p);
  return Object.entries(results);
 },[catalog]);
 const beginCreate=()=>{
  if(!catalog)return;
  setDraft(emptyDraft(catalog.defaults));setPersistentError("");
 };
 const beginEdit=(person:Staff)=>{
  if(person.role==="owner")return;
  setDraft({id:person.id,email:person.email,name:person.name,role:person.role,
   enabled:person.enabled,permissions:[...person.permissions],channels:[...person.channels],revision:person.revision});
  setPersistentError("");
 };
 const cancel=()=>{if(!busy){setDraft(null);openButton.current?.focus();}};
 function changeRole(next:string){
  if(!draft||!catalog)return;
  const defaults=catalog.defaults[next]||[];
  setDraft({...draft,role:next,permissions:[...defaults]});
 }
 function togglePermission(key:string,enabled:boolean){
  if(!draft)return;
  const permissions=new Set(draft.permissions);
  if(enabled)permissions.add(key);else permissions.delete(key);
  if(enabled&&key.startsWith("admin.pricing.")){permissions.add("admin.catalogue.read");permissions.add("admin.pricing.read");}
  if(enabled&&key.startsWith("ceo."))permissions.add("ceo.overview");
  if(enabled&&key==="ceo.mail.send")permissions.add("ceo.mail.read");
  if(enabled&&key==="ceo.seo")permissions.add("ceo.statistics");
  if(enabled&&key==="ceo.gsc.manage"){permissions.add("ceo.statistics");permissions.add("ceo.seo");}
  if(!enabled&&key==="ceo.overview")for(const p of [...permissions])if(p.startsWith("ceo."))permissions.delete(p);
  if(!enabled&&key==="ceo.mail.read")permissions.delete("ceo.mail.send");
  if(!enabled&&key==="ceo.statistics"){permissions.delete("ceo.seo");permissions.delete("ceo.gsc.manage");}
  if(!enabled&&key==="ceo.seo")permissions.delete("ceo.gsc.manage");
  if(!enabled&&key==="admin.catalogue.read"){
   permissions.delete("admin.pricing.read");permissions.delete("admin.pricing.write");
  }
  if(!enabled&&key==="admin.pricing.read")permissions.delete("admin.pricing.write");
  setDraft({...draft,permissions:[...permissions]});
 }
 function toggleChannel(key:string,enabled:boolean){
  if(!draft)return;
  setDraft({...draft,channels:enabled?[...draft.channels,key]:draft.channels.filter(p=>p!==key)});
 }
 async function save(){
  if(!draft||!catalog||busy)return;
  if(!draft.name.trim()||!draft.email.includes("@")){setPersistentError("Nhập tên và email nhân viên.");return;}
  setBusy(true);setPersistentError("");
  try{
   const payload={email:draft.email.trim().toLowerCase(),role:draft.role,enabled:draft.enabled,
    permissions:draft.permissions,channels:draft.channels};
   if(draft.id)await usersApi("PATCH",{...payload,revision:draft.revision});
   else await usersApi("POST",{...payload,name:draft.name.trim()});
   setDraft(null);
   toast(draft.id?"Đã cập nhật quyền nhân viên.":"Đã tạo tài khoản. Nhân viên cần xác minh email và tự đặt mật khẩu.");
   await load();
  }catch(error){
   setPersistentError(error instanceof Error?error.message:"Không lưu được nhân viên.");
   toast("Không lưu được tài khoản. Kiểm tra thông báo trong biểu mẫu.","error");
  }finally{setBusy(false);}
 }
 if(!isManager)return <section className="surface"><p>Chỉ Owner hoặc Admin được cấp quyền quản lý nhân viên.</p></section>;
 return <section className="user01">
  <div className="page-title"><div><h1>Quản lý tài khoản</h1>
   <p>Tạo nhân sự, cấp chức năng Admin và CEO theo từng người. Không có quyền tạo thêm Owner.</p></div>
   <button type="button" className="btn btn-primary" ref={openButton} disabled={loading||!catalog} onClick={beginCreate}>+ Tạo tài khoản</button>
  </div>
  <div className="surface user01-intro">
   <strong>Cấp quyền rõ từng chức năng</strong>
   <p>Vai trò chỉ là bộ quyền gợi ý. Các ô được tích bên dưới mới quyết định nhân viên có thể thực hiện những gì. Admin có thể tạo Admin khác; không ai được tự cấp Owner.</p>
  </div>
  <div className="surface user01-list">
   <div className="user01-toolbar">
    <h2>Nhân sự ({catalog?.users.length||0})</h2>
    <div><input className="fb-ui-field" aria-label="Tìm nhân viên" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm tên, email, vai trò"/>
    <button type="button" className="btn btn-outline" onClick={()=>void load()} disabled={loading}>Tải lại</button></div>
   </div>
   {persistentError&&!draft&&<p className="user01-error" role="alert">{persistentError}</p>}
   {loading?<p className="user01-empty">Đang tải danh sách tài khoản…</p>:
    <div className="user01-scroll"><table><thead><tr><th>Nhân viên</th><th>Vai trò</th><th>Quyền Admin</th><th>Quyền CEO</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>{filtered.map(person=><tr key={person.id}>
      <td><strong>{person.name}</strong><small>{person.email}</small>{!person.verified&&<small>Chưa xác minh email</small>}</td>
      <td>{ROLE_LABELS[person.role]||person.role}</td>
      <td>{person.role==="owner"?"Toàn quyền":person.permissions.filter(key=>key.startsWith("admin.")).length+" chức năng"}</td>
      <td>{person.role==="owner"?"Toàn quyền":person.permissions.filter(key=>key.startsWith("ceo.")).length+" chức năng"}</td>
      <td><span className={"user01-status "+(person.enabled?"is-active":"is-disabled")}>{person.enabled?"Hoạt động":"Đã khóa"}</span></td>
      <td>{person.role==="owner"?<span className="user01-immutable">Owner bảo vệ</span>:
       <button type="button" className="btn btn-outline" onClick={()=>beginEdit(person)}>Sửa quyền</button>}</td>
    </tr>)}</tbody></table>{filtered.length===0&&<p className="user01-empty">Không tìm thấy tài khoản phù hợp.</p>}</div>}
  </div>
  {draft&&<ProductModal title={draft.id?"Sửa quyền nhân viên":"Tạo tài khoản nhân viên"} onClose={cancel} locked={busy} wide
    footer={<><button type="button" className="btn btn-outline" onClick={cancel} disabled={busy}>Hủy</button>
     <button type="button" className="btn btn-primary" onClick={()=>void save()} disabled={busy}>{busy?"Đang lưu…":draft.id?"Lưu thay đổi":"Tạo tài khoản"}</button></>}>
   <div className="user01-staff-form">
      <div className="user01-form-grid">
       <label>Họ tên<input className="fb-ui-field" type="text" maxLength={150} value={draft.name} readOnly={!!draft.id} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
       <label>Email đăng nhập<input className="fb-ui-field" type="email" maxLength={200} value={draft.email} readOnly={!!draft.id} onChange={e=>setDraft({...draft,email:e.target.value})}/></label>
       <label>Vai trò<select className="fb-ui-select" value={draft.role} onChange={e=>changeRole(e.target.value)}>
        {catalog?.roles.map(role=><option value={role} key={role}>{ROLE_LABELS[role]||role}</option>)}</select></label>
       <label>Trạng thái<select className="fb-ui-select" value={draft.enabled?"yes":"no"} onChange={e=>setDraft({...draft,enabled:e.target.value==="yes"})}>
        <option value="yes">Cho phép đăng nhập</option><option value="no">Khóa truy cập</option></select></label>
      </div>
      <fieldset className="user01-fieldset"><legend>Kênh quản trị</legend><div className="user01-channels">
       {catalog?.channels.map(key=><label key={key}><input type="checkbox" checked={draft.channels.includes(key)}
        onChange={e=>toggleChannel(key,e.target.checked)}/>{CHANNEL_LABELS[key]||key}</label>)}</div></fieldset>
      <div className="user01-permission-heading"><strong>Chức năng được cấp</strong>
       <span>{draft.permissions.length}/{catalog?.permissions.length||0} quyền</span></div>
      {groups.map(([group,items])=><fieldset key={group} className="user01-fieldset">
        <legend>{group}</legend><div className="user01-permission-grid">
         {items.map(permission=><label key={permission.key} className="user01-permission">
          <input type="checkbox" checked={draft.permissions.includes(permission.key)}
           disabled={permission.key==="admin.users.manage"&&draft.role!=="admin"}
           onChange={e=>togglePermission(permission.key,e.target.checked)}/>
          <span><strong>{permission.label}</strong><small>{permission.detail}</small></span>
         </label>)}</div>
       </fieldset>)}
      <p className="user01-advice">Nhân viên mới mở trang đăng nhập Admin hoặc CEO, chọn xác minh email để nhận mã rồi tự đặt mật khẩu. Không chia sẻ mật khẩu Owner.</p>
      {persistentError&&<p className="user01-error" role="alert">{persistentError}</p>}
    </div>
   </ProductModal>}
  <AdminToast message={notice?.message||""} variant={notice?.variant||"success"} notificationId={notice?.id}
   onClose={()=>setNotice(null)}/>
 </section>;
}
