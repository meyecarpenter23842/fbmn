// Fixed canonical Website origin; no Admin token or private fields forwarded.
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex, nofollow"};
const fail=(status:number)=>Response.json({error:{code:"seo_targets_unavailable"}},{status,headers});
export async function GET(request:Request){
 if(new URL(request.url).search)return fail(400);
 try{
  const response=await fetch("https://www.fbmn.vn/api/seo-targets",{cache:"no-store",redirect:"error",
   headers:{Accept:"application/json"},signal:AbortSignal.timeout(20000)});
  if(!response.ok||!response.headers.get("content-type")?.includes("application/json"))return fail(503);
  const max=16_000_000;
  if(Number(response.headers.get("content-length")||0)>max)return fail(503);
  const raw=await response.text();
  if(raw.length>max)return fail(503);
  return new Response(raw,{headers:{...headers,"Content-Type":"application/json; charset=utf-8"}});
 }catch{return fail(503);}
}
