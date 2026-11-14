import test from 'node:test';
import assert from 'node:assert/strict';
import {marketingQueries,formatMarketing} from '../lib/ceo-marketing.mjs';
import {queriesFor} from '../lib/ceo-analytics.mjs';
import {readFileSync} from 'node:fs';

test('PH03 runs fixed read-only 7/30/90-day prior session cohorts',()=>{
 for(const days of [7,30,90]){
  const q=marketingQueries(days);
  const a=queriesFor(days+'d');
  assert.equal(Object.keys(a).length,12);
  assert.equal(a.marketingPreviousSources,q.marketingPreviousSources);
  assert.equal(a.marketingDaily,q.marketingDaily);
  assert.match(q.marketingPreviousSources,new RegExp('INTERVAL '+days*2+' DAY'));
  assert.match(q.marketingPreviousSources,new RegExp('INTERVAL '+days+' DAY'));
  assert.match(q.marketingPreviousSources,/HAVING starts>0 AND minIf\(timestamp,event='web_session_start'\) </);
  assert.match(q.marketingPreviousSources,/first|source='google'/);
  assert.match(q.marketingDaily,/minIf\(timestamp,event='web_session_start'\) AS startedAt/);
  assert.match(q.marketingDaily,/GROUP BY day,label ORDER BY day,label LIMIT 750/);
  for(const sql of [q.marketingDaily,q.marketingPreviousSources]){
   assert.match(sql,/properties\.app = 'futurebook_website'/);
   assert.match(sql,/startsWith\(distinct_id,'fbmn-web-session-'\)/);
   assert.doesNotMatch(sql,/properties\.(email|phone|message|referrer|ip)/i);
   assert.doesNotMatch(sql,/SELECT \*|DELETE |INSERT |UPDATE /i);
  }
 }
 assert.throws(()=>marketingQueries(45),/invalid_period/);
});

test('PH03 serializes actual previous totals and daily values without a synthetic zero',()=>{
 const current={results:[['google_organic',10,5,3,2,2,1],['facebook',4,2,1,1,1,0]]};
 const campaigns={results:[['fbmn-autumn','facebook',3,1,1,1]]};
 const previous={results:[['google_organic',8,4,2,1,1,0]]};
 const daily={results:[['2026-11-12','google_organic',4,1],
  ['2026-11-13','google_organic',6,1],['2026-11-13','facebook',4,1]]};
 const result=formatMarketing(current,campaigns,previous,daily);
 assert.equal(result.channels[0].sessions,10);
 assert.equal(result.channels[0].leadSessions,2);
 assert.equal(result.previousChannels[0].sessions,8);
 assert.equal(result.previousChannels[0].leadSessions,1);
 assert.equal(result.daily.length,3);
 assert.equal(result.daily[2].channel,'facebook');
 assert.deepEqual(formatMarketing({results:[]},{results:[]},{results:[]},{results:[]}),
  {channels:[],campaigns:[],previousChannels:[],daily:[]});
 assert.throws(()=>formatMarketing(current,campaigns,previous,{results:[['2026-11-13','google_organic',1,2]]}),/invalid_marketing_daily_counts/);
 assert.throws(()=>formatMarketing(current,campaigns,previous,{results:[['2026-11-13','google_organic',0,0]]}),/invalid_marketing_daily_counts/);
 assert.throws(()=>formatMarketing(current,campaigns,previous,{results:[['2026-11-13','email@example.com',1,1]]}),/invalid_marketing_daily_label/);
 assert.throws(()=>formatMarketing(current,campaigns,previous,{results:[['2026-11-13','zalo',1,0],['2026-11-13','zalo',1,0]]}),/invalid_marketing_daily_duplicate/);
 assert.throws(()=>formatMarketing(current,campaigns,previous,{results:[['2026-11-99','zalo',1,0],[1,2,3]]}),/invalid_marketing_daily_row/);
 assert.throws(()=>formatMarketing(current,campaigns,{results:[['source-unknown',1,0,0,0,0,0]]},daily),/invalid_marketing_channel/);
});

test('PH03 is an Owner-only aggregation on same gateway, never joins GSC clicks to sessions',()=>{
 const route=readFileSync(new URL('../app/api/ceo/statistics/route.ts',import.meta.url),'utf8');
 const gsc=readFileSync(new URL('../app/api/ceo/search-console/route.ts',import.meta.url),'utf8');
 assert.match(route,/requireOwner\(request\)/);
 assert.match(gsc,/requireOwner\(request\)/);
 assert.doesNotMatch(route,/gsc.*clicks.*sessions|posthog.*gsc.*JOIN/i);
 assert.match(route,/private, no-store/);
 assert.match(gsc,/private, no-store/);
});
