import test from "node:test";
import assert from "node:assert/strict";
import {queriesFor,formatStatistics} from "../lib/ceo-analytics.mjs";
import {readFileSync} from "node:fs";

test("Only bounded periods and fixed read-only aggregate queries are accepted",()=>{
 for(const period of ["7d","30d","90d"]){
  const queries=queriesFor(period);
  assert.equal(Object.keys(queries).length,7);
  assert.match(queries.seoSummary,/google_organic/);
  assert.match(queries.seoSummary,/google_paid/);
  assert.match(queries.seoSummary,/uniqIf\(distinct_id/);
  assert.match(queries.seoSummary,/web_contact_submit_success/);
  assert.match(queries.seoPages,/page_key/);
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
  seoPages:{results:[["/san-pham",2],["/san-pham/0912345678",10],["/admin",99]]}
 });
 assert.equal(result.metrics.visits,2);
 assert.equal(result.metrics.pageViews,4);
 assert.equal(result.products[0].label,"sku-abc");
 assert.equal(result.daily[0].day,"2026-11-13");
 assert.equal(result.timezone,"UTC");
 assert.equal(result.generatedAt,"2026-11-13T02:00:00Z");
 assert.equal(result.cached,true);
 assert.equal(result.seo.organicSessions,1);
 assert.equal(result.seo.organicLeadSessions,1);
 assert.equal(result.seo.organicCtaClicks,2);
 assert.equal(result.seoPages.length,1);
 assert.equal(result.daily[0].organicSessions,1);
 assert.throws(()=>formatStatistics("7d",{summary:{results:[]}}));
 assert.throws(()=>formatStatistics("7d",{
  summary:{results:[[1,-1,0,0,0,0,0,0]]},seoSummary:{results:[[0,0,0,0,0,0,0,0]]},seoPages:{results:[]},
  daily:{results:[]},sources:{results:[]},products:{results:[]},categories:{results:[]}
 }));
});
test("Analytics endpoint is server-only, Owner-guarded and does not embed credentials",()=>{
 const route=readFileSync(new URL("../app/api/ceo/statistics/route.ts",import.meta.url),"utf8");
 assert.match(route,/requireOwner\(request\)/);
 assert.match(route,/FBMN_CEO_POSTHOG_PERSONAL_API_KEY/);
 assert.match(route,/private, no-store/);
 assert.match(route,/Promise\.all/);
 assert.match(route,/force_blocking/);
 assert.match(route,/slice\(index,index\+3\)/);
 assert.doesNotMatch(route,/phx_[A-Za-z0-9]{25}/);
});
