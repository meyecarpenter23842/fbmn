import test from "node:test";
import assert from "node:assert/strict";
import {parseWebAnalytics,websiteCapturePayload,pdfServedPayload} from "../lib/analytics/web-events.ts";
const base={event:"web_page_view",session_id:"123e4567-e89b-42d3-a456-426614174000",traffic_source:"google",page_type:"products"};
test("DL11C only accepts compact approved payloads",()=>{
 assert.deepEqual(parseWebAnalytics(base),base);
 for(const extra of [{email:"x@y.com"},{phone:"0912345678"},{text:"customer says hello"},{referrer:"https://google.com/?q=private"},{ip:"1.2.3.4"},{url:"/contact?email=x@y.com"},{user_agent:"x"},{distinct_id:"abc"},{utm_campaign:"john-doe"}]){
  assert.equal(parseWebAnalytics({...base,...extra}),null);
 }
 for(const event of ["web_pdf_download_served","web_pdf_view_served","admin_section_view"]){
  assert.equal(parseWebAnalytics({...base,event}),null);
 }
});
test("DL11C validates event-specific fields and source",()=>{
 assert.equal(parseWebAnalytics({...base,traffic_source:"private-referrer.com"}),null);
 assert.equal(parseWebAnalytics({...base,page_type:"/contact?email=abc"}),null);
 assert.equal(parseWebAnalytics({...base,event:"web_product_view",page_type:undefined,product_key:"song-natural"}),null);
 assert.ok(parseWebAnalytics({event:"web_product_view",session_id:base.session_id,traffic_source:"direct",product_key:"song-natural"}));
 assert.ok(parseWebAnalytics({event:"web_product_view",session_id:base.session_id,traffic_source:"direct",product_key:"Demo_Product"}));
 assert.ok(parseWebAnalytics({event:"web_category_view",session_id:base.session_id,traffic_source:"direct",category_key:"School_Paper"}));
 assert.ok(parseWebAnalytics({event:"web_sku_view",session_id:base.session_id,traffic_source:"direct",product_key:"song-natural",sku:"0001234"}));
 assert.equal(parseWebAnalytics({...base,utm_campaign:"fbmn-john@example.com"}),null);
});
test("PostHog payload is personless and separates Website from Admin",()=>{
 const payload=websiteCapturePayload("phc_testkey1234",base);
 assert.equal(payload.distinct_id,"fbmn-web-session-"+base.session_id);
 assert.equal(payload.properties.app,"futurebook_website");
 assert.equal(payload.properties.$ip,null);
 assert.equal(payload.properties.$geoip_disable,true);
 assert.equal(payload.properties.$process_person_profile,false);
 assert.ok(!("email" in payload.properties));
 const pdf=pdfServedPayload("phc_testkey1234","web_pdf_download_served","123e4567-e89b-12d3-a456-426614174000","123e4567-e89b-42d3-a456-426614174000");
 assert.equal(pdf.event,"web_pdf_download_served");
 assert.ok(!("$session_id" in pdf.properties));
});
