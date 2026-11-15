import {requireOwner} from "@/lib/owner-gate";
import {allowedOrigin} from "@/lib/ceo-push-policy.mjs";
import {adsOAuthConfig,adsRefresh} from "@/lib/ceo-ads-oauth.mjs";
import {approvalHash,approvalClaimHash,approvalTicket,verifyApprovalTicket,validateApprovalAction,
 createPausedCampaign,existingCampaignOperation} from "@/lib/ceo-ads-approval.mjs";
import {adsCampaigns,adsMutate} from "@/lib/ceo-ads-google.mjs";
import {readAdsConnection,rotateAdsGrant,adsDraftById,reserveAdsApproval,
 finishAdsApproval,auditAds} from "@/lib/ceo-ads-store";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer",
 "X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers});
type Account={subject:string;customerId:string|null;loginCustomerId:string|null;
 refreshToken:string;currency:string|null;timeZone:string|null};
type Resolved={operations:unknown[];preview:Record<string,unknown>;fingerprint:string;
 draftId:string|null};
async function prepare(owner:string,account:Account,token:string,input:Record<string,unknown>)
 :Promise<Resolved|null>{
 const customer=account.customerId!;
 if(input.action==="create_paused"){
  const id=String(input.draftId||"");
  const draft=await adsDraftById(owner,id);
  if(!draft||draft.payload.kind!=="campaign")return null;
  const slug="fbmn-"+id.replaceAll("-","").slice(0,12);
  const output=createPausedCampaign(customer,draft.payload,slug);
  if(!output)return null;
  return {...output,draftId:id,
   fingerprint:approvalHash({
    customer,currency:account.currency,kind:"create_paused",
    draftId:id,revision:draft.revision,payload:draft.payload})};
 }
 const campaigns=await adsCampaigns(customer,token,account.loginCustomerId);
 const target=campaigns.find(c=>String(c.id)===input.campaignId);
 if(!target)return null;
 const result=existingCampaignOperation(customer,input,target);
 if(!result)return null;
 return {...result,draftId:null,
  fingerprint:approvalHash({customer,currency:account.currency,action:input,target})};
}
// A native user-click on the Owner screen must first request a preview.
// The token binds the exact previously previewed plan to a one-use DB claim.
export async function POST(request:Request){
 if(!allowedOrigin(request))return fail(403,"invalid_origin");
 const owner=await requireOwner(request);
 if(owner.status!==200||owner.role!=="owner"||!owner.subject)
  return fail(403,"owner_required");
 if(Number(request.headers.get("content-length")||0)>8000)return fail(413,"payload_too_large");
 let body:Record<string,unknown>;
 try{
  const raw=await request.json();
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return fail(400,"invalid_request");
  body=raw;
 }catch{return fail(400,"invalid_request");}
 const stage=body.stage;
 if(stage!=="preview"&&stage!=="apply")return fail(400,"invalid_stage");
 if(stage==="apply"&&(body.confirmed!==true||typeof body.ticket!=="string"))
  return fail(400,"owner_confirmation_required");
 const initial=stage==="preview"?validateApprovalAction(body.input):null;
 if(stage==="preview"&&!initial)return fail(400,"invalid_action");
 try{
  const config=adsOAuthConfig();
  if(config.status!=="ready")return fail(503,"ads_not_configured");
  const account=await readAdsConnection(owner.subject,config.key);
  if(!account?.customerId||!account.currency)return fail(409,"ads_customer_required");
  // The Owner must explicitly opt in to Google mutations through server configuration.
  if(process.env.FBMN_CEO_ADS_MUTATIONS_ENABLED!=="1")
   return fail(409,"ads_mutations_disabled");
  const access=await adsRefresh(config,account.refreshToken);
  if(access.rotated)await rotateAdsGrant(owner.subject,access.rotated,config.key);
  const token=access.accessToken;
  if(stage==="preview"){
   const prepared=await prepare(owner.subject,account,token,initial!);
   if(!prepared)return fail(400,"ads_action_not_allowed");
   // Google Ads validateOnly never changes or enables a campaign.
   await adsMutate(account.customerId,token,account.loginCustomerId,prepared.operations,true);
   const payload={input:initial,fingerprint:prepared.fingerprint,
    customerId:account.customerId,currency:account.currency,preview:prepared.preview};
   const ticket=approvalTicket(config,owner.subject,payload);
   return Response.json({data:{status:"awaiting_owner",preview:prepared.preview,
    currency:account.currency,customerId:account.customerId,ticket}},{headers});
  }
  const signed=verifyApprovalTicket(config,owner.subject,body.ticket as string);
  if(!signed)return fail(409,"approval_expired_or_invalid");
  const input=validateApprovalAction(signed.input);
  if(!input||signed.customerId!==account.customerId||
   signed.currency!==account.currency)return fail(409,"approval_changed");
  const prepared=await prepare(owner.subject,account,token,input);
  if(!prepared||prepared.fingerprint!==signed.fingerprint||
   approvalHash(prepared.preview)!==approvalHash(signed.preview))
   return fail(409,"approval_changed");
  const key=approvalClaimHash(body.ticket as string);
  if(!key)return fail(409,"approval_expired_or_invalid");
  const approvalId=await reserveAdsApproval(owner.subject,key,String(input.action),
   account.customerId,account.currency,prepared.draftId,prepared.preview);
  if(!approvalId)return fail(409,"approval_already_consumed");
  let response:Record<string,unknown>|null=null;
  try{
   // Absolutely no automatic retry. Any ambiguous result requires manual reconciliation.
   response=await adsMutate(account.customerId,token,account.loginCustomerId,
    prepared.operations,false);
  }catch{
   await finishAdsApproval(approvalId,"unknown",{reason:"google_result_unverified"});
   await auditAds(owner.subject,owner.subject,String(input.action),account.customerId,
    {approvalId,preview:prepared.preview},"unknown");
   return fail(502,"ads_mutation_unknown_check_google");
  }
  let verified=false;
  try{
   const live=await adsCampaigns(account.customerId,token,account.loginCustomerId);
   if(input.action==="create_paused"){
    const after=prepared.preview.after as {name?:unknown};
    verified=live.some(c=>c.name===after?.name&&c.status==="PAUSED");
   }else{
    const row=live.find(c=>String(c.id)===input.campaignId);
    if(row&&input.action==="status")verified=row.status===input.status;
    if(row&&input.action==="budget"){
     const requested=Number(input.budgetDaily);
     verified=row.dailyBudget!==null&&Math.abs(Number(row.dailyBudget)-requested)<0.000001;
    }
   }
  }catch{/* An unknown postcheck must never be called success. */}
  const state=verified?"verified":"unknown";
  await finishAdsApproval(approvalId,state,{
   responseKind:response&&Object.keys(response).slice(0,5),postcheck:verified});
  await auditAds(owner.subject,owner.subject,String(input.action),account.customerId,
   {approvalId,preview:prepared.preview,postcheck:verified},state);
  return Response.json({data:{status:verified?"verified":"pending_reconcile",
   approvalId,customerId:account.customerId}},{headers});
 }catch(error){
  const message=error instanceof Error?error.message:"";
  if(message==="ads_grant_expired")return fail(409,"ads_reconnect_required");
  if(message==="ads_permission_denied")return fail(403,"ads_permission_denied");
  if(message==="ads_quota")return fail(429,"ads_quota");
  return fail(503,"ads_approval_unavailable");
 }
}
