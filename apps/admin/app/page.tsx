"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { createAuthClient } from "@neondatabase/auth/next";
import CatalogueImportPreview from "./catalogue-import-preview";
import CatalogueManager from "./catalogue-manager";
import CatalogueSideWorkspace from "./catalogue-side-workspace";
import AdminTelemetry from "./admin-telemetry";

type AuthState = "checking" | "anonymous" | "authorised" | "forbidden" | "unavailable";
type Section = "dashboard" | "products" | "structure" | "pricing" | "import-products" | "new-product" | "media" | "categories" | "banners" | "content" | "customers" | "accounts" | "settings";
type GlyphName = "home" | "box" | "folder" | "image" | "layers" | "file" | "users" | "user" | "settings" | "search" | "bell" | "chevron" | "plus" | "upload" | "save" | "eye" | "edit" | "copy" | "trash" | "check" | "alert" | "logout" | "grid" | "arrow-left" | "link" | "book" | "sparkle" | "menu" | "close" | "shield" | "filter" | "refresh";
type SessionData = { role: string; channels: string[] };
type Channel = { code: string; label: string };
type LocalImage = { id: number; name: string; url: string; bytes: number };
type ProductDraft = { name: string; sku: string; slug: string; family: string; category: string; brand: string; description: string; size: string; pages: string; paper: string; unit: string; pack: string; metaTitle: string; metaDescription: string };
const blankDraft: ProductDraft = { name:"",sku:"",slug:"",family:"",category:"",brand:"Futurebook",description:"",size:"",pages:"",paper:"",unit:"Quyển",pack:"",metaTitle:"",metaDescription:"" };
const authClient = createAuthClient();

function Glyph({ name, size = 20, strokeWidth = 1.85 }: { name: GlyphName; size?: number; strokeWidth?: number }) {
  const shapes: Record<GlyphName, ReactNode> = {
    home:<><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-7h6v7"/></>,
    box:<><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="M3 7v10l9 5 9-5V7M12 12v10"/></>,
    folder:<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v11H3V7Z"/>,
    image:<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/></>,
    layers:<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    file:<><path d="M6 2h8l5 5v15H6V2Z"/><path d="M14 2v6h5M9 12h7M9 16h7"/></>,
    users:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 15c2 0 4 2 4 5"/></>,
    user:<><circle cx="12" cy="7" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="M10 2h4l1 3 3 1 3-1 2 4-2 3 1 3 1 2-3 3-3-1-3 1-2 2h-4l-1-3-3-1-3 1-2-4 2-3-1-3-1-2 3-3 3 1 3-1 2-2"/></>,
    search:<><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>,
    bell:<><path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10ZM10 21h4"/></>,
    chevron:<path d="m6 9 6 6 6-6"/>,
    plus:<path d="M12 4v16M4 12h16"/>,
    upload:<><path d="M12 16V3m-5 5 5-5 5 5M3 17v4h18v-4"/></>,
    save:<><path d="M4 3h14l3 3v15H3V3h1Z"/><path d="M7 3v7h10V3M7 21v-8h10v8"/></>,
    eye:<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
    edit:<><path d="m4 16-1 5 5-1L20 8l-4-4L4 16ZM14 6l4 4"/></>,
    copy:<><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/></>,
    trash:<><path d="M4 6h16M9 6V4h6v2M6 6l1 15h10l1-15M10 10v7M14 10v7"/></>,
    check:<path d="m5 12 5 5L20 7"/>,
    alert:<><circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 17h.01"/></>,
    logout:<><path d="M10 3H4v18h6M14 16l4-4-4-4M8 12h10"/></>,
    grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    "arrow-left":<path d="m14 5-7 7 7 7M7 12h14"/>,
    link:<><path d="M10 13a5 5 0 0 0 7 .3l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7-.3l-3 3a5 5 0 0 0 7 7l2-2"/></>,
    book:<><path d="M12 6a9 9 0 0 0-9-2v15a9 9 0 0 1 9 2 9 9 0 0 1 9-2V4a9 9 0 0 0-9 2ZM12 6v15"/></>,
    sparkle:<><path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/></>,
    menu:<path d="M3 6h18M3 12h18M3 18h18"/>,
    close:<path d="M5 5l14 14M19 5 5 19"/>,
    shield:<><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z"/><path d="m9 12 2 2 4-4"/></>,
    filter:<><path d="M4 6h16M7 12h10M10 18h4"/></>,
    refresh:<><path d="M20 10a8 8 0 0 0-14-4L3 9M3 3v6h6M4 14a8 8 0 0 0 14 4l3-3M21 21v-6h-6"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{shapes[name]}</svg>;
}

const menu: Array<{ key: Section; label: string; icon: GlyphName }> = [
  { key:"dashboard",label:"Tổng quan",icon:"home" },
  { key:"products",label:"Sản phẩm",icon:"box" },
  { key:"pricing",label:"Giá & bảng giá",icon:"layers" },
];
const productSections: Array<{key:Section;label:string;icon:GlyphName}> = [
  {key:"products",label:"Danh sách sản phẩm",icon:"box"},
  {key:"structure",label:"Danh mục & nhóm mẫu",icon:"folder"},
  {key:"media",label:"Thư viện hình ảnh",icon:"image"},
  {key:"import-products",label:"Nhập / cập nhật Excel",icon:"file"},
];

function Brand() {
  return <div className="brand"><span className="brand-symbol"><img src="/brand/fbmn-official-logo.webp" alt="Futurebook Miền Nam" width={184} height={70}/></span></div>;
}
function Button({ children, icon, variant = "light", disabled, onClick, title }: { children: ReactNode; icon?: GlyphName; variant?: "light"|"primary"|"outline"; disabled?: boolean; onClick?: () => void; title?: string }) {
  return <button type="button" title={title} className={"btn btn-"+variant} disabled={disabled} onClick={onClick}>{icon && <Glyph name={icon} size={17}/>}<span>{children}</span></button>;
}
function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={"surface "+className}>{children}</section>;
}
function SectionHeading({ icon, children }: { icon: GlyphName; children: ReactNode }) {
  return <h2 className="panel-heading"><span className="heading-icon"><Glyph name={icon} size={18}/></span>{children}</h2>;
}
function Field({ label, value, setValue, placeholder, required, area = false, readOnly = false }: { label: string; value: string; setValue: (v:string)=>void; placeholder?:string; required?:boolean; area?:boolean; readOnly?:boolean }) {
  return <label className="field"><span>{label}{required && <b> *</b>}</span>{area ? <textarea rows={4} value={value} placeholder={placeholder} onChange={e=>setValue(e.target.value)} readOnly={readOnly}/> : <input value={value} placeholder={placeholder} onChange={e=>setValue(e.target.value)} readOnly={readOnly}/>}</label>;
}
function Placeholder({ title, text }: { title:string;text:string }) {
  return <Panel className="placeholder-state"><div className="placeholder-mark"><Glyph name="shield" size={29}/></div><h2>{title}</h2><p>{text}</p></Panel>;
}

