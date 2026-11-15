import {requireOwner} from "@/lib/owner-gate";
import {allowedOrigin} from "@/lib/ceo-push-policy.mjs";
import {validCustomer} from "@/lib/ceo-ads-policy.mjs";
import {adsOAuthConfig,adsRefresh,adsRevoke} from "@/lib/ceo-ads-oauth.mjs";
import {adsAccessibleCustomers,adsCustomerInfo} from "@/lib/ceo-ads-google.mjs";
import {readAdsConnection,readCompanyAdsConnection,
 chooseAdsCustomer,deleteAdsConnection,rotateAdsGrant,auditAds} from "@/lib/ceo-ads-store";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer",
 "X-Content-Type-Options":"nosniff"};
const fail=(status:number,code:string)=>Response.json({error:{code}},{status,headers});
export async function GET(request:Request){
 const gate=await requireOwner(request);
 if(gate.status!==200||!gate.subject)return fail(gate.status,"unauthorized");
 try{
  const config=adsOAuthConfig();
  if(config.status!=="ready")return Response.json({data:{status:"unconfigured"}},{headers});
  const row=gate.role==="owner"?
   await readAdsConnection(gate.subject,config.key):
   await readCompanyAdsConnection(config.key);
  if(!row)return Response.json({data:{status:"disconnected"}},{headers});
  return Response.json({data:{status:row.customerId?"ready":"select_customer",
   customerId:row.customerId,currency:row.currency,
   timeZone:row.timeZone,customerName:row.name}},{headers});
 }catch{return Response.json({data:{status:"migration_required"}},{headers});}
}
export async function POST(request:Request){
 if(!allowedOrigin(request))return fail(403,"forbidden_origin");
 const gate=await requireOwner(request);
 if(gate.status!==200||gate.role!=="owner"||!gate.subject)return fail(403,"owner_required");
 let body:unknown;
 try{body=await request.json();}catch{return fail(400,"invalid_body");}
 if(!body||typeof body!=="object"||Array.isArray(body)||
  Object.keys(body).some(k=>!["customerId","loginCustomerId"].includes(k)))
  return fail(400,"invalid_body");
 const {customerId,loginCustomerId=null}=body as {customerId?:unknown;loginCustomerId?:unknown};
 if(customerId!==undefined&&!validCustomer(customerId)||loginCustomerId!==null&&!validCustomer(loginCustomerId))
  return fail(400,"invalid_customer");
 try{
  const config=adsOAuthConfig();
  if(config.status!=="ready")return fail(503,"ads_not_configured");
  const row=await readAdsConnection(gate.subject,config.key);
  if(!row)return fail(409,"ads_disconnected");
  const access=await adsRefresh(config,row.refreshToken);
  if(access.rotated)await rotateAdsGrant(gate.subject,access.rotated,config.key);
  const allowed=await adsAccessibleCustomers(access.accessToken);
  if(customerId===undefined)return Response.json({data:{customers:allowed}},{headers});
  if(!allowed.includes(customerId as string))return fail(403,"customer_not_allowed");
  if(loginCustomerId!==null&&!allowed.includes(loginCustomerId as string))return fail(403,"manager_not_allowed");
  const info=await adsCustomerInfo(customerId as string,access.accessToken,loginCustomerId as string|null);
  await chooseAdsCustomer(gate.subject,info,loginCustomerId as string|null);
  await auditAds(gate.subject,gate.subject,"customer.select",info.id,
   {currency:info.currency,timeZone:info.timeZone},"success");
  return Response.json({data:{status:"ready",customer:info}},{headers});
 }catch{return fail(503,"ads_google_unavailable");}
}
export async function DELETE(request:Request){
 if(!allowedOrigin(request))return fail(403,"forbidden_origin");
 const gate=await requireOwner(request);
 if(gate.status!==200||gate.role!=="owner"||!gate.subject)return fail(403,"owner_required");
 try{
  const config=adsOAuthConfig();
  if(config.status!=="ready")return fail(503,"ads_not_configured");
  const row=await readAdsConnection(gate.subject,config.key);
  if(row){
   await auditAds(gate.subject,gate.subject,"oauth.disconnect",row.customerId,{},"success");
   await deleteAdsConnection(gate.subject);
   await adsRevoke(row.refreshToken);
  }
  return Response.json({data:{status:"disconnected"}},{headers});
 }catch{return fail(503,"ads_storage_unavailable");}
}
