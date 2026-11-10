// DL7A PDF owner intake: private R2 objects; publication is opt-in and per existing book/edition.
const BOOKS="fbmn_catalog_private.website_catalogue_books";
const PDFS="fbmn_catalog_private.website_catalogue_pdfs";
const AUDIT="fbmn_catalog_private.website_catalogue_audit";
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export const MAX_CATALOGUE_PDF=20*1024*1024;
const PRIVATE={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const fail=(status,code)=>Response.json({error:{code}},{status,headers:PRIVATE});
const ok=data=>Response.json({data},{headers:PRIVATE});
const validId=v=>typeof v==="string"&&UUID.test(v);
const validRevision=v=>Number.isSafeInteger(v)&&v>0;

export function cataloguePdfKey(bookId,fileId){
 return validId(bookId)&&validId(fileId)?"books/"+bookId+"/pdf/"+fileId+".pdf":null;
}
export function validateCataloguePdf(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<100||bytes.length>MAX_CATALOGUE_PDF)return false;
 const beginning=new TextDecoder("ascii").decode(bytes.subarray(0,8));
 if(!/^%PDF-[12]\.\d/.test(beginning))return false;
 const end=new TextDecoder("ascii").decode(bytes.subarray(Math.max(0,bytes.length-1024)));
 return /%%EOF\s*$/.test(end);
}
const expose=x=>x?({byteSize:Number(x.byte_size),visible:x.visible===true,
 downloadEnabled:x.download_enabled===true,updatedAt:x.updated_at}):null;
export async function queryCataloguePdf(client,bookId){
 const q=await client.query("SELECT byte_size,visible,download_enabled,updated_at FROM "+PDFS+
  " WHERE book_id=$1::uuid LIMIT 1",[bookId]);
 return expose(q.rows[0]);
}
const validSettings=x=>x&&typeof x==="object"&&!Array.isArray(x)&&
 Object.keys(x).sort().join(",")==="downloadEnabled,id,revision,visible"&&
 validId(x.id)&&validRevision(x.revision)&&typeof x.visible==="boolean"&&
 typeof x.downloadEnabled==="boolean"&&(!x.downloadEnabled||x.visible);
