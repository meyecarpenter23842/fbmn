// DL10A: Owner-only configuration; no conversations, no public access.
const TABLE="fbmn_catalog_private.website_chatbot_config";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const ok=data=>Response.json({data},{headers:HEADERS});
const fail=(status,code)=>Response.json({error:{code}},{status,headers:HEADERS});
const KEYS=["projectId","location","agentId","environmentId","model"];
// Google CX Playbooks documented supported models, not a Gemini API catalogue.
const SUPPORTED=["agent-default","gemini-2.5-flash","gemini-2.5-flash-lite","gemini-3.1-flash-lite","gemini-3.5-flash-lite"];
export const LOCATIONS=new Set(["global","asia-south1","asia-southeast1","asia-southeast2","asia-northeast1","australia-southeast1","eu","europe-west1","europe-west2","europe-west3","europe-west4","europe-west6","northamerica-northeast1","us","us-central1","us-east1","us-west1"]);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function normalizeConfig(input){
 if(!input||typeof input!=="object"||Array.isArray(input)||Object.keys(input).some(k=>!KEYS.includes(k)))return null;
 if(!KEYS.every(k=>typeof input[k]==="string"))return null;
 const c=Object.fromEntries(KEYS.map(k=>[k,input[k].trim()]));
 if(!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(c.projectId)||!LOCATIONS.has(c.location)||!UUID.test(c.agentId)||
    (c.environmentId!=="draft"&&!UUID.test(c.environmentId))||
    (c.model!==""&&!SUPPORTED.includes(c.model)))return null;
 return c;
}
// Only a JSON object, optionally wrapped in a single literal JS export. No eval/import/functions.
export function parseConfigFile(raw){
 if(typeof raw!=="string"||raw.length>16384)return null;
 let s=raw.replace(/^\uFEFF/,"").trim();
 s=s.replace(/^(?:export\s+default\s+|module\.exports\s*=\s*)/,"").replace(/;\s*$/,"");
 try{return normalizeConfig(JSON.parse(s));}catch{return null;}
}
const PROJECT=/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
export function parseServiceAccount(raw){
 if(typeof raw!=="string"||raw.length>16384)return null;
 try{
  const v=JSON.parse(raw.replace(/^\uFEFF/,"").trim().replace(/^(?:export\s+default\s+|module\.exports\s*=\s*)/,"").replace(/;\s*$/,""));
  if(v?.type!=="service_account"||!PROJECT.test(v.project_id||"")||
   typeof v.client_email!=="string"||!/^[a-z0-9._-]+@[a-z0-9.-]+\.iam\.gserviceaccount\.com$/i.test(v.client_email)||
   typeof v.private_key!=="string"||!/^-----BEGIN PRIVATE KEY-----\r?\n[\s\S]+-----END PRIVATE KEY-----\r?\n?$/.test(v.private_key))return null;
  return {type:"service_account",project_id:v.project_id,client_email:v.client_email,private_key:v.private_key};
 }catch{return null;}
}
function cxHost(location){return location==="global"?"dialogflow.googleapis.com":location+"-dialogflow.googleapis.com";}
async function listPages(root,field,token,fetcher,signal){
 const rows=[];let page="";
 for(let i=0;i<10;i++){
  const query=new URLSearchParams({pageSize:"100",...(page?{pageToken:page}:{})});
  const data=await googleJson(root+"?"+query,token,fetcher,signal);
  rows.push(...(Array.isArray(data[field])?data[field]:[]));
  page=typeof data.nextPageToken==="string"?data.nextPageToken:"";
  if(!page)return rows;
 }
 throw Error("google_unavailable");
}
export async function listCxAgents(projectId,secret,fetcher=fetch,selectedLocation="all"){
 if(!PROJECT.test(projectId)||!(selectedLocation==="all"||LOCATIONS.has(selectedLocation)))throw Error("invalid_config");
 const token=await tokenFor(secret,fetcher),signal=AbortSignal.timeout(45000);
 let regions=[selectedLocation],locationDiscoveryFailed=false;
 if(selectedLocation==="all"){
  try{
   const locations=await listPages("https://dialogflow.googleapis.com/v3/projects/"+projectId+"/locations","locations",token,fetcher,signal);
   regions=[...new Set(["global",...locations.map(x=>x.locationId||x.name?.split("/").pop()).filter(x=>LOCATIONS.has(x))])];
  }catch(e){
   // Location enumeration may not be granted; agent list is independently
   // authorized. Try known supported locations, not arbitrary caller hosts.
   if(!["google_permission_denied","google_resource_not_found","google_unavailable"].includes(e?.message))throw e;
   regions=[...LOCATIONS];locationDiscoveryFailed=true;
  }
 }
 const agents=[],failedLocations=[],errors=[];
 for(let i=0;i<regions.length;i+=4)await Promise.all(regions.slice(i,i+4).map(async location=>{
  const parent="projects/"+projectId+"/locations/"+location+"/agents";
  try{
   const rows=await listPages("https://"+cxHost(location)+"/v3/"+parent,"agents",token,fetcher,signal);
   for(const row of rows){
    const id=row.name?.startsWith(parent+"/")?row.name.slice(parent.length+1):"";
    if(UUID.test(id))agents.push({id,location,name:typeof row.displayName==="string"?row.displayName.slice(0,200):id});
   }
  }catch(e){failedLocations.push(location);errors.push(e?.message);}
 }));
 if(failedLocations.length===regions.length||(!agents.length&&failedLocations.length)){
  for(const code of ["google_api_disabled","google_auth_failed","google_permission_denied","google_quota","google_timeout","google_network_error","google_resource_not_found"])
   if(errors.includes(code))throw Error(code);
  if(failedLocations.length===regions.length)throw Error("google_unavailable");
 }
 return {agents:agents.sort((a,b)=>a.name.localeCompare(b.name)),failedLocations,locationDiscoveryFailed};
}
export async function listCxEnvironments(config,secret,fetcher=fetch){
 const token=await tokenFor(secret,fetcher),signal=AbortSignal.timeout(25000);
 const parent="projects/"+config.projectId+"/locations/"+config.location+"/agents/"+config.agentId+"/environments";
 const rows=await listPages("https://"+cxHost(config.location)+"/v3/"+parent,"environments",token,fetcher,signal);
 return {environments:rows.flatMap(row=>{
  const id=row.name?.startsWith(parent+"/")?row.name.slice(parent.length+1):"";
  return UUID.test(id)?[{id,name:typeof row.displayName==="string"?row.displayName.slice(0,200):id}]:[];
 })};
}
function fromRow(row){
 if(!row)throw Error("config_unavailable");
 return {config:row.config,revision:Number(row.revision)};
}
// Return only allowlisted diagnostic codes: never echo Google's raw error,
// OAuth tokens, service-account email, private key, or request payload.
async function googleError(response,stage){
 if(response.status>=300&&response.status<400)return Error("google_unavailable");
 if(response.status===429)return Error("google_quota");
 if(response.status===401)return Error("google_auth_failed");
 if(stage==="oauth"&&response.status===400)return Error("google_auth_failed");
 if(response.status===403){
  let payload;try{payload=await response.json();}catch{}
  const details=payload?.error?.details;
  if(Array.isArray(details)&&details.some(d=>d?.reason==="SERVICE_DISABLED"))return Error("google_api_disabled");
  return Error("google_permission_denied");
 }
 if(response.status===404)return Error("google_resource_not_found");
 return Error("google_unavailable");
}
async function googleJson(url,token,fetcher,signal){
 let response;
 try{response=await fetcher(url,{headers:{Authorization:"Bearer "+token,Accept:"application/json"},redirect:"manual",signal});}
 catch(e){throw Error(e?.name==="TimeoutError"||e?.name==="AbortError"?"google_timeout":"google_network_error");}
 if(!response.ok)throw await googleError(response,"api");
 try{return await response.json();}catch{throw Error("google_unavailable");}
}
const b64url=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const utf8=new TextEncoder();
export async function tokenFor(secret,fetcher=fetch){
 let key;
 try{key=JSON.parse(secret);}catch{throw Error("credentials_missing");}
 if(key?.type!=="service_account"||typeof key.client_email!=="string"||typeof key.private_key!=="string")throw Error("credentials_missing");
 // WebCrypto is native to Workers. Import PKCS#8 directly and sign RS256;
 // avoid runtime dynamic-import/provider ambiguity.
 let jwt;
 try{
  const der=key.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,"");
  const bytes=Uint8Array.from(atob(der),c=>c.charCodeAt(0));
  const pk=await crypto.subtle.importKey("pkcs8",bytes,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
  const now=Math.floor(Date.now()/1000);
  const input=b64url(utf8.encode(JSON.stringify({alg:"RS256",typ:"JWT"})))+"."+b64url(utf8.encode(JSON.stringify({
   iss:key.client_email,scope:"https://www.googleapis.com/auth/cloud-platform",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+300
  })));
  jwt=input+"."+b64url(new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5",pk,utf8.encode(input))));
 }catch{throw Error("google_invalid_key");}
 let response;
 try{response=await fetcher("https://oauth2.googleapis.com/token",{method:"POST",redirect:"manual",signal:AbortSignal.timeout(12000),
  headers:{"Content-Type":"application/x-www-form-urlencoded"},
  body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:jwt})});}
 catch(e){throw Error(e?.name==="TimeoutError"||e?.name==="AbortError"?"google_timeout":"google_network_error");}
 if(!response.ok)throw await googleError(response,"oauth");
 let data;try{data=await response.json();}catch{throw Error("google_auth_failed");}
 if(typeof data.access_token!=="string"||!data.access_token)throw Error("google_auth_failed");
 return data.access_token;
}
export async function discoverCx(config,secret,fetcher=fetch){
 const signal=AbortSignal.timeout(25000);
 const token=await tokenFor(secret,fetcher);
 const host=config.location==="global"?"dialogflow.googleapis.com":config.location+"-dialogflow.googleapis.com";
 const path="projects/"+config.projectId+"/locations/"+config.location+"/agents/"+config.agentId;
 const root="https://"+host+"/v3beta1/"+path;
 const agent=await googleJson(root,token,fetcher,signal);
 if(agent.name!==path)throw Error("google_unavailable");
 if(config.environmentId!=="draft"){
  const env=await googleJson(root+"/environments/"+config.environmentId,token,fetcher,signal);
  if(env.name!==path+"/environments/"+config.environmentId)throw Error("google_unavailable");
 }
 const lang=typeof agent.defaultLanguageCode==="string"?agent.defaultLanguageCode:"vi";
 // Agent default always works without a model override. Other choices are the
 // documented CX Playbook models, not a project-specific Vertex catalogue.
 let current="";
 try{
  const settings=await googleJson(root+"/generativeSettings?languageCode="+encodeURIComponent(lang),token,fetcher,signal);
  const value=settings.llmModelSettings?.model;
  if(typeof value==="string"&&/^[a-z0-9-]{1,80}$/.test(value))current=value;
 }catch(e){
  // A flow-only agent or a service account without settings access still
  // supports its default model; do not block the basic Agent connection.
  if(!["google_resource_not_found","google_permission_denied"].includes(e?.message))throw e;
 }
 const models=["agent-default","gemini-2.5-flash","gemini-2.5-flash-lite"];
 if(SUPPORTED.includes(current)&&!models.includes(current))models.push(current);
 return {models,currentModel:current};
}
export async function handleChatbotConfig({request,actor,db,googleSecret,credentialStore,discover=discoverCx,listAgents=listCxAgents,listEnvironments=listCxEnvironments}){
 const url=new URL(request.url);
 if(url.pathname!=="/v1/admin/website/chatbot-config")return fail(404,"not_found");
 if(actor?.role!=="owner")return fail(403,"forbidden");
 if(url.search)return fail(400,"invalid_query");
 if(!["GET","POST"].includes(request.method))return fail(405,"method_not_allowed");
 if(typeof db!=="function")return fail(503,"config_unavailable");
 try{
  if(request.method==="GET"){
   const data=await db(async client=>fromRow((await client.query("SELECT config,revision FROM "+TABLE+" WHERE singleton=true")).rows[0]));
   return ok({...data,credentialsConfigured:Boolean(await credentialStore?.read(data.revision)||googleSecret)});
  }
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json")return fail(415,"invalid_content_type");
  if(Number(request.headers.get("content-length")||0)>20000)return fail(413,"too_large");
  const raw=await request.text();if(raw.length>20000)return fail(413,"too_large");
  let body;try{body=JSON.parse(raw);}catch{return fail(400,"invalid_config");}
  if(!body||typeof body!=="object"||Array.isArray(body))return fail(400,"invalid_config");
  // Uploaded key stays request-local until the Owner commits a validated configuration.
  const account=body.credential===undefined?null:parseServiceAccount(body.credential);
  if(body.credential!==undefined&&!account)return fail(400,"invalid_config");
  const readStored=async()=>{
   const row=await db(async client=>fromRow((await client.query("SELECT config,revision FROM "+TABLE+" WHERE singleton=true")).rows[0]));
   return await credentialStore?.read(row.revision)||googleSecret;
  };
  const getSecret=async()=>account?JSON.stringify(account):await readStored();
  if(body.operation==="list_agents"){
   if(Object.keys(body).some(k=>!["operation","projectId","credential","location"].includes(k))||!PROJECT.test(body.projectId||"")||(account&&account.project_id!==body.projectId))return fail(400,"invalid_config");
   const secret=await getSecret();if(!secret)return fail(503,"credentials_missing");
   const location=body.location??"all";if(location!=="all"&&!LOCATIONS.has(location))return fail(400,"invalid_config");
   return ok(await listAgents(body.projectId,secret,fetch,location));
  }
  if(body.operation==="import"){
   if(Object.keys(body).some(k=>!["operation","raw"].includes(k)))return fail(400,"invalid_config");
   const config=parseConfigFile(body.raw);return config?ok({config}):fail(400,"invalid_config");
  }
  if(Object.keys(body).some(k=>!["operation","config","revision","credential"].includes(k)))return fail(400,"invalid_config");
  const config=normalizeConfig(body.config);if(!config||(account&&account.project_id!==config.projectId))return fail(400,"invalid_config");
  if(body.operation==="list_environments"){
   const secret=await getSecret();if(!secret)return fail(503,"credentials_missing");
   return ok(await listEnvironments(config,secret));
  }
  if(body.operation==="discover"){
   const secret=await getSecret();if(!secret)return fail(503,"credentials_missing");
   return ok(await discover(config,secret));
  }
  if(body.operation!=="save"||!Number.isSafeInteger(body.revision)||body.revision<1)return fail(400,"invalid_config");
  if(account&&(!credentialStore||!config.model))return fail(400,"invalid_config");
  // Blank model is a saved draft; a selected model must be observed by Google on every save.
  if(config.model){
   const secret=await getSecret();if(!secret)return fail(503,"credentials_missing");
   const result=await discover(config,secret);
   if(!result.models.includes(config.model))return fail(400,"model_unavailable");
  }
  const data=await db(async client=>{
   await client.query("BEGIN");
   try{
    const before=fromRow((await client.query("SELECT config,revision FROM "+TABLE+" WHERE singleton=true FOR UPDATE")).rows[0]);
    if(before.revision!==body.revision)throw Error("revision_conflict");
    const retained=account?JSON.stringify(account):await credentialStore?.read(before.revision);
    // Overwrite even a failed-save orphan at this revision. Empty authenticated
    // value explicitly means use the pre-existing Worker secret fallback.
    if(credentialStore)await credentialStore.write(before.revision+1,retained||"");
    const after=fromRow((await client.query("UPDATE "+TABLE+" SET config=$1::jsonb,revision=revision+1,updated_by=$2,updated_at=now() WHERE singleton=true RETURNING config,revision",[JSON.stringify(config),actor.subject])).rows[0]);
    await client.query("INSERT INTO "+TABLE+"_audit(revision,actor_subject,before_data,after_data) VALUES($1,$2,$3::jsonb,$4::jsonb)",[after.revision,actor.subject,JSON.stringify(before.config),JSON.stringify(after.config)]);
    await client.query("COMMIT");return after;
   }catch(e){await client.query("ROLLBACK");throw e;}
  });
  return ok(data);
 }catch(e){
  if(e?.message==="revision_conflict")return fail(409,"revision_conflict");
  if(e?.message==="credentials_missing")return fail(503,"credentials_missing");
  return fail(503,bodyUnavailable(e));
 }
}
function bodyUnavailable(e){return ["google_unavailable","google_invalid_key","google_auth_failed","google_api_disabled","google_permission_denied","google_resource_not_found","google_quota","google_timeout","google_network_error","credentials_storage_unavailable"].includes(e?.message)?e.message:"config_unavailable";}
