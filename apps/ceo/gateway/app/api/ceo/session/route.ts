import {requireOwner} from "@/lib/owner-gate";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
export async function GET(){
 const gate=await requireOwner();
 return gate.status===200
  ? Response.json({data:{role:"owner"}},{headers})
  : Response.json({error:{code:gate.status===403?"forbidden":"unauthenticated"}},{status:gate.status,headers});
}
