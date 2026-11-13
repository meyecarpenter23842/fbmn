// SEO02B: authenticated Owner-only settings; public application is staged in SEO02C.
const TABLE="fbmn_catalog_private.web_seo_settings";
const AUDIT="fbmn_catalog_private.web_seo_settings_audit";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const ok=data=>Response.json({data},{headers:HEADERS});
const fail=(status,code)=>Response.json({error:{code}},{status,headers:HEADERS});
const KINDS=new Set(["product","category","article","promotion"]);
const MODES=new Set(["auto","custom","noindex"]);
const SLUG=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const validSlug=(kind,slug)=>typeof slug==="string"&&slug.length<=100&&SLUG.test(slug)&&
 (kind==="product"?/^sku-[a-f0-9]{32}$/.test(slug):
 kind==="category"?(/^cat-[a-f0-9]{32}$/.test(slug)||slug==="chua-phan-loai"):true);
const plain=(v,max)=>typeof v==="string"&&v.length<=max&&v===v.trim()&&!/[<>\x00-\x1f\x7f]/.test(v);
const validMedia=(path)=>path===null||(typeof path==="string"&&
 /^\/api\/catalogue-image\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(path));
export function parseSeoSetting(body){
 if(!body||typeof body!=="object"||Array.isArray(body)||body.operation!=="save"||
  !KINDS.has(body.kind)||!validSlug(body.kind,body.slug)||!MODES.has(body.mode)||
  !Number.isSafeInteger(body.revision)||body.revision<0||body.revision>2147483646||
  !plain(body.title,180)||!plain(body.description,400)||
  !validMedia(body.ogImagePath??null))return null;
 if(body.mode==="auto"&&(body.title||body.description||body.ogImagePath))return null;
 if(body.kind!=="product"&&body.ogImagePath)return null;
 if(body.mode==="custom"&&!(body.title||body.description||body.ogImagePath))return null;
 return {kind:body.kind,slug:body.slug,mode:body.mode,title:body.title,
  description:body.description,image:body.ogImagePath??null,revision:body.revision};
}
async function body(request){
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json"||
  Number(request.headers.get("content-length")||0)>4000)return null;
 const raw=await request.text();if(raw.length>4000)return null;
 try{return JSON.parse(raw);}catch{return null;}
}
export async function handleSeoSettings({request,actor,db}){
 if(actor?.role!=="owner")return fail(403,"owner_required");
 const url=new URL(request.url);
 if(url.pathname!=="/v1/admin/website/seo")return fail(400,"invalid_route");
 if(request.method!=="GET"&&url.search)return fail(400,"invalid_query");
 const pageRaw=url.searchParams.get("page");
 if(request.method==="GET"&&(url.searchParams.size>1||
   (pageRaw!==null&&(!/^[1-9]\d{0,1}$/.test(pageRaw)||Number(pageRaw)>50))))
  return fail(400,"invalid_page");
 const page=pageRaw===null?1:Number(pageRaw);
 if(typeof db!=="function")return fail(503,"seo_unavailable");
 if(request.method==="GET"){
  try{
   const result=await db(c=>c.query("SELECT kind,slug,mode,seo_title AS title,meta_description AS description,"+
    "og_image_path AS \"ogImagePath\",revision,updated_at FROM "+TABLE+
     " ORDER BY kind,slug LIMIT 201 OFFSET $1",[200*(page-1)]));
   return ok({items:result.rows.slice(0,200),page,hasMore:result.rows.length>200});
  }catch{return fail(503,"seo_unavailable");}
 }
 if(request.method!=="POST")return fail(405,"method_not_allowed");
 const input=parseSeoSetting(await body(request));
 if(!input)return fail(400,"invalid_seo_setting");
 try{
  const record=await db(async c=>{
   await c.query("BEGIN");
   try{
    const previous=await c.query("SELECT * FROM "+TABLE+" WHERE kind=$1 AND slug=$2 FOR UPDATE",[input.kind,input.slug]);
    const old=previous.rows[0]??null;
    if(Number(old?.revision??0)!==input.revision)throw Error("revision_conflict");
    const params=[input.kind,input.slug,input.mode,input.title,input.description,input.image,actor.subject];
    const result=old?await c.query("UPDATE "+TABLE+" SET mode=$3,seo_title=$4,meta_description=$5,og_image_path=$6,"+
      "revision=revision+1,updated_by=$7,updated_at=now() WHERE kind=$1 AND slug=$2 RETURNING *",params):
     await c.query("INSERT INTO "+TABLE+
      "(kind,slug,mode,seo_title,meta_description,og_image_path,updated_by)"+
      " VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",params);
    const next=result.rows[0];if(!next)throw Error("seo_unavailable");
    await c.query("INSERT INTO "+AUDIT+" (kind,slug,actor_subject,revision,before_data,after_data)"+
     " VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb)",
     [input.kind,input.slug,actor.subject,Number(next.revision),
      old?JSON.stringify(old):null,JSON.stringify(next)]);
    await c.query("COMMIT");
    return next;
   }catch(e){await c.query("ROLLBACK");throw e;}
  });
  return ok({item:{kind:record.kind,slug:record.slug,mode:record.mode,
   title:record.seo_title,description:record.meta_description,
   ogImagePath:record.og_image_path,revision:Number(record.revision),
   updated_at:record.updated_at}});
 }catch(e){return e?.message==="revision_conflict"?fail(409,"revision_conflict"):fail(503,"seo_unavailable");}
}
