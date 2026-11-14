// Public no-store read-through to the least-privilege Worker configuration.
import {parseAppDownloadConfig} from "@/lib/app-download/config";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const fail=(status:number)=>Response.json({error:{code:"app_download_unavailable"}},{status,headers:HEADERS});
export async function GET(request:Request){
 const url=new URL(request.url);
 if(url.search)return fail(400);
 if(process.env.FBMN_PUBLIC_API_ENABLED!=="true")return fail(503);
 let origin:string;
 try{const base=new URL(process.env.FBMN_PUBLIC_API_BASE_URL||"");
  if(base.protocol!=="https:"||base.pathname!=="/"||base.username||base.password||base.search||base.hash)
   return fail(503);
  origin=base.origin;
 }catch{return fail(503);}
 try{
  const remote=await fetch(origin+"/v1/public/app-download",{
   cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(7000),
   headers:{"Accept":"application/json"}
  });
  if(remote.status!==200||!remote.headers.get("content-type")?.includes("application/json"))
   return fail(503);
  const text=await remote.text();
  if(text.length>4000)return fail(503);
  const raw=JSON.parse(text) as {data?:unknown};
  const config=parseAppDownloadConfig(raw.data);
  if(!config)return fail(503);
  return Response.json({data:config},{headers:HEADERS});
 }catch{return fail(503);}
}
