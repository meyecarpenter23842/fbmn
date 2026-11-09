import {catalogueWorkerOrigin} from "@/lib/catalogue/worker-origin";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const MAX=5*1024*1024;
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Cross-Origin-Resource-Policy":"same-origin"};
const fail=(s:number)=>new Response(null,{status:s,headers:HEADERS});
export async function GET(request:Request){
 const u=new URL(request.url);
 if(u.searchParams.size!==1||u.searchParams.getAll("asset").length!==1)return fail(400);
 const asset=u.searchParams.get("asset")||"";
 if(!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(asset))return fail(400);
 const base=catalogueWorkerOrigin();
 if(!base)return fail(503);
 try{
  const r=await fetch(base+"/v1/public/catalogue-image?asset="+encodeURIComponent(asset),{
   method:"GET",cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(9000)
  });
  if(r.status!==200||r.headers.get("content-type")?.split(";")[0]!=="image/webp"||!r.body){
   await r.body?.cancel();return fail(r.status===404?404:503);
  }
  const len=r.headers.get("content-length");
  if(!len||!/^\d+$/.test(len)||Number(len)<100||Number(len)>MAX){
   await r.body.cancel();return fail(503);
  }
  // The Worker already re-checks ready state, bucket key, byte length and MIME.
  return new Response(r.body,{status:200,headers:{...HEADERS,"Content-Type":"image/webp","Content-Length":len}});
 }catch{return fail(503);}
}
