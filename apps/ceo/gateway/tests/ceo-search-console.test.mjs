import test from "node:test";
import assert from "node:assert/strict";
import {generateKeyPairSync,createVerify} from "node:crypto";
import {readFileSync} from "node:fs";
import {
 GSC_PERIODS,gscDates,gscPreviousDates,readGscConfig,
 formatGscReport,formatGscComparison,fetchGscReport
} from "../lib/ceo-search-console.mjs";

const {privateKey,publicKey}=generateKeyPairSync("rsa",{modulusLength:2048});
const credentials=JSON.stringify({
 type:"service_account",client_email:"gsc-readonly@test-project.iam.gserviceaccount.com",
 private_key:privateKey.export({type:"pkcs8",format:"pem"})
});
const env={
 FBMN_CEO_GSC_SITE_URL:"https://www.fbmn.vn/",
 FBMN_CEO_GSC_SERVICE_ACCOUNT_JSON:credentials
};
const NOW=new Date("2026-11-14T05:00:00Z");

test("SEO06 GSC periods use finalized PT dates, never today's partial data",()=>{
 assert.deepEqual(GSC_PERIODS,{"7d":7,"30d":30,"90d":90});
 assert.deepEqual(gscDates("7d",NOW),{startDate:"2026-11-04",endDate:"2026-11-10"});
 assert.deepEqual(gscDates("30d",NOW),{startDate:"2026-10-12",endDate:"2026-11-10"});
 assert.throws(()=>gscDates("all",NOW),/gsc_invalid_period/);
 assert.throws(()=>gscDates("7d;DELETE",NOW),/gsc_invalid_period/);
});
test("SEO06 requires explicit limited GSC property and server-only valid service account",()=>{
 assert.equal(readGscConfig({}).status,"unconfigured");
 assert.throws(()=>readGscConfig({FBMN_CEO_GSC_SITE_URL:"https://www.fbmn.vn/"}),/gsc_config_invalid/);
 assert.throws(()=>readGscConfig({...env,FBMN_CEO_GSC_SITE_URL:"https://ceo.fbmn.vn/"}),/gsc_property_invalid/);
 assert.throws(()=>readGscConfig({...env,FBMN_CEO_GSC_SITE_URL:"http://www.fbmn.vn/"}),/gsc_property_invalid/);
 assert.throws(()=>readGscConfig({...env,FBMN_CEO_GSC_SERVICE_ACCOUNT_JSON:"not a JSON"}),/gsc_config_invalid/);
 assert.equal(readGscConfig({...env,FBMN_CEO_GSC_SITE_URL:"sc-domain:fbmn.vn"}).status,"ready");
});
test("SEO06 formats real GSC metrics, sanitizes queries and pages, never sums top rows",()=>{
 const result=formatGscReport("7d",gscDates("7d",NOW),{
  overview:{rows:[{clicks:31,impressions:400,ctr:0.0775,position:12.1}]},
  daily:{rows:[
   {keys:["2026-11-05"],clicks:15,impressions:200,ctr:0.075,position:11.2},
   {keys:["2026-11-04"],clicks:16,impressions:200,ctr:0.08,position:13}
  ]},
  queries:{rows:[
   {keys:["tập học sinh 200 trang"],clicks:10,impressions:50,ctr:0.2,position:8},
   {keys:["nguyennam@example.com"],clicks:5,impressions:20,ctr:0.25,position:2},
   {keys:["093123456789"],clicks:5,impressions:20,ctr:0.25,position:2},
   {keys:["liên hệ 090 123 4567"],clicks:3,impressions:20,ctr:0.15,position:2},
   {keys:["liên hệ 090.123.4567"],clicks:3,impressions:20,ctr:0.15,position:2},
   {keys:["liên hệ 090-123-4567"],clicks:3,impressions:20,ctr:0.15,position:2}
  ]},
  pages:{rows:[
   {keys:["https://www.fbmn.vn/san-pham/tap-hoc-sinh"],clicks:12,impressions:30,ctr:0.4,position:4},
   {keys:["https://www.fbmn.vn/lien-he?email=x@y.com"],clicks:2,impressions:10,ctr:0.2,position:3},
   {keys:["https://ceo.fbmn.vn/ceo/"],clicks:2,impressions:10,ctr:0.2,position:3},
   {keys:["https://www.fbmn.vn/admin/"],clicks:2,impressions:10,ctr:0.2,position:3},
   {keys:["https://www.fbmn.vn/san-pham/090-123-4567"],clicks:2,impressions:10,ctr:0.2,position:3}
  ]}
 });
 assert.equal(result.status,"ready");
 assert.equal(result.metrics.clicks,31);
 assert.equal(result.metrics.impressions,400);
 assert.equal(result.metrics.ctr,0.0775);
 assert.equal(result.metrics.position,12.1);
 assert.deepEqual(result.daily.map(x=>x.date),["2026-11-04","2026-11-05"]);
 assert.deepEqual(result.queries.map(x=>x.label),["tập học sinh 200 trang"]);
 assert.deepEqual(result.pages.map(x=>x.label),["/san-pham/tap-hoc-sinh"]);
 assert.equal(JSON.stringify(result).includes("nguyennam"),false);
 assert.equal(JSON.stringify(result).includes("090 123"),false);
 assert.equal(JSON.stringify(result).includes("090.123"),false);
 assert.equal(JSON.stringify(result).includes("090-123"),false);
 assert.equal(JSON.stringify(result).includes("ceo.fbmn.vn"),false);
 assert.equal(JSON.stringify(result).includes("email="),false);
});
test("SEO06 has a distinct unconfigured and no-data state; no fabricated zeros",async()=>{
 const unconfigured=await fetchGscReport("7d",{env:{},now:NOW});
 assert.equal(unconfigured.status,"unconfigured");
 assert.equal(unconfigured.metrics,null);
 assert.deepEqual(unconfigured.queries,[]);
 const empty=formatGscReport("7d",gscDates("7d",NOW),{
  overview:{},daily:{rows:[]},queries:{rows:[]},pages:{rows:[]}
 });
 assert.equal(empty.status,"ready");
 assert.equal(empty.metrics,null);
 assert.deepEqual(empty.daily,[]);
 assert.throws(()=>formatGscReport("7d",gscDates("7d",NOW),{
  overview:{rows:[{clicks:-1,impressions:0,ctr:0,position:0}]},
  daily:{rows:[]},queries:{rows:[]},pages:{rows:[]}
 }),/gsc_invalid_clicks/);
});
test("SEO06 uses real signed OAuth readonly assertion and exactly four bounded GSC queries",async()=>{
 const calls=[];
 const fakeFetch=async(url,options)=>{
  calls.push({url:String(url),options});
  assert.equal(options.method,"POST");
  assert.equal(options.redirect,"error");
  assert.equal(options.cache,"no-store");
  if(String(url)==="https://oauth2.googleapis.com/token"){
   assert.equal(options.headers["Content-Type"],"application/x-www-form-urlencoded");
   const token=new URLSearchParams(options.body);
   const parts=token.get("assertion").split(".");
   const claims=JSON.parse(Buffer.from(parts[1],"base64url").toString("utf8"));
   assert.equal(claims.scope,"https://www.googleapis.com/auth/webmasters.readonly");
   assert.equal(claims.iss,"gsc-readonly@test-project.iam.gserviceaccount.com");
   assert.equal(claims.aud,"https://oauth2.googleapis.com/token");
   assert.equal(createVerify("RSA-SHA256").update(parts[0]+"."+parts[1]).end().verify(publicKey,Buffer.from(parts[2],"base64url")),true);
   return new Response(JSON.stringify({access_token:"a".repeat(70)}),{status:200,
    headers:{"content-type":"application/json"}});
  }
  assert.equal(options.headers.Authorization,"Bearer "+"a".repeat(70));
  assert.equal(String(url).startsWith("https://www.googleapis.com/webmasters/v3/sites/"),true);
  assert.equal(String(url).includes("https%3A%2F%2Fwww.fbmn.vn%2F"),true);
  const payload=JSON.parse(options.body);
  assert.equal(payload.type,"web");
  assert.equal(payload.dataState,"final");
  assert.equal(Object.hasOwn(payload,"dimensionFilterGroups"),false,
   "Unfiltered Search Console property metrics must include all FBMN host variants");
  assert.equal(payload.startDate,"2026-11-04");
  assert.equal(payload.endDate,"2026-11-10");
  const one={clicks:13,impressions:100,ctr:0.13,position:8.2};
  const rows=payload.dimensions.length===0?[{keys:[],...one}]:
   payload.dimensions[0]==="date"?[{keys:["2026-11-04"],...one}]:
   payload.dimensions[0]==="query"?[{keys:["văn phòng phẩm"],...one}]:
   [{keys:["https://www.fbmn.vn/"],...one}];
  return new Response(JSON.stringify({rows}),{status:200,headers:{"content-type":"application/json"}});
 };
 const result=await fetchGscReport("7d",{env,now:NOW,fetchImpl:fakeFetch});
 assert.equal(calls.length,5);
 assert.equal(result.metrics.clicks,13);
 assert.equal(result.queries[0].label,"văn phòng phẩm");
 assert.equal(result.pages[0].label,"/");
});
test("SEO06B returns property-wide Google metrics and safely ranks both FBMN hosts",async()=>{
 const property="sc-domain:fbmn.vn",seen=[];
 const fakeFetch=async(url,options)=>{
  assert.equal(url,"https://www.googleapis.com/webmasters/v3/sites/"+encodeURIComponent(property)+"/searchAnalytics/query");
  const request=JSON.parse(options.body);
  assert.equal(Object.hasOwn(request,"dimensionFilterGroups"),false);
  seen.push(request.dimensions.join(","));
  const totals={clicks:21,impressions:330,ctr:21/330,position:14};
  const rows=request.dimensions.length===0?[totals]:
   request.dimensions[0]==="date"?[{keys:["2026-11-04"],...totals}]:
   request.dimensions[0]==="query"?[{keys:["tập vở học sinh"],...totals}]:
   [
    {keys:["https://fbmn.vn/"],...totals},
    {keys:["https://www.fbmn.vn/san-pham/tap-hoc-sinh"],...totals},
    {keys:["http://fbmn.vn/dai-ly"],...totals},
    {keys:["https://fbmn.vn/lien-he?email=private@example.com"],...totals},
    {keys:["https://ceo.fbmn.vn/ceo"],...totals}
   ];
  return new Response(JSON.stringify({rows}),{status:200,
   headers:{"content-type":"application/json"}});
 };
 const value=await fetchGscReport("7d",{
  accessToken:"a".repeat(45),site:property,now:NOW,fetchImpl:fakeFetch
 });
 assert.deepEqual(seen,["","date","query","page"]);
 assert.equal(value.site,"fbmn.vn");
 assert.equal(value.metrics.clicks,21);
 assert.equal(value.metrics.impressions,330);
 assert.deepEqual(value.queries.map(x=>x.label),["tập vở học sinh"]);
 assert.deepEqual(value.pages.map(x=>x.label),[
  "fbmn.vn/","/san-pham/tap-hoc-sinh","http://fbmn.vn/dai-ly"
 ]);
 assert.equal(JSON.stringify(value).includes("private@example.com"),false);
 assert.equal(JSON.stringify(value).includes("ceo.fbmn.vn"),false);
});

