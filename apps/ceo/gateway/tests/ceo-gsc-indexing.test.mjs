import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 P3_URLS,P3_BASELINE_DATE,p3Schedule,p3Watchlist,p3Target,
 p3GoogleResult,p3InspectGoogle,p3PerformanceResult,p3InspectPerformance,
 p3TechnicalHtml,p3InspectLive
} from "../lib/ceo-gsc-indexing.mjs";
import {ceoScope,canAccessCeo} from "../lib/ceo-user01-scope.mjs";
const TOKEN="token_token_token_abcdefgh_123456";
const SITE="sc-domain:fbmn.vn";
const now=new Date("2026-11-17T23:00:00Z"); // 17 Nov in Pacific time
const p003=P3_URLS.find(x=>x.key==="P003");
const validResponse={
 inspectionResult:{inspectionResultLink:"https://search.google.com/search-console/inspect?resource_id=sc-domain%3Afbmn.vn",
  indexStatusResult:{
   verdict:"FAIL",coverageState:"Crawled - currently not indexed",
   robotsTxtState:"ALLOWED",indexingState:"INDEXING_ALLOWED",
   pageFetchState:"SUCCESSFUL",lastCrawlTime:"2026-11-10T12:00:00Z",
   userCanonical:p003.url,googleCanonical:"http://fbmn.vn/san-pham/legacy-product",
   sitemap:["https://www.fbmn.vn/sitemap.xml"]
  }}
};
test("P3 watchlist exactly matches 12 original Search Console URLs and follow-up milestones",()=>{
 assert.equal(P3_URLS.length,12);
 assert.deepEqual(P3_URLS.map(x=>x.key),["catalogue","P003","L450","0240","5260","L413",
  "8014","L410","B871","P0041","9556","A571"]);
 assert.equal(p3Target("0240").url,
  "https://www.fbmn.vn/san-pham/sku-52049f0e6880574ccc2c7e909d5b83ed");
 assert.equal(p3Target("unknown"),null);
 assert.equal(p3Target("P003?url=evil"),null);
 assert.deepEqual(p3Schedule(),[
  {days:7,dueDate:"2026-11-25"},
  {days:14,dueDate:"2026-12-02"},
  {days:30,dueDate:"2026-12-18"}
 ]);
 assert.equal(P3_BASELINE_DATE,"2026-11-18");
 assert.match(p3Watchlist().note,/không phản ánh trạng thái index hiện tại/);
});
test("P3 validates Google indexed-version verdict without presenting it as live test",()=>{
 const out=p3GoogleResult(validResponse,p003.url);
 assert.equal(out.indexed,false);
 assert.equal(out.source,"google_url_inspection_indexed_version");
 assert.equal(out.coverage,"Crawled - currently not indexed");
 assert.equal(out.userCanonicalMatches,true);
 assert.equal(out.googleCanonicalMatches,false);
 assert.equal(out.sitemapReferenced,true);
 assert.equal(out.lastCrawlTime,"2026-11-10T12:00:00.000Z");
 assert.equal(p3GoogleResult({
  inspectionResult:{indexStatusResult:{verdict:"PASS",googleCanonical:p003.url}}},p003.url).indexed,true);
 assert.equal(p3GoogleResult({inspectionResult:{indexStatusResult:{verdict:"NEUTRAL"}}},p003.url).indexed,null);
 assert.throws(()=>p3GoogleResult({inspectionResult:{}},p003.url),/p3_gsc_invalid_data/);
});
test("P3 makes one allowlisted read-only Google URL Inspection request using the connected property",async()=>{
 let calls=0;
 const result=await p3InspectGoogle("P003",TOKEN,SITE,{fetchImpl:async(url,options)=>{
  calls++;
  assert.equal(url,"https://searchconsole.googleapis.com/v1/urlInspection/index:inspect");
  assert.equal(options.method,"POST");
  assert.equal(options.cache,"no-store");
  assert.equal(options.redirect,"error");
  assert.equal(options.headers.Authorization,"Bearer "+TOKEN);
  assert.deepEqual(JSON.parse(options.body),{inspectionUrl:p003.url,siteUrl:SITE});
  return Response.json(validResponse);
 }});
 assert.equal(calls,1);
 assert.equal(result.indexed,false);
 assert.ok(!JSON.stringify(result).includes(TOKEN));
 await assert.rejects(()=>p3InspectGoogle("https://evil.example",TOKEN,SITE),/p3_invalid_request/);
 await assert.rejects(()=>p3InspectGoogle("P003",TOKEN,"sc-domain:competitor.vn"),/p3_invalid_request/);
 await assert.rejects(()=>p3InspectGoogle("P003",TOKEN,SITE,{
  fetchImpl:async()=>new Response("limit",{status:429})
 }),/p3_gsc_rate_limited/);
});
test("P3 7/14/30-day numbers are Google performance signals, not indexed status history",async()=>{
 const expectedDates={startDate:"2026-10-16",endDate:"2026-11-14"};
 const payload={rows:[
  {keys:["2026-11-14"],clicks:1,impressions:3},
  {keys:["2026-11-08"],clicks:2,impressions:5},
  {keys:["2026-11-01"],clicks:3,impressions:7},
  {keys:["2026-10-17"],clicks:4,impressions:9}
 ]};
 const out=p3PerformanceResult(payload,expectedDates);
 assert.deepEqual(out.windows,[
  {days:7,clicks:3,impressions:8},
  {days:14,clicks:6,impressions:15},
  {days:30,clicks:10,impressions:24}
 ]);
 const result=await p3InspectPerformance("P003",TOKEN,SITE,{now,fetchImpl:async(url,opts)=>{
  assert.match(url,/searchAnalytics\/query$/);
  const query=JSON.parse(opts.body);
  assert.deepEqual(query.dimensions,["date"]);
  assert.equal(query.dimensionFilterGroups[0].filters[0].expression,p003.url);
  assert.equal(query.dimensionFilterGroups[0].filters[0].operator,"equals");
  assert.equal(query.dataState,"final");
  return Response.json(payload);
 }});
 assert.equal(result.source,"google_search_analytics_finalized");
 assert.deepEqual(result.windows,out.windows);
 assert.throws(()=>p3PerformanceResult({rows:[payload.rows[0],payload.rows[0]]},expectedDates),
  /p3_gsc_invalid_data/);
});
test("P3 live check only accepts 200, canonical match, absent noindex and sitemap loc",async()=>{
 const html='<html><head><link rel="canonical" href="'+p003.url+'">'+
  '<meta name="description" content="Futurebook"></head><body>P003</body></html>';
 const fetched=[];
 const fetchImpl=async url=>{
  fetched.push(url);
  return url.endsWith("sitemap.xml")?
   new Response('<urlset><url><loc>'+p003.url+'</loc></url></urlset>',
    {status:200,headers:{"Content-Type":"application/xml"}}):
   new Response(html,{status:200,headers:{"Content-Type":"text/html"}});
 };
 const ready=await p3InspectLive("P003",{fetchImpl});
 assert.equal(ready.ready,true);
 assert.equal(ready.http.canonicalMatches,true);
 assert.equal(ready.sitemap.included,true);
 assert.deepEqual(fetched.sort(),[p003.url,"https://www.fbmn.vn/sitemap.xml"].sort());
 const noindex=await p3InspectLive("P003",{fetchImpl:async url=>
  url.endsWith("sitemap.xml")?
   new Response('<urlset><url><loc>'+p003.url+'</loc></url></urlset>',{
    headers:{"Content-Type":"application/xml"}}):
   new Response('<head><link rel="canonical" href="'+p003.url+
    '"><meta name="robots" content="NOINDEX,follow"></head>',{
    headers:{"Content-Type":"text/html"}})
 });
 assert.equal(noindex.ready,false);
 assert.equal(noindex.http.noindex,true);
 assert.equal(p3TechnicalHtml('<head><meta content="noindex" name="googlebot"></head>',
  p003.url).noindex,true);
});
test("P3 recognizes Next.js streamed canonical and noindex in body metadata",()=>{
 const html='<html><head><title>P003</title></head><body>'+
  '<h1>Futurebook</h1><link rel="canonical" href="'+p003.url+'">'+
  '<meta name="robots" content="noindex,follow"></body></html>';
 const detected=p3TechnicalHtml(html,p003.url);
 assert.equal(detected.canonicalMatches,true);
 assert.equal(detected.noindex,true);
 const valid=p3TechnicalHtml(html.replace('noindex,follow','index,follow'),p003.url);
 assert.equal(valid.canonicalMatches,true);
 assert.equal(valid.noindex,false);
});
test("P3 SSRF safety and rate-limit failures remain unverified rather than success",async()=>{
 await assert.rejects(()=>p3InspectLive("../../admin"),/p3_invalid_request/);
 const failed=await p3InspectLive("P003",{fetchImpl:async()=>{throw Error("network failure");}});
 assert.equal(failed.ready,false);
 assert.equal(failed.http.status,null);
 assert.equal(failed.sitemap.status,"unavailable");
 const moved=await p3InspectLive("P003",{fetchImpl:async url=>
  url.endsWith("sitemap.xml")?
   new Response("<urlset></urlset>",{headers:{"content-type":"application/xml"}}):
   new Response(null,{status:308,headers:{Location:"https://somewhere.example"}})
 });
 assert.equal(moved.http.status,308);
 assert.equal(moved.ready,false);
});
test("P3 CEO route is SEO-permission scoped and does not expose Google token or mutate Google indexing",()=>{
 const url="https://ceo.fbmn.vn/api/ceo/search-console/indexing?key=P003";
 assert.equal(ceoScope(url,"GET"),"ceo.seo");
 assert.equal(ceoScope(url,"POST"),null);
 assert.equal(canAccessCeo("employee",["ceo.seo"],"ceo.seo"),true);
 assert.equal(canAccessCeo("employee",["ceo.statistics"],"ceo.seo"),false);
 const route=readFileSync(new URL("../app/api/ceo/search-console/indexing/route.ts",import.meta.url),"utf8");
 assert.match(route,/await requireOwner\(request\)/);
 assert.match(route,/p3Target\(key\)/);
 assert.match(route,/refreshGoogleToken\(/);
 assert.match(route,/\"Cache-Control\":\"private, no-store\"/);
 assert.doesNotMatch(route,/indexing\.googleapis\.com|urlNotifications:publish/);
});
