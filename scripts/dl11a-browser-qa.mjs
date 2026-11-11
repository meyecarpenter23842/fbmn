import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
const browser=await chromium.launch();
await mkdir("artifacts/dl11a",{recursive:true});
try{for(const width of [1440,1280,1024,801,768,390,360]){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
 await page.addInitScript(()=>localStorage.setItem("fbmn-app-download-last-shown",String(Date.now())));
 await page.goto("http://127.0.0.1:3100/",{waitUntil:"domcontentloaded"});
 const header=page.locator(".ref-header");
 await header.waitFor();
 const g=await header.evaluate(el=>({height:el.getBoundingClientRect().height,top:el.getBoundingClientRect().top,overflow:el.scrollWidth>el.clientWidth+2}));
 assert.ok(g.height<=76&&g.top>=5&&!g.overflow,JSON.stringify({width,g}));
 if(width>800){
  const nav=page.locator("#site-navigation");
  const links=nav.locator(".ref-navigation__link");
  assert.equal(await links.count(),6);
  const logo=nav.locator(".ref-brand");assert.ok(await logo.isVisible());
  const b=await logo.boundingBox();const left=await links.nth(2).boundingBox(),right=await links.nth(3).boundingBox();
  assert.ok(left.x+left.width<=b.x+1&&b.x+b.width<=right.x+1,"logo between three links each side");
  assert.ok(Math.abs(b.x+b.width/2-width/2)<20,"centered logo");
  assert.ok(await page.locator(".ref-header__desktop-search").isVisible());
 }else{
  const toggle=page.locator('button[aria-controls="site-navigation"]');
  await toggle.click();assert.equal(await toggle.getAttribute("aria-expanded"),"true");
  await page.locator("#site-navigation .ref-navigation__link").last().waitFor({state:"visible"});
  await page.screenshot({path:"artifacts/dl11a/menu-"+width+".png"});
  await page.keyboard.press("Escape");assert.equal(await toggle.getAttribute("aria-expanded"),"false");
  const search=page.locator('button[aria-controls="ref-mobile-search"]');await search.click();
  assert.ok(await page.locator("#ref-mobile-search").isVisible());await page.keyboard.press("Escape");
 }
 await page.screenshot({path:"artifacts/dl11a/header-"+width+".png"});
 const btn=page.getByRole("button",{name:"Tải ứng dụng",exact:true});await btn.scrollIntoViewIfNeeded();await btn.click();
 const dialog=page.getByRole("dialog",{name:"Ứng dụng Futurebook"});await dialog.waitFor();
 assert.equal(await dialog.locator(".app-download__store--unavailable").count(),2);
 await page.screenshot({path:"artifacts/dl11a/app-"+width+".png"});
 await dialog.getByRole("button",{name:"Đóng thông báo tải ứng dụng"}).click();
 await dialog.waitFor({state:"hidden"});await page.close();
 console.log("DL11A_BROWSER_OK "+width);
}}finally{await browser.close();}