export default function AdminPage() {
  const [authState,setAuthState] = useState<AuthState>("checking");
  const [session,setSession] = useState<SessionData|null>(null);
  const [channels,setChannels] = useState<Channel[]>([]);
  const [name,setName] = useState("");
  const [notice,setNotice] = useState("");
  const [busy,setBusy] = useState(false);
  const [loginMode,setLoginMode] = useState<"login"|"verify"|"forgot"|"reset">("login");
  const [adminEmail,setAdminEmail] = useState("");
  const [adminPassword,setAdminPassword] = useState("");
  const [repeatPassword,setRepeatPassword] = useState("");
  const [emailCode,setEmailCode] = useState("");
  const [section,setSection] = useState<Section>("products");
  const [menuOpen,setMenuOpen] = useState(false);
  const [productMenuExpanded,setProductMenuExpanded]=useState(true);
  const [workspaceOperationBusy,setWorkspaceOperationBusy]=useState(false);
  const [structureTab,setStructureTab]=useState<"categories"|"families">("categories");
  const [draft,setDraft] = useState<ProductDraft>(blankDraft);
  const [photos,setPhotos] = useState<LocalImage[]>([]);
  const [selectedPhoto,setSelectedPhoto] = useState<number|null>(null);
  const [coverId,setCoverId] = useState<number|null>(null);
  const nextImageId = useRef(1);
  const photoUrls = useRef<string[]>([]);
  const inputFile=useRef<HTMLInputElement>(null);

  useEffect(()=>()=>{for(const url of photoUrls.current)URL.revokeObjectURL(url);},[]);

  const refresh=useCallback(async()=>{
    setAuthState("checking");
    setNotice("");
    setSession(null);
    try {
      const result=await authClient.getSession();
      if(result.error){setNotice("Không đọc được phiên hiện tại. Anh có thể đăng nhập lại bằng email và mật khẩu.");setAuthState("anonymous");return;}
      if(!result.data?.user){setAuthState("anonymous");return;}
      // A pre-created Owner with unverified email cannot obtain an Admin JWT.
      // Offer onboarding before ever calling the protected Admin API.
      if(result.data.user.emailVerified===false){
        setAdminEmail(result.data.user.email?.trim().toLowerCase() || "");
        setLoginMode("login");
        setNotice("Email Owner chưa xác minh. Chọn Kích hoạt / Xác minh Owner để nhận mã qua email.");
        setAuthState("anonymous");return;
      }
      setName(result.data.user.name || result.data.user.email || "Nhân sự Futurebook");
      // Neon SDK 0.7.0-beta may classify /token as getSession and return a
      // cached session response. Bypass its method cache via the trusted
      // SAME-ORIGIN Neon Auth Next.js proxy; never fetch the token cross-origin.
      const jwtResponse=await fetch("/api/auth/token",{
        method:"GET",credentials:"same-origin",cache:"no-store",
        headers:{Accept:"application/json"}
      });
      if(!jwtResponse.ok){
        setNotice("Kết nối xác thực đang gián đoạn. Vui lòng thử lại sau.");
        setAuthState("unavailable");return;
      }
      const jwtBody=await jwtResponse.json().catch(()=>null) as {token?:unknown}|null;
      const jwt=typeof jwtBody?.token==="string" ? jwtBody.token : "";
      if(jwt.length>12000 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jwt)){
        setNotice("Chưa xác minh được phiên đăng nhập. Vui lòng thử lại.");
        setAuthState("unavailable");return;
      }
      // Short-lived bearer exists only within this call; no storage or logging.
      const adminRequest=(route:string)=>fetch("/api/admin/"+route,{
        method:"GET",credentials:"same-origin",cache:"no-store",
        headers:{Authorization:"Bearer "+jwt,Accept:"application/json"}
      });
      const response=await adminRequest("session");
      if(response.status===401){
        // Never destroy a legitimate Neon session on a downstream JWT error.
        // Leave it available for retry and use a safe, non-secret stage code.
        const failure=await response.json().catch(()=>null) as {error?:{code?:string}}|null;
        const code=failure?.error?.code || "upstream_unauthenticated";
        setNotice("Phiên đăng nhập chưa được chấp nhận. Vui lòng thử lại.");
        setAuthState("unavailable");return;
      }
      if(response.status===403){setAuthState("forbidden");return;}
      if(!response.ok){setNotice("Chưa xác minh được quyền quản trị của tài khoản.");setAuthState("unavailable");return;}
      const data=await response.json() as {data?:SessionData};
      if(!data.data?.role || !Array.isArray(data.data.channels))throw Error("Invalid API response");
      setSession(data.data);
      setAuthState("authorised");
      const channelResult=await adminRequest("channels");
      if(channelResult.ok){
        const body=await channelResult.json() as {data?:Channel[]};
        if(Array.isArray(body.data))setChannels(body.data);
      }
    }catch{setNotice("Không kết nối được dịch vụ. Vui lòng thử lại.");setAuthState("unavailable");}
  },[]);
  useEffect(()=>{queueMicrotask(()=>{void refresh();});},[refresh]);

  async function signIn(){
    if(!adminEmail.includes("@") || adminPassword.length<1){setNotice("Nhập email và mật khẩu quản trị.");return;}
    setBusy(true);setNotice("");
    try {
      const result=await authClient.signIn.email({email:adminEmail.trim().toLowerCase(),password:adminPassword,rememberMe:false});
      if(result.error) {setNotice("Không đăng nhập được bằng mật khẩu này. Nếu là lần đầu sử dụng, chọn Kích hoạt / Xác minh Owner để nhận mã qua email và đặt mật khẩu mới.");return;}
      setAdminPassword("");void refresh();
    }catch(error:unknown){
      // The Neon Auth client may reject HTTP 401 as an exception rather than
      // returning result.error. 401 is invalid credentials, not a network outage.
      const status = typeof error==="object" && error!==null && "status" in error ? Number(error.status) : 0;
      if(status===403){
        setNotice("Không đăng nhập được lúc này. Vui lòng tải lại trang và thử lại.");
      } else if(status===401 || status===422){
        setNotice("Thông tin đăng nhập không được chấp nhận. Kiểm tra email và mật khẩu; dùng Kích hoạt / Xác minh Owner chỉ khi tài khoản chưa được thiết lập.");
      } else {
        setNotice("Đăng nhập không thành công. Nếu chưa có mật khẩu, bấm Kích hoạt / Xác minh Owner; nếu lỗi tiếp diễn, kiểm tra kết nối.");
      }
    }
    finally{setBusy(false);}
  }
  async function sendVerification(){
    if(!adminEmail.includes("@")){setNotice("Nhập email quản trị trước.");return;}
    setBusy(true);setNotice("");
    try{
      const result=await authClient.emailOtp.sendVerificationOtp({email:adminEmail.trim().toLowerCase(),type:"email-verification"});
      if(result.error){setNotice("Không thể gửi mã xác minh email. Kiểm tra hộp thư hoặc thử lại.");return;}
      setLoginMode("verify");
      setNotice("Nếu email tồn tại, mã xác minh đã được gửi. Vui lòng kiểm tra cả thư rác.");
    }catch{setNotice("Dịch vụ xác minh email tạm thời không sẵn sàng.");}
    finally{setBusy(false);}
  }
  async function verifyEmail(){
    if(!adminEmail.includes("@")||emailCode.trim().length<4){setNotice("Nhập đầy đủ email và mã xác minh.");return;}
    setBusy(true);setNotice("");
    try{
      const result=await authClient.emailOtp.verifyEmail({email:adminEmail.trim().toLowerCase(),otp:emailCode.trim()});
      if(result.error){setNotice("Mã xác minh sai hoặc đã hết hạn.");return;}
      setEmailCode("");setLoginMode("forgot");
      setNotice("Đã xác minh email. Tiếp theo gửi mã để đặt mật khẩu quản trị mới.");
    }catch{setNotice("Không kiểm tra được mã email.");}
    finally{setBusy(false);}
  }
  async function requestReset(){
    if(!adminEmail.includes("@")){setNotice("Nhập email quản trị trước.");return;}
    setBusy(true);setNotice("");
    try{
      const result=await authClient.emailOtp.requestPasswordReset({email:adminEmail.trim().toLowerCase()});
      if(result.error){setNotice("Không gửi được mã đặt lại mật khẩu. Kiểm tra dịch vụ email.");return;}
      setLoginMode("reset");setEmailCode("");
      setNotice("Nếu email tồn tại, mã đặt lại mật khẩu đã được gửi. Không chia sẻ mã với ai.");
    }catch{setNotice("Dịch vụ khôi phục mật khẩu không sẵn sàng.");}
    finally{setBusy(false);}
  }
  async function resetPassword(){
    if(emailCode.trim().length<4){setNotice("Nhập mã xác minh được gửi qua email.");return;}
    if(adminPassword.length<8||adminPassword!==repeatPassword){setNotice("Mật khẩu mới cần từ 8 ký tự và phải trùng nhau.");return;}
    setBusy(true);setNotice("");
    try{
      const result=await authClient.emailOtp.resetPassword({email:adminEmail.trim().toLowerCase(),otp:emailCode.trim(),password:adminPassword});
      if(result.error){setNotice("Mã không hợp lệ hoặc mật khẩu không đáp ứng yêu cầu. Vui lòng thử lại.");return;}
      setAdminPassword("");setRepeatPassword("");setEmailCode("");setLoginMode("login");
      setNotice("Đã đặt mật khẩu mới. Anh có thể đăng nhập bằng email và mật khẩu.");
    }catch{setNotice("Không đổi được mật khẩu. Thử gửi lại mã.");}
    finally{setBusy(false);}
  }
  async function signOut(){
    setBusy(true);setNotice("");
    try{await authClient.signOut();setSession(null);setChannels([]);setName("");setAuthState("anonymous");}
    catch{setNotice("Không đăng xuất được. Thử tải lại trang.");}
    finally{setBusy(false);}
  }
  function navigate(to:Section){
    // A running image upload/replace must not be detached by navigation.
    if(workspaceOperationBusy&&["media","pricing"].includes(section)&&to!==section)return;
    setSection(to==="new-product"?"products":to);
    if(["products","structure","media","import-products"].includes(to))
      setProductMenuExpanded(true);
    setMenuOpen(false);setNotice("");
  }
  function updateDraft(key:keyof ProductDraft,value:string){
    setDraft(prev=>({...prev,[key]:value,...(key==="name" && !prev.slug ? {slug:value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")} : {})}));
  }
  function addFiles(fileList: FileList | File[]){
    const files=Array.from(fileList).filter(file=>["image/png","image/jpeg","image/webp"].includes(file.type)&&file.size<=10*1024*1024).slice(0,Math.max(0,20-photos.length));
    const added=files.map(file=>{const url=URL.createObjectURL(file);photoUrls.current.push(url);return {id:nextImageId.current++,name:file.name,url,bytes:file.size};});
    setPhotos(prev=>prev.concat(added));if(selectedPhoto===null&&added.length)setSelectedPhoto(added[0].id);
    if(coverId===null&&added.length)setCoverId(added[0].id);
  }
  function addPhotos(event:ChangeEvent<HTMLInputElement>){
    if(event.target.files)addFiles(event.target.files);
    event.target.value="";
  }
  function removePhoto(id:number){setPhotos(prev=>{const found=prev.find(p=>p.id===id);if(found){URL.revokeObjectURL(found.url);photoUrls.current=photoUrls.current.filter(u=>u!==found.url);}return prev.filter(p=>p.id!==id);});if(selectedPhoto===id)setSelectedPhoto(null);if(coverId===id)setCoverId(null);}
  const activePhoto=photos.find(p=>p.id===selectedPhoto)||photos[0];
  const roleLabel=session?.role?.toUpperCase() || "";
  const sectionName:Record<Section,string>={dashboard:"Tổng quan",products:"Danh sách sản phẩm",structure:"Danh mục & nhóm mẫu",pricing:"Giá & bảng giá","import-products":"Nhập / cập nhật Excel","new-product":"Thêm sản phẩm",media:"Thư viện hình ảnh",categories:"Danh mục",banners:"Banner & Popup",content:"Nội dung",customers:"Khách hàng",accounts:"Tài khoản",settings:"Cài đặt"};
  return <div className="admin-app">
    <div className={"workspace "+(authState!=="authorised"?"workspace-locked":"")}>
      <aside className={"sidebar "+(menuOpen?"sidebar-open":"")}>
        <Brand/>
        <nav className="side-menu" aria-label="Điều hướng quản trị">
          {menu.filter(item=>item.key==="dashboard").map(item=>
            <button type="button" key={item.key}
              className={"side-link "+(section===item.key?"active":"")}
              aria-current={section===item.key?"page":undefined}
              onClick={()=>navigate(item.key)} disabled={authState!=="authorised"||(workspaceOperationBusy&&["media","pricing"].includes(section)&&item.key!==section)}>
              <Glyph name={item.icon} size={20}/><span>{item.label}</span>
            </button>)}
          <div className="side-menu-divider" aria-hidden="true"/>
          <div className="side-group">
            <button type="button" className={"side-group-heading"+(
              ["products","structure","media","import-products"].includes(section)?" active":"")}
              aria-controls="product-navigation" aria-expanded={productMenuExpanded}
              onClick={()=>setProductMenuExpanded(value=>!value)}
              disabled={authState!=="authorised"}>
              <Glyph name="box" size={20}/><span>Sản phẩm</span>
              <span className="side-menu-caret"><Glyph name="chevron" size={16}/></span>
            </button>
            {productMenuExpanded&&<div id="product-navigation" className="side-submenu">
              {productSections.map(item=>
                <button type="button" key={item.key}
                  className={"side-sub-link"+(section===item.key?" active":"")}
                  aria-current={section===item.key?"page":undefined}
                  onClick={()=>navigate(item.key)}
                  disabled={authState!=="authorised"||(workspaceOperationBusy&&["media","pricing"].includes(section)&&item.key!==section)}>
                  <Glyph name={item.icon} size={16}/><span>{item.label}</span>
                </button>)}
            </div>}
          </div>
          <div className="side-menu-divider" aria-hidden="true"/>
          {menu.filter(item=>item.key==="pricing").map(item=>
            <button type="button" key={item.key}
              className={"side-link "+(section===item.key?"active":"")}
              aria-current={section===item.key?"page":undefined}
              onClick={()=>navigate(item.key)} disabled={authState!=="authorised"||(workspaceOperationBusy&&["media","pricing"].includes(section)&&item.key!==section)}>
              <Glyph name={item.icon} size={20}/><span>{item.label}</span>
            </button>)}
        </nav>
        <div className="side-footer"><div className="decorative-books" aria-hidden="true"><div/><div/><div/></div><p>Tri thức hôm nay<br/>Kiến tạo ngày mai</p><i/></div>
      </aside>
      <div className="work-area">
        <header className="topbar"><button type="button" className="mobile-menu" onClick={()=>setMenuOpen(v=>!v)} aria-label="Mở menu"><Glyph name="menu"/></button>
          <div className="breadcrumbs"><Glyph name="home" size={21}/><span className="crumb-sep">›</span><span>{["products","structure","media","import-products"].includes(section)?"Sản phẩm":"Quản trị"}</span><span className="crumb-sep">›</span><b>{sectionName[section]}</b></div>
          <div className="top-actions"><div className="profile-avatar">{name.slice(0,1).toUpperCase()||"F"}</div><div className="profile-text"><b>{name || "Futurebook Admin"}</b><small>{session?roleLabel:"Yêu cầu đăng nhập"}</small></div><button type="button" className="top-icon" onClick={()=>void signOut()} disabled={authState!=="authorised"} title="Đăng xuất"><Glyph name="logout" size={18}/></button></div>
        </header>
        <main className="workspace-main">
          {authState==="authorised" && <><AdminTelemetry section={section}/>
            {section==="products" && <CatalogueManager
              onImport={()=>navigate("import-products")}
              onStructure={pane=>{setStructureTab(pane);navigate("structure");}}/>}
            {section==="structure"&&<CatalogueManager key={structureTab}
              view="structure" initialPane={structureTab}
              onImport={()=>navigate("import-products")}
              onStructure={pane=>setStructureTab(pane)}/>}
            {section==="pricing"&&<CatalogueSideWorkspace mode="pricing" onBusyChange={setWorkspaceOperationBusy}/>}
            {section==="import-products" && <CatalogueImportPreview/>}
            {section==="new-product" && <><div className="page-title"><div><h1>Thêm sản phẩm mới</h1><p>Chuẩn bị thông tin sản phẩm cho Website và App Futurebook.</p></div><div className="action-row"><Button icon="arrow-left" variant="outline" onClick={()=>navigate("products")}>Quay lại</Button><Button icon="save" disabled title="API ghi bản nháp chưa triển khai">Lưu nháp</Button><Button icon="eye" variant="outline" disabled title="Cần bản nháp thật để xem trước">Xem trước</Button><Button icon="upload" variant="primary" disabled title="Cần quyền publisher và API duyệt/xuất bản">Xuất bản</Button></div></div><p className="draft-warning"><Glyph name="alert" size={17}/>Mẫu nhập liệu đang ở chế độ giao diện thử nghiệm. Thông tin chưa lưu lên database; nút lưu và xuất bản bị khóa cho đến khi có API catalogue.</p>
              <div className="editor-grid"><div className="editor-main"><Panel><SectionHeading icon="file">Thông tin cơ bản</SectionHeading><div className="form-grid cols-3"><Field label="Tên sản phẩm" required value={draft.name} setValue={v=>updateDraft("name",v)} placeholder="Nhập tên theo catalogue"/><Field label="Mã SKU" required value={draft.sku} setValue={v=>updateDraft("sku",v)} placeholder="Giữ nguyên mã công ty"/><Field label="Slug" required value={draft.slug} setValue={v=>updateDraft("slug",v)} placeholder="ten-san-pham"/><Field label="Nhóm hàng" required value={draft.family} setValue={v=>updateDraft("family",v)} placeholder="Tập học sinh / Văn phòng phẩm"/><Field label="Danh mục" required value={draft.category} setValue={v=>updateDraft("category",v)} placeholder="Danh mục sản phẩm"/><Field label="Thương hiệu" value={draft.brand} setValue={v=>updateDraft("brand",v)}/></div></Panel><Panel><SectionHeading icon="layers">Mô tả sản phẩm</SectionHeading><Field label="Thông tin mô tả" value={draft.description} area setValue={v=>updateDraft("description",v)} placeholder="Mô tả đúng thông số đã xác minh"/></Panel><Panel><SectionHeading icon="grid">Quy cách & thông số</SectionHeading><div className="form-grid cols-5"><Field label="Kích thước" value={draft.size} setValue={v=>updateDraft("size",v)} placeholder="Ví dụ A4"/><Field label="Số trang/tờ" value={draft.pages} setValue={v=>updateDraft("pages",v)}/><Field label="Chất liệu" value={draft.paper} setValue={v=>updateDraft("paper",v)}/><Field label="Đơn vị tính" value={draft.unit} setValue={v=>updateDraft("unit",v)}/><Field label="Đóng gói" value={draft.pack} setValue={v=>updateDraft("pack",v)}/></div></Panel><Panel><div className="panel-title-line"><SectionHeading icon="box">Biến thể / SKU phụ</SectionHeading><Button icon="plus" variant="outline" disabled title="Chờ API quản lý biến thể">Thêm biến thể</Button></div><div className="empty-mini">Một sản phẩm có thể chứa nhiều mẫu bìa, quy cách và màu sắc. Dữ liệu biến thể sẽ liên kết theo SKU công ty sau khi kích hoạt API.</div></Panel></div>
              <div className="editor-aside"><Panel><SectionHeading icon="image">Ảnh sản phẩm</SectionHeading><div className="photo-feature">{activePhoto?<img src={activePhoto.url} alt={activePhoto.name}/>:<div className="photo-placeholder"><Glyph name="image" size={37}/><span>Chưa có ảnh sản phẩm</span></div>}</div><div className="mini-thumbs">{photos.slice(0,4).map(p=><button type="button" key={p.id} className={selectedPhoto===p.id?"selected":""} onClick={()=>setSelectedPhoto(p.id)}><img src={p.url} alt={p.name}/></button>)}<button type="button" className="add-thumb" onClick={()=>{navigate("media");inputFile.current?.click();}}><Glyph name="plus"/></button></div><Button variant="outline" icon="image" onClick={()=>navigate("media")}>Quản lý ảnh</Button><p className="subtle">JPG, PNG, WEBP • tối đa 10MB/ảnh. Ảnh chỉ xem tạm trên máy.</p></Panel><Panel><SectionHeading icon="search">SEO / hiển thị</SectionHeading><Field label="Meta title" value={draft.metaTitle} setValue={v=>updateDraft("metaTitle",v)} placeholder="Tên sản phẩm - Futurebook Miền Nam"/><Field label="Meta description" value={draft.metaDescription} setValue={v=>updateDraft("metaDescription",v)} area/><small className="subtle">Địa chỉ web và SEO thật sẽ tạo sau khi xuất bản.</small></Panel><div className="suggestion-box"><Glyph name="sparkle"/><div><b>Gợi ý nhập liệu</b><p>Không tự đoán giá, mã SKU hoặc chất lượng giấy. Dùng bảng giá và catalogue đã đối chiếu.</p></div></div></div></div>
            </>}
            {section==="media"&&<CatalogueSideWorkspace mode="media" onBusyChange={setWorkspaceOperationBusy}/>}
            {section==="dashboard"&&<><div className="page-title"><div><h1>Tổng quan quản trị</h1><p>Thông tin tài khoản và quyền quản trị hiện tại.</p></div><span className="tag">Thông tin tài khoản</span></div><div className="metric-grid"><div className="metric"><span className="metric-icon green"><Glyph name="shield"/></span><div><small>Trạng thái</small><strong className="metric-word">Đã xác thực</strong><em>Phiên đăng nhập hợp lệ</em></div></div><div className="metric"><span className="metric-icon purple"><Glyph name="user"/></span><div><small>Vai trò</small><strong className="metric-word">{roleLabel}</strong><em>Quyền theo tài khoản</em></div></div><div className="metric"><span className="metric-icon blue"><Glyph name="layers"/></span><div><small>Kênh được xem</small><strong>{session?.channels.length||0}</strong><em>Phạm vi theo tài khoản</em></div></div></div><Panel><SectionHeading icon="layers">Kênh kinh doanh được cấp quyền</SectionHeading>{channels.map(c=><div className="channel-row" key={c.code}><span>{c.label}</span><b>{session?.role==="admin"||session?.channels.includes(c.code)?"Có quyền":"Không có quyền"}</b></div>)}</Panel></>}
            {!["dashboard","products","structure","pricing","import-products","new-product","media"].includes(section)&&<><div className="page-title"><div><h1>{sectionName[section]}</h1></div></div><Placeholder title={sectionName[section]+" chưa kích hoạt"} text="Chức năng này đang được hoàn thiện."/></>}
          </>}
        </main>
      </div>
    </div>
    <input type="file" multiple hidden ref={inputFile} accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={addPhotos}/>
    {authState!=="authorised" && <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title"><div className="auth-modal">
      <div className="auth-top"><div className="auth-logo"><img src="/brand/fbmn-official-logo.webp" alt="Futurebook Miền Nam" width={240} height={84}/></div><span className="staging-pill">ADMIN</span></div>
      {authState==="checking"?<><h1 id="auth-title">Đang xác minh phiên đăng nhập</h1><p className="modal-subtitle">Đang kiểm tra quyền truy cập Futurebook…</p><div className="modal-spinner" role="status" aria-label="Đang tải"/></>:
       authState==="anonymous"?<><h1 id="auth-title">{loginMode==="verify"?"Xác minh email":loginMode==="forgot"?"Khôi phục mật khẩu":loginMode==="reset"?"Đặt mật khẩu mới":"Đăng nhập quản trị"}</h1>
       <p className="modal-subtitle">{loginMode==="verify"?"Nhập mã được gửi đến email để xác minh quyền sở hữu hộp thư.":loginMode==="forgot"?"Nhận mã qua email để đặt lại mật khẩu an toàn.":loginMode==="reset"?"Nhập mã email và mật khẩu mới; không dùng lại mật khẩu đã chia sẻ.":"Dành riêng cho nhân sự quản trị được cấp quyền. Đăng nhập bằng email và mật khẩu."}</p>
       {loginMode==="login"&&<div className="first-login-hint" role="note"><Glyph name="alert" size={17}/><span><strong>Lần đầu dùng Owner?</strong> Chọn <b>Kích hoạt / Xác minh Owner</b> bên dưới để nhận mã email và đặt mật khẩu mới.</span></div>}
       <form className="admin-login-form" onSubmit={e=>{e.preventDefault();void (loginMode==="login"?signIn():loginMode==="verify"?verifyEmail():loginMode==="forgot"?requestReset():resetPassword());}}>
         <label className="login-label">Email quản trị<input type="email" value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} placeholder="email@congty.vn" autoComplete="email" required maxLength={200}/></label>
         {(loginMode==="verify"||loginMode==="reset")&&<label className="login-label">Mã xác minh qua email<input inputMode="numeric" autoComplete="one-time-code" value={emailCode} onChange={e=>setEmailCode(e.target.value)} placeholder="Nhập mã đã nhận" required maxLength={12}/></label>}
         {(loginMode==="login"||loginMode==="reset")&&<label className="login-label">{loginMode==="reset"?"Mật khẩu mới":"Mật khẩu"}<input type="password" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} placeholder={loginMode==="reset"?"Ít nhất 8 ký tự":"Nhập mật khẩu"} autoComplete={loginMode==="login"?"current-password":"new-password"} required minLength={loginMode==="reset"?8:1}/></label>}
         {loginMode==="reset"&&<label className="login-label">Xác nhận mật khẩu mới<input type="password" value={repeatPassword} onChange={e=>setRepeatPassword(e.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" required minLength={8}/></label>}
         <button type="submit" className="google-login admin-password-submit" disabled={busy}><Glyph name={loginMode==="login"?"shield":loginMode==="verify"?"check":"refresh"} size={18}/><span>{busy?"Đang xử lý…":loginMode==="verify"?"Xác minh email":loginMode==="forgot"?"Gửi mã đặt lại mật khẩu":loginMode==="reset"?"Đặt mật khẩu mới":"Đăng nhập Admin"}</span></button>
       </form>
       <div className="login-switch">
         {loginMode==="login"?<><button type="button" onClick={()=>{setNotice("");setLoginMode("forgot");}}>Quên mật khẩu?</button><button type="button" onClick={()=>{setNotice("");void sendVerification();}} disabled={busy}>Kích hoạt / Xác minh Owner</button></>:
          loginMode==="verify"?<><button type="button" onClick={()=>{void sendVerification();}} disabled={busy}>Gửi lại mã</button><button type="button" onClick={()=>{setNotice("");setLoginMode("login");}}>Về đăng nhập</button></>:
          loginMode==="reset"?<><button type="button" onClick={()=>{setNotice("");setLoginMode("forgot");}}>Gửi lại mã</button><button type="button" onClick={()=>{setNotice("");setLoginMode("login");}}>Về đăng nhập</button></>:
          <button type="button" onClick={()=>{setNotice("");setLoginMode("login");}}>Về đăng nhập</button>}
       </div><p className="login-footnote">Chỉ tài khoản đã được cấp quyền mới truy cập khu vực quản trị.</p></>:
       authState==="forbidden"?<><h1 id="auth-title">Tài khoản chưa được cấp quyền</h1><p className="modal-subtitle">Đã nhận phiên đăng nhập của <b>{name}</b> nhưng tài khoản chưa được cấp quyền quản trị.</p><button type="button" className="google-login" onClick={()=>void signOut()} disabled={busy}><Glyph name="logout" size={18}/>Đăng xuất / Đổi tài khoản</button><Button icon="refresh" onClick={()=>void refresh()} disabled={busy}>Kiểm tra quyền lại</Button></>:
       <><h1 id="auth-title">Chưa kết nối được đăng nhập</h1><p className="modal-subtitle">Chưa xác minh được phiên đăng nhập hoặc quyền tài khoản. Vui lòng thử lại.</p><div className="modal-actions"><Button icon="refresh" variant="primary" onClick={()=>void refresh()}>Thử lại</Button><Button icon="logout" onClick={()=>void signOut()}>Đăng nhập lại</Button><Button icon="user" onClick={()=>{setNotice("Đăng nhập bằng email quản trị hoặc chọn Kích hoạt / Xác minh Owner.");setLoginMode("login");setAuthState("anonymous");}}>Mở form đăng nhập</Button></div></>}
      {notice && <p className="auth-notice" role="alert">{notice}</p>}
      <div className="modal-footer"><Glyph name="shield" size={15}/>Khu vực bảo mật · Futurebook Miền Nam</div>
    </div></div>}
  </div>;
}
