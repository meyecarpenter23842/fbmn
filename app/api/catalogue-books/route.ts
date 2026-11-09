import {catalogueWorkerOrigin} from "@/lib/catalogue/worker-origin";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const fail=(code:number)=>Response.json({error:{code:"catalogue_unavailable"}},{status:code,headers:HEADERS});
export async function GET(request:Request){
 const url=new URL(request.url);
 const keys=[...url.searchParams.keys()];
 if(keys.length>1||keys.some(k=>k!=="id")||
    url.searchParams.getAll("id").length>1)return fail(400);
 const id=url.searchParams.get("id");
 if(id!==null&&!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))return fail(400);
 const base=catalogueWorkerOrigin();
 if(!base)return fail(503);
 try{
  const remote=await fetch(base+"/v1/public/catalogue-books"+(id?"?id="+encodeURIComponent(id):""),{
   method:"GET",redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(8000)
  });
  if(remote.status!==200){
   await remote.body?.cancel();
   return fail(remote.status===404?404:503);
  }
  if(!remote.headers.get("content-type")?.includes("application/json"))return fail(503);
  const body=await remote.text();
  if(body.length>150000)return fail(503);
  const parsed=JSON.parse(body) as unknown;
  if(!parsed||typeof parsed!=="object"||!("data" in parsed))return fail(503);
  return new Response(body,{status:200,headers:{...HEADERS,"Content-Type":"application/json; charset=utf-8"}});
 }catch{return fail(503);}
}
