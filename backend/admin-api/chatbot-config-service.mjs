// DL10A: Owner-only configuration; no conversations, no public access.
const TABLE="fbmn_catalog_private.website_chatbot_config";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const ok=data=>Response.json({data},{headers:HEADERS});
const fail=(status,code)=>Response.json({error:{code}},{status,headers:HEADERS});
const KEYS=["projectId","location","agentId","environmentId","model"];
// Google CX Playbooks documented supported models, not a Gemini API catalogue.
const SUPPORTED=["gemini-2.5-flash","gemini-2.5-flash-lite","gemini-3.1-flash-lite","gemini-3.5-flash-lite"];
const LOCATIONS=new Set(["global","asia-south1","asia-southeast1","asia-southeast2","asia-northeast1","australia-southeast1","eu","europe-west1","europe-west2","europe-west3","europe-west4","europe-west6","northamerica-northeast1","us","us-central1","us-east1","us-west1"]);
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
function fromRow(row){
 if(!row)throw Error("config_unavailable");
 return {config:row.config,revision:Number(row.revision)};
}
async function googleJson(url,token,fetcher){
 const response=await fetcher(url,{headers:{Authorization:"Bearer "+token,Accept:"application/json"},redirect:"error",signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error("google_unavailable");
 return response.json();
}
async function tokenFor(secret,fetcher){
 let key;
 try{key=JSON.parse(secret);}catch{throw Error("credentials_missing");}
 if(key?.type!=="service_account"||typeof key.client_email!=="string"||typeof key.private_key!=="string")throw Error("credentials_missing");
 const {SignJWT,importPKCS8}=await import("jose");
 const pk=await importPKCS8(key.private_key,"RS256");
 const jwt=await new SignJWT({scope:"https://www.googleapis.com/auth/cloud-platform"})
  .setProtectedHeader({alg:"RS256"}).setIssuer(key.client_email).setAudience("https://oauth2.googleapis.com/token")
  .setIssuedAt().setExpirationTime("5m").sign(pk);
 const response=await fetcher("https://oauth2.googleapis.com/token",{method:"POST",redirect:"error",signal:AbortSignal.timeout(8000),
  headers:{"Content-Type":"application/x-www-form-urlencoded"},
  body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:jwt})});
 if(!response.ok)throw Error("google_unavailable");
 const data=await response.json();
 if(typeof data.access_token!=="string"||!data.access_token)throw Error("google_unavailable");
 return data.access_token;
}
export async function discoverCx(config,secret,fetcher=fetch){
 const token=await tokenFor(secret,fetcher);
 const host=config.location==="global"?"dialogflow.googleapis.com":config.location+"-dialogflow.googleapis.com";
 const path="projects/"+config.projectId+"/locations/"+config.location+"/agents/"+config.agentId;
 const root="https://"+host+"/v3beta1/"+path;
 const agent=await googleJson(root,token,fetcher);
 if(agent.name!==path)throw Error("google_unavailable");
 if(config.environmentId!=="draft"){
  const env=await googleJson(root+"/environments/"+config.environmentId,token,fetcher);
  if(env.name!==path+"/environments/"+config.environmentId)throw Error("google_unavailable");
 }
 const lang=typeof agent.defaultLanguageCode==="string"?agent.defaultLanguageCode:"vi";
 const settings=await googleJson(root+"/generativeSettings?languageCode="+encodeURIComponent(lang),token,fetcher);
 // Model Garden is a real Google API; intersect with CX Playbook support, never advertise all Vertex models.
 const found=new Set();
 let page="";
 for(let i=0;i<10;i++){
  const query=new URLSearchParams({pageSize:"100",...(page?{pageToken:page}:{})});
  const data=await googleJson("https://aiplatform.googleapis.com/v1beta1/publishers/google/models?"+query,token,fetcher);
  for(const model of Array.isArray(data.publisherModels)?data.publisherModels:[]){
   const name=typeof model.name==="string"?model.name.split("/").pop().split("@")[0]:"";
   if(SUPPORTED.includes(name))found.add(name);
  }
  page=typeof data.nextPageToken==="string"?data.nextPageToken:"";
  if(!page)break;
  if(i===9)throw Error("google_unavailable");
 }
 const current=settings.llmModelSettings?.model;
 if(SUPPORTED.includes(current))found.add(current);
 return {models:SUPPORTED.filter(m=>found.has(m)),currentModel:typeof current==="string"&&/^[a-z0-9-]{1,80}$/.test(current)?current:""};
}
export async function handleChatbotConfig({request,actor,db,googleSecret,discover=discoverCx}){
 const url=new URL(request.url);
 if(url.pathname!=="/v1/admin/website/chatbot-config")return fail(404,"not_found");
 if(actor?.role!=="owner")return fail(403,"forbidden");
 if(url.search)return fail(400,"invalid_query");
 if(!["GET","POST"].includes(request.method))return fail(405,"method_not_allowed");
 if(typeof db!=="function")return fail(503,"config_unavailable");
 try{
  if(request.method==="GET"){
   const data=await db(async client=>fromRow((await client.query("SELECT config,revision FROM "+TABLE+" WHERE singleton=true")).rows[0]));
   return ok({...data,credentialsConfigured:typeof googleSecret==="string"&&googleSecret.length>0});
  }
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json")return fail(415,"invalid_content_type");
  if(Number(request.headers.get("content-length")||0)>20000)return fail(413,"too_large");
  const raw=await request.text();if(raw.length>20000)return fail(413,"too_large");
  let body;try{body=JSON.parse(raw);}catch{return fail(400,"invalid_config");}
  if(!body||typeof body!=="object"||Array.isArray(body))return fail(400,"invalid_config");
  if(body.operation==="import"){
   if(Object.keys(body).some(k=>!["operation","raw"].includes(k)))return fail(400,"invalid_config");
   const config=parseConfigFile(body.raw);return config?ok({config}):fail(400,"invalid_config");
  }
  if(Object.keys(body).some(k=>!["operation","config","revision"].includes(k)))return fail(400,"invalid_config");
  const config=normalizeConfig(body.config);if(!config)return fail(400,"invalid_config");
  if(body.operation==="discover"){
   if(!googleSecret)return fail(503,"credentials_missing");
   return ok(await discover(config,googleSecret));
  }
  if(body.operation!=="save"||!Number.isSafeInteger(body.revision)||body.revision<1)return fail(400,"invalid_config");
  // Blank model is a saved draft; a selected model must be observed by Google on every save.
  if(config.model){
   if(!googleSecret)return fail(503,"credentials_missing");
   const result=await discover(config,googleSecret);
   if(!result.models.includes(config.model))return fail(400,"model_unavailable");
  }
  const data=await db(async client=>{
   await client.query("BEGIN");
   try{
    const before=fromRow((await client.query("SELECT config,revision FROM "+TABLE+" WHERE singleton=true FOR UPDATE")).rows[0]);
    if(before.revision!==body.revision)throw Error("revision_conflict");
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
function bodyUnavailable(e){return e?.message==="google_unavailable"?"google_unavailable":"config_unavailable";}
