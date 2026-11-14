// Owner-only revisioned Website App download popup; no CMS data or secret URL handling.
const TABLE="fbmn_catalog_private.web_app_download_settings";
const AUDIT="fbmn_catalog_private.web_app_download_settings_audit";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const good=data=>Response.json({data},{headers:HEADERS});
const fail=(status,code)=>Response.json({error:{code}},{status,headers:HEADERS});
const READ="SELECT popup_enabled,button_enabled,first_delay_ms,cooldown_minutes,title,message,ios_url,android_url,revision FROM "+TABLE+" WHERE singleton=true";
export const DEFAULT_APP_DOWNLOAD=Object.freeze({popupEnabled:true,buttonEnabled:true,firstDelayMs:1400,
 cooldownMinutes:120,title:"Ứng dụng Futurebook",
 message:"Ứng dụng chưa phát hành. Đường dẫn tải sẽ cập nhật khi có bản chính thức.",
 iosUrl:null,androidUrl:null,revision:1});
function fromRow(r){
 if(!r)throw Error("config_unavailable");
 return {popupEnabled:r.popup_enabled,buttonEnabled:r.button_enabled,
  firstDelayMs:Number(r.first_delay_ms),cooldownMinutes:Number(r.cooldown_minutes),
  title:r.title,message:r.message,iosUrl:r.ios_url,androidUrl:r.android_url,revision:Number(r.revision)};
}
export function validateStoreUrl(value,platform){
 if(value===null)return true;
 if(typeof value!=="string"||value.length>500)return false;
 try{
  const u=new URL(value);
  if(u.protocol!=="https:"||u.username||u.password||u.port||u.hash||u.searchParams.has("redirect"))return false;
  if(platform==="ios")return u.hostname==="apps.apple.com"&&u.pathname.length>2;
  return u.hostname==="play.google.com"&&u.pathname==="/store/apps/details"&&
   u.searchParams.has("id")&&/^[a-zA-Z0-9_.]+$/.test(u.searchParams.get("id")||"");
 }catch{return false;}
}
export function validateAppDownload(input){
 if(!input||typeof input!=="object"||Array.isArray(input))return false;
 const fields=["popupEnabled","buttonEnabled","firstDelayMs","cooldownMinutes",
  "title","message","iosUrl","androidUrl","revision"];
 if(Object.keys(input).some(k=>!fields.includes(k)))return false;
 return typeof input.popupEnabled==="boolean"&&typeof input.buttonEnabled==="boolean"&&
  Number.isSafeInteger(input.firstDelayMs)&&input.firstDelayMs>=500&&input.firstDelayMs<=15000&&
  Number.isSafeInteger(input.cooldownMinutes)&&input.cooldownMinutes>=30&&input.cooldownMinutes<=1440&&
  typeof input.title==="string"&&input.title.length>0&&input.title.length<=80&&
  typeof input.message==="string"&&input.message.length>0&&input.message.length<=240&&
  !/[<>]/.test(input.title+input.message)&&
  !/[\x00-\x1f\x7f]/.test(input.title)&&
  !/[\x00-\x09\x0b-\x1f\x7f]/.test(input.message)&&
  validateStoreUrl(input.iosUrl,"ios")&&validateStoreUrl(input.androidUrl,"android")&&
  Number.isSafeInteger(input.revision)&&input.revision>=1;
}
async function bodyJson(request){
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json"||
    Number(request.headers.get("content-length")||0)>3000)return null;
 const body=await request.text();
 if(body.length>3000)return null;
 try{return JSON.parse(body)}catch{return null;}
}
export async function handleAppDownloadSettings({request,actor,db}){
 const url=new URL(request.url);
 if(url.pathname!=="/v1/admin/website/app-download")return fail(404,"not_found");
 if(url.search)return fail(400,"invalid_query");
 if(!["GET","POST"].includes(request.method))return fail(405,"method_not_allowed");
 if(actor?.role!=="owner"||!actor.subject)return fail(403,"owner_only");
 if(typeof db!=="function")return fail(503,"config_unavailable");
 try{
  if(request.method==="GET"){
   const row=await db(async client=>(await client.query(READ)).rows[0]);
   return good({settings:fromRow(row)});
  }
  const req=await bodyJson(request);
  if(!req||!["save","reset"].includes(req.operation)||
     !Number.isSafeInteger(req.revision)||req.revision<1)return fail(400,"invalid_settings");
  const {operation,...settings}=req;
  const candidate=operation==="reset"?{...DEFAULT_APP_DOWNLOAD,revision:req.revision}:settings;
  if(!validateAppDownload(candidate))return fail(400,"invalid_settings");
  const saved=await db(async client=>{
   await client.query("BEGIN");
   try{
    const current=fromRow((await client.query(READ)).rows[0]);
    if(current.revision!==req.revision)throw Error("revision_conflict");
    const args=[candidate.popupEnabled,candidate.buttonEnabled,candidate.firstDelayMs,
      candidate.cooldownMinutes,candidate.title,candidate.message,candidate.iosUrl,
      candidate.androidUrl,current.revision,actor.subject];
    const update=await client.query("UPDATE "+TABLE+
     " SET popup_enabled=$1,button_enabled=$2,first_delay_ms=$3,cooldown_minutes=$4,"+
     "title=$5,message=$6,ios_url=$7,android_url=$8,revision=revision+1,"+
     "updated_by=$10,updated_at=now() WHERE singleton=true AND revision=$9 "+
     "RETURNING popup_enabled,button_enabled,first_delay_ms,cooldown_minutes,title,message,ios_url,android_url,revision",args);
    if(update.rows.length!==1)throw Error("revision_conflict");
    const after=fromRow(update.rows[0]);
    await client.query("INSERT INTO "+AUDIT+"(revision,actor_subject,operation,before_data,after_data) "+
     "VALUES($1,$2,$3,$4::jsonb,$5::jsonb)",
     [after.revision,actor.subject,req.operation,JSON.stringify(current),JSON.stringify(after)]);
    await client.query("COMMIT");return after;
   }catch(error){await client.query("ROLLBACK");throw error;}
  });
  return good({settings:saved});
 }catch(error){
  if(error?.message==="revision_conflict")return fail(409,"revision_conflict");
  return fail(503,"config_unavailable");
 }
}
