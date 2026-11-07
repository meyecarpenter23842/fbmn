// Owner-scoped CMS images. Stored as private WebP in the existing R2 bucket.
// Not a public image URL, not a catalogue SKU/image and not an asset approval bypass.
import { imageSize } from "./media-service.mjs";

const TABLE="fbmn_catalog_private.cms_entries";
const MEDIA="fbmn_catalog_private.cms_entry_media";
const AUDIT="fbmn_catalog_private.cms_entry_audit";
const LIMIT=5*1024*1024;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHANNEL=new Set(["public_web","dealer_app","consumer_app"]);
const DEVICE=new Set(["desktop","mobile"]);
const H={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status,code)=>Response.json({error:{code}},{status,headers:H});
const ok=data=>Response.json({data},{headers:H});
const one=(u,keys)=>u.searchParams.size===keys.length&&keys.every(k=>u.searchParams.getAll(k).length===1);

function selected(u){
 const id=u.searchParams.get("id"),channel=u.searchParams.get("channel"),device=u.searchParams.get("device");
 if(!UUID.test(id)||!CHANNEL.has(channel)||!DEVICE.has(device))return null;
 return {id,channel,device};
}
export async function handleCmsMedia({request,db,r2,actor,action}){
 const u=new URL(request.url);
 if(!r2?.get||!r2?.put)return fail(503,"media_store_unavailable");
 if(request.method==="GET"&&action==="assets"){
  if(!one(u,["id"])||!UUID.test(u.searchParams.get("id")))return fail(400,"invalid_query");
  try{
   const rows=await db(c=>c.query("SELECT channel,device,width,height,updated_at FROM "+MEDIA+
    " WHERE entry_id=$1::uuid ORDER BY channel,device",[u.searchParams.get("id")]));
   return ok({items:rows.rows});
  }catch{return fail(503,"cms_unavailable");}
 }
 if(request.method==="GET"&&action==="image"){
  if(!one(u,["id","channel","device"]))return fail(400,"invalid_query");
  const q=selected(u);if(!q)return fail(400,"invalid_query");
  try{
   const result=await db(c=>c.query("SELECT r2_key FROM "+MEDIA+
    " WHERE entry_id=$1::uuid AND channel=$2 AND device=$3",[q.id,q.channel,q.device]));
   if(result.rowCount!==1)return fail(404,"not_found");
   const object=await r2.get(result.rows[0].r2_key);
   if(!object || !object.body || object.size>LIMIT)return fail(404,"not_found");
   return new Response(object.body,{status:200,headers:{...H,
    "Content-Type":"image/webp","Content-Disposition":"inline",
    "Cross-Origin-Resource-Policy":"same-origin"}});
  }catch{return fail(503,"cms_unavailable");}
 }
 if(request.method!=="POST"||action!=="image-upload")return fail(405,"method_not_allowed");
 if(u.search)return fail(400,"invalid_query");
 const id=request.headers.get("x-cms-id"),channel=request.headers.get("x-cms-channel"),
  device=request.headers.get("x-cms-device"),rev=Number(request.headers.get("x-cms-revision"));
 if(!UUID.test(id)||!CHANNEL.has(channel)||!DEVICE.has(device)||
    request.headers.get("content-type")?.split(";")[0]!=="image/webp"||
    !Number.isSafeInteger(rev)||rev<1)return fail(400,"invalid_upload");
 if(Number(request.headers.get("content-length")||0)>LIMIT)return fail(413,"image_too_large");
 let bytes;
 try{bytes=new Uint8Array(await request.arrayBuffer());}
 catch{return fail(400,"invalid_image");}
 if(bytes.length<100||bytes.length>LIMIT)return fail(413,"image_too_large");
 const dimensions=imageSize(bytes,"image/webp",64);
 if(!dimensions||dimensions.width>6000||dimensions.height>6000)return fail(400,"invalid_image");
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)))
  .map(v=>v.toString(16).padStart(2,"0")).join("");
 const key="cms/"+id+"/"+channel+"/"+device+"/"+crypto.randomUUID()+".webp";
 let inserted=false,committed=false,commitAttempted=false,oldKey=null;
 try{
  const result=await db(async c=>{
   await c.query("BEGIN");
   try{
    const current=await c.query("SELECT * FROM "+TABLE+" WHERE id=$1::uuid FOR UPDATE",[id]);
    if(current.rowCount!==1)throw Error("not_found");
    const entry=current.rows[0];
    if(entry.revision!==rev)throw Error("revision_conflict");
    if(entry.status==="published")throw Error("hide_before_edit");
    if(!entry.channel_targets.includes(channel))throw Error("channel_not_selected");
    const former=await c.query("SELECT r2_key FROM "+MEDIA+
     " WHERE entry_id=$1::uuid AND channel=$2 AND device=$3 FOR UPDATE",[id,channel,device]);
    oldKey=former.rows[0]?.r2_key??null;
    await r2.put(key,bytes,{httpMetadata:{contentType:"image/webp"},customMetadata:{sha256:digest}});
    inserted=true;
    await c.query("INSERT INTO "+MEDIA+
     " (entry_id,channel,device,r2_key,width,height,file_sha256,uploaded_by) "+
     "VALUES($1::uuid,$2,$3,$4,$5,$6,$7,$8) "+
     "ON CONFLICT(entry_id,channel,device) DO UPDATE SET r2_key=excluded.r2_key,"+
     "width=excluded.width,height=excluded.height,file_sha256=excluded.file_sha256,"+
     "uploaded_by=excluded.uploaded_by,updated_at=now()",[
      id,channel,device,key,dimensions.width,dimensions.height,digest,actor.subject]);
    const updated=await c.query("UPDATE "+TABLE+" SET revision=revision+1,"+
     "updated_by=$2,updated_at=now() WHERE id=$1::uuid RETURNING revision",[id,actor.subject]);
    await c.query("INSERT INTO "+AUDIT+
     " (entry_id,actor_subject,action,before_data,after_data) "+
     "VALUES($1::uuid,$2,'media_upload',$3::jsonb,$4::jsonb)",[
      id,actor.subject,JSON.stringify({channel,device,previous:key===oldKey?null:oldKey}),
      JSON.stringify({channel,device,width:dimensions.width,height:dimensions.height,sha256:digest})]);
    // An uncertain COMMIT acknowledgement must never delete a newly referenced R2 key.
    commitAttempted=true;
    await c.query("COMMIT");
    committed=true;
    return {channel,device,width:dimensions.width,height:dimensions.height,revision:updated.rows[0].revision};
   }catch(e){await c.query("ROLLBACK").catch(()=>{});throw e;}
  });
  // Best-effort deletion of a now-unreferenced replaced private asset.
  if(oldKey&&oldKey!==key)await r2.delete(oldKey).catch(()=>{});
  return ok(result);
 }catch(e){
  if(inserted&&!commitAttempted)await r2.delete(key).catch(()=>{});
  if(e?.message==="revision_conflict"||e?.message==="hide_before_edit")return fail(409,e.message);
  if(e?.message==="not_found")return fail(404,"not_found");
  if(e?.message==="channel_not_selected")return fail(400,"channel_not_selected");
  return fail(503,"cms_unavailable");
 }
}
