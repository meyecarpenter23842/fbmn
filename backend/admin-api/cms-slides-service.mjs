// C5 private Owner-only per-banner slides. Slide 1 remains cms_entry_media.
import {imageSize} from "./media-service.mjs";
const ENTRIES="fbmn_catalog_private.cms_entries";
const EXTRA="fbmn_catalog_private.cms_banner_slide_media";
const SETTINGS="fbmn_catalog_private.cms_banner_settings";
const AUDIT="fbmn_catalog_private.cms_entry_audit";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIMIT=5*1024*1024;
const H={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status,code)=>Response.json({error:{code}},{status,headers:H});
const ok=data=>Response.json({data},{headers:H});
const validSlide=n=>Number.isSafeInteger(n)&&n>=2&&n<=5;
const validDevice=v=>v==="desktop"||v==="mobile";
const defaultSettings={enabled:true,autoplay:true,effect:"fade-slide",
 interval_ms:7000,duration_ms:480,slide_order:[1,2,3,4,5]};
const validSettings=d=>d&&typeof d==="object"&&!Array.isArray(d)&&
 typeof d.enabled==="boolean"&&typeof d.autoplay==="boolean"&&
 ["fade","slide","fade-slide"].includes(d.effect)&&
 Number.isInteger(d.intervalMs)&&d.intervalMs>=3000&&d.intervalMs<=15000&&
 Number.isInteger(d.durationMs)&&d.durationMs>=300&&d.durationMs<=800&&
 Array.isArray(d.order)&&d.order.length===5&&
 d.order.every(Number.isInteger)&&new Set(d.order).size===5&&
 [1,2,3,4,5].every(i=>d.order.includes(i));
