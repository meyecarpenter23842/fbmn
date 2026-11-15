import test from "node:test";
import assert from "node:assert/strict";
import {safeKeywords,safeGeos,validLandingUrl,validateDraft,moneyFromMicros,
 reportingDates,googleReportRows} from "../lib/ceo-ads-policy.mjs";
import {adsOAuthConfig,adsAuthorize,adsCallback,adsTicket,adsVerifyTicket} from "../lib/ceo-ads-oauth.mjs";
import {approvalTicket,verifyApprovalTicket,createPausedCampaign,
 existingCampaignOperation,validateApprovalAction,budgetMicros} from "../lib/ceo-ads-approval.mjs";
test("ADS01 distinguishes real bidding ranges, CPC and missing values",()=>{
 assert.equal(moneyFromMicros("1234567"),1.234567);
 assert.equal(moneyFromMicros("0"),0);
 assert.equal(moneyFromMicros(undefined),null);
 assert.equal(moneyFromMicros("not_a_number"),null);
 assert.deepEqual(safeKeywords(["giấy photocopy","giấy photocopy","tập học sinh"]),
  ["giấy photocopy","tập học sinh"]);
 assert.equal(safeKeywords([""]),null);
 assert.deepEqual(safeGeos(["geoTargetConstants/1000"]),["geoTargetConstants/1000"]);
 assert.equal(safeGeos(["geoTargetConstants/INVALID"]),null);
});
test("ADS02 landing URLs and drafts are fail-closed",()=>{
 assert.equal(validLandingUrl("https://www.fbmn.vn/san-pham"),true);
 for(const url of ["https://fbmn.vn/san-pham","https://www.fbmn.vn/admin",
  "https://www.fbmn.vn/ceo/","https://www.fbmn.vn/api/price",
  "https://www.fbmn.vn/login","https://www.fbmn.vn/san-pham?token=x"]){
  assert.equal(validLandingUrl(url),false,url);
 }
 assert.equal(validateDraft({kind:"campaign",name:"B2B campaign",
  keywords:["tập vở sỉ"],negativeKeywords:["miễn phí"],
  matchType:"PHRASE",budgetDaily:100000,geos:["geoTargetConstants/1000"],
  landingUrl:"https://www.fbmn.vn/san-pham",
  headlines:["Tập vở Futurebook","Tập học sinh chất lượng","Giấy tập cho đại lý"],
  descriptions:["Liên hệ Futurebook Miền Nam để nhận thông tin sản phẩm.",
   "Bảng mẫu tập vở và sổ tay dành cho đại lý phân phối."]}).status,"DRAFT_PAUSED");
 assert.equal(validateDraft({kind:"campaign",name:"B2B campaign",keywords:["tập"],
  budgetDaily:-1,matchType:"BROAD",geos:["geoTargetConstants/1000"],
  landingUrl:"https://www.fbmn.vn/san-pham"}),null);
});
test("ADS03 cost_micros use Google source, do not invent CPL",()=>{
 const d=reportingDates("7d","2026-11-15");
 assert.deepEqual(d,{from:"2026-11-08",to:"2026-11-14",
  previousFrom:"2026-11-01",previousTo:"2026-11-07"});
 const r=googleReportRows([{segments:{date:"2026-11-14"},metrics:{
  clicks:"2",impressions:"20",costMicros:"10000000"}}]);
 assert.equal(r.totals.cost,10);assert.equal(r.totals.cpc,5);
 assert.equal(r.totals.ctr,.1);assert.equal(googleReportRows([]).totals.cpc,null);
});
test("Ads OAuth is separate from GSC and Owner-bound with a short-lived ticket",()=>{
 const cfg=adsOAuthConfig({FBMN_CEO_ADS_OAUTH_CLIENT_ID:"1234567890-exampleproject.apps.googleusercontent.com",
  FBMN_CEO_ADS_OAUTH_CLIENT_SECRET:"01234567890123456789",
  FBMN_CEO_ADS_OAUTH_ENCRYPTION_KEY:"a".repeat(64)});
 const url=new URL(adsAuthorize(cfg,"real-owner",100));
 assert.equal(url.searchParams.get("scope"),"https://www.googleapis.com/auth/adwords");
 assert.match(url.searchParams.get("code_challenge"),/^[A-Za-z0-9_-]+$/);
 const code="abcdefghij1234567890";
 const callback=adsCallback(cfg,code,url.searchParams.get("state"),200);
 assert.equal(callback.subject,"real-owner");
 const ticket=adsTicket(cfg,callback,300);
 assert.equal(adsVerifyTicket(cfg,ticket,"other-owner",400),null);
 assert.equal(adsVerifyTicket(cfg,ticket,"real-owner",121000),null);
 assert.equal(adsVerifyTicket(cfg,ticket,"real-owner",400).code,code);
});

