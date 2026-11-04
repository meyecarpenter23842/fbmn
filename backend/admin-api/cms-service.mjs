// ADM-03 (#20). Private CMS CRUD. No public DTO, no pricing or customer data.
import { parseCmsTimestamp } from "./cms-publication-policy.mjs";
import { validCmsPlacements, cmsPlacementIsReady, validatePopupFrequency } from "./cms-placement-contract.mjs";

const ROOT = "/v1/admin/cms";
const KIND = new Set(["banner","popup","article","promotion"]);
const CHANNEL = new Set(["public_web","dealer_app","consumer_app"]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IDENTIFIER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TABLE = "fbmn_catalog_private.cms_entries";
const AUDIT = "fbmn_catalog_private.cms_entry_audit";
const HEADERS = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

const ok = data => Response.json({ data }, { headers: HEADERS });
const fail = (status,code) => Response.json({ error: {code} }, { status, headers: HEADERS });
const clean = (v,min,max) => typeof v === "string" && v === v.trim() &&
 v.length>=min && v.length<=max && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v);
const plain = (s) => !/<\/?[a-z][^>]*>/i.test(s);
const date = (value) => value===null ? null :
 typeof value==="string" && parseCmsTimestamp(value)!==null ?
 new Date(parseCmsTimestamp(value)).toISOString() : undefined;