function getOne(u,expected){
 const keys=[...u.searchParams.keys()];
 return keys.length===expected.length&&
  new Set(keys).size===keys.length&&
  expected.every(k=>u.searchParams.getAll(k).length===1);
}
function error(ex){
 const msg=ex?.message;
 if(["revision_conflict","hide_before_edit"].includes(msg))return fail(409,msg);
 if(msg==="not_found")return fail(404,msg);
 if(["not_hero_banner","missing_main_images"].includes(msg))return fail(400,msg);
 return fail(503,"cms_unavailable");
}
async function data(request){
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json")return null;
 const bytes=await request.text();if(bytes.length>12000)return null;
 try{const obj=JSON.parse(bytes);return obj&&typeof obj==="object"&&!Array.isArray(obj)?obj:null;}
 catch{return null;}
}
async function tx(db,work){
 return db(async c=>{
  await c.query("BEGIN");
  try{const v=await work(c);await c.query("COMMIT");return v;}
  catch(ex){await c.query("ROLLBACK").catch(()=>{});throw ex;}
 });
}
async function banner(c,id,rev){
 const r=await c.query("SELECT id,kind,status,revision,channel_targets,placements "+
  "FROM "+ENTRIES+" WHERE id=$1::uuid FOR UPDATE",[id]);
 if(r.rowCount!==1)throw Error("not_found");
 const item=r.rows[0];
 if(item.revision!==rev)throw Error("revision_conflict");
 if(item.status==="published")throw Error("hide_before_edit");
 if(item.kind!=="banner"||item.placements?.public_web!=="home.hero"||
   !item.channel_targets.includes("public_web"))throw Error("not_hero_banner");
 return item;
}
async function audit(c,id,actor,action,before,after){
 await c.query("INSERT INTO "+AUDIT+
 " (entry_id,actor_subject,action,before_data,after_data) VALUES($1::uuid,$2,$3,$4::jsonb,$5::jsonb)",
 [id,actor,action,JSON.stringify(before),JSON.stringify(after)]);
}
export async function handleCmsSlides({request,db,r2,actor,action}){
 if(actor?.role!=="owner")return fail(403,"owner_required");
 const u=new URL(request.url);
 if(request.method==="GET"&&action==="slides"){
  if(!getOne(u,["id"])||!UUID.test(u.searchParams.get("id")))return fail(400,"invalid_query");
  const id=u.searchParams.get("id");
  try{
   const result=await db(async c=>{
    const entry=await c.query("SELECT kind,status,revision FROM "+ENTRIES+" WHERE id=$1::uuid",[id]);
    if(entry.rowCount!==1)return null;
    const [settings,legacy,extras]=await Promise.all([
     c.query("SELECT enabled,autoplay,effect,interval_ms,duration_ms,slide_order FROM "+SETTINGS+" WHERE entry_id=$1::uuid",[id]),
     c.query("SELECT 1::integer AS slide_no,device,width,height,updated_at FROM fbmn_catalog_private.cms_entry_media WHERE entry_id=$1::uuid AND channel='public_web'",[id]),
     c.query("SELECT slide_no::integer,device,width,height,updated_at FROM "+EXTRA+" WHERE entry_id=$1::uuid ORDER BY slide_no,device",[id])
    ]);
    return {kind:entry.rows[0].kind,status:entry.rows[0].status,revision:entry.rows[0].revision,
     settings:settings.rows[0]??defaultSettings,
     images:[...legacy.rows,...extras.rows]};
   });
   return result?ok(result):fail(404,"not_found");
  }catch{return fail(503,"cms_unavailable");}
 }
 if(request.method==="GET"&&action==="slide-image"){
  if(!getOne(u,["id","slide","device"]))return fail(400,"invalid_query");
  const id=u.searchParams.get("id"),slide=Number(u.searchParams.get("slide")),
   device=u.searchParams.get("device");
  if(!UUID.test(id)||!validSlide(slide)||!validDevice(device))return fail(400,"invalid_query");
  if(!r2?.get)return fail(503,"media_store_unavailable");
  try{
   const rows=await db(c=>c.query("SELECT r2_key FROM "+EXTRA+
    " WHERE entry_id=$1::uuid AND slide_no=$2 AND device=$3",[id,slide,device]));
   if(rows.rowCount!==1)return fail(404,"not_found");
   const object=await r2.get(rows.rows[0].r2_key);
   if(!object?.body||object.size>LIMIT)return fail(404,"not_found");
   return new Response(object.body,{headers:{...H,"Content-Type":"image/webp",
     "Content-Disposition":"inline","Cross-Origin-Resource-Policy":"same-origin"}});
  }catch{return fail(503,"cms_unavailable");}
 }
 if(request.method!=="POST"||u.search)return fail(405,"method_not_allowed");
 if(action==="slide-upload"){
  if(!r2?.get||!r2?.put||!r2?.delete)return fail(503,"media_store_unavailable");
  const id=request.headers.get("x-cms-id"),slide=Number(request.headers.get("x-cms-slide")),
   device=request.headers.get("x-cms-device"),rev=Number(request.headers.get("x-cms-revision"));
  if(!UUID.test(id)||!validSlide(slide)||!validDevice(device)||
     !Number.isSafeInteger(rev)||rev<1||
     request.headers.get("content-type")?.split(";")[0]!=="image/webp")return fail(400,"invalid_upload");
  if(Number(request.headers.get("content-length")||0)>LIMIT)return fail(413,"image_too_large");
  const bytes=new Uint8Array(await request.arrayBuffer().catch(()=>new ArrayBuffer(0)));
  if(bytes.length<100||bytes.length>LIMIT)return fail(413,"image_too_large");
  const size=imageSize(bytes,"image/webp",64);
  if(!size||size.width>6000||size.height>6000)return fail(400,"invalid_image");
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)))
   .map(v=>v.toString(16).padStart(2,"0")).join("");
  const key="cms/"+id+"/public_web/"+device+"/"+crypto.randomUUID()+".webp";
  let inserted=false,commitAttempted=false,oldKey=null;
  try{
   const result=await db(async c=>{
    await c.query("BEGIN");
    try{
     await banner(c,id,rev);
     const old=await c.query("SELECT r2_key FROM "+EXTRA+
      " WHERE entry_id=$1::uuid AND slide_no=$2 AND device=$3 FOR UPDATE",[id,slide,device]);
     oldKey=old.rows[0]?.r2_key??null;
     await r2.put(key,bytes,{httpMetadata:{contentType:"image/webp"},customMetadata:{sha256:digest}});
     inserted=true;
     await c.query("INSERT INTO "+EXTRA+
      " (entry_id,slide_no,device,r2_key,width,height,file_sha256,uploaded_by)"+
      " VALUES($1::uuid,$2,$3,$4,$5,$6,$7,$8)"+
      " ON CONFLICT(entry_id,slide_no,device) DO UPDATE SET r2_key=excluded.r2_key,"+
      "width=excluded.width,height=excluded.height,file_sha256=excluded.file_sha256,"+
      "uploaded_by=excluded.uploaded_by,updated_at=now()",
      [id,slide,device,key,size.width,size.height,digest,actor.subject]);
     const updated=await c.query("UPDATE "+ENTRIES+
      " SET revision=revision+1,updated_at=now(),updated_by=$2 WHERE id=$1::uuid RETURNING revision",
      [id,actor.subject]);
     await audit(c,id,actor.subject,"banner_slide_upload",
      {slide,device,hadPrevious:!!oldKey},{slide,device,width:size.width,height:size.height,sha256:digest});
     commitAttempted=true;await c.query("COMMIT");
     return {revision:updated.rows[0].revision,slide,device,width:size.width,height:size.height};
    }catch(ex){await c.query("ROLLBACK").catch(()=>{});throw ex;}
   });
   if(oldKey&&oldKey!==key)await r2.delete(oldKey).catch(()=>{});
   return ok(result);
  }catch(ex){
   // Don't delete if COMMIT acknowledgement is uncertain: a DB reference may exist.
   if(inserted&&!commitAttempted)await r2.delete(key).catch(()=>{});
   return error(ex);
  }
 }
 const input=await data(request);
 if(!input||!UUID.test(input.id)||!Number.isSafeInteger(input.expectedRevision)||
    input.expectedRevision<1)return fail(400,"invalid_body");
 if(action==="slide-settings"){
  if(!validSettings(input))return fail(400,"invalid_settings");
  try{
   const result=await tx(db,async c=>{
    await banner(c,input.id,input.expectedRevision);
    const before=await c.query("SELECT * FROM "+SETTINGS+" WHERE entry_id=$1::uuid",[input.id]);
    await c.query("INSERT INTO "+SETTINGS+
     " (entry_id,enabled,autoplay,effect,interval_ms,duration_ms,slide_order)"+
     " VALUES($1::uuid,$2,$3,$4,$5,$6,$7::smallint[])"+
     " ON CONFLICT(entry_id) DO UPDATE SET enabled=excluded.enabled,"+
     "autoplay=excluded.autoplay,effect=excluded.effect,interval_ms=excluded.interval_ms,"+
     "duration_ms=excluded.duration_ms,slide_order=excluded.slide_order",
     [input.id,input.enabled,input.autoplay,input.effect,input.intervalMs,input.durationMs,input.order]);
    const updated=await c.query("UPDATE "+ENTRIES+
     " SET revision=revision+1,updated_at=now(),updated_by=$2 WHERE id=$1::uuid RETURNING revision",
     [input.id,actor.subject]);
    await audit(c,input.id,actor.subject,"banner_slide_settings",
     before.rows[0]??defaultSettings,{enabled:input.enabled,autoplay:input.autoplay,
      effect:input.effect,intervalMs:input.intervalMs,durationMs:input.durationMs,order:input.order});
    return {revision:updated.rows[0].revision};
   });
   return ok(result);
  }catch(ex){return error(ex);}
 }
 if(action==="slide-remove"){
  const slide=input.slide;
  if(!validSlide(slide)||!r2?.delete)return fail(400,"invalid_slide");
  try{
   const result=await tx(db,async c=>{
    await banner(c,input.id,input.expectedRevision);
    const removed=await c.query("DELETE FROM "+EXTRA+
     " WHERE entry_id=$1::uuid AND slide_no=$2 RETURNING device,r2_key",[input.id,slide]);
    const updated=await c.query("UPDATE "+ENTRIES+
     " SET revision=revision+1,updated_at=now(),updated_by=$2 WHERE id=$1::uuid RETURNING revision",
     [input.id,actor.subject]);
    await audit(c,input.id,actor.subject,"banner_slide_remove",
     {slide,devices:removed.rows.map(x=>x.device)},{slide,removed:true});
    return {revision:updated.rows[0].revision,keys:removed.rows.map(x=>x.r2_key)};
   });
   for(const key of result.keys)await r2.delete(key).catch(()=>{});
   return ok({revision:result.revision,slide});
  }catch(ex){return error(ex);}
 }
 return fail(404,"not_found");
}
