"use client";
import {Fragment,useEffect,useState,useCallback} from "react";
import ProductModal,{useProductModalClose} from "./product-modal";
import AdminToast from "./admin-toast";
type Config={projectId:string;location:string;agentId:string;environmentId:string;model:string};
type Stored={config:Partial<Config>;revision:number;credentialsConfigured?:boolean};
type Models={models:string[];currentModel:string};
const empty:Config={projectId:"",location:"global",agentId:"",environmentId:"draft",model:""};
const labels:Record<keyof Config,string>={projectId:"Google Cloud Project ID",location:"Vùng Agent",agentId:"Agent ID",environmentId:"Environment ID (hoặc draft)",model:"Model"};
async function api<T>(body?:object):Promise<T>{
 const auth=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 const jwt=await auth.json().catch(()=>({})) as {token?:unknown};
 if(!auth.ok||typeof jwt.token!=="string")throw Error("Phiên đăng nhập không hợp lệ.");
 const res=await fetch("/api/website/chatbot-config",{method:body?"POST":"GET",cache:"no-store",credentials:"same-origin",
  headers:{Authorization:"Bearer "+jwt.token,Accept:"application/json",...(body?{"Content-Type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{})});
 const reply=await res.json().catch(()=>({})) as {data?:T;error?:{code?:string}};
 if(!res.ok||!reply.data){
  const code=reply.error?.code;
  throw Error(code==="credentials_missing"?"Chưa cấu hình tài khoản Google ở backend.":code==="revision_conflict"?"Cấu hình đã thay đổi. Hãy tải lại.":code==="invalid_config"?"Cấu hình không hợp lệ. Chỉ nhận đúng các trường và định dạng hỗ trợ.":code==="model_unavailable"?"Model chưa có trong kết quả Google.":code==="google_unavailable"?"Không xác minh được Google Agent, Environment hoặc danh sách model. Kiểm tra quyền và API.":"Không thể xử lý cấu hình Chatbot.");
 }
 return reply.data;
}
function Cancel(){const close=useProductModalClose();return <button className="fb-ui-button fb-ui-button--secondary" type="button" onClick={close}>Hủy</button>;}
export default function ChatbotConfigManager({owner}:{owner:boolean}){
 const [stored,setStored]=useState<Stored|null>(null),[draft,setDraft]=useState<Config>(empty);
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [models,setModels]=useState<Models|null>(null),[notice,setNotice]=useState(""),[noticeId,setNoticeId]=useState(0);
 const [variant,setVariant]=useState<"success"|"error">("success");
 const notify=(message:string,v:"success"|"error")=>{setNotice(message);setVariant(v);setNoticeId(n=>n+1);};
 const load=useCallback(async()=>{setError("");try{setStored(await api<Stored>());}catch(e){setError(e instanceof Error?e.message:"Không tải được cấu hình.");}},[]);
 useEffect(()=>{if(owner)void Promise.resolve().then(load);},[owner,load]);
 const change=(key:keyof Config,value:string)=>{setDraft(d=>({...d,[key]:value,...(key!=="model"?{model:""}:{})}));if(key!=="model")setModels(null);};
 async function importFile(file:File){
  setBusy(true);try{
   if(file.size>16384||!/\.(js|json)$/i.test(file.name))throw Error("Chỉ nhận file JS/JSON tối đa 16 KB.");
   const raw=await file.text();
   // Reject credential-shaped and non-literal files locally; never send raw keys to a server.
   let candidate:unknown;
   try{candidate=JSON.parse(raw.replace(/^\uFEFF/,"").trim().replace(/^(?:export\s+default\s+|module\.exports\s*=\s*)/,"").replace(/;\s*$/,""));}catch{throw Error("File phải chứa JSON thuần hoặc một export JSON.");}
   if(!candidate||typeof candidate!=="object"||Array.isArray(candidate)||Object.keys(candidate).some(k=>!Object.prototype.hasOwnProperty.call(labels,k)))throw Error("File có trường ngoài cấu hình. Không nhập khóa bí mật.");
   if(Object.values(candidate).some(v=>typeof v!=="string"||v.length>100||/PRIVATE KEY|Bearer\s|ya29\./i.test(v)))throw Error("File có giá trị không hợp lệ hoặc chứa thông tin bí mật.");
   const result=await api<{config:Config}>({operation:"import",raw:JSON.stringify(candidate)});
   setDraft(result.config);setModels(null);notify("Đã đọc cấu hình. Chưa lưu.", "success");
  }catch(e){notify(e instanceof Error?e.message:"Không đọc được file.","error");}finally{setBusy(false);}
 }
 async function discover(){
  setBusy(true);setModels(null);
  try{const result=await api<Models>({operation:"discover",config:draft});setModels(result);
   setDraft(d=>({...d,model:result.models.includes(d.model)?d.model:""}));
   notify("Đã xác minh Agent/Environment và tải model từ Google.","success");
  }catch(e){notify(e instanceof Error?e.message:"Không kết nối được Google.","error");}finally{setBusy(false);}
 }
 async function save(){
  if(!stored)return;setBusy(true);
  try{const result=await api<Stored>({operation:"save",config:draft,revision:stored.revision});
   setStored({...result,credentialsConfigured:stored.credentialsConfigured});setOpen(false);notify("Đã lưu cấu hình.","success");
  }catch(e){notify(e instanceof Error?e.message:"Không lưu được cấu hình.","error");}finally{setBusy(false);}
 }
 if(!owner)return <section className="surface dl4-panel"><h1>Cấu hình Chatbot</h1><p>Chỉ Owner được quản lý cấu hình.</p></section>;
 return <div className="dl4-layout">
  <div className="page-title"><div><h1>Cấu hình Chatbot</h1><p>Dialogflow CX · Website Futurebook</p></div>
   <div className="action-row"><button className="fb-ui-button fb-ui-button--secondary" disabled={busy} onClick={()=>void load()}>Tải lại</button>
   <button className="fb-ui-button fb-ui-button--primary" disabled={!stored||busy} onClick={()=>{setDraft({...empty,...stored?.config});setModels(null);setOpen(true);}}>Chỉnh cấu hình</button></div></div>
  {error&&<p role="alert">{error}</p>}
  {!stored&&!error&&<p role="status">Đang tải cấu hình…</p>}
  {stored&&<section className="surface dl4-panel"><h2>Kết nối Google</h2>
   <p>{stored.credentialsConfigured?"Đã có biến bí mật ở backend; chưa xác minh kết nối.":"Chưa có tài khoản Google ở backend."}</p>
   <dl className="dl6-request-details">{(Object.keys(labels) as (keyof Config)[]).map(k=><Fragment key={k}><dt>{labels[k]}</dt><dd>{stored.config[k]||"Chưa cấu hình"}</dd></Fragment>)}</dl>
   <p className="content-small-note">Model lưu tại đây là lựa chọn cho Website ở DL10B. Prompt/Playbook quản lý bên Google. DL10A chưa kích hoạt chatbot thật hoặc lưu hội thoại.</p>
  </section>}
  {open&&<ProductModal title="Cấu hình Dialogflow CX" locked={busy} onClose={()=>setOpen(false)}
   beforeClose={()=>JSON.stringify(draft)===JSON.stringify({...empty,...stored?.config})||window.confirm("Bỏ thay đổi chưa lưu?")}
   footer={<><Cancel/><button className="fb-ui-button fb-ui-button--primary" disabled={busy||!draft.projectId||!draft.agentId||!draft.environmentId} onClick={()=>void save()}>Lưu cấu hình</button></>}>
   <div className="form-grid">
    <label>Nhập file JS/JSON<input type="file" accept=".js,.json" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void importFile(f);e.target.value="";}}/></label>
    <p className="content-small-note">JSON hoặc JS dạng export default / module.exports chứa JSON thuần; không nhập khóa bí mật hoặc mã thực thi.</p>
    {(["projectId","location","agentId","environmentId"] as const).map(k=><label key={k}>{labels[k]}<input className="fb-ui-field" value={draft[k]} disabled={busy} onChange={e=>change(k,e.target.value)}/></label>)}
    <button className="fb-ui-button fb-ui-button--secondary" disabled={busy||!draft.projectId||!draft.agentId} onClick={()=>void discover()}>{busy?"Đang xử lý…":"Kiểm tra kết nối & tải model"}</button>
    <label>Model<select className="fb-ui-select" value={draft.model} disabled={busy||!models} onChange={e=>change("model",e.target.value)}>
     <option value="">Chưa chọn (lưu nháp)</option>
     {draft.model&&!models?.models.includes(draft.model)&&<option value={draft.model}>{draft.model} (chưa kiểm tra)</option>}
     {models?.models.map(m=><option key={m} value={m}>{m}</option>)}
    </select></label>
    {models&&<p role="status">Model hiện tại của Agent: {models.currentModel||"Không trả về"} · {models.models.length} lựa chọn được đối chiếu.</p>}
   </div>
  </ProductModal>}
  <AdminToast message={notice} variant={variant} notificationId={noticeId} onClose={()=>setNotice("")}/>
 </div>;
}
