// DL4: Owner-only, revisioned Website homepage layout. Never updates SKU records.
const TABLE="fbmn_catalog_private.web_home_layout";
const AUDIT="fbmn_catalog_private.web_home_layout_audit";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const ok=data=>Response.json({data},{headers:HEADERS});
const fail=(status,code)=>Response.json({error:{code}},{status,headers:HEADERS});
export const DEFAULT_HOME_LAYOUT=Object.freeze({
 categoryIds:[],featuredSkus:[],categoryLimit:6,productLimit:4,
 sectionOrder:["categories","products"],revision:1
});
const LAYOUT_SQL="SELECT category_ids,featured_skus,category_limit,product_limit,section_order,revision FROM "+TABLE+" WHERE singleton=true";
const ELIGIBLE_SQL="SELECT s.sku_cong_ty AS sku, COALESCE(NULLIF(BTRIM(s.ten_san_pham),''),"+
 "NULLIF(BTRIM(s.ten_goc_xnt),''),s.sku_cong_ty) AS name,"+
 "s.category_id::text AS category_id,c.category_label,s.family_id::text AS family_id FROM fbmn_catalog.skus s "+
 "JOIN fbmn_catalog.publications p ON p.sku_cong_ty=s.sku_cong_ty "+
 "LEFT JOIN fbmn_catalog.categories c ON c.id=s.category_id "+
 "WHERE p.channel_code='public_web' AND p.state='published' AND p.published_at IS NOT NULL "+
 "ORDER BY s.sku_cong_ty LIMIT 10001";
function fromRow(row){
 if(!row)throw Error("layout_missing");
 return {categoryIds:row.category_ids,featuredSkus:row.featured_skus,
  categoryLimit:Number(row.category_limit),productLimit:Number(row.product_limit),
  sectionOrder:row.section_order,revision:Number(row.revision)};
}
/**
 * Mirrors Public P5 grouping: a published family (up to 100 SKUs per card)
 * has a single category, even if member SKUs were assigned different ones.
 * The fallback uncategorized slot upgrades to the first real category.
 * Admin must not offer categories which have no actual Website cards.
 */
