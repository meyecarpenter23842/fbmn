// ADMIN L02 — confidential price bulk workflow. All writes are explicitly confirmed draft writes.
// No public/B2B/consumer read path uses this module.
const KINDS=new Set(["source","net_internal","retail_public","dealer_contract"]);
const SKU=x=>typeof x==="string"&&x.length>0&&x.length<=80&&x===x.trim()&&!/[\x00-\x1f\x7f]/.test(x);
const UUID=x=>typeof x==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const DATE=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&
 !Number.isNaN(Date.parse(x))&&new Date(x+"T00:00:00Z").toISOString().slice(0,10)===x;
const VALID_SOURCE=x=>typeof x==="string"&&x.length>=1&&x.length<=300&&x===x.trim()&&!/[\x00-\x1f\x7f]/.test(x);
const MAX_ROWS=1000;
const PRESERVABLE=new Set(["vat_included","vat_rate_bps","source_document","effective_until"]);
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const error=(status,code)=>Response.json({error:{code}},{status,headers});
const reply=(status,data)=>Response.json({data},{status,headers});
const vnDay=()=>{const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Ho_Chi_Minh",
 year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const val=k=>parts.find(p=>p.type===k)?.value;
 return val("year")+"-"+val("month")+"-"+val("day");
};
const valueStr=x=>typeof x==="number"&&Number.isSafeInteger(x)?String(x):x;
const amountOk=x=>typeof x==="string"&&/^(0|[1-9][0-9]{0,12})$/.test(x)&&
 BigInt(x)<=1000000000000n;
