// L03 owner-only bulk update against a USER-DEFINED price list, not a hardcoded price kind.
// A dry-run fingerprint is bound to the exact list, rows, VAT basis and existing revisions.
const NS="fbmn_catalog_private";
const uuid=s=>typeof s==="string"&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(s);
const date=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&
 !Number.isNaN(Date.parse(s))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
const money=s=>typeof s==="string"&&/^(0|[1-9][0-9]{0,12})$/.test(s)&&BigInt(s)<=1000000000000n;
const res=(status,data)=>Response.json(status===200?{data}:{error:{code:data}},{status,headers:{"Cache-Control":"private, no-store"}});
const today=()=>{
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Ho_Chi_Minh",
  year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const at=key=>parts.find(p=>p.type===key)?.value;
 return at("year")+"-"+at("month")+"-"+at("day");
};
function invalid(input){
 if(!input||!uuid(input.list_id)||!Array.isArray(input.rows)||input.rows.length<1||
  input.rows.length>1000||!date(input.valid_from)||input.valid_until!==null&&
  input.valid_until!==undefined&&(!date(input.valid_until)||input.valid_until<input.valid_from)||
  typeof input.source_document!=="string"||input.source_document.trim().length<1||
  input.source_document.length>300||
  input.vat_included!==null&&input.vat_included!==undefined&&
  typeof input.vat_included!=="boolean")return "invalid_bulk_input";
 if(input.rows.some(r=>!r||!Number.isInteger(r.line)||r.line<2||r.line>2000||
  typeof r.sku_cong_ty!=="string"||r.sku_cong_ty.length>80||
  typeof r.amount_vnd!=="string"||r.amount_vnd.length>32))return "invalid_bulk_row";
 return null;
}
async function fingerprint(input,revision,changes){
 const canonical=JSON.stringify({list_id:input.list_id,list_revision:revision,
  source_document:input.source_document,valid_from:input.valid_from,
  valid_until:input.valid_until??null,vat_included:input.vat_included??null,
  rows:changes.map(r=>[r.line,r.sku_cong_ty,r.amount_vnd,r.status,r.old_amount_vnd,
   r.old_revision,r.vat_included,r.valid_until,r.issue])});
 const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical));
 return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function inspect(c,input,lock){
 const list=await c.query("SELECT id::text,list_code,list_name,approval_state,revision,valid_from::text,valid_until::text "+
  "FROM "+NS+".managed_price_lists WHERE id=$1"+(lock?" FOR UPDATE":""),[input.list_id]);
 if(list.rowCount!==1)return {error:"price_list_not_found"};
 const target=list.rows[0];
 if(target.approval_state!=="draft")return {error:"list_not_editable"};
 if(input.valid_from<target.valid_from||
  target.valid_until!==null&&(input.valid_from>target.valid_until||
   input.valid_until!==null&&input.valid_until!==undefined&&input.valid_until>target.valid_until))
  return {error:"period_outside_price_list"};
 const keys=[...new Set(input.rows.map(r=>r.sku_cong_ty).filter(Boolean))];
 const skus=await c.query("SELECT sku_cong_ty,ten_san_pham,ten_goc_xnt "+
  "FROM fbmn_catalog.skus WHERE sku_cong_ty=ANY($1::text[])",[keys]);
 const names=new Map(skus.rows.map(r=>[r.sku_cong_ty,r.ten_san_pham||r.ten_goc_xnt||null]));
 const old=await c.query("SELECT DISTINCT ON (sku_cong_ty) "+
  "id::text,sku_cong_ty,amount_vnd::text,vat_included,revision,approval_state,valid_from::text,valid_until::text "+
  "FROM "+NS+".managed_price_list_prices "+
  "WHERE list_id=$1 AND sku_cong_ty=ANY($2::text[]) AND valid_from<=$3::date "+
  "ORDER BY sku_cong_ty,valid_from DESC",[input.list_id,keys,input.valid_from]);
 const existing=new Map(old.rows.map(r=>[r.sku_cong_ty,r]));
 // A prior approved historical price is immutable, but may have expired.
 // Reject only approved periods that actually overlap the incoming period.
 const approved=await c.query("SELECT sku_cong_ty,valid_from::text,valid_until::text "+
  "FROM "+NS+".managed_price_list_prices "+
  "WHERE list_id=$1 AND sku_cong_ty=ANY($2::text[]) AND approval_state='approved' "+
  "AND daterange(valid_from,valid_until,'[]') && daterange($3::date,$4::date,'[]')",[
   input.list_id,keys,input.valid_from,input.valid_until??null]);
 const approvedBySku=new Map();
 for(const r of approved.rows){
  if(!approvedBySku.has(r.sku_cong_ty))approvedBySku.set(r.sku_cong_ty,[]);
  approvedBySku.get(r.sku_cong_ty).push(r);
 }
 const seen=new Set();
 const changes=input.rows.map(r=>{
  const sku=r.sku_cong_ty,amount=r.amount_vnd.trim(),before=existing.get(sku)||null;
  const vat=typeof input.vat_included==="boolean"?input.vat_included:
   typeof before?.vat_included==="boolean"?before.vat_included:null;
  // An exact-period price owns its own expiry. Excel is only changing the
  // amount/VAT, never extending the record to the parent list's expiry.
  const until=before?.valid_from===input.valid_from?
   before.valid_until??null:input.valid_until??null;
  const overlaps=(approvedBySku.get(sku)||[]).some(p=>
   p.valid_from<=(until??"9999-12-31")&&
   (p.valid_until===null||p.valid_until>=input.valid_from));
  let status="new",issue=null;
  if(!sku||!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/.test(sku))issue="invalid_sku";
  else if(seen.has(sku))issue="duplicate_sku";
  else if(!names.has(sku))issue="sku_not_found";
  else if(amount==="")status="skipped";
  else if(!money(amount))issue="invalid_amount";
  else if(overlaps)issue="approved_price_locked";
  else if(vat===null)issue="vat_required";
  else if(before&&before.valid_from===input.valid_from&&before.amount_vnd===amount&&
   before.vat_included===vat)status="unchanged";
  else if(before?.valid_from===input.valid_from)status="updated";
  if(sku)seen.add(sku);
  if(issue)status="invalid";
  return {line:r.line,sku_cong_ty:sku,ten_san_pham:names.get(sku)||null,
   amount_vnd:amount,old_amount_vnd:before?.amount_vnd??null,
   old_revision:before?.revision??null,vat_included:vat,valid_until:until,status,issue};
 });
 const invalidCount=changes.filter(r=>r.status==="invalid").length;
 const created=changes.filter(r=>r.status==="new").length;
 const updated=changes.filter(r=>r.status==="updated").length;
 const unchanged=changes.filter(r=>r.status==="unchanged").length;
 const skipped=changes.filter(r=>r.status==="skipped").length;
 const hash=await fingerprint(input,target.revision,changes);
 return {target,changes,invalid:invalidCount,created,updated,unchanged,skipped,
  preview_fingerprint:hash};
}
async function transaction(db,fn){
 return db(async c=>{
  await c.query("BEGIN");
  try{const result=await fn(c);await c.query("COMMIT");return result;}
  catch(e){await c.query("ROLLBACK");throw e;}
 });
}
export async function handleManagedPriceImport({action,input,actor,db}){
 if(actor?.role!=="owner")return res(403,"owner_required");
 const bad=invalid(input);if(bad)return res(400,bad);
 if(action!=="bulk-preview"&&action!=="bulk-apply")return res(404,"not_found");
 if(action==="bulk-apply"&&(!/^[0-9a-f]{64}$/.test(input.preview_fingerprint||"")||
  input.confirm!=="XAC_NHAN_GIA_NHAP"))return res(400,"missing_confirmation");
 // Deliberately fake UAT files must never write actual production prices.
 if(action==="bulk-apply"&&/TEST|KHONG_AP_DUNG/i.test(input.source_document))
  return res(409,"test_file_preview_only");
 try{
  if(action==="bulk-preview"){
   const preview=await db(c=>inspect(c,input,false));
   return preview.error?res(409,preview.error):res(200,preview);
  }
  const result=await transaction(db,async c=>{
   const preview=await inspect(c,input,true);
   if(preview.error)throw Error(preview.error);
   if(preview.invalid||preview.created+preview.updated===0||
    preview.preview_fingerprint!==input.preview_fingerprint)
    throw Error("preview_stale");
   const modified=preview.changes.filter(r=>r.status==="new"||r.status==="updated");
   const writeRows=modified.map(r=>({
    sku:r.sku_cong_ty,amount:r.amount_vnd,vat:r.vat_included,
    until_date:r.valid_until
   }));
   const saved=await c.query("INSERT INTO "+NS+".managed_price_list_prices "+
    "(list_id,sku_cong_ty,amount_vnd,vat_included,source_document,valid_from,valid_until,updated_by) "+
    "SELECT $1::uuid,rec.sku,rec.amount::bigint,rec.vat::boolean,$3,$4::date,"+
    "rec.until_date::date,$5 "+
    "FROM jsonb_to_recordset($2::jsonb) AS rec(sku text,amount text,vat boolean,until_date text) "+
    "ON CONFLICT (list_id,sku_cong_ty,valid_from) DO UPDATE SET "+
    "amount_vnd=EXCLUDED.amount_vnd,vat_included=EXCLUDED.vat_included,"+
    "source_document=EXCLUDED.source_document,valid_until=EXCLUDED.valid_until,"+
    "revision=managed_price_list_prices.revision+1,"+
    "updated_by=EXCLUDED.updated_by,updated_at=now() "+
    "WHERE "+NS+".managed_price_list_prices.approval_state='draft' "+
    "RETURNING id::text,sku_cong_ty",[
     input.list_id,JSON.stringify(writeRows),input.source_document,input.valid_from,
     actor.subject]);
   if(saved.rowCount!==modified.length)throw Error("preview_stale");
   const ids=new Map(saved.rows.map(r=>[r.sku_cong_ty,r.id]));
   const audit=modified.map(r=>({
    price_id:ids.get(r.sku_cong_ty),action:r.status==="new"?"price.create":"price.update",
    old_value:r.old_amount_vnd===null?null:{sku_cong_ty:r.sku_cong_ty,
     amount_vnd:r.old_amount_vnd,revision:r.old_revision},
    new_value:{sku_cong_ty:r.sku_cong_ty,amount_vnd:r.amount_vnd,
     vat_included:r.vat_included,source_document:input.source_document,
     valid_from:input.valid_from,valid_until:r.valid_until}
   }));
   await c.query("INSERT INTO "+NS+".managed_price_audit "+
    "(actor_subject,action,list_id,price_id,old_value,new_value) "+
    "SELECT $1,row.action,$2::uuid,row.price_id::uuid,row.old_value,row.new_value "+
    "FROM jsonb_to_recordset($3::jsonb) AS row("+
    "price_id text,action text,old_value jsonb,new_value jsonb)",[
     actor.subject,input.list_id,JSON.stringify(audit)]);
   return {created:preview.created,updated:preview.updated,
    unchanged:preview.unchanged,skipped:preview.skipped,applied:modified.length,
    list_code:preview.target.list_code};
  });
  return res(200,result);
 }catch(e){
  const code=e instanceof Error?e.message:"";
  return res(["preview_stale","list_not_editable","price_list_not_found","period_outside_price_list"].includes(code)?409:503,
   ["preview_stale","list_not_editable","price_list_not_found","period_outside_price_list"].includes(code)?code:"managed_bulk_unavailable");
 }
}
