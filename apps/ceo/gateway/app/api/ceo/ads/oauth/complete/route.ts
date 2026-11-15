import {requireOwner} from "@/lib/owner-gate";
import {allowedOrigin} from "@/lib/ceo-push-policy.mjs";
import {adsOAuthConfig,adsVerifyTicket,adsExchangeCode} from "@/lib/ceo-ads-oauth.mjs";
import {adsAccessibleCustomers} from "@/lib/ceo-ads-google.mjs";
import {saveAdsConnection,auditAds} from "@/lib/ceo-ads-store";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer",
 "X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers});
export async function POST(request:Request){
 if(!allowedOrigin(request))return fail(403,"forbidden_origin");
 const owner=await requireOwner(request);
 if(owner.status!==200||owner.role!=="owner"||!owner.subject)return fail(403,"owner_required");
 if(Number(request.headers.get("content-length")||0)>6000)return fail(400,"invalid_request");
 let input:unknown;
 try{input=await request.json();}catch{return fail(400,"invalid_request");}
 if(!input||typeof input!=="object"||Array.isArray(input)||
  Object.keys(input).length!==1||typeof (input as {ticket?:unknown}).ticket!=="string")
  return fail(400,"invalid_request");
 try{
  const config=adsOAuthConfig();
  if(config.status!=="ready")return fail(503,"ads_not_configured");
  const ticket=adsVerifyTicket(config,(input as {ticket:string}).ticket,owner.subject);
  if(!ticket)return fail(400,"invalid_ticket");
  const grant=await adsExchangeCode(config,ticket.code,ticket.verifier);
  const customers=await adsAccessibleCustomers(grant.accessToken);
  if(customers.length<1)return fail(403,"ads_account_not_accessible");
  await saveAdsConnection(owner.subject,grant.refreshToken,config.key);
  await auditAds(owner.subject,owner.subject,"oauth.connect",null,{},"success");
  // Google Ads customer is NOT selected automatically; Owner must select.
  return Response.json({data:{status:"connected",customerSelected:false}},{headers});
 }catch{return fail(503,"ads_connect_failed");}
}