export function eligibleHomeLayout(rows){
 if(rows.length>10000)throw Error("too_many_skus");
 const labels=new Map(),groups=new Map(),counts=new Map();
 for(const row of rows){
  const sku=String(row.sku);
  const categoryId=row.category_id?"p5-"+String(row.category_id):"p5-uncategorized";
  labels.set(categoryId,String(row.category_label||"Chưa phân loại"));
  const key=row.family_id?"family:"+String(row.family_id):"sku:"+sku;
  const count=counts.get(key)??0;
  counts.set(key,count+1);
  const pageKey=key+"|part:"+Math.floor(count/100);
  let group=groups.get(pageKey);
  if(!group){
   group={categoryId,skus:[]};
   groups.set(pageKey,group);
  }
  if(row.category_id&&group.categoryId==="p5-uncategorized")group.categoryId=categoryId;
  group.skus.push({sku,name:String(row.name)});
 }
 const categories=new Map(),skus=[];
 for(const group of groups.values()){
  const id=group.categoryId;
  const existing=categories.get(id);
  if(existing)existing.productCount++;
  else categories.set(id,{id,name:labels.get(id)||"Chưa phân loại",productCount:1});
  for(const item of group.skus)skus.push({...item,categoryId:id});
 }
 return {categories:[...categories.values()].sort((a,b)=>
  a.name.localeCompare(b.name,"vi")||a.id.localeCompare(b.id)),skus};
}
function uniqueStrings(x,max,length){
 return Array.isArray(x)&&x.length<=max&&x.every(v=>
  typeof v==="string"&&v.length>0&&v.length<=length&&v.trim()===v&&
  !/[\x00-\x1f\x7f]/.test(v))&&new Set(x).size===x.length;
}
export function validateHomeLayout(input,available){
 if(!input||typeof input!=="object"||Array.isArray(input)||
  !uniqueStrings(input.categoryIds,6,80)||
  !uniqueStrings(input.featuredSkus,12,100)||
  !Number.isSafeInteger(input.categoryLimit)||input.categoryLimit<1||input.categoryLimit>6||
  !Number.isSafeInteger(input.productLimit)||input.productLimit<1||input.productLimit>12||
  !Array.isArray(input.sectionOrder)||input.sectionOrder.length!==2||
  new Set(input.sectionOrder).size!==2||
  !input.sectionOrder.includes("categories")||!input.sectionOrder.includes("products")||
  !Number.isSafeInteger(input.revision)||input.revision<1
 )return false;
 const categories=new Set(available.categories.map(c=>c.id));
 const skus=new Set(available.skus.map(s=>s.sku));
 return input.categoryIds.every(id=>categories.has(id))&&
  input.featuredSkus.every(sku=>skus.has(sku));
}
async function readBody(request){
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json"||
  Number(request.headers.get("content-length")||0)>15000)return null;
 const text=await request.text();
 if(text.length>15000)return null;
 try{return JSON.parse(text)}catch{return null;}
}
export async function handleHomeLayout({request,actor,db}){
 const url=new URL(request.url);
 if(url.pathname!=="/v1/admin/website/home-layout")return fail(404,"not_found");
 if(url.search)return fail(400,"invalid_query");
 if(!["GET","POST"].includes(request.method))return fail(405,"method_not_allowed");
 if(typeof db!=="function")return fail(503,"layout_unavailable");
 try{
  if(request.method==="GET"){
   const result=await db(async client=>{
    const [layout,eligible]=await Promise.all([client.query(LAYOUT_SQL),client.query(ELIGIBLE_SQL)]);
    return {layout:fromRow(layout.rows[0]),available:eligibleHomeLayout(eligible.rows)};
   });
   return ok(result);
  }
  const body=await readBody(request);
  if(!body||typeof body!=="object"||Array.isArray(body))return fail(400,"invalid_layout");
  if(body.operation!=="save"&&body.operation!=="reset")return fail(400,"invalid_layout");
  if(!Number.isSafeInteger(body.revision)||body.revision<1)return fail(400,"invalid_layout");
  const saved=await db(async client=>{
   await client.query("BEGIN");
   try{
    const before=fromRow((await client.query(LAYOUT_SQL)).rows[0]);
    if(before.revision!==body.revision)throw Error("revision_conflict");
    const selected=body.operation==="reset"?{...DEFAULT_HOME_LAYOUT,revision:body.revision}:body;
    const available=eligibleHomeLayout((await client.query(ELIGIBLE_SQL)).rows);
    if(!validateHomeLayout(selected,available))throw Error("invalid_layout");
    const args=[selected.categoryIds,selected.featuredSkus,selected.categoryLimit,
      selected.productLimit,selected.sectionOrder,body.revision,actor.subject];
    const updated=await client.query("UPDATE "+TABLE+" SET category_ids=$1,featured_skus=$2,"+
     "category_limit=$3,product_limit=$4,section_order=$5,revision=revision+1,"+
     "updated_by=$7,updated_at=now() WHERE singleton=true AND revision=$6 "+
     "RETURNING category_ids,featured_skus,category_limit,product_limit,section_order,revision",args);
    if(updated.rows.length!==1)throw Error("revision_conflict");
    const after=fromRow(updated.rows[0]);
    await client.query("INSERT INTO "+AUDIT+
      "(revision,actor_subject,operation,before_data,after_data) "+
      "VALUES($1,$2,$3,$4::jsonb,$5::jsonb)",
      [after.revision,actor.subject,body.operation,JSON.stringify(before),JSON.stringify(after)]);
    await client.query("COMMIT");
    return after;
   }catch(error){await client.query("ROLLBACK");throw error;}
  });
  return ok({layout:saved});
 }catch(error){
  if(error?.message==="revision_conflict")return fail(409,"revision_conflict");
  if(error?.message==="invalid_layout")return fail(400,"invalid_layout");
  return fail(503,"layout_unavailable");
 }
}
