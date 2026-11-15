import test from "node:test";
import assert from "node:assert/strict";
import {safeKeywords,safeGeos,validLandingUrl,validateDraft,moneyFromMicros,
 reportingDates,googleReportRows} from "../lib/ceo-ads-policy.mjs";
import {adsOAuthConfig,adsAuthorize,adsCallback,adsTicket,adsVerifyTicket} from "../lib/ceo-ads-oauth.mjs";
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
  landingUrl:"https://www.fbmn.vn/san-pham"}).status,"DRAFT_PAUSED");
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
