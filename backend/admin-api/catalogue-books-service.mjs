// DL7B Owner-only catalogue BOOK media. Not SKU catalogue, not CMS and not public data.
// All objects use a distinct private R2 binding CATALOGUE_MEDIA_R2 (bucket fbmn-catalogue).
import {imageSize} from "./media-service.mjs";

const ROOT="/v1/admin/website/catalogue";
const BOOKS="fbmn_catalog_private.website_catalogue_books";
const ASSETS="fbmn_catalog_private.website_catalogue_assets";
const AUDIT="fbmn_catalog_private.website_catalogue_audit";
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const KINDS=new Set(["page","cover","background_desktop","background_mobile"]);
const LIMIT=5*1024*1024, MAX_PAGES=200;
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status,code)=>Response.json({error:{code}},{status,headers:HEADERS});
const ok=data=>Response.json({data},{headers:HEADERS});
const validId=id=>typeof id==="string"&&UUID.test(id);
const textField=(s,max,min=0)=>typeof s==="string"&&s.trim()===s&&s.length>=min&&
 s.length<=max&&!/[\x00-\x1f\x7f]/.test(s);
const revision=n=>Number.isSafeInteger(n)&&n>0;
const one=(u,key)=>u.searchParams.size===1&&u.searchParams.getAll(key).length===1;

export function catalogueObjectKey(bookId,kind,fileId){
 if(!validId(bookId)||!validId(fileId)||!KINDS.has(kind))return null;
 if(kind==="page")return "books/"+bookId+"/pages/"+fileId+".webp";
 if(kind==="cover")return "books/"+bookId+"/covers/"+fileId+".webp";
 return "backgrounds/"+(kind==="background_desktop"?"desktop":"mobile")+
  "/"+bookId+"/"+fileId+".webp";
}
export function validateCatalogueBook(input){
 return input&&typeof input==="object"&&!Array.isArray(input)&&
  textField(input.title,120,1)&&textField(input.edition,80);
}
export function validateCatalogueImage(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<100||bytes.length>LIMIT)return null;
 const d=imageSize(bytes,"image/webp",64);
 return d&&d.width<=6000&&d.height<=6000?d:null;
}
const exposeBook=r=>({id:r.id,title:r.title,edition:r.edition,state:r.state,
 revision:Number(r.revision),updated_at:r.updated_at});
const exposeAsset=r=>({id:r.id,kind:r.kind,sort_order:Number(r.sort_order),
 width:Number(r.width),height:Number(r.height),byte_size:Number(r.byte_size)});
