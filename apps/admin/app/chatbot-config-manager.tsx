"use client";
import {Fragment,useEffect,useState,useCallback,useRef} from "react";
import ProductModal,{useProductModalClose} from "./product-modal";
import AdminToast from "./admin-toast";
type Config={projectId:string;location:string;agentId:string;environmentId:string;model:string};
type Stored={config:Partial<Config>;revision:number;credentialsConfigured?:boolean};
type Agent={id:string;location:string;name:string};
type Environment={id:string;name:string};
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
  throw Error(code==="credentials_missing"?"Chưa có tài khoản Google. Hãy nhập file Service Account.":code==="revision_conflict"?"Cấu hình đã thay đổi. Hãy tải lại.":code==="invalid_config"?"Cấu hình không hợp lệ. Chỉ nhận đúng các trường và định dạng hỗ trợ.":code==="model_unavailable"?"Model chưa có trong kết quả Google.":code==="google_invalid_key"?"File Google có private key không hợp lệ. Tạo lại khóa Service Account JSON.":code==="google_auth_failed"?"Google từ chối xác thực Service Account. Kiểm tra khóa đã bị thu hồi hoặc tài khoản bị vô hiệu hóa.":code==="google_api_disabled"?"Google chưa bật Dialogflow API hoặc API cần thiết trong project.":code==="google_permission_denied"?"Service Account thiếu quyền Google IAM để đọc Agent/Environment/model.":code==="google_resource_not_found"?"Không tìm thấy project hoặc tài nguyên Google trong vùng đã chọn.":code==="google_quota"?"Google giới hạn quota. Kiểm tra quota và thử lại.":code==="google_timeout"?"Google phản hồi quá thời gian. Chọn vùng Agent cụ thể rồi thử lại.":code==="google_network_error"?"Backend không kết nối được Google. Thử lại hoặc chọn vùng Agent cụ thể.":code==="config_upstream_unavailable"?"Admin Worker không phản hồi hoặc trả dữ liệu không hợp lệ.":code==="credentials_storage_unavailable"?"Kho khóa mã hóa chưa sẵn sàng.":code==="google_unavailable"?"Không xác minh được Google Agent, Environment hoặc danh sách model. Kiểm tra quyền và API.":"Không thể xử lý cấu hình Chatbot.");
 }
 return reply.data;
}
function Cancel(){const close=useProductModalClose();return <button className="fb-ui-button fb-ui-button--secondary" type="button" onClick={close}>Hủy</button>;}
function CloseAfterSave({ready}:{ready:boolean}){
 const close=useProductModalClose();
 // Let ProductModal sync its unlocked and beforeClose refs before requesting its shared exit.
 useEffect(()=>{if(ready)void Promise.resolve().then(close);},[ready,close]);
 return null;
}
export default function ChatbotConfigManager({owner}:{owner:boolean}){
 const [stored,setStored]=useState<Stored|null>(null),[draft,setDraft]=useState<Config>(empty);
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false),[error,setError]=useState("");
 const credential=useRef<string>("");
 const [region,setRegion]=useState("all");
 const [fileName,setFileName]=useState(""),[agents,setAgents]=useState<Agent[]>([]),[environments,setEnvironments]=useState<Environment[]>([]);
 const [models,setModels]=useState<Models|null>(null),[notice,setNotice]=useState(""),[noticeId,setNoticeId]=useState(0);
 const [variant,setVariant]=useState<"success"|"error">("success");
 const notify=(message:string,v:"success"|"error")=>{setNotice(message);setVariant(v);setNoticeId(n=>n+1);};
 const load=useCallback(async()=>{setError("");try{setStored(await api<Stored>());}catch(e){setError(e instanceof Error?e.message:"Không tải được cấu hình.");}},[]);
 useEffect(()=>{if(owner)void Promise.resolve().then(load);},[owner,load]);
 const resetDiscovery=()=>{setAgents([]);setEnvironments([]);setModels(null);};
 const change=(key:keyof Config,value:string)=>{setDraft(d=>({...d,[key]:value,...(key!=="model"?{model:""}:{})}));if(key!=="model")setModels(null);};
 const withCredential=(body:object)=>({...body,...(credential.current?{credential:credential.current}:{})});
 async function importFile(file:File){
  setBusy(true);try{
   if(file.size>16384||!/\.(js|json)$/i.test(file.name))throw Error("Chỉ nhận file JS/JSON tối đa 16 KB.");
   const raw=await file.text();
   let candidate:unknown;
   try{candidate=JSON.parse(raw.replace(/^\uFEFF/,"").trim().replace(/^(?:export\s+default\s+|module\.exports\s*=\s*)/,"").replace(/;\s*$/,""));}catch{throw Error("File phải chứa JSON thuần hoặc một export JSON.");}
   if(!candidate||typeof candidate!=="object"||Array.isArray(candidate))throw Error("File không hợp lệ.");
   const v=candidate as Record<string,unknown>;
   if(v.type==="service_account"&&typeof v.project_id==="string"&&typeof v.client_email==="string"&&typeof v.private_key==="string"){
    credential.current=JSON.stringify(v);setFileName(file.name);setDraft({...empty,projectId:v.project_id});resetDiscovery();
    notify("Đã đọc file Google. Bấm Load Agent để tải danh sách.","success");return;
   }
   const result=await api<{config:Config}>({operation:"import",raw:JSON.stringify(candidate)});
   credential.current="";setFileName(file.name);setDraft(result.config);resetDiscovery();notify("Đã đọc cấu hình. Bấm Load Agent.","success");
  }catch(e){notify(e instanceof Error?e.message:"Không đọc được file.","error");}finally{setBusy(false);}
 }
 async function loadAgents(){
  setBusy(true);resetDiscovery();
  try{
   const result=await api<{agents:Agent[];failedLocations:string[]}>(withCredential({operation:"list_agents",projectId:draft.projectId,location:region}));
   setAgents(result.agents);setDraft(d=>({...d,agentId:"",environmentId:"draft",model:""}));
   notify(result.agents.length?"Đã tải "+result.agents.length+" Agent."+ (result.failedLocations.length?" Một số vùng không truy cập được.":""):"Không tìm thấy Agent có quyền truy cập.",result.agents.length?"success":"error");
  }catch(e){notify(e instanceof Error?e.message:"Không tải được Agent.","error");}finally{setBusy(false);}
 }
 async function loadEnvironments(){
  setBusy(true);setEnvironments([]);setModels(null);
  try{
   const result=await api<{environments:Environment[]}>(withCredential({operation:"list_environments",config:{...draft,environmentId:"draft",model:""}}));
   setEnvironments(result.environments);setDraft(d=>({...d,environmentId:"draft",model:""}));
   notify(result.environments.length?"Đã tải Environment.":"Chưa có Environment đã phát hành bên Google.",result.environments.length?"success":"error");
  }catch(e){notify(e instanceof Error?e.message:"Không tải được Environment.","error");}finally{setBusy(false);}
 }
 async function discover(){
  setBusy(true);setModels(null);
  try{const result=await api<Models>(withCredential({operation:"discover",config:draft}));setModels(result);
   setDraft(d=>({...d,model:result.models.includes(d.model)?d.model:""}));
   notify("Đã xác minh Agent/Environment và tải model từ Google.","success");
  }catch(e){notify(e instanceof Error?e.message:"Không kết nối được Google.","error");}finally{setBusy(false);}
 }
 async function save(){
  if(!stored)return;setBusy(true);
  try{const result=await api<Stored>(withCredential({operation:"save",config:draft,revision:stored.revision}));
   setStored({...result,credentialsConfigured:Boolean(credential.current)||stored.credentialsConfigured});setDraft({...empty,...result.config});credential.current="";setSaved(true);setNotice("");
  }catch(e){notify(e instanceof Error?e.message:"Không lưu được cấu hình.","error");}finally{setBusy(false);}
 }
 if(!owner)return <section className="surface dl4-panel"><h1>Cấu hình Chatbot</h1><p>Chỉ Owner được quản lý cấu hình.</p></section>;
 return <div className="dl4-layout">
  <div className="page-title"><div><h1>Cấu hình Chatbot</h1><p>Dialogflow CX · Website Futurebook</p></div>
   <div className="action-row"><button className="fb-ui-button fb-ui-button--secondary" disabled={busy} onClick={()=>void load()}>Tải lại</button>
   <button className="fb-ui-button fb-ui-button--primary" disabled={!stored||busy} onClick={()=>{setDraft({...empty,...stored?.config});resetDiscovery();credential.current="";setFileName("");setRegion("all");setSaved(false);setNotice("");setOpen(true);}}>Chỉnh cấu hình</button></div></div>
  {error&&<p role="alert">{error}</p>}
  {!stored&&!error&&<p role="status">Đang tải cấu hình…</p>}
  {stored&&<section className="surface dl4-panel"><h2>Kết nối Google</h2>
   <p>{stored.credentialsConfigured?"Đã có tài khoản Google ở backend.":"Chưa có tài khoản Google ở backend."}</p>
   <dl className="dl6-request-details">{(Object.keys(labels) as (keyof Config)[]).map(k=><Fragment key={k}><dt>{labels[k]}</dt><dd>{stored.config[k]||"Chưa cấu hình"}</dd></Fragment>)}</dl>
   <p className="content-small-note">Website sử dụng Agent, Environment và model đã lưu. Prompt/Playbook quản lý bên Google. Chưa lưu lịch sử hội thoại.</p>
  </section>}
  {open&&<ProductModal title="Cấu hình Dialogflow CX" locked={busy} onClose={()=>{credential.current="";setFileName("");setOpen(false);setNotice("");if(saved)notify("Đã lưu cấu hình.","success");}}
   beforeClose={()=>saved||(!credential.current&&JSON.stringify(draft)===JSON.stringify({...empty,...stored?.config}))||window.confirm("Bỏ thay đổi chưa lưu?")}
   footer={<><Cancel/><button className="fb-ui-button fb-ui-button--primary" disabled={busy||saved||!draft.projectId||!draft.agentId||draft.environmentId==="draft"||!draft.model} onClick={()=>void save()}>Lưu cấu hình</button></>}>
   <CloseAfterSave ready={saved&&!busy}/>
   <div className="form-grid">
    <label>Nhập file Google Cloud (JS/JSON)<input type="file" accept=".js,.json" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)void importFile(f);e.target.value="";}}/></label>
    <p className="content-small-note">{fileName?"Đã chọn: "+fileName:"Chọn file Service Account JSON của Google Cloud."} Khóa được mã hóa khi lưu; không hiển thị hoặc ghi vào bảng cấu hình.</p>
    <label>Google Cloud Project ID<input className="fb-ui-field" value={draft.projectId} readOnly disabled={busy}/></label>
    <label>Vùng tìm Agent<select className="fb-ui-select" value={region} disabled={busy} onChange={e=>{setRegion(e.target.value);resetDiscovery();setDraft(d=>({...d,agentId:"",environmentId:"draft",model:""}));}}>
    <option value="all">Tất cả vùng</option>
    {["global","asia-south1","asia-southeast1","asia-southeast2","asia-northeast1","australia-southeast1","eu","europe-west1","europe-west2","europe-west3","europe-west4","europe-west6","northamerica-northeast1","us","us-central1","us-east1","us-west1"].map(x=><option key={x} value={x}>{x}</option>)}
    </select></label>
    <button className="fb-ui-button fb-ui-button--secondary" disabled={busy||!draft.projectId} onClick={()=>void loadAgents()}>Load Agent</button>
    <label>Agent<select className="fb-ui-select" value={draft.agentId?draft.location+"/"+draft.agentId:""} disabled={busy||!agents.length} onChange={e=>{
      const a=agents.find(x=>x.location+"/"+x.id===e.target.value);if(!a)return;
      setDraft(d=>({...d,location:a.location,agentId:a.id,environmentId:"draft",model:""}));setEnvironments([]);setModels(null);
    }}><option value="">Chọn Agent</option>
    {draft.agentId&&!agents.some(a=>a.id===draft.agentId&&a.location===draft.location)&&<option value={draft.location+"/"+draft.agentId}>{draft.agentId} (đã lưu)</option>}
    {agents.map(a=><option key={a.location+"/"+a.id} value={a.location+"/"+a.id}>{a.name} — {a.location}</option>)}</select></label>
    <button className="fb-ui-button fb-ui-button--secondary" disabled={busy||!draft.agentId} onClick={()=>void loadEnvironments()}>Load Environment</button>
    <label>Environment<select className="fb-ui-select" value={draft.environmentId} disabled={busy||!environments.length} onChange={e=>change("environmentId",e.target.value)}>
    <option value="draft">Chọn Environment đã phát hành</option>
    {draft.environmentId!=="draft"&&!environments.some(x=>x.id===draft.environmentId)&&<option value={draft.environmentId}>{draft.environmentId} (đã lưu)</option>}
    {environments.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
    <button className="fb-ui-button fb-ui-button--secondary" disabled={busy||!draft.agentId||draft.environmentId==="draft"} onClick={()=>void discover()}>Load Model</button>
    <label>Model<select className="fb-ui-select" value={draft.model} disabled={busy||!models} onChange={e=>change("model",e.target.value)}>
     <option value="">Chọn model</option>
     {draft.model&&!models?.models.includes(draft.model)&&<option value={draft.model}>{draft.model} (chưa kiểm tra)</option>}
     {models?.models.map(m=><option key={m} value={m}>{m}</option>)}
    </select></label>
    {models&&<p role="status">Model hiện tại của Agent: {models.currentModel||"Không trả về"} · {models.models.length} lựa chọn được đối chiếu.</p>}
   </div>
   <AdminToast message={notice} variant={variant} notificationId={noticeId} onClose={()=>setNotice("")}/>
  </ProductModal>}
  {!open&&<AdminToast message={notice} variant={variant} notificationId={noticeId} onClose={()=>setNotice("")}/>}
 </div>;
}
