import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch();
await mkdir("artifacts/dl11a",{recursive:true});
try{for(const width of [1440,1280,1024,801,768,390,360]){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
 await page.addInitScript(()=>localStorage.setItem("fbmn:app-download:last-shown:v1",String(Date.now())));
 await page.goto("http://127.0.0.1:3100/",{waitUntil:"domcontentloaded"});
 const header=page.locator(".ref-header");
 await header.waitFor();
 const g=await header.evaluate(el=>({height:el.getBoundingClientRect().height,top:el.getBoundingClientRect().top,overflow:el.scrollWidth>el.clientWidth+2}));
 assert.ok(g.height<=76&&g.top>=(width>800?19:13)&&!g.overflow,JSON.stringify({width,g}));
 const backdrop=await page.locator(".fb-glass-site").evaluate(el=>({top:el.getBoundingClientRect().top,bg:getComputedStyle(el).backgroundImage}));
 assert.ok(Math.abs(backdrop.top)<1&&backdrop.bg!=="none","background covers top gap "+JSON.stringify(backdrop));
 if(width>800){
  const nav=page.locator("#site-navigation");
  const links=nav.locator(".ref-navigation__link");
  assert.equal(await links.count(),6);
  const logo=nav.locator(".ref-brand");assert.ok(await logo.isVisible());
  const b=await logo.boundingBox();const left=await links.nth(2).boundingBox(),right=await links.nth(3).boundingBox();
  assert.ok(left.x+left.width<=b.x+1&&b.x+b.width<=right.x+1,"logo between three links each side");
  assert.ok(Math.abs(b.x+b.width/2-width/2)<20,"centered logo");
  assert.ok(await page.locator(".ref-header__desktop-search").isVisible());
  if(width===1440){
   await page.emulateMedia({reducedMotion:"no-preference"});
   const link=links.nth(1);await link.hover();await page.waitForTimeout(250);
   assert.notEqual(await link.evaluate(el=>getComputedStyle(el).transform),"none");
   assert.notEqual(await link.evaluate(el=>getComputedStyle(el).boxShadow),"none");
   await page.screenshot({path:"artifacts/dl11a/hover-1440.png"});
   await page.mouse.down();await page.waitForTimeout(220);
   const press=await link.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);assert.ok(press<.99,"pressed link scales");
   await page.mouse.move(2,2);await page.mouse.up();
   await page.emulateMedia({reducedMotion:"reduce"});await link.hover();
   assert.equal(await link.evaluate(el=>getComputedStyle(el).transform),"none");
  }
 }else{
  const toggle=page.locator('button[aria-controls="site-navigation"]');
  const searchToggle=page.locator('button[aria-controls="ref-mobile-search"]');
  const logo=page.locator(".ref-brand--mobile");
  const s=await searchToggle.boundingBox(),b=await logo.boundingBox(),m=await toggle.boundingBox();
  assert.ok(s.x+s.width<=b.x&&b.x+b.width<=m.x,"search left, logo center, hamburger right");
  assert.ok(Math.abs(b.x+b.width/2-width/2)<2,"mobile logo centered");
  await toggle.click();assert.equal(await toggle.getAttribute("aria-expanded"),"true");
  await page.locator("#site-navigation .ref-navigation__link").last().waitFor({state:"visible"});
  await page.screenshot({path:"artifacts/dl11a/menu-"+width+".png"});
  await page.keyboard.press("Escape");assert.equal(await toggle.getAttribute("aria-expanded"),"false");
  const search=page.locator('button[aria-controls="ref-mobile-search"]');await search.click();
  assert.ok(await page.locator("#ref-mobile-search").isVisible());await page.keyboard.press("Escape");
 }
 await page.screenshot({path:"artifacts/dl11a/header-"+width+".png"});
 // Content shells also used to collapse the header margin, notably Gia công.
 await page.goto("http://127.0.0.1:3100/gia-cong",{waitUntil:"domcontentloaded"});
 assert.ok(await page.locator(".fb-glass-site").evaluate(el=>Math.abs(el.getBoundingClientRect().top)<1));
 assert.ok(await page.locator(".ref-header").evaluate(el=>el.getBoundingClientRect().top>10));
 await page.screenshot({path:"artifacts/dl11a/gia-cong-"+width+".png"});
 await page.evaluate(()=>window.scrollTo(0,Math.min(500,document.documentElement.scrollHeight-innerHeight)));
 await page.waitForTimeout(250);
 const sticky=await page.locator(".ref-header").evaluate(el=>({top:el.getBoundingClientRect().top,scroll:scrollY,position:getComputedStyle(el).position}));
 assert.ok(sticky.scroll>50&&sticky.top>=0&&sticky.top<=20&&sticky.position==="sticky",JSON.stringify({width,sticky}));
 if(width<=800){const toggle=page.locator('button[aria-controls="site-navigation"]');await toggle.click();await page.locator("#site-navigation .ref-navigation__link").last().waitFor({state:"visible"});await page.keyboard.press("Escape");}
 await page.screenshot({path:"artifacts/dl11a/sticky-"+width+".png"});
 const btn=page.getByRole("button",{name:"Tải ứng dụng",exact:true});await btn.scrollIntoViewIfNeeded();await btn.click();
 const dialog=page.getByRole("dialog",{name:"Ứng dụng Futurebook"});await dialog.waitFor();
 assert.equal(await dialog.locator(".app-download__store--unavailable").count(),2);
 await page.screenshot({path:"artifacts/dl11a/app-"+width+".png"});
 await dialog.getByRole("button",{name:"Đóng thông báo tải ứng dụng"}).click();
 await dialog.waitFor({state:"hidden"});await page.close();
 const policy=await browser.newPage({viewport:{width,height:900}});
 const response=await policy.goto("http://127.0.0.1:3100/policy",{waitUntil:"domcontentloaded"});
 assert.equal(response.status(),200);await policy.getByRole("heading",{name:"Chính sách bảo mật",exact:true}).waitFor();
 await policy.waitForTimeout(1600);
 assert.equal(await policy.locator(".ref-header,.site-footer,.app-download,.fb-chat__launcher,.cms-web-popup-dialog").count(),0);
 assert.equal(await policy.locator("html").evaluate(el=>el.scrollWidth>innerWidth+2),false);
 assert.ok(await policy.locator("#data-deletion").isVisible());
 assert.equal(await policy.locator("link[rel=canonical]").getAttribute("href"),"https://fbmn.vn/policy");
 await policy.screenshot({path:"artifacts/dl11a/policy-"+width+".png"});await policy.close();
 console.log("DL11B_BROWSER_OK "+width);
}}finally{await browser.close();}
