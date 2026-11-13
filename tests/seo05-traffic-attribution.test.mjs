import test from "node:test";
import assert from "node:assert/strict";
import {classifyWebsiteTraffic,analyticsPublicPageKey} from "../lib/analytics/traffic-attribution.ts";

const get=(query,referrer="")=>classifyWebsiteTraffic(query,referrer,"www.fbmn.vn");

test("Google search referrer is organic but paid tags/click marker remain paid",()=>{
 assert.deepEqual([get("","https://www.google.com/search?q=private").source,
  get("","https://www.google.com/search?q=private").channel],["google","google_organic"]);
 assert.equal(get("?utm_source=google&utm_medium=organic").channel,"google_organic");
 assert.equal(get("?utm_source=google&utm_medium=cpc").channel,"google_paid");
 assert.equal(get("?utm_source=google&utm_medium=paid_search").channel,"google_paid");
 assert.equal(get("?utm_source=googleads").channel,"google_paid");
 assert.equal(get("?gclid=private-click-token").channel,"google_paid");
 assert.equal(get("?gbraid=private-click-token").channel,"google_paid");
 assert.equal(get("?utm_source=google").channel,"google_unclassified");
 assert.equal(get("?utm_source=facebook&utm_medium=paid_social").channel,"social");
 assert.equal(get("","https://www.fbmn.com.vn/san-pham").channel,"direct");
 assert.equal(get("","https://www.fbmn.vn/san-pham").channel,"direct");
});
test("Attribution never returns raw referrer, query, click ID or unsafe campaign",()=>{
 const value=get("?utm_source=google&utm_medium=organic&utm_campaign=abc&gclid=SECRET",
  "https://www.google.com/search?q=secret");
 assert.equal(value.source,"google");
 assert.equal(value.channel,"google_paid"); // marker outranks UTM organic.
 assert.equal(value.campaign,undefined);
 assert.equal(JSON.stringify(value).includes("SECRET"),false);
 assert.equal(JSON.stringify(value).includes("secret"),false);
 const campaign=get("?utm_source=google&utm_medium=organic&utm_campaign=fbmn-school-2026");
 assert.equal(campaign.campaign,"fbmn-school-2026");
 assert.equal(get("?utm_campaign=alice@example.com").campaign,undefined);
});
test("Only public canonical routes are eligible as page keys",()=>{
 for(const path of ["/","/san-pham","/catalogue","/lien-he","/gia-cong","/dai-ly",
  "/san-pham/sku-3ac08ff247847c1e77bfccb0e806ed29","/danh-muc/school"])
  assert.equal(analyticsPublicPageKey(path),path);
 for(const path of ["/policy","/admin","/api/contact","/san-pham?q=private",
  "/dai-ly#mail","/san-pham/sku?email=abc","/san-pham/a/b",
  "/danh-muc/%3Fquery","/danh-muc/alice@example.com"])
  assert.equal(analyticsPublicPageKey(path),undefined);
});
