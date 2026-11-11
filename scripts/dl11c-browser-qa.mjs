import {chromium} from "playwright";
import assert from "node:assert/strict";
const origin="http://127.0.0.1:3100";
const browser=await chromium.launch();
const records=[];
const page=await browser.newPage({viewport:{width:390,height:844}});
try{
 await page.route("**/api/analytics",async route=>{
  const record=JSON.parse(route.request().postData()||"null");
  records.push(record);
  // The client must not transmit any form text, query, raw referrer or identity.
  const forbidden=["email","phone","name","message","details","text","referrer","url","ip","user_agent","cookie"];
  assert.ok(!Object.keys(record).some(key=>forbidden.includes(key)),JSON.stringify(record));
  assert.ok(!JSON.stringify(record).includes("private@example.com"));
  await route.fulfill({status:204,body:""});
 });
 await page.addInitScript(()=>localStorage.setItem("fbmn:app-download:last-shown:v1",String(Date.now())));
 await page.goto(origin+"/?utm_source=facebook&utm_medium=paid_social&utm_campaign=fbmn-autumn26&email=private@example.com",{waitUntil:"domcontentloaded"});
 await page.waitForTimeout(650);
 assert.equal(records.filter(r=>r.event==="web_page_view").length,1,"Initial pageview counted once");
 assert.equal(records.filter(r=>r.event==="web_session_start").length,1);
 assert.equal(records.find(r=>r.event==="web_page_view")?.traffic_source,"facebook");
 assert.equal(records.find(r=>r.event==="web_page_view")?.utm_campaign,"fbmn-autumn26");
 await page.getByRole("button",{name:"Mở chat Futurebook"}).click();
 await page.waitForTimeout(250);
 assert.equal(records.filter(r=>r.event==="web_chat_open").length,1);
 await page.goto(origin+"/policy",{waitUntil:"domcontentloaded"});
 const before=records.length;await page.waitForTimeout(250);
 assert.equal(records.length,before,"Privacy Policy is excluded from client analytics");
 await page.goto(origin+"/",{waitUntil:"domcontentloaded"});await page.waitForTimeout(400);
 assert.equal(records.filter(r=>r.event==="web_page_view"&&r.page_type==="home").length,2,"Returning from Policy counts a new pageview");
 await page.route("**/api/contact",async route=>{
  const count=Number((page).__contactCalls||0)+1;
  (page).__contactCalls=count;
  await route.fulfill({status:count===1?503:201,contentType:"application/json",
   body:JSON.stringify(count===1?{ok:false}:{ok:true})});
 });
 await page.goto(origin+"/lien-he",{waitUntil:"domcontentloaded"});
 const form=page.locator("form.content-contact-form");
 await form.waitFor();
 await form.locator('input[autocomplete="name"]').fill("Test khách hàng");
 await form.locator('input[type="email"]').fill("private@example.com");
 await form.locator("select").first().selectOption({index:1});
 await form.locator("select").nth(1).selectOption({index:1});
 await form.locator('.contact-interest-grid input[type="checkbox"]').first().check();
 await form.locator('.content-consent input[type="checkbox"]').check();
 await form.getByRole("button",{name:"Gửi liên hệ"}).click();
 await page.waitForTimeout(300);
 assert.equal(records.filter(r=>r.event==="web_contact_submit_attempt").length,1);
 assert.equal(records.filter(r=>r.event==="web_contact_submit_success").length,0,"A 503 is never a conversion");
 await form.getByRole("button",{name:"Gửi liên hệ"}).click();
 await page.waitForTimeout(400);
 assert.equal(records.filter(r=>r.event==="web_contact_submit_attempt").length,2);
 assert.equal(records.filter(r=>r.event==="web_contact_submit_success").length,1,"Only 201 + ok:true counts");
 assert.equal(records.filter(r=>r.event==="web_session_start").length,1,"No duplicate session starts on navigation");
 console.log("DL11C_BROWSER_ANALYTICS_OK "+JSON.stringify({events:records.length,views:records.filter(r=>r.event==="web_page_view").length,success:1}));
}finally{await page.close();await browser.close();}
