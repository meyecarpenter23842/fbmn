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
 if(width===390||width===360){
  const launcher=page.getByRole("button",{name:"Mở chat Futurebook"});
  await launcher.waitFor();
  const mascot=await launcher.locator(".fb-chat__mascot").evaluate(el=>{
   const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width};
  });
  assert.ok(mascot.width>=68&&mascot.left>=8&&mascot.right<=width-8,"full mascot clipped "+JSON.stringify({width,mascot}));
  // Emulate a visual viewport shrinking independently of the layout viewport:
  // this is how a mobile software keyboard obscures the composer.
  await page.evaluate(()=>{
   const visual=new EventTarget();
   visual.offsetTop=0;
   visual.height=window.innerHeight;
   Object.defineProperty(window,"visualViewport",{configurable:true,value:visual});
  });
  await launcher.click();
  const chat=page.locator("#fb-chat-panel");await chat.waitFor();
  const input=chat.locator("#fb-chat-input");
  await input.fill("Nhờ tư vấn sản phẩm");
  const geometry=await chat.evaluate(el=>{
   const r=el.getBoundingClientRect(),i=el.querySelector("#fb-chat-input").getBoundingClientRect();
   const send=el.querySelector('button[type="submit"]').getBoundingClientRect();
   return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,inputLeft:i.left,inputRight:i.right,sendLeft:send.left,sendRight:send.right,inputFont:parseFloat(getComputedStyle(el.querySelector("#fb-chat-input")).fontSize)};
  });
  assert.ok(geometry.left>=8&&geometry.right<=width-8&&geometry.inputLeft>=geometry.left&&geometry.inputRight<geometry.sendLeft&&geometry.sendRight<=geometry.right,"mobile composer overflow "+JSON.stringify({width,geometry}));
  assert.ok(geometry.inputFont>=16,"iOS input zoom risk "+JSON.stringify({width,geometry}));
  await page.screenshot({path:"artifacts/dl11a/chat-mobile-"+width+".png"});
  await page.evaluate(()=>{
   const visual=window.visualViewport;
   visual.height=window.innerHeight-280;
   visual.dispatchEvent(new Event("resize"));
  });
  // Allow visual-viewport resize styles and any pending layout frame to settle.
  await page.waitForTimeout(180);
  const keyboard=await chat.evaluate(el=>({
   bottom:el.getBoundingClientRect().bottom,
   visualBottom:visualViewport.offsetTop+visualViewport.height,
   composerBottom:el.querySelector(".fb-chat__composer").getBoundingClientRect().bottom,
   keyboardInset:getComputedStyle(el).getPropertyValue("--fb-chat-keyboard-bottom"),
   visibleHeight:getComputedStyle(el).getPropertyValue("--fb-chat-visual-height"),
   computedHeight:getComputedStyle(el).height,
   inlineHeight:el.style.height,
   visualHeight:visualViewport.height,
   inlineCss:el.style.cssText,
   computedMinHeight:getComputedStyle(el).minHeight,
   computedMaxHeight:getComputedStyle(el).maxHeight,
   computedTransition:getComputedStyle(el).transition,
   supportsHeight:CSS.supports("height",el.style.height)
  }));
  assert.ok(keyboard.bottom<=keyboard.visualBottom-8&&keyboard.composerBottom<=keyboard.visualBottom-8,
   "virtual keyboard hides mobile chat composer "+JSON.stringify({width,keyboard}));
  assert.ok(parseFloat(keyboard.keyboardInset)>=280,"VisualViewport event did not update the keyboard inset");
  // Verify that both the CSS computed height and the direct inline fallback
  // actually consume the shrunken visual viewport, not just the bottom geometry.
  assert.ok(keyboard.inlineHeight.includes(`${Math.round(keyboard.visualHeight)}px`),
   "inline mobile keyboard height was not updated "+JSON.stringify({width,keyboard}));
  assert.ok(parseFloat(keyboard.computedHeight)<=keyboard.visualHeight-16,
   "computed chat height ignores the virtual keyboard "+JSON.stringify({width,keyboard}));
  await page.evaluate(()=>{
   const visual=window.visualViewport;
   visual.height=window.innerHeight;
   visual.dispatchEvent(new Event("resize"));
  });
  await page.setViewportSize({width,height:520});
  // This test overrides visualViewport with EventTarget; keep the mock in sync
  // after resizing the *layout* viewport, like the browser would normally do.
  await page.evaluate(()=>{
   const visual=window.visualViewport;
   visual.height=window.innerHeight;
   visual.dispatchEvent(new Event("resize"));
  });
  await page.waitForTimeout(100);
  const short=await chat.evaluate(el=>({top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,h:innerHeight}));
  assert.ok(short.top>=0&&short.bottom<=short.h+1,"chat sheet escapes short viewport "+JSON.stringify({width,short}));
  await chat.getByRole("button",{name:"Đóng chatbot"}).click();
  await chat.waitFor({state:"hidden"});
  await page.setViewportSize({width,height:900});
 }
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