async function hash(data){
 const bytes=new TextEncoder().encode(JSON.stringify(data));
 const result=await crypto.subtle.digest("SHA-256",bytes);
 return Array.from(new Uint8Array(result),v=>v.toString(16).padStart(2,"0")).join("");
}
async function readBody(request){
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json")return null;
 if(Number(request.headers.get("content-length")||0)>350000)return null;
 const txt=await request.text();
 if(txt.length>350000)return null;
 try{return JSON.parse(txt);}catch{return null;}
}
function normalize(input){
 if(!input||typeof input!=="object"||Array.isArray(input)||
  !Array.isArray(input.rows)||input.rows.length<1||input.rows.length>MAX_ROWS)return null;
 const today=vnDay();const defaults={
  price_kind:input.price_kind,customer_id:input.customer_id??null,
  vat_included:input.vat_included,vat_rate_bps:input.vat_rate_bps??null,
  source_document:input.source_document,effective_from:input.effective_from||today,
  effective_until:input.effective_until||null
 };
 const rows=input.rows.map((raw,index)=>{
  const r=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{};
  const value=valueStr(r.amount_vnd);
  const preserve=Array.isArray(r.preserve_existing_fields)?r.preserve_existing_fields:[];
  const validPreserve=preserve.length<=PRESERVABLE.size&&new Set(preserve).size===preserve.length&&
   preserve.every(field=>PRESERVABLE.has(field));
  const item={line:Number.isInteger(r.line)&&r.line>=2?r.line:index+2,
   sku_cong_ty:r.sku_cong_ty,amount_vnd:value,
   price_kind:Object.hasOwn(r,"price_kind")?r.price_kind:defaults.price_kind,
   customer_id:Object.hasOwn(r,"customer_id")?r.customer_id:defaults.customer_id,
   vat_included:Object.hasOwn(r,"vat_included")?r.vat_included:defaults.vat_included,
   vat_rate_bps:Object.hasOwn(r,"vat_rate_bps")?r.vat_rate_bps:defaults.vat_rate_bps,
   source_document:Object.hasOwn(r,"source_document")?r.source_document:defaults.source_document,
   effective_from:Object.hasOwn(r,"effective_from")?r.effective_from:defaults.effective_from,
   effective_until:Object.hasOwn(r,"effective_until")?r.effective_until:defaults.effective_until,
   preserve_existing_fields:preserve};
  // UUIDs are case-insensitive in PostgreSQL; normalize before duplicate
  // detection, scope matching and preview hashing.
  if(UUID(item.customer_id))item.customer_id=item.customer_id.toLowerCase();
  let fault=null;
  if(!validPreserve)fault="invalid_preserve_fields";
  else if(!SKU(item.sku_cong_ty))fault="invalid_company_sku";
  else if(value===null||value===undefined||value==="")fault="empty_skip";
  else if(!amountOk(value))fault="invalid_price";
  else if(!KINDS.has(item.price_kind))fault="invalid_price_kind";
  else if(item.price_kind==="dealer_contract"?!UUID(item.customer_id):item.customer_id!==null)
   fault="invalid_customer_scope";
  else if(typeof item.vat_included!=="boolean")fault="vat_required";
  else if(item.vat_rate_bps!==null&&(!Number.isInteger(item.vat_rate_bps)||
   item.vat_rate_bps<0||item.vat_rate_bps>10000))fault="invalid_vat_rate";
  else if(!VALID_SOURCE(item.source_document))fault="source_document_required";
  else if(!DATE(item.effective_from)||item.effective_until!==null&&
   (!DATE(item.effective_until)||item.effective_until<item.effective_from))
   fault="invalid_effective_period";
  return {...item,fault};
 });
 return rows;
}
function key(x){return [x.sku_cong_ty,x.price_kind,x.customer_id||"",x.effective_from].join("\x1f");}
async function snapshot(c,rows){
 const skus=[...new Set(rows.filter(r=>SKU(r.sku_cong_ty)).map(r=>r.sku_cong_ty))];
 if(skus.length===0)return {found:new Set(),entries:[]};
 const [s,p]=await Promise.all([
  c.query("SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=ANY($1::text[])",[skus]),
  c.query("SELECT id::text AS id,sku_cong_ty,price_kind,customer_id::text AS customer_id,"+
   "amount_vnd::text AS amount_vnd,vat_included,vat_rate_bps,source_document,"+
   "effective_from::text AS effective_from,effective_until::text AS effective_until,"+
   "approval_state,revision FROM fbmn_catalog_private.pricebook_entries "+
   "WHERE sku_cong_ty=ANY($1::text[]) ORDER BY sku_cong_ty,price_kind,customer_id,effective_from,id",[skus])
 ]);
 if(p.rows.length>15000)throw Error("too_many_versions");
 return {found:new Set(s.rows.map(r=>r.sku_cong_ty)),entries:p.rows};
}
function plan(rows,state){
 const used=new Set();const changes=[];let bad=0;
 for(const r of rows){
  const k=SKU(r.sku_cong_ty)?key(r):"invalid:"+r.line;
  let issue=r.fault; if(!issue&&used.has(k))issue="duplicate_row";
  if(!issue)used.add(k);
  if(!issue&&!state.found.has(r.sku_cong_ty))issue="sku_not_found";
  const scope=state.entries.filter(e=>e.sku_cong_ty===r.sku_cong_ty&&
   e.price_kind===r.price_kind&&(e.customer_id||null)===(r.customer_id||null));
  const exact=scope.find(e=>e.effective_from===r.effective_from)||null;
  const resolved={...r};
  if(exact)for(const field of r.preserve_existing_fields){resolved[field]=exact[field];}
  const old=exact||scope.filter(e=>e.effective_from<=r.effective_from)
   .sort((a,b)=>b.effective_from.localeCompare(a.effective_from))[0]||null;
  if(!issue&&exact?.approval_state==="approved")issue="approved_price_locked";
  if(!issue&&scope.some(e=>e.approval_state==="approved"&&e.id!==exact?.id&&
    e.effective_from<=(resolved.effective_until||"9999-12-31")&&
    (e.effective_until||"9999-12-31")>=r.effective_from))issue="approved_period_overlap";
  const same=!!exact&&exact.amount_vnd===resolved.amount_vnd&&
   exact.vat_included===resolved.vat_included&&exact.vat_rate_bps===resolved.vat_rate_bps&&
   exact.source_document===resolved.source_document&&
   exact.effective_until===resolved.effective_until;
  const status=issue==="empty_skip"?"unchanged":issue?"invalid":same?"unchanged":
   exact?"updated":"new";
  if(status==="invalid")bad++;
  changes.push({...resolved,status,issue:issue||null,old_amount_vnd:old?.amount_vnd??null,
   entry_id:exact?.id??null,expected_revision:exact?.revision??null,
   previous_revision:old?.revision??null});
 }
 return {changes,invalid:bad,
  updated:changes.filter(r=>r.status==="updated").length,
  created:changes.filter(r=>r.status==="new").length,
  unchanged:changes.filter(r=>r.status==="unchanged").length};
}
async function fingerprint(rows,state){
 return hash({rows,state:state.entries.map(e=>[e.id,e.revision,e.amount_vnd,
  e.vat_included,e.vat_rate_bps,e.source_document,e.effective_from,e.effective_until,e.approval_state])});
}
async function transaction(db,fn){
 return db(async c=>{await c.query("BEGIN");try{
  const value=await fn(c);await c.query("COMMIT");return value;
 }catch(e){await c.query("ROLLBACK");throw e;}});
}
async function getExport(db,url){
 if([...url.searchParams.keys()].some(k=>!["kind","customer_id"].includes(k))||
  url.searchParams.getAll("kind").length!==1)return error(400,"invalid_query");
 const kind=url.searchParams.get("kind");const customer=url.searchParams.get("customer_id");
 if(!KINDS.has(kind)||(kind==="dealer_contract"?!UUID(customer):customer!==null))
  return error(400,"invalid_price_scope");
 const result=await db(c=>c.query(
  "SELECT s.sku_cong_ty,s.ten_san_pham,s.ten_goc_xnt,s.ten_goc_bang_gia,"+
  "p.id::text AS id,p.amount_vnd::text AS amount_vnd,p.vat_included,p.vat_rate_bps,"+
  "p.source_document,p.effective_from::text AS effective_from,"+
  "p.effective_until::text AS effective_until,p.revision,p.approval_state "+
  "FROM fbmn_catalog.skus s LEFT JOIN LATERAL ("+
  "SELECT * FROM fbmn_catalog_private.pricebook_entries p WHERE p.sku_cong_ty=s.sku_cong_ty "+
  "AND p.price_kind=$1 AND p.customer_id IS NOT DISTINCT FROM $2::uuid "+
  "ORDER BY p.effective_from DESC LIMIT 1) p ON true "+
  "ORDER BY s.sku_cong_ty LIMIT 10001",[kind,customer||null]));
 if(result.rows.length>10000)return error(503,"export_too_large");
 return reply(200,{kind,customer_id:customer||null,items:result.rows});
}
async function getHistory(db,url){
 if([...url.searchParams.keys()].some(k=>!["sku","limit"].includes(k)))return error(400,"invalid_query");
 const sku=url.searchParams.get("sku"),limit=Number(url.searchParams.get("limit")||50);
 if(sku!==null&&!SKU(sku)||!Number.isInteger(limit)||limit<1||limit>100)return error(400,"invalid_query");
 const result=await db(c=>c.query(
  "SELECT a.id::text,a.created_at::text,a.actor_subject,a.action,a.old_revision,a.new_revision,"+
  "a.old_amount_vnd::text,a.new_amount_vnd::text,a.old_vat_included,a.new_vat_included,"+
  "a.source_document,a.batch_id::text AS batch_id,e.sku_cong_ty,e.price_kind,"+
  "e.customer_id::text AS customer_id,e.effective_from::text,e.effective_until::text,"+
  "e.approval_state FROM fbmn_catalog_private.pricebook_audit a "+
  "JOIN fbmn_catalog_private.pricebook_entries e ON e.id=a.entry_id "+
  "WHERE ($1::text IS NULL OR e.sku_cong_ty=$1) ORDER BY a.id DESC LIMIT $2",[sku,limit]));
 const batches=await db(c=>c.query("SELECT id::text,created_at::text,actor_subject,source_document,"+
  "rows_total,created_count,updated_count,unchanged_count "+
  "FROM fbmn_catalog_private.pricebook_import_batches ORDER BY created_at DESC LIMIT 20"));
 return reply(200,{events:result.rows,batches:batches.rows});
}
async function approve(db,input,actor){
 if(!UUID(input?.id)||!Number.isInteger(input?.expected_revision)||
  input.expected_revision<1||input.confirm!=="DUYET_GIA_NOI_BO")return error(400,"invalid_approval");
 try{
  const result=await transaction(db,async c=>{
   // Lock SKU first, then row: same order as bulk apply prevents deadlock.
   const scope=await c.query("SELECT sku_cong_ty FROM fbmn_catalog_private.pricebook_entries "+
    "WHERE id=$1",[input.id]);
   if(scope.rowCount!==1)throw Error("revision_conflict");
   await c.query("SELECT pg_advisory_xact_lock(hashtext($1))",["fbmn-price:"+scope.rows[0].sku_cong_ty]);
   const old=await c.query("SELECT * FROM fbmn_catalog_private.pricebook_entries "+
    "WHERE id=$1 FOR UPDATE",[input.id]);
   const e=old.rows[0];if(!e||e.approval_state!=="draft"||
    e.revision!==input.expected_revision)throw Error("revision_conflict");
   const overlapping=await c.query(
    "SELECT id FROM fbmn_catalog_private.pricebook_entries WHERE id<>$1 "+
    "AND sku_cong_ty=$2 AND price_kind=$3 AND customer_id IS NOT DISTINCT FROM $4::uuid "+
    "AND approval_state='approved' AND "+
    "daterange(effective_from,effective_until,'[]') && daterange($5::date,$6::date,'[]') LIMIT 1",
    [e.id,e.sku_cong_ty,e.price_kind,e.customer_id,e.effective_from,e.effective_until]);
   if(overlapping.rowCount)throw Error("effective_period_conflict");
   const res=await c.query("UPDATE fbmn_catalog_private.pricebook_entries SET "+
    "approval_state='approved',revision=revision+1,updated_by=$1,updated_at=now() "+
    "WHERE id=$2 AND revision=$3 AND approval_state='draft' RETURNING revision",
    [actor.subject,e.id,e.revision]);
   if(res.rowCount!==1)throw Error("revision_conflict");
   await c.query("INSERT INTO fbmn_catalog_private.pricebook_audit "+
    "(entry_id,actor_subject,action,old_revision,new_revision,old_amount_vnd,"+
    "new_amount_vnd,old_vat_included,new_vat_included,source_document) "+
    "VALUES($1,$2,'approve_draft',$3,$4,$5,$5,$6,$6,$7)",
    [e.id,actor.subject,e.revision,e.revision+1,e.amount_vnd,e.vat_included,e.source_document]);
   return {id:e.id,revision:e.revision+1,approval_state:"approved",publicly_published:false};
  });
  return reply(200,result);
 }catch(e){return error(e.message==="revision_conflict"||e.message==="effective_period_conflict"?409:503,
  e.message==="effective_period_conflict"?"effective_period_conflict":"pricebook_conflict");}
}
export async function handleBulkPricebook({request,actor,db}){
 if(!actor||actor.role!=="owner"||typeof actor.subject!=="string")return error(403,"owner_required");
 const url=new URL(request.url),path=url.pathname;
 try{
  if(request.method==="GET"){
   if(path==="/v1/admin/pricing/bulk")return getExport(db,url);
   if(path==="/v1/admin/pricing/history")return getHistory(db,url);
   return error(405,"method_not_allowed");
  }
  if(request.method!=="POST"||url.search!=="")return error(405,"method_not_allowed");
  if(!["/v1/admin/pricing/bulk/preview","/v1/admin/pricing/bulk/apply",
   "/v1/admin/pricing/approve"].includes(path))return error(404,"not_found");
  const input=await readBody(request);
  if(path==="/v1/admin/pricing/approve")return approve(db,input,actor);
  const rows=normalize(input);if(!rows)return error(400,"invalid_batch");
  if(path.endsWith("/apply")&&(!UUID(input.request_id)||input.confirm!=="XAC_NHAN_GIA_NHAP"||
   !/^[a-f0-9]{64}$/.test(input.preview_fingerprint||"")))
   return error(400,"confirmation_required");
  if(path.endsWith("/preview")){
   const state=await db(c=>snapshot(c,rows)),result=plan(rows,state);
   return reply(200,{...result,preview_fingerprint:await fingerprint(rows,state),
    saved:false,privacy:"internal_only",default_effective_date:vnDay()});
  }
  const response=await transaction(db,async c=>{
   // Serialize concurrent retries for the same batch before inspecting its state.
   await c.query("SELECT pg_advisory_xact_lock(hashtext($1))",["fbmn-batch:"+input.request_id]);
   // Atomic idempotency gate and per-SKU locks. Single-entry PATCH still uses revision guards.
   const existing=await c.query("SELECT payload_sha256,created_count,updated_count,unchanged_count "+
    "FROM fbmn_catalog_private.pricebook_import_batches WHERE id=$1",[input.request_id]);
   const payloadHash=await hash(rows);
   if(existing.rowCount){
    if(existing.rows[0].payload_sha256!==payloadHash)throw Error("idempotency_conflict");
    return {...existing.rows[0],replayed:true,publicly_published:false};
   }
   for(const s of [...new Set(rows.filter(r=>SKU(r.sku_cong_ty)).map(r=>r.sku_cong_ty))].sort()){
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1))",["fbmn-price:"+s]);
   }
   const state=await snapshot(c,rows),result=plan(rows,state);
   if(result.invalid)throw Error("invalid_rows");
   if(await fingerprint(rows,state)!==input.preview_fingerprint)throw Error("stale_preview");
   await c.query("INSERT INTO fbmn_catalog_private.pricebook_import_batches "+
    "(id,payload_sha256,actor_subject,source_document,rows_total,created_count,updated_count,unchanged_count) "+
    "VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [input.request_id,payloadHash,actor.subject,input.source_document||"Mixed source",
     rows.length,result.created,result.updated,result.unchanged]);
   for(const row of result.changes){
    if(!["new","updated"].includes(row.status))continue;
    let entryId=row.entry_id,newRevision;
    if(row.status==="new"){
     const saved=await c.query(
      "INSERT INTO fbmn_catalog_private.pricebook_entries "+
      "(sku_cong_ty,price_kind,customer_id,amount_vnd,currency,vat_included,vat_rate_bps,"+
      "source_document,effective_from,effective_until,updated_by) "+
      "VALUES($1,$2,$3,$4,'VND',$5,$6,$7,$8,$9,$10) RETURNING id::text AS id,revision",
      [row.sku_cong_ty,row.price_kind,row.customer_id,row.amount_vnd,row.vat_included,
       row.vat_rate_bps,row.source_document,row.effective_from,row.effective_until,actor.subject]);
     entryId=saved.rows[0].id;newRevision=saved.rows[0].revision;
    }else{
     const saved=await c.query(
      "UPDATE fbmn_catalog_private.pricebook_entries SET amount_vnd=$1,vat_included=$2,"+
      "vat_rate_bps=$3,source_document=$4,effective_until=$5,revision=revision+1,"+
      "updated_by=$6,updated_at=now() WHERE id=$7 AND revision=$8 AND approval_state='draft' "+
      "RETURNING revision",
      [row.amount_vnd,row.vat_included,row.vat_rate_bps,row.source_document,row.effective_until,
       actor.subject,row.entry_id,row.expected_revision]);
     if(saved.rowCount!==1)throw Error("stale_preview");
     newRevision=saved.rows[0].revision;
    }
    await c.query("INSERT INTO fbmn_catalog_private.pricebook_audit "+
     "(entry_id,actor_subject,action,old_revision,new_revision,old_amount_vnd,new_amount_vnd,"+
     "old_vat_included,new_vat_included,source_document,batch_id) "+
     "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
     [entryId,actor.subject,row.status==="new"?"create_draft":"update_draft",
      row.expected_revision,newRevision,row.status==="new"?null:row.old_amount_vnd,
      row.amount_vnd,row.status==="new"?null:state.entries.find(e=>e.id===entryId)?.vat_included,
      row.vat_included,row.source_document,input.request_id]);
   }
   return {created_count:result.created,updated_count:result.updated,
    unchanged_count:result.unchanged,rows_total:rows.length,replayed:false,
    publicly_published:false};
  });
  return reply(200,response);
 }catch(e){
  if(["stale_preview","invalid_rows","idempotency_conflict","pricebook_conflict"].includes(e?.message)||
   ["23503","23505","23514","40001"].includes(e?.code))
   return error(409,e.message==="invalid_rows"?"invalid_rows":"pricebook_conflict");
  return error(503,"pricebook_unavailable");
 }
}
