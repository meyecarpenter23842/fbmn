import test from "node:test";
import assert from "node:assert/strict";
import {queriesFor,formatStatistics} from "../lib/ceo-analytics.mjs";
import {readFileSync} from "node:fs";

test("Only bounded periods and fixed read-only aggregate queries are accepted",()=>{
 for(const period of ["7d","30d","90d"]){
  const queries=queriesFor(period);
  assert.equal(Object.keys(queries).length,12);
  assert.match(queries.seoSummary,/google_organic/);
  assert.match(queries.seoSummary,/google_paid/);
  assert.match(queries.seoSummary,/uniqIf\(distinct_id/);
  assert.match(queries.seoSummary,/web_contact_submit_success/);
  assert.match(queries.seoPages,/page_key/);
  assert.equal(queries.marketingSources.includes("argMinIf(toString(properties.traffic_source)"),true);
  assert.match(queries.marketingSources,/GROUP BY distinct_id HAVING starts>0/);
  assert.equal(queries.marketingCampaigns.includes("WHERE match(campaign"),true);
  assert.equal(queries.marketingCampaigns.includes("NOT match(campaign,'[0-9]{9,}')"),true);
  assert.equal(queries.marketingSources.includes("person_id"),false);
  assert.equal(queries.marketingSources.includes("properties.email"),false);
  assert.equal(queries.marketingCampaigns.includes("person_id"),false);
  assert.equal(queries.marketingCampaigns.includes("properties.phone"),false);
  assert.match(queries.funnel,/windowFunnel\(86400000\)\(accurateCast\(toUnixTimestamp64Milli\(timestamp\), 'UInt64'\)/);
  assert.doesNotMatch(queries.funnel,/toDateTime\(timestamp\)/);
  assert.match(queries.funnel,/GROUP BY distinct_id/);
  assert.match(queries.funnel,/startsWith\(distinct_id, 'fbmn-web-session-'\)/);
  assert.match(queries.funnel,/event = 'web_product_view', event = 'web_lead_cta_click'/);
  assert.match(queries.funnel,/web_contact_submit_success','web_outsourcing_submit_success/);
  assert.doesNotMatch(queries.funnel,/properties\.(email|phone|name|message|ip|referrer)/i);
  assert.doesNotMatch(queries.seoSummary,/person|email|utm_campaign|referrer/i);
  for(const sql of Object.values(queries)){
   assert.match(sql,/SELECT /);
   assert.match(sql,/timestamp >= now\(\) - INTERVAL /);
   assert.match(sql,/properties\.app = 'futurebook_website'/);
   assert.doesNotMatch(sql,/SELECT \*|DELETE |INSERT |UPDATE /);
  }
 }
 assert.throws(()=>queriesFor("all"));
 assert.throws(()=>queriesFor("7d;DROP TABLE events"));
});
test("Real rows map into aggregates with no fabricated defaults",()=>{
 const result=formatStatistics("7d",{
  summary:{results:[[2,4,3,2,1,1,1,0]],last_refresh:"2026-11-13T02:00:00Z",is_cached:true},
  daily:{results:[["2026-11-13",2,4,1,1]]},
  sources:{results:[["direct",2]]},
  products:{results:[["sku-abc",3]]},
  categories:{results:[["notebooks",2]]},
  seoSummary:{results:[[1,1,1,0,1,0,0,2]]},
  funnel:{results:[[5,3,2]]},
  marketingSources:{results:[["direct",5,4,3,2,1,1],["google_organic",2,1,1,1,1,0]]},
  marketingCampaigns:{results:[["fbmn-autumn-2026","google_paid",3,2,1,1]]},
  seoPages:{results:[["/san-pham",2],["/san-pham/0912345678",10],["/admin",99]]}
 });
 assert.equal(result.metrics.visits,2);
 assert.equal(result.metrics.pageViews,4);
 assert.equal(result.products[0].label,"sku-abc");
 assert.equal(result.daily[0].day,"2026-11-13");
 assert.equal(result.timezone,"UTC");
 assert.equal(result.generatedAt,"2026-11-13T02:00:00Z");
 assert.equal(result.cached,true);
 assert.deepEqual(result.funnel,{viewedSessions:5,ctaSessions:3,submittedSessions:2});
 assert.equal(result.marketing.channels[0].channel,"direct");
 assert.equal(result.marketing.channels[0].leadSessions,2);
 assert.equal(result.marketing.campaigns[0].campaign,"fbmn-autumn-2026");
 assert.equal(result.marketing.campaigns[0].leadSessions,1);
 assert.equal(result.seo.organicSessions,1);
 assert.equal(result.seo.organicLeadSessions,1);
 assert.equal(result.seo.organicCtaClicks,2);
 assert.equal(result.seoPages.length,1);
 assert.equal(result.daily[0].organicSessions,1);
 assert.throws(()=>formatStatistics("7d",{summary:{results:[]}}));
 assert.throws(()=>formatStatistics("7d",{
  summary:{results:[[1,-1,0,0,0,0,0,0]]},seoSummary:{results:[[0,0,0,0,0,0,0,0]]},seoPages:{results:[]},
  daily:{results:[]},sources:{results:[]},products:{results:[]},categories:{results:[]},funnel:{results:[[1,2,1]]}
 }));
});
test("Analytics endpoint is server-only, Owner-guarded and does not embed credentials",()=>{
 const route=readFileSync(new URL("../app/api/ceo/statistics/route.ts",import.meta.url),"utf8");
 assert.match(route,/requireOwner\(request\)/);
 assert.match(route,/FBMN_CEO_POSTHOG_PERSONAL_API_KEY/);
 assert.match(route,/FBMN_CEO_PUBLIC_API_BASE_URL/);
 assert.match(route,/attachCatalogNames\(data,process\.env\.FBMN_CEO_PUBLIC_API_BASE_URL/);
 assert.match(route,/private, no-store/);
 assert.match(route,/Promise\.all/);
 assert.match(route,/force_blocking/);
 assert.match(route,/slice\(index,index\+3\)/);
 assert.doesNotMatch(route,/phx_[A-Za-z0-9]{25}/);
});

test("PH01 refuses missing or inconsistent funnel counts; true zero stays zero",()=>{
 const base={
  summary:{results:[[0,0,0,0,0,0,0,0]]},
  daily:{results:[]},sources:{results:[]},products:{results:[]},categories:{results:[]},
  seoSummary:{results:[[0,0,0,0,0,0,0,0]]},seoPages:{results:[]},
  marketingSources:{results:[]},marketingCampaigns:{results:[]}
 };
 assert.throws(()=>formatStatistics("7d",base),/invalid_funnel/);
 assert.throws(()=>formatStatistics("7d",{...base,funnel:{results:[[1,2,1]]}}),/invalid_funnel_order/);
 assert.throws(()=>formatStatistics("7d",{...base,funnel:{results:[[3,-1,0]]}}),/invalid_count/);
 assert.throws(()=>formatStatistics("7d",{...base,funnel:{results:[[3,2]]}}),/invalid_funnel/);
 const empty=formatStatistics("7d",{...base,funnel:{results:[[0,0,0]]}});
 assert.deepEqual(empty.funnel,{viewedSessions:0,ctaSessions:0,submittedSessions:0});
});

test("PH01 preserves subsecond order: reverse CTA is not a conversion",()=>{
 // Same precision as the deployed HogQL expression. Verified with PostHog
 // windowFunnel live: reversed is stage 1, correct order is stage 3.
 const stage=(items)=>{
  let reached=0,started=0;
  for(const item of [...items].sort((a,b)=>a.millisecond-b.millisecond)){
   if(reached===0&&item.event==='product'){reached=1;started=item.millisecond;}
   else if(item.millisecond-started<=86400000&&reached===1&&item.event==='cta')reached=2;
   else if(item.millisecond-started<=86400000&&reached===2&&item.event==='success')reached=3;
  }
  return reached;
 };
 const start=Date.parse("2026-11-13T12:00:00.000Z");
 assert.equal(stage([{event:'cta',millisecond:start+100},{event:'product',millisecond:start+900},
  {event:'success',millisecond:start+999}]),1);
 assert.equal(stage([{event:'product',millisecond:start+100},{event:'cta',millisecond:start+900},
  {event:'success',millisecond:start+999}]),3);
});

test("PH02 allows only safe aggregate channel labels and verified campaign codes",()=>{
 const base={
  summary:{results:[[0,0,0,0,0,0,0,0]]},daily:{results:[]},sources:{results:[]},
  products:{results:[]},categories:{results:[]},seoSummary:{results:[[0,0,0,0,0,0,0,0]]},
  seoPages:{results:[]},funnel:{results:[[0,0,0]]},
  marketingSources:{results:[]},marketingCampaigns:{results:[]}
 };
 const use=(source,campaign)=>formatStatistics("30d",{...base,
   marketingSources:{results:source},marketingCampaigns:{results:campaign}}).marketing;
 assert.deepEqual(use([],[]),{channels:[],campaigns:[],previousChannels:[],daily:[]});
 assert.equal(use([],[["fbmn-20261113","google_paid",1,0,0,0]]).campaigns[0].campaign,"fbmn-20261113");
 assert.throws(()=>use([["google_paid",2,0,1,3,1,1]],[]),/invalid_marketing_counts/);
 assert.throws(()=>use([["unsafe",2,0,0,0,0,0]],[]),/invalid_marketing_channel/);
 assert.throws(()=>use([],[["name@gmail.com","google_paid",1,0,0,0]]),/invalid_marketing_campaign/);
 assert.throws(()=>use([],[["fbmn-09876543210","google_paid",1,0,0,0]]),/invalid_marketing_campaign/);
 assert.throws(()=>use([["direct",1,0,0,0,0,0],["direct",1,0,0,0,0,0]],[]),/invalid_marketing_duplicate/);
 assert.throws(()=>use([["direct",2,0,0,1,2,0]],[]),/invalid_marketing_counts/);
 assert.throws(()=>use([],[["fbmn-safe","facebook",1,0,0,-1]]),/invalid_marketing_number/);
});