test("ADS02 consent is Owner-bound, short-lived and tied to the displayed payload",()=>{
 const cfg=adsOAuthConfig({FBMN_CEO_ADS_OAUTH_CLIENT_ID:"1234567890-exampleproject.apps.googleusercontent.com",
  FBMN_CEO_ADS_OAUTH_CLIENT_SECRET:"01234567890123456789",
  FBMN_CEO_ADS_OAUTH_ENCRYPTION_KEY:"b".repeat(64)});
 const payload={action:{action:"status",campaignId:"12345",status:"PAUSED"},
  customerId:"1234567890",currency:"VND",fingerprint:"v1"};
 const ticket=approvalTicket(cfg,"owner-id",payload,1000);
 assert.equal(verifyApprovalTicket(cfg,"other",ticket,1500),null);
 assert.equal(verifyApprovalTicket(cfg,"owner-id",ticket,182000),null);
 assert.equal(verifyApprovalTicket(cfg,"owner-id",ticket,1500).customerId,"1234567890");
 assert.equal(validateApprovalAction({action:"status",campaignId:"12",status:"INVALID"}),null);
 assert.equal(validateApprovalAction({action:"budget",campaignId:"12",budgetDaily:-1}),null);
 assert.equal(budgetMicros(123.45),"123450000");
});
test("ADS02 paused campaign includes correct negative, match and server owned URL",()=>{
 const draft={kind:"campaign",name:"Đại lý vở học sinh",
  keywords:["tập vở sỉ","giấy photo"],negativeKeywords:["miễn phí"],
  matchType:"PHRASE",budgetDaily:50000,geos:["geoTargetConstants/1000"],
  landingUrl:"https://www.fbmn.vn/san-pham",
  headlines:["Tập vở Futurebook","Tập học sinh chất lượng","Giấy tập cho đại lý"],
  descriptions:["Liên hệ Futurebook Miền Nam để nhận thông tin sản phẩm.",
   "Bảng mẫu tập vở và sổ tay dành cho đại lý phân phối."]};
 const created=createPausedCampaign("1234567890",draft,"fbmn-123456789abc");
 assert.equal(created.preview.after.status,"PAUSED");
 assert.equal(created.operations[1].campaignOperation.create.status,"PAUSED");
 assert.equal(created.operations.at(-1).adGroupAdOperation.create.status,"ENABLED");
 assert.equal(created.operations.find(x=>x.adGroupOperation).adGroupOperation.create.status,"ENABLED");
 assert.equal(created.operations.filter(x=>x.adGroupCriterionOperation?.create?.negative).length,1);
 assert.equal(created.operations.find(x=>x.adGroupCriterionOperation?.create?.keyword?.text==="tập vở sỉ")
  .adGroupCriterionOperation.create.keyword.matchType,"PHRASE");
 assert.equal(created.operations.at(-1).adGroupAdOperation.create.ad.finalUrls[0],
  "https://www.fbmn.vn/san-pham");
 assert.equal(createPausedCampaign("1234567890",{...draft,landingUrl:"https://www.fbmn.vn/admin"},"fbmn-123456789abc"),null);
});
test("ADS02 external shared budgets cannot be silently updated",()=>{
 const row={id:"1234",name:"Old",status:"ENABLED",dailyBudget:40000,
  budgetResource:"customers/1234567890/campaignBudgets/99",explicitlyShared:true};
 assert.equal(existingCampaignOperation("1234567890",
  {action:"budget",campaignId:"1234",budgetDaily:60000},row),null);
 const st=existingCampaignOperation("1234567890",
  {action:"status",campaignId:"1234",status:"PAUSED"},row);
 assert.equal(st.preview.before.status,"ENABLED");
 assert.equal(st.preview.after.status,"PAUSED");
 assert.equal(st.operations[0].campaignOperation.updateMask,"status");
});
