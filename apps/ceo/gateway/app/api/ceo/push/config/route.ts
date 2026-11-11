import {requireOwner} from "@/lib/owner-gate";
export const runtime="nodejs";export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"};
export async function GET(request:Request){
 const gate=await requireOwner(request);
 if(gate.status!==200)return Response.json({error:{code:"owner_required"}},{status:gate.status,headers:noStore});
 const key=process.env.FBMN_CEO_VAPID_PUBLIC_KEY||"";
 if(!/^[A-Za-z0-9_-]{80,100}$/.test(key))
  return Response.json({error:{code:"push_not_configured"}},{status:503,headers:noStore});
 return Response.json({data:{vapidPublicKey:key}},{headers:noStore});
}
