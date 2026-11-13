import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseWebAnalytics,websiteCapturePayload} from "../lib/analytics/web-events.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const base={session_id:"123e4567-e89b-42d3-a456-426614174000",
 traffic_source:"google",traffic_channel:"google_organic"};

test("SEO05 refuses PII and arbitrary URL, preserves legacy pageview payload",()=>{
 const event={...base,event:"web_page_view",page_type:"product",
  page_key:"/san-pham/sku-3ac08ff247847c1e77bfccb0e806ed29"};
 assert.deepEqual(parseWebAnalytics(event),event);
 const legacy={event:"web_page_view",session_id:base.session_id,
  traffic_source:"google",page_type:"home"};
 assert.deepEqual(parseWebAnalytics(legacy),legacy);
 for(const bad of [{email:"alice@example.com"},{phone:"0912345678"},
  {url:"https://www.fbmn.vn?email=alice"},{referrer:"google.com?q=secret"},
  {page_key:"/admin"},{page_key:"/san-pham?email=x"},{traffic_channel:"google_paid",traffic_source:"direct"},
  {traffic_channel:"google_organic",traffic_source:"facebook"}]){
  assert.equal(parseWebAnalytics({...event,...bad}),null);
 }
});
test("SEO05 lead intent is not a successfully submitted lead",()=>{
 const event={...base,event:"web_lead_cta_click",cta_location:"product_primary",
  product_key:"sku-3ac08ff247847c1e77bfccb0e806ed29"};
 assert.deepEqual(parseWebAnalytics(event),event);
 assert.ok(parseWebAnalytics({...base,event:"web_lead_cta_click",cta_location:"dealer"}));
 assert.equal(parseWebAnalytics({...event,cta_location:"button_contact_alice"}),null);
 assert.equal(parseWebAnalytics({...event,message:"hello"}),null);
 const captured=websiteCapturePayload("phc_testkey1234",event);
 assert.equal(captured.properties.traffic_channel,"google_organic");
 assert.equal(captured.properties.$process_person_profile,false);
 assert.equal(captured.properties.$ip,null);
 assert.ok(!("email" in captured.properties));
});
test("Public tracking is no-autocapture, server-gated, and actual CTA clicks",()=>{
 const web=read("lib/analytics/web-client.ts");
 const api=read("app/api/analytics/route.ts");
 const detail=read("components/catalogue-product-options.tsx");
 const b2b=read("components/seo-lead-link.tsx");
 const page=read("components/web-analytics.tsx");
 assert.match(web,/globalPrivacyControl/);
 assert.match(web,/navigator\.doNotTrack/);
 assert.match(web,/web_session_start/);
 assert.match(web,/credentials:"omit"/);
 assert.match(api,/parseWebAnalytics\(value\)/);
 assert.match(api,/webAnalyticsEnabled\(\)/);
 assert.match(api,/origin/);
 assert.match(detail,/web_lead_cta_click/);
 assert.match(detail,/product_primary/);
 assert.match(detail,/product_mobile/);
 assert.match(b2b,/web_lead_cta_click/);
 assert.match(page,/analyticsPublicPageKey\(pathname\)/);
 assert.doesNotMatch(web,/posthog\.identify|posthog\.autocapture|sessionRecording/);
});