test("SEO06 treats Google 403 as a permission error and does not expose raw response",async()=>{
 const fakeFetch=async(url)=>new Response(String(url).includes("/token")?
  JSON.stringify({access_token:"b".repeat(70)}):"Private error details",{
  status:String(url).includes("/token")?200:403,
  headers:{"content-type":"application/json"}
 });
 await assert.rejects(()=>fetchGscReport("7d",{env,now:NOW,fetchImpl:fakeFetch}),
  /gsc_permission_denied/);
 const route=readFileSync(new URL("../app/api/ceo/search-console/route.ts",import.meta.url),"utf8");
 assert.match(route,/requireOwner\(request\)/);
 assert.match(route,/private, no-store/);
 assert.match(route,/fetchGscReport\(period,\{accessToken,site:config\.property\}\)/);
 assert.match(route,/gsc_permission_denied/);
 assert.doesNotMatch(route,/FBMN_CEO_GSC_SERVICE_ACCOUNT_JSON/);
});

test("SEO07 compares exact adjacent finalized PT windows for 7/30/90 days",()=>{
 assert.deepEqual(gscPreviousDates("7d",NOW),{
  startDate:"2026-10-28",endDate:"2026-11-03"
 });
 assert.deepEqual(gscPreviousDates("30d",NOW),{
  startDate:"2026-09-12",endDate:"2026-10-11"
 });
 assert.deepEqual(gscPreviousDates("90d",NOW),{
  startDate:"2026-05-15",endDate:"2026-08-12"
 }); // test concrete dates separately if period arithmetic changes
 assert.throws(()=>gscPreviousDates("random",NOW),/gsc_invalid_period/);
});

