// ADM-06 private draft catalogue service. Exact company SKU text is immutable.
// Never store NET, stock, private image source or publish from these endpoints.
const roles = new Set(["owner","admin","editor"]);
const reply = (status, data) => new Response(JSON.stringify(data), {status,headers:{
  "Content-Type":"application/json","Cache-Control":"private, no-store",
  "X-Content-Type-Options":"nosniff"
}});
const fail = (code,status=400) => reply(status,{error:{code}});
const validSku = x => typeof x==="string" && x.length>0 && x.length<=80 &&
  x.trim()===x && !/[^\P{Cc}]/u.test(x);
const validText = (x,max=500) => x===undefined || x===null ||
  (typeof x==="string" && x.length<=max && !Array.from(x).some(char=>char.charCodeAt(0)<32 && ![9,10,13].includes(char.charCodeAt(0))));
const uuid = x => typeof x==="string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const SPEC_FIELDS = new Set(["pages","ruling","gsm","cover_type","unit","packaging","units_per_pack"]);
export function safeProductSpec(spec) {
  if(spec===undefined)return {};
  if(!spec || typeof spec!=="object" || Array.isArray(spec))throw Error("invalid_product_spec");
  const out={};
  for(const [key,value] of Object.entries(spec)){
    if(!SPEC_FIELDS.has(key) || !(value===null || (typeof value==="string" && validText(value,["pages","ruling"].includes(key)?1200:160))))
      throw Error("invalid_product_spec");
    if(value!==null && key==="gsm" && value!=="" && !/^\d{1,4}(?:\.\d{1,2})?$/.test(value))
      throw Error("invalid_product_spec");
    if(value!==null && key==="units_per_pack" && value!=="" && !/^[1-9]\d{0,4}$/.test(value))
      throw Error("invalid_product_spec");
    out[key]=value===""?null:value;
  }
  return out;
}
const validCategory = value => value===undefined || value===null || uuid(value);
const needsReview = new Set(["negative_stock","stock_snapshot_missing",
  "packaging_promotion_review","similar_sku_review","regional_channel_review",
  "shared_media_review","source_spec_conflict","suspected_company_code",
  "merged_pdf_price_cell_verify"]);
export function safeDraft(row) {
  if(!row || typeof row!=="object" || !validSku(row.sku_cong_ty)) throw Error("invalid_sku");
  for(const name of ["ten_san_pham","ten_goc_xnt","barcode","paper_size","pages","ruling"])
    if(!validText(row[name],1200))throw Error("invalid_field");
  if(!(row.ten_san_pham?.trim()||row.ten_goc_xnt?.trim()))throw Error("missing_name");
  if(!validCategory(row.category_id))throw Error("invalid_category");
  const product_spec=safeProductSpec(row.product_spec);
  if(row.warnings!==undefined && (!Array.isArray(row.warnings) ||
    row.warnings.length>30 || row.warnings.some(x=>!validText(x,80))))
    throw Error("invalid_warning_codes");
  return {
    sku_cong_ty:row.sku_cong_ty,ten_san_pham:row.ten_san_pham||null,
    ten_goc_xnt:row.ten_goc_xnt||null,barcode:row.barcode||null,
    paper_size:row.paper_size||null,pages:row.pages||null,ruling:row.ruling||null,
    category_id:row.category_id??null,product_spec,
    warnings:row.warnings||[],
    review_status:(row.warnings||[]).some(x=>needsReview.has(x))?"needs_review":"draft"
  };
}
const rowsSql = "SELECT s.sku_cong_ty,s.ten_goc_xnt,s.ten_goc_bang_gia,s.ten_san_pham,s.barcode,s.paper_size,s.product_spec,"+
  "s.review_status,s.revision,s.family_id,f.family_label,s.category_id,c.category_label FROM fbmn_catalog.skus s "+
  "LEFT JOIN fbmn_catalog.families f ON f.id=s.family_id "+
  "LEFT JOIN fbmn_catalog.categories c ON c.id=s.category_id ORDER BY s.sku_cong_ty LIMIT 20000";
