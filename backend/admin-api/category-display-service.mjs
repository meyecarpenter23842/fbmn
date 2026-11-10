// DL5: Owner-only category presentation preferences. SKU/Family data is immutable.
const TABLE="fbmn_catalog_private.web_category_display";
const AUDIT="fbmn_catalog_private.web_category_display_audit";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const ok=data=>Response.json({data},{headers:HEADERS});
const fail=(status,code)=>Response.json({error:{code}},{status,headers:HEADERS});
const CATEGORY=/^p5-(?:[0-9a-f-]{36}|uncategorized)$/;
const LIST_SQL="SELECT category_id,mode,revision FROM "+TABLE+" ORDER BY category_id LIMIT 2001";
const ELIGIBLE_SQL="SELECT s.category_id::text AS category_id,c.category_label FROM fbmn_catalog.skus s "+
 "JOIN fbmn_catalog.publications p ON p.sku_cong_ty=s.sku_cong_ty "+
 "LEFT JOIN fbmn_catalog.categories c ON c.id=s.category_id "+
 "WHERE p.channel_code='public_web' AND p.state='published' AND p.published_at IS NOT NULL "+
 "ORDER BY s.sku_cong_ty LIMIT 10001";
function categoriesFrom(rows){
 if(rows.length>10000)throw Error("too_many_skus");
 const categories=new Map();
 for(const row of rows){
  const categoryId=row.category_id?"p5-"+String(row.category_id):"p5-uncategorized";
  if(!CATEGORY.test(categoryId))throw Error("invalid_public_category");
  const previous=categories.get(categoryId);
  if(previous)previous.skuCount++;
  else categories.set(categoryId,{categoryId,name:String(row.category_label||"Chưa phân loại"),skuCount:1});
 }
 return [...categories.values()];
}
async function readBody(request){
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json"||
  Number(request.headers.get("content-length")||0)>3000)return null;
 const body=await request.text();if(body.length>3000)return null;
 try{return JSON.parse(body)}catch{return null;}
}
export async function handleCategoryDisplay({request,actor,db}){
 const url=new URL(request.url);
 if(url.pathname!=="/v1/admin/website/category-display")return fail(404,"not_found");
 if(url.search)return fail(400,"invalid_query");
 if(!["GET","POST"].includes(request.method))return fail(405,"method_not_allowed");
 if(typeof db!=="function")return fail(503,"display_unavailable");
 try{
  if(request.method==="GET"){
   const data=await db(async client=>{
    const [rows,eligible]=await Promise.all([client.query(LIST_SQL),client.query(ELIGIBLE_SQL)]);
    if(rows.rows.length>2000)throw Error("too_many_categories");
    const byId=new Map(rows.rows.map(row=>[String(row.category_id),row]));
    return categoriesFrom(eligible.rows).map(category=>{
     const row=byId.get(category.categoryId);
     return {...category,mode:row?.mode==="sku"?"sku":"family",revision:row?Number(row.revision):0};
    });
   });
   return ok({categories:data});
  }
  const body=await readBody(request);
  if(!body||typeof body!=="object"||Array.isArray(body)||body.operation!=="save"||
    typeof body.categoryId!=="string"||!CATEGORY.test(body.categoryId)||
    !["family","sku"].includes(body.mode)||!Number.isSafeInteger(body.revision)||body.revision<0)
    return fail(400,"invalid_display");
  const saved=await db(async client=>{
   await client.query("BEGIN");
   try{
    const available=categoriesFrom((await client.query(ELIGIBLE_SQL)).rows);
    if(!available.some(x=>x.categoryId===body.categoryId))throw Error("invalid_display");
    const old=(await client.query("SELECT mode,revision FROM "+TABLE+" WHERE category_id=$1 FOR UPDATE",[body.categoryId])).rows[0];
    const previous={categoryId:body.categoryId,mode:old?.mode??"family",revision:old?Number(old.revision):0};
    if(previous.revision!==body.revision)throw Error("revision_conflict");
    const updated=old?
      await client.query("UPDATE "+TABLE+" SET mode=$2,revision=revision+1,updated_by=$3,updated_at=now() "+
       "WHERE category_id=$1 AND revision=$4 RETURNING category_id,mode,revision",
       [body.categoryId,body.mode,actor.subject,body.revision]):
      await client.query("INSERT INTO "+TABLE+"(category_id,mode,revision,updated_by) VALUES($1,$2,1,$3) "+
       "RETURNING category_id,mode,revision",[body.categoryId,body.mode,actor.subject]);
    if(updated.rows.length!==1)throw Error("revision_conflict");
    const row=updated.rows[0];
    const after={categoryId:String(row.category_id),mode:String(row.mode),revision:Number(row.revision)};
    await client.query("INSERT INTO "+AUDIT+"(category_id,revision,actor_subject,before_data,after_data) "+
      "VALUES($1,$2,$3,$4::jsonb,$5::jsonb)",
      [after.categoryId,after.revision,actor.subject,JSON.stringify(previous),JSON.stringify(after)]);
    await client.query("COMMIT");return after;
   }catch(error){await client.query("ROLLBACK");throw error;}
  });
  return ok({category:saved});
 }catch(error){
  if(error?.message==="revision_conflict")return fail(409,"revision_conflict");
  if(error?.message==="invalid_display")return fail(400,"invalid_display");
  return fail(503,"display_unavailable");
 }
}
