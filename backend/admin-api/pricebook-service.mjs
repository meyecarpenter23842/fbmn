// G04 — private draft-only pricebook. No public, B2B or catalogue data path.
const kinds=new Set(["source","net_internal","retail_public","dealer_contract"]);
const canRead=new Set(["owner","admin","pricing"]);
const skuOk=x=>typeof x==="string"&&x.length>=1&&x.length<=80&&x.trim()===x&&!/[\x00-\x1f\x7f]/.test(x);
const uuid=x=>typeof x==="string"&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(x);
const dateOk=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&
  !Number.isNaN(Date.parse(x))&&new Date(x+"T00:00:00Z").toISOString().slice(0,10)===x;
const error=(status,code)=>Response.json({error:{code}},{status,
  headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
const reply=(status,data)=>Response.json({data},{status,
  headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
async function tx(db,fn){
  return db(async c=>{
    await c.query("BEGIN");
    try{const value=await fn(c);await c.query("COMMIT");return value;}
    catch(e){await c.query("ROLLBACK");throw e;}
  });
}
const parseBody=async request=>{
  if(request.headers.get("content-type")?.split(";")[0]!=="application/json")return null;
  if(Number(request.headers.get("content-length")||0)>4096)return null;
  const body=await request.text();
  if(body.length>4096)return null;
  try{return JSON.parse(body);}catch{return null;}
};
function validSource(x){
  return typeof x==="string"&&x.trim()===x&&x.length>=1&&x.length<=300&&
    !/[\x00-\x1f\x7f]/.test(x);
}
function validAmount(x){return Number.isSafeInteger(x)&&x>=0&&x<=1000000000000;}
function validEntry(x){
  return x&&typeof x==="object"&&!Array.isArray(x)&&
    skuOk(x.sku_cong_ty)&&kinds.has(x.price_kind)&&
    (x.price_kind==="dealer_contract"?uuid(x.customer_id):x.customer_id===null)&&
    validAmount(x.amount_vnd)&&x.currency==="VND"&&
    typeof x.vat_included==="boolean"&&
    (x.vat_rate_bps===null||Number.isInteger(x.vat_rate_bps)&&x.vat_rate_bps>=0&&x.vat_rate_bps<=10000)&&
    validSource(x.source_document)&&dateOk(x.effective_from)&&
    (x.effective_until===null||dateOk(x.effective_until)&&x.effective_until>=x.effective_from)&&
    x.confirm==="LUU_GIA_NHAP";
}
function validEdit(x){
  return x&&typeof x==="object"&&!Array.isArray(x)&&uuid(x.id)&&
    Number.isSafeInteger(x.expected_revision)&&x.expected_revision>=1&&
    validAmount(x.amount_vnd)&&typeof x.vat_included==="boolean"&&
    (x.vat_rate_bps===null||Number.isInteger(x.vat_rate_bps)&&x.vat_rate_bps>=0&&x.vat_rate_bps<=10000)&&
    validSource(x.source_document)&&
    (x.effective_until===null||dateOk(x.effective_until))&&
    x.confirm==="CAP_NHAT_GIA_NHAP";
}
export async function handlePricebook({request,actor,db}){
  if(!canRead.has(actor?.role)||typeof actor.subject!=="string")return error(403,"pricing_forbidden");
  const url=new URL(request.url);
  if(url.pathname!=="/v1/admin/pricing/entries")return error(404,"not_found");
  if(request.method==="GET"){
    if([...url.searchParams.keys()].some(k=>k!=="sku")||
      url.searchParams.getAll("sku").length!==1||!skuOk(url.searchParams.get("sku")))
      return error(400,"invalid_sku");
    try{
      const result=await db(c=>c.query(
        "SELECT id::text AS id,sku_cong_ty,price_kind,customer_id::text AS customer_id,"+
        "amount_vnd::text AS amount_vnd,currency,vat_included,vat_rate_bps,"+
        "source_document,effective_from::text AS effective_from,effective_until::text AS effective_until,"+
        "approval_state,revision FROM fbmn_catalog_private.pricebook_entries "+
        "WHERE sku_cong_ty=$1 AND (price_kind<>'dealer_contract' OR $2::boolean) "+
        "ORDER BY price_kind,customer_id,effective_from DESC LIMIT 101",
        [url.searchParams.get("sku"),actor.role==="owner"]));
      if(result.rows.length>100)return error(503,"too_many_price_versions");
      return reply(200,{entries:result.rows,currency:"VND",empty:result.rows.length===0});
    }catch{return error(503,"pricebook_unavailable");}
  }
  if(!["POST","PATCH"].includes(request.method))return error(405,"method_not_allowed");
  // Pricing role can inspect internal prices but cannot alter them.
  if(actor.role!=="owner")return error(403,"owner_required");
  if(url.search!=="")return error(400,"invalid_query");
  const input=await parseBody(request);
  if(request.method==="POST"&&!validEntry(input))return error(400,"invalid_price_draft");
  if(request.method==="PATCH"&&!validEdit(input))return error(400,"invalid_price_revision");
  try{
    if(request.method==="POST"){
      const saved=await tx(db,async c=>{
        const result=await c.query(
          "INSERT INTO fbmn_catalog_private.pricebook_entries "+
          "(sku_cong_ty,price_kind,customer_id,amount_vnd,currency,vat_included,vat_rate_bps,"+
          "source_document,effective_from,effective_until,updated_by) "+
          "VALUES($1,$2,$3,$4,'VND',$5,$6,$7,$8,$9,$10) "+
          "RETURNING id::text AS id,revision,approval_state",
          [input.sku_cong_ty,input.price_kind,input.customer_id,input.amount_vnd,
            input.vat_included,input.vat_rate_bps,input.source_document,input.effective_from,
            input.effective_until,actor.subject]);
        await c.query("INSERT INTO fbmn_catalog_private.pricebook_audit "+
          "(entry_id,actor_subject,action,old_revision,new_revision) "+
          "VALUES($1,$2,'create_draft',NULL,1)",[result.rows[0].id,actor.subject]);
        return result.rows[0];
      });
      return reply(201,saved);
    }
    const saved=await tx(db,async c=>{
      const result=await c.query(
        "UPDATE fbmn_catalog_private.pricebook_entries SET amount_vnd=$1,vat_included=$2,"+
        "vat_rate_bps=$3,source_document=$4,effective_until=$5,revision=revision+1,"+
        "updated_by=$6,updated_at=now() "+
        "WHERE id=$7 AND revision=$8 AND approval_state='draft' "+
        "AND ($5::date IS NULL OR $5::date>=effective_from) "+
        "RETURNING id::text AS id,revision,approval_state",
        [input.amount_vnd,input.vat_included,input.vat_rate_bps,input.source_document,
          input.effective_until,actor.subject,input.id,input.expected_revision]);
      if(result.rowCount!==1)throw new Error("pricebook_conflict");
      await c.query("INSERT INTO fbmn_catalog_private.pricebook_audit "+
        "(entry_id,actor_subject,action,old_revision,new_revision) "+
        "VALUES($1,$2,'update_draft',$3,$4)",
        [input.id,actor.subject,input.expected_revision,result.rows[0].revision]);
      return result.rows[0];
    });
    return reply(200,saved);
  }catch(e){
    if(e?.code==="23505"||e?.code==="23503"||e?.code==="23514"||
       e?.message==="pricebook_conflict")return error(409,"pricebook_conflict");
    return error(503,"pricebook_unavailable");
  }
}
