import {getPublicCms} from "@/lib/content/cms";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const headers={"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
export async function GET(request:Request){
 if(new URL(request.url).search)return Response.json({error:{code:"invalid_query"}},{status:400,headers});
 try{
  const items=await getPublicCms();
  // Only the public Worker DTO is returned. Never expose Admin API tokens.
  return Response.json({data:{items}},{headers});
 }catch{return Response.json({error:{code:"cms_unavailable"}},{status:503,headers});}
}