function urlSafe(value){
 if(value===null)return true;
 if(typeof value!=="string" || value.length>500 || value!==value.trim())return false;
 if(/^\/(?!\/)/.test(value))return !value.includes("\\") && !/\.\./.test(value);
 try{
  const u=new URL(value);
  return u.protocol==="https:" && !u.username && !u.password &&
   !u.hash && u.href===value && u.hostname.includes(".");
 }catch{return false;}
}
function validate(input,creating=false) {
 if(!input || typeof input!=="object" || Array.isArray(input))return null;
 if(creating && (!KIND.has(input.kind)||!SLUG.test(input.slug)||input.slug.length>100))return null;
 if(!clean(input.title,2,160) || !plain(input.title) ||
    !clean(input.summary,0,400) || !plain(input.summary) ||
    !Array.isArray(input.paragraphs) || input.paragraphs.length>30 ||
    !input.paragraphs.every(p=>clean(p,1,3000)&&plain(p))||
    !urlSafe(input.ctaUrl) || !Array.isArray(input.channelTargets) ||
    input.channelTargets.length>3 || new Set(input.channelTargets).size!==input.channelTargets.length ||
    !input.channelTargets.every(c=>CHANNEL.has(c)) ||
    !Number.isSafeInteger(input.sortOrder) || input.sortOrder<0 || input.sortOrder>10000 ||
    (input.sourceRef!=="" && !clean(input.sourceRef,1,500)) ||
    date(input.startsAt)===undefined || date(input.endsAt)===undefined ||
    !validCmsPlacements(input.kind??"article",input.channelTargets,input.placements??{}) ||
    !validatePopupFrequency({popupDelaySeconds:input.popupDelaySeconds??3,
     popupCooldownMinutes:input.popupCooldownMinutes??1440,
     popupMaxPerSession:input.popupMaxPerSession??1}))
  return null;
 const starts=date(input.startsAt),ends=date(input.endsAt);
 if(starts!==null && ends!==null && starts>ends)return null;
 if(creating && ["article","promotion"].includes(input.kind) && !input.paragraphs.length)return null;
 return { title:input.title,summary:input.summary,paragraphs:input.paragraphs,
  cta_url:input.ctaUrl,channel_targets:input.channelTargets,sort_order:input.sortOrder,
  starts_at:starts,ends_at:ends,source_ref:input.sourceRef,
  placements:input.placements??{},popup_delay_seconds:input.popupDelaySeconds??3,
  popup_cooldown_minutes:input.popupCooldownMinutes??1440,
  popup_max_per_session:input.popupMaxPerSession??1 };
}
async function body(request){
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json")return null;
 if(Number(request.headers.get("content-length")||0)>105000)return null;
 const raw=await request.text();
 if(raw.length>105000)return null;
 try { const value=JSON.parse(raw);return value&&typeof value==="object"&&!Array.isArray(value)?value:null; }
 catch{return null;}
}
async function transaction(db,work){
 return db(async client=>{
  await client.query("BEGIN");
  try{const result=await work(client);await client.query("COMMIT");return result;}
  catch(e){await client.query("ROLLBACK");throw e;}
 });
}
async function record(client,id,subject,action,before,after){
 await client.query("INSERT INTO "+AUDIT+
  " (entry_id,actor_subject,action,before_data,after_data) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb)",
  [id,subject,action,before?JSON.stringify(before):null,JSON.stringify(after)]);
}
function errorFor(e) {
 if(e?.message==="surface_unavailable")return fail(409,"surface_unavailable");
 if(e?.message==="revision_conflict"||e?.message==="hide_before_edit"||
    e?.message==="already_published"||e?.message==="already_hidden")return fail(409,e.message);
 if(e?.message==="source_required"||e?.message==="channels_required"||e?.message==="placements_required"||e?.message==="media_required")return fail(400,e.message);
 return fail(e?.code==="23505"?409:503,e?.code==="23505"?"slug_conflict":"cms_unavailable");
}
// Fetch lightweight summaries in bounded pages; full prose is loaded only on edit.
async function list(db,mode,page){
 const result=await db(client=>client.query(
  "SELECT id::text,kind,slug,title,summary,channel_targets,sort_order,"+
  "starts_at,ends_at,source_ref,placements,popup_delay_seconds,popup_cooldown_minutes,popup_max_per_session,status,revision,created_at,updated_at "+
  "FROM "+TABLE+" WHERE (($1::text='marketing' AND kind IN ('banner','popup')) "+
  "OR ($1::text='editorial' AND kind IN ('article','promotion'))) "+
  "ORDER BY updated_at DESC,id LIMIT 51 OFFSET $2",
  [mode,(page-1)*50]));
 return ok({items:result.rows.slice(0,50),page,hasNext:result.rows.length>50});
}
async function detail(db,id){
 const result=await db(client=>client.query(
  "SELECT id::text,kind,slug,title,summary,paragraphs,cta_url,channel_targets,"+
  "sort_order,starts_at,ends_at,source_ref,placements,popup_delay_seconds,popup_cooldown_minutes,popup_max_per_session,status,revision,created_at,updated_at "+
  "FROM "+TABLE+" WHERE id=$1::uuid LIMIT 1",[id]));
 if(result.rowCount!==1)return fail(404,"cms_not_found");
 return ok({item:result.rows[0]});
}
async function create(db,input,subject){
 const item=validate(input,true);
 if(!item)return fail(400,"invalid_cms_entry");
 try{
  const result=await transaction(db,async c=>{
   const columns="kind,slug,title,summary,paragraphs,cta_url,channel_targets,sort_order,"+
    "starts_at,ends_at,source_ref,placements,popup_delay_seconds,popup_cooldown_minutes,popup_max_per_session,created_by,updated_by";
   const values=[input.kind,input.slug,item.title,item.summary,item.paragraphs,
    item.cta_url,item.channel_targets,item.sort_order,item.starts_at,item.ends_at,
    item.source_ref,JSON.stringify(item.placements),item.popup_delay_seconds,
    item.popup_cooldown_minutes,item.popup_max_per_session,subject,subject];
   const added=await c.query("INSERT INTO "+TABLE+" ("+columns+") VALUES ("+
    values.map((_,i)=>"$"+(i+1)).join(",")+") RETURNING *",values);
   await record(c,added.rows[0].id,subject,"create",null,added.rows[0]);
   return added.rows[0];
  });
  return ok({item:result});
 }catch(e){return errorFor(e);}
}
async function mutate(db,input,subject,action,publicSurfaceReady=false){
 if(!IDENTIFIER.test(input?.id)||!Number.isSafeInteger(input?.expectedRevision)||
    input.expectedRevision<1)return fail(400,"invalid_revision");
 const next=action==="update"?validate(input):null;
 if(action==="update"&&!next)return fail(400,"invalid_cms_entry");
 try{
  const changed=await transaction(db,async c=>{
   const prev=await c.query("SELECT * FROM "+TABLE+" WHERE id=$1::uuid FOR UPDATE",[input.id]);
   if(prev.rowCount!==1 || prev.rows[0].revision!==input.expectedRevision)throw Error("revision_conflict");
   const old=prev.rows[0];
   if(action==="update"&&old.status==="published")throw Error("hide_before_edit");
   if(action==="publish"&&old.status==="published")throw Error("already_published");
   if(action==="hide"&&old.status==="hidden")throw Error("already_hidden");
   if(action==="publish" && !old.source_ref.trim())throw Error("source_required");
   if(action==="publish" && !old.channel_targets.length)throw Error("channels_required");
   if(action==="publish" && !cmsPlacementIsReady(old.kind,old.channel_targets,old.placements))
    throw Error("placements_required");
   // No phantom releases while public read-model + frontend do not consume CMS.
   if(action==="publish" && (!publicSurfaceReady || old.channel_targets.some(c=>c!=="public_web")))
    throw Error("surface_unavailable");
   if(action==="publish" && ["banner","popup"].includes(old.kind)){
    const media=await c.query("SELECT channel,device FROM fbmn_catalog_private.cms_entry_media WHERE entry_id=$1::uuid",[input.id]);
    if(!["desktop","mobile"].every(device=>media.rows.some(m=>m.channel==="public_web"&&m.device===device)))
     throw Error("media_required");
   }
   let result;
   if(action==="update"){
    result=await c.query("UPDATE "+TABLE+" SET "+
     "title=$2,summary=$3,paragraphs=$4,cta_url=$5,channel_targets=$6,sort_order=$7,"+
     "starts_at=$8,ends_at=$9,source_ref=$10,placements=$11::jsonb,"+
     "popup_delay_seconds=$12,popup_cooldown_minutes=$13,popup_max_per_session=$14,"+
     "status='draft',revision=revision+1,updated_by=$15,updated_at=now() WHERE id=$1::uuid RETURNING *",[
     input.id,next.title,next.summary,next.paragraphs,next.cta_url,next.channel_targets,
     next.sort_order,next.starts_at,next.ends_at,next.source_ref,JSON.stringify(next.placements),
     next.popup_delay_seconds,next.popup_cooldown_minutes,next.popup_max_per_session,subject]);
   }else if(action==="publish"){
    result=await c.query("UPDATE "+TABLE+" SET "+
     "status='published',verified_by=$2,verified_at=now(),approved_by=$2,approved_at=now(),"+
     "published_at=now(),withdrawn_at=NULL,revision=revision+1,"+
     "updated_by=$2,updated_at=now() WHERE id=$1::uuid RETURNING *",[input.id,subject]);
   }else{
    result=await c.query("UPDATE "+TABLE+" SET status='hidden',withdrawn_at=now(),"+
     "revision=revision+1,updated_by=$2,updated_at=now() WHERE id=$1::uuid RETURNING *",
     [input.id,subject]);
   }
   const item=result.rows[0];
   await record(c,input.id,subject,action,old,item);
   return item;
  });
  return ok({item:changed});
 }catch(e){return errorFor(e);}
}
export async function handleCms({request,actor,db,r2,publicSurfaceReady=false}){
 // Limit release rights until Editor/Publisher scope is approved by Owner.
 if(actor?.role!=="owner")return fail(403,"owner_required");
 const u=new URL(request.url);
 const action=u.pathname===ROOT?"":u.pathname.startsWith(ROOT+"/")?
  u.pathname.slice(ROOT.length+1):"unknown";
 if(request.method==="GET"){
  const keys=[...u.searchParams.keys()];
  if(keys.length!==new Set(keys).size)return fail(400,"invalid_query");
  if(action==="entry"){
   if(keys.length!==1 || keys[0]!=="id")return fail(400,"invalid_query");
   const id=u.searchParams.get("id");
   if(!IDENTIFIER.test(id))return fail(400,"invalid_id");
   try{return await detail(db,id);}catch{return fail(503,"cms_unavailable");}
  }
  if(action!=="" || keys.some(k=>k!=="mode"&&k!=="page"))return fail(400,"invalid_query");
  const mode=u.searchParams.get("mode")??"editorial";
  const rawPage=u.searchParams.get("page")??"1";
  if(!["marketing","editorial"].includes(mode) || !/^[1-9]\d{0,3}$/.test(rawPage))
   return fail(400,"invalid_query");
  try{return await list(db,mode,Number(rawPage));}catch{return fail(503,"cms_unavailable");}
 }
 if(request.method!=="POST")return fail(405,"method_not_allowed");
 if(u.search)return fail(400,"invalid_query");
 if(!["create","update","publish","hide"].includes(action))return fail(404,"not_found");
 const input=await body(request);
 if(!input)return fail(400,"invalid_body");
 if(action==="create")return create(db,input,actor.subject);
 return mutate(db,input,actor.subject,action,publicSurfaceReady);
}
