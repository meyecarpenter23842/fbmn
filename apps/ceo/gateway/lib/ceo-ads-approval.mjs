import {createHash,randomBytes} from "node:crypto";
import {encryptSecret,decryptSecret} from "./ceo-gsc-oauth.mjs";
import {validCustomer,validateDraft} from "./ceo-ads-policy.mjs";
const TICKET=/^v1\.[A-Za-z0-9_-]{40,12000}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const CAMPAIGN=/^[0-9]{1,20}$/;
export function safeDraftId(id){return typeof id==="string"&&UUID.test(id);}
export function safeCampaignId(id){return typeof id==="string"&&CAMPAIGN.test(id);}
export function approvalHash(payload){
 return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
export function approvalTicket(config,owner,payload,now=Date.now()){
 if(config.status!=="ready"||typeof owner!=="string"||!owner||owner.length>200)
  throw new Error("ads_approval_invalid");
 return encryptSecret(JSON.stringify({
  kind:"ads131_owner_approval_v1",owner,payload,
  fingerprint:approvalHash(payload),nonce:randomBytes(24).toString("base64url"),
  createdAt:now
 }),config.key);
}
export function verifyApprovalTicket(config,owner,ticket,now=Date.now()){
 if(config.status!=="ready"||typeof ticket!=="string"||!TICKET.test(ticket))return null;
 try{
  const v=JSON.parse(decryptSecret(ticket,config.key));
  if(v.kind!=="ads131_owner_approval_v1"||v.owner!==owner||
   typeof v.nonce!=="string"||!/^[A-Za-z0-9_-]{32}$/.test(v.nonce)||
   !Number.isFinite(v.createdAt)||v.createdAt>now||now-v.createdAt>180000||
   approvalHash(v.payload)!==v.fingerprint)return null;
  return v.payload;
 }catch{return null;}
}
export function validateApprovalAction(value){
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 if(value.action==="create_paused"&&safeDraftId(value.draftId))
  return {action:"create_paused",draftId:value.draftId};
 if(value.action==="status"&&safeCampaignId(value.campaignId)&&
  ["PAUSED","ENABLED"].includes(value.status))
  return {action:"status",campaignId:value.campaignId,status:value.status};
 if(value.action==="budget"&&safeCampaignId(value.campaignId)&&
  typeof value.budgetDaily==="number"&&Number.isFinite(value.budgetDaily)&&
  value.budgetDaily>0&&value.budgetDaily<=100000000)
  return {action:"budget",campaignId:value.campaignId,budgetDaily:value.budgetDaily};
 return null;
}
export function budgetMicros(amount){
 if(typeof amount!=="number"||!Number.isFinite(amount)||amount<=0||
  amount>100000000)return null;
 const micros=BigInt(Math.round(amount*1000000));
 return micros>0n?micros.toString():null;
}
export function createPausedCampaign(customer,draft,slug){
 if(!validCustomer(customer)||typeof slug!=="string"||!/^fbmn-[0-9a-f]{12}$/.test(slug))
  return null;
 const v=validateDraft(draft);
 if(!v||v.kind!=="campaign")return null;
 const budget=budgetMicros(v.budgetDaily);
 if(!budget)return null;
 const base="customers/"+customer+"/";
 const budgetRef=base+"campaignBudgets/-1",campaignRef=base+"campaigns/-2";
 const groupRef=base+"adGroups/-3";
 const name="FBMN "+v.name+" "+slug;
 const operations=[
  {campaignBudgetOperation:{create:{
   resourceName:budgetRef,name:name+" ngân sách",
   amountMicros:budget,deliveryMethod:"STANDARD",explicitlyShared:false}}},
  {campaignOperation:{create:{
   resourceName:campaignRef,name,advertisingChannelType:"SEARCH",
   status:"PAUSED",campaignBudget:budgetRef,manualCpc:{},
   containsEuPoliticalAdvertising:"DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
   networkSettings:{targetGoogleSearch:true,targetSearchNetwork:false,targetContentNetwork:false}}}},
  ...v.geos.map(x=>({campaignCriterionOperation:{create:{
   campaign:campaignRef,location:{geoTargetConstant:x},negative:false}}})),
  {adGroupOperation:{create:{
   resourceName:groupRef,campaign:campaignRef,name:v.name.slice(0,100),
   type:"SEARCH_STANDARD",status:"ENABLED"}}},
  ...v.keywords.map(x=>({adGroupCriterionOperation:{create:{
   adGroup:groupRef,status:"ENABLED",
   keyword:{text:x,matchType:v.matchType}}}})),
  ...v.negativeKeywords.map(x=>({adGroupCriterionOperation:{create:{
   adGroup:groupRef,negative:true,keyword:{text:x,matchType:"BROAD"}}}})),
  {adGroupAdOperation:{create:{
   adGroup:groupRef,status:"ENABLED",ad:{
    finalUrls:[v.landingUrl],
    responsiveSearchAd:{
     headlines:v.headlines.map(text=>({text})),
     descriptions:v.descriptions.map(text=>({text}))
    }
   }}}}
 ];
 return {operations,preview:{
  action:"create_paused",customerId:customer,before:null,
  after:{name,status:"PAUSED",budgetDaily:v.budgetDaily,keywordCount:v.keywords.length,
   negativeCount:v.negativeKeywords.length,geoTargets:v.geos,
   matchType:v.matchType,landingUrl:v.landingUrl,headlines:v.headlines,
   descriptions:v.descriptions}
 }};
}
export function existingCampaignOperation(customer,action,row){
 if(!validCustomer(customer)||!row||!safeCampaignId(String(row.id||"")))return null;
 const ref="customers/"+customer+"/campaigns/"+row.id;
 if(action.action==="status"){
  if(row.status===action.status)return null;
  return {operations:[{campaignOperation:{
   update:{resourceName:ref,status:action.status},updateMask:"status"}}],
   preview:{action:"status",customerId:customer,campaignId:row.id,
    before:{status:row.status,dailyBudget:row.dailyBudget,name:row.name},
    after:{status:action.status,dailyBudget:row.dailyBudget,name:row.name}}};
 }
 if(action.action==="budget"){
  const budget=budgetMicros(action.budgetDaily);
  if(!budget||row.explicitlyShared===true||
   !/^customers\/[0-9]{10}\/campaignBudgets\/[0-9]+$/.test(row.budgetResource||"")||
   row.budgetResource.split("/")[1]!==customer)return null;
  return {operations:[{campaignBudgetOperation:{
   update:{resourceName:row.budgetResource,amountMicros:budget},
   updateMask:"amount_micros"}}],
   preview:{action:"budget",customerId:customer,campaignId:row.id,
    before:{status:row.status,dailyBudget:row.dailyBudget,name:row.name},
    after:{status:row.status,dailyBudget:action.budgetDaily,name:row.name}}};
 }
 return null;
}
