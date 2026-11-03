// L03: Owner-managed, private price lists. No public or consumer API routes.
const S="fbmn_catalog_private";
const UUID=v=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const CODE=v=>typeof v==="string"&&/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(v);
const DATE=v=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&
 !Number.isNaN(Date.parse(v))&&new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;
const TEXT=(v,min,max)=>typeof v==="string"&&v===v.trim()&&v.length>=min&&v.length<=max&&
 !/[\x00-\x1f\x7f]/.test(v);
const CHANNELS=new Set(["public_web","consumer_app","dealer_app"]);
const CUSTOMER_TYPES=new Set(["distributor","dealer","bookstore","school","enterprise","factory","other"]);
const ERR=(status,code)=>Response.json({error:{code}},{status,headers:{"Cache-Control":"private, no-store"}});
const OK=data=>Response.json({data},{headers:{"Cache-Control":"private, no-store"}});
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Ho_Chi_Minh",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
async function body(request){
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json")return null;
 const text=await request.text();if(text.length>100000)return null;
 try{const value=JSON.parse(text);return value&&typeof value==="object"&&!Array.isArray(value)?value:null;}
 catch{return null;}
}
const AUDIT="INSERT INTO "+S+".managed_price_audit(actor_subject,action,list_id,price_id,old_value,new_value) "+
 "VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb)";