function errorCode(e){
 const m=e?.message;
 if(["revision_conflict","ready_locked"].includes(m))return [409,m];
 if(m==="not_found")return [404,m];
 if(m==="pages_required")return [422,m];
 if(["bad_order","page_limit","invalid_book"].includes(m))return [400,m];
 return [503,"catalogue_unavailable"];
}
async function transact(db,fn){
 return db(async c=>{
  await c.query("BEGIN");
  try{
   const result=await fn(c);
   await c.query("COMMIT");
   return result;
  }catch(e){await c.query("ROLLBACK").catch(()=>{});throw e;}
 });
}
async function lockBook(c,id,rev){
 const found=await c.query("SELECT id,title,edition,state,revision,updated_at FROM "+BOOKS+
  " WHERE id=$1::uuid FOR UPDATE",[id]);
 if(found.rowCount!==1)throw Error("not_found");
 const b=found.rows[0];
 if(Number(b.revision)!==rev)throw Error("revision_conflict");
 return b;
}
async function tick(c,id,actor){
 const a=await c.query("UPDATE "+BOOKS+
  " SET revision=revision+1,updated_at=now(),updated_by=$2 WHERE id=$1::uuid"+
  " RETURNING id,title,edition,state,revision,updated_at",[id,actor]);
 return exposeBook(a.rows[0]);
}
async function audit(c,id,actor,op,revision,before,after){
 await c.query("INSERT INTO "+AUDIT+
  "(book_id,revision,actor_subject,operation,before_data,after_data)"+
  " VALUES($1::uuid,$2,$3,$4,$5::jsonb,$6::jsonb)",
  [id,revision,actor,op,JSON.stringify(before),JSON.stringify(after)]);
}
async function bodyJson(request){
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json"||
  Number(request.headers.get("content-length")||0)>20000)return null;
 const raw=await request.text();
 if(raw.length>20000)return null;
 try{return JSON.parse(raw);}catch{return null;}
}
async function queryList(db){
 const q=await db(c=>c.query("SELECT id,title,edition,state,revision,updated_at"+
  " FROM "+BOOKS+" ORDER BY updated_at DESC,id DESC LIMIT 50"));
 return {books:q.rows.map(exposeBook)};
}
async function queryDetail(db,id){
 const v=await db(async c=>{
  const b=await c.query("SELECT id,title,edition,state,revision,updated_at FROM "+BOOKS+
   " WHERE id=$1::uuid",[id]);
  if(b.rowCount!==1)throw Error("not_found");
  const files=await c.query("SELECT id,kind,sort_order,width,height,byte_size FROM "+ASSETS+
   " WHERE book_id=$1::uuid ORDER BY CASE kind WHEN 'cover' THEN 0 WHEN 'background_desktop' THEN 1"+
   " WHEN 'background_mobile' THEN 2 ELSE 3 END,sort_order,id LIMIT 205",[id]);
  return {book:exposeBook(b.rows[0]),assets:files.rows.map(exposeAsset)};
 });
 return v;
}
async function createBook(db,actor,payload){
 if(!validateCatalogueBook(payload))throw Error("invalid_book");
 const id=crypto.randomUUID();
 return transact(db,async c=>{
  const b=await c.query("INSERT INTO "+BOOKS+
   "(id,title,edition,created_by,updated_by) VALUES($1::uuid,$2,$3,$4,$4)"+
   " RETURNING id,title,edition,state,revision,updated_at",
   [id,payload.title,payload.edition,actor]);
  const book=exposeBook(b.rows[0]);
  await audit(c,id,actor,"create",1,{},book);
  return {book};
 });
}
async function mutate(db,r2,actor,action,data){
 if(!validId(data?.id)||!revision(data?.revision))throw Error("invalid_book");
 const id=data.id,rev=data.revision;
 let removedKey=null,commitAttempted=false;
 const result=await db(async c=>{
  await c.query("BEGIN");
  try{
   const before=await lockBook(c,id,rev);
   const safeBefore=exposeBook(before);
   if(before.state==="ready"&&action!=="hide")throw Error("ready_locked");
   let afterData={};
   if(action==="save"){
    if(!validateCatalogueBook(data))throw Error("invalid_book");
    await c.query("UPDATE "+BOOKS+" SET title=$2,edition=$3 WHERE id=$1::uuid",
     [id,data.title,data.edition]);
    afterData={title:data.title,edition:data.edition};
   }else if(action==="ready"){
    const n=await c.query("SELECT count(*)::integer AS n FROM "+ASSETS+
     " WHERE book_id=$1::uuid AND kind='page'",[id]);
    if(Number(n.rows[0].n)<1)throw Error("pages_required");
    await c.query("UPDATE "+BOOKS+" SET state='ready' WHERE id=$1::uuid",[id]);
    afterData={state:"ready"};
   }else if(action==="hide"){
    await c.query("UPDATE "+BOOKS+" SET state='hidden' WHERE id=$1::uuid",[id]);
    afterData={state:"hidden"};
   }else if(action==="reorder"){
    const pages=await c.query("SELECT id FROM "+ASSETS+
     " WHERE book_id=$1::uuid AND kind='page' ORDER BY sort_order,id FOR UPDATE",[id]);
    const ids=data.assetIds;
    if(!Array.isArray(ids)||ids.length!==pages.rowCount||ids.length>MAX_PAGES||
     !ids.every(validId)||new Set(ids).size!==ids.length||
     !ids.every(x=>pages.rows.some(row=>row.id===x)))throw Error("bad_order");
    for(let i=0;i<ids.length;i++)await c.query("UPDATE "+ASSETS+
      " SET sort_order=$2 WHERE id=$1::uuid",[ids[i],i]);
    afterData={page_order:ids};
   }else if(action==="remove"){
    if(!validId(data.assetId))throw Error("invalid_book");
    const row=await c.query("DELETE FROM "+ASSETS+
     " WHERE id=$1::uuid AND book_id=$2::uuid RETURNING kind,r2_key",
     [data.assetId,id]);
    if(row.rowCount!==1)throw Error("not_found");
    removedKey=row.rows[0].r2_key;
    afterData={removed_asset:data.assetId,kind:row.rows[0].kind};
   }else throw Error("invalid_book");
   const book=await tick(c,id,actor);
   await audit(c,id,actor,action,book.revision,safeBefore,afterData);
   commitAttempted=true;
   await c.query("COMMIT");
   return {book};
  }catch(e){await c.query("ROLLBACK").catch(()=>{});throw e;}
 });
 // The bucket is private. Keep orphaned bytes rather than delete a committed object on ambiguous COMMIT.
 if(removedKey&&commitAttempted)await r2.delete(removedKey).catch(()=>{});
 return result;
}
async function upload(db,r2,actor,request){
 const id=request.headers.get("x-catalogue-book-id");
 const kind=request.headers.get("x-catalogue-kind");
 const rev=Number(request.headers.get("x-catalogue-revision"));
 if(!validId(id)||!KINDS.has(kind)||!revision(rev)||
  request.headers.get("content-type")?.split(";")[0]!=="image/webp")
  return fail(400,"invalid_upload");
 if(Number(request.headers.get("content-length")||0)>LIMIT)return fail(413,"too_large");
 let bytes;
 try{bytes=new Uint8Array(await request.arrayBuffer());}catch{return fail(400,"invalid_image");}
 const d=validateCatalogueImage(bytes);
 if(!d)return fail(400,"invalid_image");
 const fileId=crypto.randomUUID(),key=catalogueObjectKey(id,kind,fileId);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)))
  .map(v=>v.toString(16).padStart(2,"0")).join("");
 let inserted=false,commitAttempted=false,formerKey=null;
 try{
  const saved=await db(async c=>{
   await c.query("BEGIN");
   try{
    const before=await lockBook(c,id,rev);
    if(before.state==="ready")throw Error("ready_locked");
    let order=0;
    if(kind==="page"){
     const counter=await c.query("SELECT count(*)::integer AS n,"+
      " COALESCE(max(sort_order),-1)+1 AS next FROM "+ASSETS+
      " WHERE book_id=$1::uuid AND kind='page'",[id]);
     if(Number(counter.rows[0].n)>=MAX_PAGES)throw Error("page_limit");
     order=Number(counter.rows[0].next);
    }else{
     const former=await c.query("SELECT r2_key FROM "+ASSETS+
      " WHERE book_id=$1::uuid AND kind=$2 FOR UPDATE",[id,kind]);
     formerKey=former.rows[0]?.r2_key??null;
    }
    await r2.put(key,bytes,{httpMetadata:{contentType:"image/webp"},customMetadata:{sha256:hash}});
    inserted=true;
    if(kind!=="page")await c.query("DELETE FROM "+ASSETS+
     " WHERE book_id=$1::uuid AND kind=$2",[id,kind]);
    await c.query("INSERT INTO "+ASSETS+
     "(id,book_id,kind,sort_order,r2_key,byte_size,width,height,file_sha256,uploaded_by)"+
     " VALUES($1::uuid,$2::uuid,$3,$4,$5,$6,$7,$8,$9,$10)",
     [fileId,id,kind,order,key,bytes.length,d.width,d.height,hash,actor]);
    const book=await tick(c,id,actor);
    await audit(c,id,actor,"upload",book.revision,exposeBook(before),
     {asset:fileId,kind,width:d.width,height:d.height});
    commitAttempted=true;
    await c.query("COMMIT");
    return {book,asset:{id:fileId,kind,sort_order:order,width:d.width,height:d.height,byte_size:bytes.length}};
   }catch(e){await c.query("ROLLBACK").catch(()=>{});throw e;}
  });
  if(formerKey)await r2.delete(formerKey).catch(()=>{});
  return ok(saved);
 }catch(e){
  if(inserted&&!commitAttempted)await r2.delete(key).catch(()=>{});
  const [status,code]=errorCode(e);return fail(status,code);
 }
}
export async function handleCatalogueBooks({request,actor,db,r2}){
 if(actor?.role!=="owner")return fail(403,"owner_required");
 if(typeof db!=="function"||!r2?.get||!r2?.put||!r2?.delete)
  return fail(503,"catalogue_storage_unavailable");
 const u=new URL(request.url);
 if(u.pathname!==ROOT&&!u.pathname.startsWith(ROOT+"/"))return fail(404,"not_found");
 const action=u.pathname===ROOT?"":u.pathname.slice(ROOT.length+1);
 if(action.includes("/")||!["","image","create","save","ready","hide","upload","reorder","remove"].includes(action))
  return fail(404,"not_found");
 try{
  if(request.method==="GET"&&action===""){
   if(!u.search)return ok(await queryList(db));
   if(!one(u,"id")||!validId(u.searchParams.get("id")))return fail(400,"invalid_query");
   return ok(await queryDetail(db,u.searchParams.get("id")));
  }
  if(request.method==="GET"&&action==="image"){
   if(!one(u,"asset")||!validId(u.searchParams.get("asset")))return fail(400,"invalid_query");
   const found=await db(c=>c.query("SELECT r2_key,byte_size FROM "+ASSETS+
    " WHERE id=$1::uuid",[u.searchParams.get("asset")]));
   if(found.rowCount!==1)return fail(404,"not_found");
   const object=await r2.get(found.rows[0].r2_key);
   if(!object?.body||object.size>LIMIT||object.size!==Number(found.rows[0].byte_size))
    return fail(404,"not_found");
   return new Response(object.body,{status:200,headers:{...HEADERS,
    "Content-Type":"image/webp","Content-Disposition":"inline",
    "Cross-Origin-Resource-Policy":"same-origin"}});
  }
  if(request.method!=="POST"||u.search)return fail(405,"method_not_allowed");
  if(action==="upload")return upload(db,r2,actor.subject,request);
  const input=await bodyJson(request);
  if(!input||typeof input!=="object"||Array.isArray(input))return fail(400,"invalid_book");
  if(action==="create")return ok(await createBook(db,actor.subject,input));
  if(["save","ready","hide","reorder","remove"].includes(action))
   return ok(await mutate(db,r2,actor.subject,action,input));
  return fail(405,"method_not_allowed");
 }catch(e){const [status,code]=errorCode(e);return fail(status,code);}
}