const secureError=e=>{
 if(e?.message==="not_found")return fail(404,"not_found");
 if(["ready_locked","revision_conflict"].includes(e?.message))return fail(409,e.message);
 if(e?.message==="pdf_required")return fail(422,"pdf_required");
 if(e?.message==="invalid_pdf_settings")return fail(400,"invalid_pdf_settings");
 return fail(503,"catalogue_unavailable");
};
async function lock(client,id,revision){
 const r=await client.query("SELECT id,title,edition,state,revision,updated_at FROM "+BOOKS+
  " WHERE id=$1::uuid FOR UPDATE",[id]);
 if(r.rowCount!==1)throw Error("not_found");
 if(Number(r.rows[0].revision)!==revision)throw Error("revision_conflict");
 if(r.rows[0].state==="ready")throw Error("ready_locked");
 return r.rows[0];
}
async function record(client,bookId,actor,action,before,after){
 const rev=await client.query("UPDATE "+BOOKS+
  " SET revision=revision+1,updated_at=now(),updated_by=$2 WHERE id=$1::uuid"+
  " RETURNING id,title,edition,state,revision,updated_at",[bookId,actor]);
 const book={...rev.rows[0],revision:Number(rev.rows[0].revision)};
 await client.query("INSERT INTO "+AUDIT+
  "(book_id,revision,actor_subject,operation,before_data,after_data)"+
  " VALUES($1::uuid,$2,$3,$4,$5::jsonb,$6::jsonb)",
  [bookId,book.revision,actor,action,JSON.stringify(before),JSON.stringify(after)]);
 return book;
}
async function jsonBody(request){
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json"||
    Number(request.headers.get("content-length")||0)>20000)return null;
 try{
  const raw=await request.text();
  return raw.length<=20000?JSON.parse(raw):null;
 }catch{return null;}
}
async function transaction(db,work){
 return db(async c=>{
  await c.query("BEGIN");
  try{const value=await work(c);await c.query("COMMIT");return value;}
  catch(e){await c.query("ROLLBACK").catch(()=>{});throw e;}
 });
}
async function changeSettings(db,actor,data){
 if(!validSettings(data))return fail(400,"invalid_pdf_settings");
 try{
  const saved=await transaction(db,async c=>{
   const old=await lock(c,data.id,data.revision);
   const before=await queryCataloguePdf(c,data.id);
   if(!before)throw Error("pdf_required");
   const result=await c.query("UPDATE "+PDFS+
    " SET visible=$2,download_enabled=$3,updated_at=now() WHERE book_id=$1::uuid"+
    " RETURNING byte_size,visible,download_enabled,updated_at",
    [data.id,data.visible,data.downloadEnabled]);
   const pdf=expose(result.rows[0]);
   const book=await record(c,data.id,actor,"save",
    {state:old.state,pdf:before},{pdf});
   return {book,pdf};
  });
  return ok(saved);
 }catch(e){return secureError(e);}
}
async function remove(db,r2,actor,data){
 if(!validId(data?.id)||!validRevision(data?.revision))return fail(400,"invalid_book");
 let key=null,committed=false;
 try{
  const saved=await transaction(db,async c=>{
   const old=await lock(c,data.id,data.revision);
   const before=await queryCataloguePdf(c,data.id);
   if(!before)throw Error("pdf_required");
   const deleted=await c.query("DELETE FROM "+PDFS+" WHERE book_id=$1::uuid RETURNING r2_key",[data.id]);
   key=deleted.rows[0].r2_key;
   const book=await record(c,data.id,actor,"remove",{state:old.state,pdf:before},{pdf:null});
   return {book,pdf:null};
  });
  committed=true;
  if(key)await r2.delete(key).catch(()=>{});
  return ok(saved);
 }catch(e){return secureError(e);}
}
async function upload(db,r2,actor,request){
 const id=request.headers.get("x-catalogue-book-id"),rev=Number(request.headers.get("x-catalogue-revision"));
 if(!validId(id)||!validRevision(rev)||request.headers.get("content-type")?.split(";")[0]!=="application/pdf")
  return fail(400,"invalid_upload");
 if(Number(request.headers.get("content-length")||0)>MAX_CATALOGUE_PDF)return fail(413,"too_large");
 let bytes;
 try{bytes=new Uint8Array(await request.arrayBuffer());}
 catch{return fail(400,"invalid_pdf");}
 if(!validateCataloguePdf(bytes))return fail(400,"invalid_pdf");
 const fileId=crypto.randomUUID(),key=cataloguePdfKey(id,fileId);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)))
  .map(v=>v.toString(16).padStart(2,"0")).join("");
 let inserted=false,committed=false,commitAttempted=false,oldKey=null;
 try{
  const saved=await transaction(db,async c=>{
   const before=await lock(c,id,rev);
   const old=await c.query("SELECT r2_key,byte_size,visible,download_enabled,updated_at FROM "+PDFS+
    " WHERE book_id=$1::uuid FOR UPDATE",[id]);
   oldKey=old.rows[0]?.r2_key||null;
   await r2.put(key,bytes,{httpMetadata:{contentType:"application/pdf"},
    customMetadata:{sha256:hash}});
   inserted=true;
   const next=await c.query("INSERT INTO "+PDFS+
    "(book_id,r2_key,byte_size,file_sha256,uploaded_by,visible,download_enabled)"+
    " VALUES($1::uuid,$2,$3,$4,$5,false,false)"+
    " ON CONFLICT(book_id) DO UPDATE SET r2_key=excluded.r2_key,byte_size=excluded.byte_size,"+
    " file_sha256=excluded.file_sha256,uploaded_by=excluded.uploaded_by,uploaded_at=now(),"+
    " visible=false,download_enabled=false,updated_at=now()"+
    " RETURNING byte_size,visible,download_enabled,updated_at",[id,key,bytes.length,hash,actor]);
   const pdf=expose(next.rows[0]);
   const book=await record(c,id,actor,"upload",
    {state:before.state,pdf:expose(old.rows[0])},{pdf});
   commitAttempted=true;
   return {book,pdf};
  });
  committed=true;
  if(oldKey)await r2.delete(oldKey).catch(()=>{});
  return ok(saved);
 }catch(e){
  // After a possibly successful COMMIT, preserve bytes; never risk losing an owned PDF.
  if(inserted&&!commitAttempted)await r2.delete(key).catch(()=>{});
  return secureError(e);
 }
}
export async function handleCataloguePdf({request,action,actor,db,r2}){
 if(actor?.role!=="owner")return fail(403,"owner_required");
 if(typeof db!=="function"||!r2?.put||!r2?.delete)return fail(503,"catalogue_storage_unavailable");
 if(action==="pdf-upload"){
  if(request.method!=="POST"||new URL(request.url).search)return fail(405,"method_not_allowed");
  return upload(db,r2,actor.subject,request);
 }
 if(request.method!=="POST"||new URL(request.url).search)return fail(405,"method_not_allowed");
 const input=await jsonBody(request);
 if(!input||typeof input!=="object"||Array.isArray(input))return fail(400,"invalid_body");
 if(action==="pdf-settings")return changeSettings(db,actor.subject,input);
 if(action==="pdf-remove")return remove(db,r2,actor.subject,input);
 return fail(404,"not_found");
}
