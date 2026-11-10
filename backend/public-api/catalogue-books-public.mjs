// DL7C: approved flipbook only. Never accept client-supplied R2 paths or keys.
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const MAX_IMAGE=5*1024*1024;
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Vary":"Origin"};
const fail=(status,code)=>Response.json({error:{code}},{status,headers:HEADERS});
const ok=(data)=>Response.json({data},{headers:HEADERS});

export function cataloguePublicAssetKey(key){
 return typeof key==="string"&&/^books\/[0-9a-f-]{36}\/(pages|covers)\/[0-9a-f-]{36}\.webp$/.test(key);
}
export function parseCataloguePublicQuery(url){
 const u=url instanceof URL?url:new URL(url);
 if(u.pathname==="/v1/public/catalogue-books"){
  if(!u.search)return {kind:"list"};
  if(u.searchParams.size!==1||u.searchParams.getAll("id").length!==1||
     !UUID.test(u.searchParams.get("id")||""))return null;
  return {kind:"detail",id:u.searchParams.get("id")};
 }
 if(u.pathname==="/v1/public/catalogue-image"){
  if(u.searchParams.size!==1||u.searchParams.getAll("asset").length!==1||
     !UUID.test(u.searchParams.get("asset")||""))return null;
  return {kind:"image",asset:u.searchParams.get("asset")};
 }
 return null;
}
export async function handlePublicCatalogueRequest({request,enabled,allowedOrigins,r2,listBooks,getBook,getAssets,getKey}){
 if(!enabled)return fail(404,"not_found");
 if(request.method!=="GET")return fail(405,"method_not_allowed");
 const origin=request.headers.get("origin");
 if(origin&&(!Array.isArray(allowedOrigins)||!allowedOrigins.includes(origin)))return fail(403,"origin_forbidden");
 const parsed=parseCataloguePublicQuery(new URL(request.url));
 if(!parsed)return fail(400,"invalid_query");
 try{
  if(parsed.kind==="list"){
   if(typeof listBooks!=="function")return fail(503,"catalogue_unavailable");
   const books=await listBooks();
   if(!Array.isArray(books)||books.length>100)return fail(503,"catalogue_unavailable");
   return ok({books:books.map(b=>({id:b.id,title:b.title,edition:b.edition}))});
  }
  if(parsed.kind==="detail"){
   if(typeof getBook!=="function"||typeof getAssets!=="function")
    return fail(503,"catalogue_unavailable");
   const book=await getBook(parsed.id);
   if(!book)return fail(404,"not_found");
   const assets=await getAssets(parsed.id);
   if(!Array.isArray(assets)||assets.length>201)return fail(503,"catalogue_unavailable");
   const pages=assets.filter(a=>a.kind==="page").sort((a,b)=>a.sortOrder-b.sortOrder||a.id.localeCompare(b.id));
   if(!pages.length||pages.length>200)return fail(404,"not_found");
   const cover=assets.find(a=>a.kind==="cover");
   const assetDTO=a=>({id:a.id,width:a.width,height:a.height});
   return ok({book:{id:book.id,title:book.title,edition:book.edition},
    pages:pages.map(assetDTO),
    cover:cover?assetDTO(cover):null});
  }
  if(typeof getKey!=="function"||!r2?.get)return fail(503,"catalogue_unavailable");
  const record=await getKey(parsed.asset);
  if(!record||!cataloguePublicAssetKey(record.key)||
     !Number.isSafeInteger(record.bytes)||record.bytes<100||record.bytes>MAX_IMAGE)
   return fail(404,"not_found");
  const image=await r2.get(record.key);
  if(!image?.body||image.size!==record.bytes||image.httpMetadata?.contentType!=="image/webp")
   return fail(404,"not_found");
  return new Response(image.body,{status:200,headers:{
   ...HEADERS,"Content-Type":"image/webp","Content-Length":String(image.size),
   "Cross-Origin-Resource-Policy":"same-origin"
  }});
 }catch{return fail(503,"catalogue_unavailable");}
}