const snapshot=(record)=>record?JSON.stringify(record):null;
async function log(c,actor,action,id,price,previous,next){
 await c.query(AUDIT,[actor.subject,action,id||null,price||null,snapshot(previous),snapshot(next)]);
}
async function tx(db,fn){
 return db(async c=>{await c.query("BEGIN");try{
  const result=await fn(c);await c.query("COMMIT");return result;
 }catch(e){await c.query("ROLLBACK");throw e;}});
}
function validateList(input,creating=false){
 if(!input||creating&&!CODE(input.list_code)||!TEXT(input.list_name,2,120)||
  typeof input.note!=="string"||input.note.length>500||
  !["internal","consumer","dealer"].includes(input.audience)||!Array.isArray(input.channel_codes)||
  input.channel_codes.length>3||
  new Set(input.channel_codes).size!==input.channel_codes.length||
  !input.channel_codes.every(x=>CHANNELS.has(x))||
  !Number.isInteger(input.priority)||input.priority<0||input.priority>10000||
  !DATE(input.valid_from)||input.valid_until!==null&&(!DATE(input.valid_until)||input.valid_until<input.valid_from))
  return "invalid_price_list";
 const channels=input.channel_codes;
 const type=input.scope_customer_type??null,id=input.scope_customer_id??null;
 if(type!==null&&!CUSTOMER_TYPES.has(type)||id!==null&&!UUID(id)||type&&id)return "invalid_customer_scope";
 if(input.audience==="internal"&&(channels.length!==0||type||id)||
  input.audience==="consumer"&&(channels.length===0||channels.some(x=>x==="dealer_app")||type||id)||
  input.audience==="dealer"&&(channels.length!==1||channels[0]!=="dealer_app"))
  return "invalid_channel_scope";
 return null;
}
async function customerExists(c,id){
 if(!id)return true;
 const r=await c.query("SELECT id FROM futurebook.customers WHERE id=$1 AND status='active'",[id]);
 return r.rowCount===1;
}
async function getLists(db){
 const result=await db(c=>c.query("SELECT l.id::text,l.list_code,l.list_name,l.note,l.audience,"+
  "l.channel_codes,l.scope_customer_type,l.scope_customer_id::text,l.priority,"+
  "l.valid_from::text,l.valid_until::text,l.approval_state,l.revision,l.created_at::text,"+
  "c.customer_code,c.display_name AS customer_name,"+
  "(SELECT count(*)::int FROM "+S+".managed_price_list_prices p WHERE p.list_id=l.id) price_count "+
  "FROM "+S+".managed_price_lists l LEFT JOIN futurebook.customers c ON c.id=l.scope_customer_id "+
  "ORDER BY l.created_at DESC,l.list_code LIMIT 1000"));
 return OK({items:result.rows});
}
async function getCustomers(db,url){
 const keys=[...url.searchParams.keys()];
 if(keys.some(k=>k!=="q")||keys.length>1)return ERR(400,"invalid_query");
 const q=(url.searchParams.get("q")||"").trim();
 if(q.length>80)return ERR(400,"invalid_query");
 const result=await db(c=>c.query("SELECT id::text,customer_code,display_name,customer_type,status "+
  "FROM futurebook.customers WHERE (position(lower($1) in lower(customer_code))>0 "+
  "OR position(lower($1) in lower(display_name))>0) "+
  "ORDER BY CASE WHEN status='active' THEN 0 ELSE 1 END,customer_code LIMIT 60",[q]));
 return OK({items:result.rows});
}
async function createList(db,input,actor){
 const problem=validateList(input,true);if(problem)return ERR(400,problem);
 try{
  const value=await tx(db,async c=>{
   if(!await customerExists(c,input.scope_customer_id))throw Error("customer_not_found");
   const result=await c.query("INSERT INTO "+S+".managed_price_lists "+
    "(list_code,list_name,note,audience,channel_codes,scope_customer_type,scope_customer_id,priority,"+
    "valid_from,valid_until,created_by,updated_by) VALUES "+
    "($1,$2,$3,$4,$5::text[],$6,$7::uuid,$8,$9::date,$10::date,$11,$11) "+
    "RETURNING id::text,list_code,list_name,revision,approval_state",[
     input.list_code,input.list_name,input.note,input.audience,input.channel_codes,
     input.scope_customer_type||null,input.scope_customer_id||null,input.priority,
     input.valid_from,input.valid_until,actor.subject]);
   await log(c,actor,"list.create",result.rows[0].id,null,null,result.rows[0]);
   return result.rows[0];
  });return OK(value);
 }catch(e){return ERR(e?.code==="23505"?409:503,e?.code==="23505"?"duplicate_price_list_code":"price_list_write_failed");}
}
async function updateList(db,input,actor,mode){
 if(!UUID(input?.id)||!Number.isInteger(input.expected_revision)||input.expected_revision<1||
  mode==="edit"&&validateList(input))return ERR(400,"invalid_price_list_update");
 try{
  const result=await tx(db,async c=>{
   const old=await c.query("SELECT * FROM "+S+".managed_price_lists WHERE id=$1 FOR UPDATE",[input.id]);
   if(old.rowCount!==1||old.rows[0].revision!==input.expected_revision)throw Error("revision_conflict");
   const previous=old.rows[0];
   if(mode==="edit"&&previous.approval_state!=="draft")throw Error("approved_list_locked");
   if(mode==="approve"){
    if(previous.approval_state!=="draft")throw Error("approved_list_locked");
    const approved=await c.query("SELECT 1 FROM "+S+".managed_price_list_prices "+
     "WHERE list_id=$1 AND approval_state='approved' LIMIT 1",[input.id]);
    if(!approved.rowCount)throw Error("approved_price_required");
   }
   if(mode==="edit"&&!await customerExists(c,input.scope_customer_id))throw Error("customer_not_found");
   let updated;
   if(mode==="edit"){
    const query=await c.query("UPDATE "+S+".managed_price_lists SET "+
     "list_name=$1,note=$2,audience=$3,channel_codes=$4::text[],scope_customer_type=$5,"+
     "scope_customer_id=$6::uuid,priority=$7,valid_from=$8::date,valid_until=$9::date,"+
     "revision=revision+1,updated_by=$10,updated_at=now() WHERE id=$11 RETURNING *",[
      input.list_name,input.note,input.audience,input.channel_codes,input.scope_customer_type||null,
      input.scope_customer_id||null,input.priority,input.valid_from,input.valid_until,actor.subject,input.id]);
    updated=query.rows[0];
   }else{
    const next=mode==="approve"?"approved":"inactive";
    updated=(await c.query("UPDATE "+S+".managed_price_lists SET "+
     "approval_state=$1,approved_by=$2,approved_at=$3,revision=revision+1,"+
     "updated_by=$4,updated_at=now() WHERE id=$5 RETURNING *",[
      next,next==="approved"?actor.subject:null,next==="approved"?new Date().toISOString():null,
      actor.subject,input.id])).rows[0];
   }
   await log(c,actor,"list."+(mode==="edit"?"update":mode==="approve"?"approve":"deactivate"),
    input.id,null,previous,updated);
   return {id:input.id,revision:updated.revision,approval_state:updated.approval_state};
  });return OK(result);
 }catch(e){const c=e?.message;return ERR(c==="revision_conflict"||c==="approved_list_locked"||
  c==="approved_price_required"||c==="customer_not_found"?409:503,
  ["revision_conflict","approved_list_locked","approved_price_required","customer_not_found"].includes(c)?c:"price_list_write_failed");}
}
async function getPrices(db,url){
 const id=url.searchParams.get("list_id");
 if([...url.searchParams.keys()].some(k=>k!=="list_id")||!UUID(id))return ERR(400,"invalid_query");
 const result=await db(c=>c.query("SELECT p.id::text,p.list_id::text,p.sku_cong_ty,"+
  "s.ten_san_pham,s.ten_goc_xnt,p.amount_vnd::text,p.vat_included,p.source_document,"+
  "p.valid_from::text,p.valid_until::text,p.approval_state,p.revision "+
  "FROM "+S+".managed_price_list_prices p JOIN fbmn_catalog.skus s ON s.sku_cong_ty=p.sku_cong_ty "+
  "WHERE p.list_id=$1 ORDER BY p.sku_cong_ty,p.valid_from DESC LIMIT 2000",[id]));
 return OK({items:result.rows});
}
const MONEY=v=>typeof v==="string"&&/^(0|[1-9][0-9]{0,12})$/.test(v)&&BigInt(v)<=1000000000000n;
async function setPrice(db,input,actor){
 if(!UUID(input?.list_id)||!TEXT(input.sku_cong_ty,1,80)||!MONEY(input.amount_vnd)||
  typeof input.vat_included!=="boolean"||!TEXT(input.source_document,1,300)||
  !DATE(input.valid_from)||input.valid_until!==null&&(!DATE(input.valid_until)||input.valid_until<input.valid_from))
  return ERR(400,"invalid_price");
 try{
  const value=await tx(db,async c=>{
   await c.query("SELECT pg_advisory_xact_lock(hashtext($1))",["managed-price:"+input.list_id+":"+input.sku_cong_ty]);
   const list=await c.query("SELECT approval_state FROM "+S+".managed_price_lists WHERE id=$1 FOR UPDATE",[input.list_id]);
   if(list.rowCount!==1||list.rows[0].approval_state!=="draft")throw Error("list_not_editable");
   const sku=await c.query("SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE sku_cong_ty=$1",[input.sku_cong_ty]);
   if(sku.rowCount!==1)throw Error("sku_not_found");
   const previous=await c.query("SELECT * FROM "+S+".managed_price_list_prices "+
    "WHERE list_id=$1 AND sku_cong_ty=$2 AND valid_from=$3::date FOR UPDATE",[
     input.list_id,input.sku_cong_ty,input.valid_from]);
   const old=previous.rows[0]||null;
   if(old?.approval_state==="approved")throw Error("approved_price_locked");
   let updated;
   if(old){
    if(!Number.isInteger(input.expected_revision)||old.revision!==input.expected_revision)
     throw Error("revision_conflict");
    updated=(await c.query("UPDATE "+S+".managed_price_list_prices SET "+
      "amount_vnd=$1,vat_included=$2,source_document=$3,valid_until=$4::date,"+
      "revision=revision+1,updated_by=$5,updated_at=now() WHERE id=$6 RETURNING *",[
       input.amount_vnd,input.vat_included,input.source_document,input.valid_until,actor.subject,old.id])).rows[0];
   }else{
    updated=(await c.query("INSERT INTO "+S+".managed_price_list_prices "+
     "(list_id,sku_cong_ty,amount_vnd,vat_included,source_document,valid_from,valid_until,updated_by) "+
     "VALUES($1,$2,$3,$4,$5,$6::date,$7::date,$8) RETURNING *",[
      input.list_id,input.sku_cong_ty,input.amount_vnd,input.vat_included,input.source_document,
      input.valid_from,input.valid_until,actor.subject])).rows[0];
   }
   await log(c,actor,old?"price.update":"price.create",input.list_id,updated.id,old,updated);
   return {id:updated.id,revision:updated.revision,approval_state:updated.approval_state};
  });return OK(value);
 }catch(e){const code=e?.message;return ERR([
  "list_not_editable","sku_not_found","approved_price_locked","revision_conflict"].includes(code)?409:503,
  ["list_not_editable","sku_not_found","approved_price_locked","revision_conflict"].includes(code)?code:"price_write_failed");}
}
async function approvePrice(db,input,actor){
 if(!UUID(input?.id)||!Number.isInteger(input.expected_revision))return ERR(400,"invalid_approval");
 try{
  const value=await tx(db,async c=>{
   // Lock the parent price list before the item, matching the manual
   // update path so approval and deactivation cannot race.
   const target=await c.query("SELECT list_id FROM "+S+".managed_price_list_prices WHERE id=$1",[input.id]);
   if(target.rowCount!==1)throw Error("revision_conflict");
   const list=await c.query("SELECT approval_state FROM "+S+".managed_price_lists WHERE id=$1 FOR UPDATE",
    [target.rows[0].list_id]);
   if(list.rowCount!==1||list.rows[0].approval_state!=="draft")throw Error("list_not_editable");
   const old=await c.query("SELECT * FROM "+S+".managed_price_list_prices WHERE id=$1 FOR UPDATE",[input.id]);
   const p=old.rows[0];
   if(!p||p.revision!==input.expected_revision||p.approval_state!=="draft")throw Error("revision_conflict");
   const conflicts=await c.query("SELECT 1 FROM "+S+".managed_price_list_prices "+
    "WHERE id<>$1 AND list_id=$2 AND sku_cong_ty=$3 AND approval_state='approved' "+
    "AND daterange(valid_from,valid_until,'[]') && daterange($4::date,$5::date,'[]') LIMIT 1",[
     p.id,p.list_id,p.sku_cong_ty,p.valid_from,p.valid_until]);
   if(conflicts.rowCount)throw Error("approved_period_overlap");
   const updated=(await c.query("UPDATE "+S+".managed_price_list_prices SET "+
    "approval_state='approved',approved_by=$1,approved_at=now(),revision=revision+1,"+
    "updated_by=$1,updated_at=now() WHERE id=$2 RETURNING *",[actor.subject,p.id])).rows[0];
   await log(c,actor,"price.approve",p.list_id,p.id,p,updated);
   return {id:p.id,revision:updated.revision,approval_state:updated.approval_state};
  });return OK(value);
 }catch(e){const code=e?.message;return ERR(["revision_conflict","approved_period_overlap","list_not_editable"].includes(code)?409:503,
  ["revision_conflict","approved_period_overlap","list_not_editable"].includes(code)?code:"approval_failed");}
}
export async function handleManagedPriceLists({request,actor,db}){
 if(actor?.role!=="owner")return ERR(403,"owner_required");
 const u=new URL(request.url),prefix="/v1/admin/pricing/managed";
 const action=u.pathname===prefix?"":u.pathname.startsWith(prefix+"/")?
  u.pathname.slice(prefix.length+1):"unknown";
 if(request.method==="GET"){
  try{
   if(action===""&&u.search==="")return await getLists(db);
   if(action==="customers")return await getCustomers(db,u);
   if(action==="prices")return await getPrices(db,u);
   return ERR(404,"not_found");
  }catch{return ERR(503,"pricing_unavailable");}
 }
 if(request.method!=="POST"||u.search)return ERR(405,"method_not_allowed");
 const input=await body(request);if(!input)return ERR(400,"invalid_body");
 if(action==="create")return createList(db,input,actor);
 if(action==="update")return updateList(db,input,actor,"edit");
 if(action==="approve")return updateList(db,input,actor,"approve");
 if(action==="deactivate")return updateList(db,input,actor,"deactivate");
 if(action==="price")return setPrice(db,input,actor);
 if(action==="price-approve")return approvePrice(db,input,actor);
 return ERR(404,"not_found");
}