async function transactional(db,work) {
  return db(async c=>{await c.query("BEGIN");try{
    const data=await work(c);await c.query("COMMIT");return data;
  }catch(e){await c.query("ROLLBACK");throw e;}});
}
const audit=(c,subject,action,data)=>c.query(
  "INSERT INTO fbmn_catalog.audit_events(actor_subject,operation,after_json) VALUES($1,$2,$3::jsonb)",
  [subject,action,JSON.stringify(data)]);
async function parsed(request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))throw Error("invalid_type");
  const length=Number(request.headers.get("content-length")||0);
  if(length>650000)throw Error("too_large");
  const body=await request.text();
  if(body.length>650000)throw Error("too_large");
  return JSON.parse(body);
}
export async function handleCatalogue({request,actor,db}) {
  const url=new URL(request.url);
  const route=url.pathname.slice("/v1/admin/catalogue/".length);
  if(!["snapshot","skus","families","categories","apply","sync","group"].includes(route))
    return fail("not_found",404);
  if(!roles.has(actor?.role))return fail("forbidden",403);
  if(url.search)return fail("invalid_query");
  if(!db)return fail("catalogue_db_unavailable",503);
  if(!["GET","POST","PATCH"].includes(request.method))return fail("method_not_allowed",405);
  if(["apply","sync","group"].includes(route) && actor.role!=="owner")
    return fail("owner_required",403);
  if(request.method==="GET"){
    if(!["snapshot","skus","families","categories"].includes(route))return fail("method_not_allowed",405);
    try{
      const sql=route==="families"?
        "SELECT id::text AS id,family_label,revision FROM fbmn_catalog.families ORDER BY family_label LIMIT 3000":
        route==="categories"?
        "SELECT id::text AS id,parent_id::text AS parent_id,category_label FROM fbmn_catalog.categories ORDER BY category_label LIMIT 1000":
        rowsSql;
      const result=await db(c=>c.query(sql));
      return reply(200,{data:{items:result.rows,database_queried:true}});
    }catch{return fail("catalogue_db_unavailable",503);}
  }
  let input;
  try{input=await parsed(request);}catch{return fail("invalid_body");}
  try{
    if(route==="apply" && request.method==="POST"){
      if(input?.confirm!=="NHAP_BAN_NHAP" || !Array.isArray(input?.rows) ||
        !input.rows.length || input.rows.length>1000 || input.expectedCreate!==input.rows.length)
        return fail("owner_confirmation_required");
      const records=input.rows.map(safeDraft);
      const keys=records.map(x=>x.sku_cong_ty.toUpperCase());
      if(new Set(keys).size!==keys.length)return fail("duplicate_company_sku",409);
      const count=await transactional(db,async c=>{
        const existing=await c.query(
          "SELECT sku_cong_ty FROM fbmn_catalog.skus WHERE upper(sku_cong_ty)=ANY($1::text[])",
          [keys]);
        if(existing.rowCount)throw Error("catalogue_conflict");
        const sql="INSERT INTO fbmn_catalog.skus "+
          "(sku_cong_ty,ten_goc_xnt,ten_san_pham,barcode,paper_size,product_spec,evidence,review_status) "+
          "SELECT x.sku_cong_ty,x.ten_goc_xnt,x.ten_san_pham,x.barcode,x.paper_size, "+
          "jsonb_build_object('pages',x.pages,'ruling',x.ruling), "+
          "jsonb_build_object('warnings',x.warnings,'source','owner_file_approved'),x.review_status "+
          "FROM jsonb_to_recordset($1::jsonb) AS x(sku_cong_ty text,ten_goc_xnt text, "+
          "ten_san_pham text,barcode text,paper_size text,pages text,ruling text, "+
          "warnings jsonb,review_status text) RETURNING sku_cong_ty";
        const saved=await c.query(sql,[JSON.stringify(records)]);
        if(saved.rowCount!==records.length)throw Error("catalogue_conflict");
        await audit(c,actor.subject,"draft_import",{count:saved.rowCount,published:false});
        return saved.rowCount;
      });
      return reply(201,{data:{drafts_saved:count,published:0}});
    }
    if(route==="sync" && request.method==="POST"){
      // Server-only one-sheet sync. Revalidated by Next against a fresh DB snapshot.
      // Here the exact company SKU is immutable; transactional revisions prevent TOCTOU writes.
      const ops=input?.operations;
      if(input?.confirm!=="SYNC_SAN_PHAM"||!Array.isArray(ops)||
         ops.length<1||ops.length>1000 ||
         !Number.isSafeInteger(input.expectedCreate)||!Number.isSafeInteger(input.expectedUpdate)||
         input.expectedCreate<0||input.expectedUpdate<0||
         input.expectedCreate+input.expectedUpdate!==ops.length)
        return fail("invalid_sync_request");
      let createRows=[],updateRows=[];
      try{
        const seen=new Set();
        for(const op of ops){
          if(!validSku(op?.sku_cong_ty)||!["create","update"].includes(op.kind))
            throw Error("invalid_sync");
          const key=op.sku_cong_ty.toUpperCase();
          if(seen.has(key))throw Error("duplicate_company_sku");
          seen.add(key);
          if(op.kind==="create"){
            const row=safeDraft(op);
            createRows.push(row);
          }else{
            if(!Number.isSafeInteger(op.expected_revision)||op.expected_revision<1||
               !op.changes||typeof op.changes!=="object"||Array.isArray(op.changes))
              throw Error("invalid_sync");
            const keys=Object.keys(op.changes);
            if(!keys.length || keys.some(k=>!["ten_san_pham","barcode","paper_size","product_spec","category_id"].includes(k)))
              throw Error("invalid_sync");
            // Name must always be populated. Barcode, paper size and category
            // may only be cleared via an explicit null, never silently by blank.
            for(const key of ["ten_san_pham","barcode","paper_size"]){
              if(!(key in op.changes))continue;
              const value=op.changes[key];
              if(key!=="ten_san_pham"&&value===null)continue;
              if(typeof value!=="string"||!value.trim()||!validText(value,1200))
                throw Error("invalid_sync");
            }
            if("category_id" in op.changes&&!validCategory(op.changes.category_id))
              throw Error("invalid_category");
            const specs=("product_spec" in op.changes)?safeProductSpec(op.changes.product_spec):{};
            if("product_spec" in op.changes && !Object.keys(specs).length)
              throw Error("invalid_sync");
            updateRows.push({sku_cong_ty:op.sku_cong_ty,
              expected_revision:op.expected_revision,
              changes:{...op.changes,...("product_spec" in op.changes?{product_spec:specs}:{})}});
          }
        }
      }catch{return fail("invalid_sync_request");}
      if(createRows.length!==input.expectedCreate||updateRows.length!==input.expectedUpdate)
        return fail("invalid_sync_request");
      const result=await transactional(db,async c=>{
        const categoryIds=[...new Set([
          ...createRows.map(row=>row.category_id),
          ...updateRows.map(row=>row.changes.category_id)
        ].filter(Boolean))];
        if(categoryIds.length){
          const found=await c.query(
            "SELECT id::text FROM fbmn_catalog.categories WHERE id::text=ANY($1::text[])",
            [categoryIds]);
          if(found.rowCount!==categoryIds.length)throw Error("invalid_category");
        }
        if(updateRows.length){
          const saved=await c.query(
            "UPDATE fbmn_catalog.skus s SET "+
            "ten_san_pham=CASE WHEN x.changes ? 'ten_san_pham' THEN x.changes->>'ten_san_pham' ELSE s.ten_san_pham END,"+
            "barcode=CASE WHEN x.changes ? 'barcode' THEN x.changes->>'barcode' ELSE s.barcode END,"+
            "paper_size=CASE WHEN x.changes ? 'paper_size' THEN x.changes->>'paper_size' ELSE s.paper_size END,"+
            "category_id=CASE WHEN x.changes ? 'category_id' THEN (x.changes->>'category_id')::uuid ELSE s.category_id END,"+
            "product_spec=s.product_spec || COALESCE(x.changes->'product_spec','{}'::jsonb),"+
            "revision=s.revision+1,updated_at=now() "+
            "FROM jsonb_to_recordset($1::jsonb) AS x(sku_cong_ty text,expected_revision integer,changes jsonb) "+
            "WHERE s.sku_cong_ty=x.sku_cong_ty AND s.revision=x.expected_revision "+
            "AND s.review_status IN ('draft','needs_review') RETURNING s.sku_cong_ty",
            [JSON.stringify(updateRows)]);
          if(saved.rowCount!==updateRows.length)throw Error("catalogue_conflict");
        }
        if(createRows.length){
          const saved=await c.query(
            "INSERT INTO fbmn_catalog.skus "+
            "(sku_cong_ty,ten_san_pham,barcode,paper_size,product_spec,category_id,review_status) "+
            "SELECT x.sku_cong_ty,x.ten_san_pham,x.barcode,x.paper_size,x.product_spec,x.category_id,'draft' "+
            "FROM jsonb_to_recordset($1::jsonb) AS x(sku_cong_ty text,ten_san_pham text,"+
            "barcode text,paper_size text,product_spec jsonb,category_id uuid) RETURNING sku_cong_ty",
            [JSON.stringify(createRows)]);
          if(saved.rowCount!==createRows.length)throw Error("catalogue_conflict");
        }
        await audit(c,actor.subject,"one_sheet_sync",{
          created:createRows.length,updated:updateRows.length,published:false});
        return {created:createRows.length,updated:updateRows.length,published:0};
      });
      return reply(201,{data:result});
    }
    if(route==="skus" && request.method==="POST"){
      const row=safeDraft(input);
      const result=await transactional(db,async c=>{
        if(row.category_id){
          const selected=await c.query("SELECT id FROM fbmn_catalog.categories WHERE id=$1",[row.category_id]);
          if(!selected.rowCount)throw Error("invalid_category");
        }
        const saved=await c.query(
          "INSERT INTO fbmn_catalog.skus(sku_cong_ty,ten_goc_xnt,ten_san_pham,barcode,paper_size,review_status,category_id,product_spec) "+
          "VALUES($1,$2,$3,$4,$5,'draft',$6,$7::jsonb) RETURNING sku_cong_ty",
          [row.sku_cong_ty,row.ten_goc_xnt,row.ten_san_pham,row.barcode,row.paper_size,row.category_id,JSON.stringify(row.product_spec)]);
        await audit(c,actor.subject,"draft_create",{sku_cong_ty:row.sku_cong_ty});
        return saved.rows[0];
      });
      return reply(201,{data:result});
    }
    if(route==="skus" && request.method==="PATCH"){
      if(!validSku(input?.sku_cong_ty)||!Number.isSafeInteger(input?.expected_revision)||
         input.expected_revision<1||typeof input?.ten_san_pham!=="string"||!validText(input?.ten_san_pham,1200)||
         !["draft","needs_review","withdrawn"].includes(input.review_status) ||
         !validText(input.barcode,1200) || !validText(input.paper_size,1200) ||
         !validCategory(input.category_id))return fail("invalid_update");
      let spec;
      try{spec=safeProductSpec(input.product_spec);}catch{return fail("invalid_product_spec");}
      const has=k=>Object.prototype.hasOwnProperty.call(input,k);
      const result=await transactional(db,async c=>{
        if(input.category_id){
          const selected=await c.query("SELECT id FROM fbmn_catalog.categories WHERE id=$1",[input.category_id]);
          if(!selected.rowCount)throw Error("invalid_category");
        }
        const saved=await c.query(
          "UPDATE fbmn_catalog.skus SET ten_san_pham=NULLIF($3,''),review_status=$4,"+
          "barcode=CASE WHEN $5::boolean THEN NULLIF($6::text,'') ELSE barcode END,"+
          "paper_size=CASE WHEN $7::boolean THEN NULLIF($8::text,'') ELSE paper_size END,"+
          "category_id=CASE WHEN $9::boolean THEN $10::uuid ELSE category_id END,"+
          "product_spec=product_spec || $11::jsonb,"+
          "revision=revision+1,updated_at=now() WHERE sku_cong_ty=$1 AND revision=$2 "+
          "AND review_status IN ('draft','needs_review') "+
          "AND (NULLIF(BTRIM($3),'') IS NOT NULL OR "+
          "NULLIF(BTRIM(ten_goc_xnt),'') IS NOT NULL OR "+
          "NULLIF(BTRIM(ten_goc_bang_gia),'') IS NOT NULL) "+
          "RETURNING sku_cong_ty,revision",
          [input.sku_cong_ty,input.expected_revision,input.ten_san_pham,input.review_status,
           has("barcode"),input.barcode??null,has("paper_size"),input.paper_size??null,
           has("category_id"),input.category_id??null,JSON.stringify(spec)]);
        if(!saved.rowCount)throw Error("catalogue_conflict");
        await audit(c,actor.subject,"draft_update",{sku_cong_ty:input.sku_cong_ty});
        return saved.rows[0];
      });
      return reply(200,{data:result});
    }
    if(route==="categories" && request.method==="POST"){
      if(actor.role!=="owner")return fail("owner_required",403);
      if(typeof input?.category_label!=="string"||!input.category_label.trim()||
         !validText(input.category_label,160)||!validCategory(input.parent_id))
        return fail("invalid_category");
      const result=await transactional(db,async c=>{
        if(input.parent_id){
          const parent=await c.query(
            "SELECT id FROM fbmn_catalog.categories WHERE id=$1 AND parent_id IS NULL",
            [input.parent_id]);
          if(!parent.rowCount)throw Error("invalid_category");
        }
        const saved=await c.query(
          "INSERT INTO fbmn_catalog.categories(category_label,parent_id) VALUES($1,$2) "+
          "RETURNING id::text AS id,parent_id::text AS parent_id,category_label",
          [input.category_label.trim(),input.parent_id??null]);
        await audit(c,actor.subject,"category_create",{id:saved.rows[0].id});
        return saved.rows[0];
      });
      return reply(201,{data:result});
    }
    if(route==="families" && request.method==="POST"){
      if(typeof input?.family_label!=="string" || !input.family_label.trim()||
        !validText(input.family_label,160))return fail("invalid_family_label");
      const result=await transactional(db,async c=>{
        const saved=await c.query(
          "INSERT INTO fbmn_catalog.families(family_label) VALUES ($1) "+
          "RETURNING id::text AS id,family_label",[input.family_label.trim()]);
        await audit(c,actor.subject,"family_create",{id:saved.rows[0].id});
        return saved.rows[0];
      });
      return reply(201,{data:result});
    }
    if(route==="group" && request.method==="POST"){
      const codes=input?.sku_cong_ty;
      if(typeof input?.family_id!=="string" || !/^[0-9a-f-]{36}$/i.test(input.family_id)||
        !Array.isArray(codes)||codes.length<2||codes.length>200||
        codes.some(x=>!validSku(x))||
        new Set(codes.map(x=>x.toUpperCase())).size!==codes.length)
        return fail("invalid_family_assignment");
      const count=await transactional(db,async c=>{
        const family=await c.query("SELECT id FROM fbmn_catalog.families WHERE id=$1",
          [input.family_id]);
        if(!family.rowCount)throw Error("catalogue_conflict");
        const saved=await c.query(
          "UPDATE fbmn_catalog.skus SET family_id=$1,revision=revision+1,updated_at=now() "+
          "WHERE sku_cong_ty=ANY($2::text[]) AND review_status IN ('draft','needs_review') "+
          "RETURNING sku_cong_ty",[input.family_id,codes]);
        if(saved.rowCount!==codes.length)throw Error("catalogue_conflict");
        await audit(c,actor.subject,"family_group",{family_id:input.family_id,count:saved.rowCount});
        return saved.rowCount;
      });
      return reply(200,{data:{grouped:count,published:0}});
    }
    return fail("method_not_allowed",405);
  }catch(e){
    if(e?.message==="invalid_category")return fail("invalid_category");
    if(e?.message==="invalid_product_spec")return fail("invalid_product_spec");
    const collision=e?.message==="catalogue_conflict"||e?.code==="23505";
    return fail(collision?"catalogue_conflict":"catalogue_db_unavailable",collision?409:503);
  }
}