test("SEO07 compares only matching sanitized top rows, without false zero or PII",async()=>{
 const property="sc-domain:fbmn.vn";
 const calls=[];
 const token="x".repeat(45);
 const fakeFetch=async(url,options)=>{
  const p=JSON.parse(options.body);
  assert.equal(Object.hasOwn(p,"dimensionFilterGroups"),false);
  assert.equal(url,"https://www.googleapis.com/webmasters/v3/sites/"+encodeURIComponent(property)+"/searchAnalytics/query");
  calls.push({start:p.startDate,end:p.endDate,dimension:p.dimensions[0]||"overview"});
  const current=p.startDate==="2026-11-04";
  const total=current?
   {clicks:12,impressions:200,ctr:.06,position:8}:
   {clicks:10,impressions:100,ctr:.1,position:12};
  const keys=p.dimensions[0];
  const rows=!keys?[total]:keys==="date"?
   [{keys:["2026-11-04"],...total}]:
   keys==="query"?
    (current?[
     {keys:["tập vở học sinh"],clicks:6,impressions:70,ctr:6/70,position:6},
     {keys:["sổ tay"],clicks:2,impressions:20,ctr:.1,position:11},
     {keys:["private@example.com"],clicks:1,impressions:10,ctr:.1,position:2}
    ]:[
     {keys:["tập vở học sinh"],clicks:3,impressions:50,ctr:.06,position:8},
     {keys:["giấy photocopy"],clicks:4,impressions:40,ctr:.1,position:6}
    ]):
    (current?[
     {keys:["https://fbmn.vn/"],clicks:5,impressions:75,ctr:5/75,position:6},
     {keys:["https://www.fbmn.vn/admin"],clicks:2,impressions:30,ctr:.07,position:8}
    ]:[
     {keys:["https://fbmn.vn/"],clicks:8,impressions:90,ctr:8/90,position:10}
    ]);
  return new Response(JSON.stringify({rows}),{status:200,
   headers:{"content-type":"application/json"}});
 };
 const r=await fetchGscReport("7d",{
  accessToken:token,site:property,now:NOW,fetchImpl:fakeFetch,compare:true
 });
 assert.equal(calls.length,7);
 assert.deepEqual(calls.map(x=>x.dimension),
  ["overview","date","query","page","overview","query","page"]);
 assert.deepEqual(calls.slice(4).map(x=>[x.start,x.end]),[
  ["2026-10-28","2026-11-03"],["2026-10-28","2026-11-03"],["2026-10-28","2026-11-03"]
 ]);
 assert.equal(r.metrics.clicks,12);
 assert.equal(r.comparison.metrics.clicks,10);
 assert.equal(r.comparison.totals.clicksDelta,2);
 assert.equal(r.comparison.totals.impressionsDelta,100);
 assert.equal(r.comparison.totals.ctrPointsDelta,-4);
 assert.equal(r.comparison.totals.positionImprovement,4);
 assert.equal(r.comparison.keywords.gainers[0].clickDelta,3);
 assert.equal(r.comparison.keywords.gainers[0].positionImprovement,2);
 assert.equal(r.comparison.keywords.newInTop[0].label,"sổ tay");
 assert.equal(r.comparison.keywords.newInTop[0].clickDelta,null);
 assert.equal(r.comparison.keywords.leftTop[0].label,"giấy photocopy");
 assert.equal(r.comparison.keywords.leftTop[0].clickDelta,null);
 assert.equal(r.comparison.pages.decliners[0].clickDelta,-3);
 assert.equal(JSON.stringify(r).includes("private@example.com"),false);
 assert.equal(JSON.stringify(r).includes("/admin"),false);
});
test("SEO07 never reports a percentage when prior period has zero or no Google metrics",()=>{
 const d=gscDates("7d",NOW),p=gscPreviousDates("7d",NOW);
 const base={overview:{rows:[{clicks:5,impressions:50,ctr:.1,position:7}]},
  daily:{rows:[]},queries:{rows:[]},pages:{rows:[]}};
 const current=formatGscReport("7d",d,base);
 const empty=formatGscReport("7d",p,{overview:{rows:[]},daily:{rows:[]},
  queries:{rows:[]},pages:{rows:[]}});
 assert.equal(formatGscComparison("7d",current,empty).totals,null);
 const prior=formatGscReport("7d",p,{...base,
  overview:{rows:[{clicks:0,impressions:0,ctr:0,position:0}]}});
 assert.equal(formatGscComparison("7d",current,prior).totals.clicksPercentChange,null);
});
