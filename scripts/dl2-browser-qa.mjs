// DL2 acceptance check against the deployed *production* Website, not PR preview.
// No product media fixtures: stage geometry and live approved R2 status are distinct.
import {chromium} from "playwright";
import {mkdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
const site=process.env.DL2_BASE_URL||"https://fbmn-web.vercel.app";
if(site!=="https://fbmn-web.vercel.app")throw new Error("Production site only");
const out=resolve(process.env.DL2_OUTPUT_DIR||"artifacts/dl2");
const widths=[1440,1280,768,390,360];
const routes=[
 {name:"home",path:"/",selector:".ref-product-card__image"},
 {name:"catalog",path:"/san-pham",selector:".catalog-grid .fb-song-related-image"},
 {name:"related",path:"/san-pham/sku-3ac08ff247847c1e77bfccb0e806ed29",selector:".fb-song-related-grid .fb-song-related-image"},
];
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const observations=[],failures=[],warnings=[];
try {
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:width>800?900:844},locale:"vi-VN",colorScheme:"light",reducedMotion:"reduce"});
  for(const item of routes){
   const page=await context.newPage(),errors=[];
   page.on("pageerror",error=>errors.push(error.message));
   try{
    const response=await page.goto(site+item.path,{waitUntil:"domcontentloaded",timeout:35000});
    await page.locator("body").waitFor({state:"visible",timeout:10000});
    const stage=page.locator(item.selector).first();
    await stage.waitFor({state:"visible",timeout:15000});
    await stage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const visual=await page.evaluate(({selector,name})=>{
      const stages=[...document.querySelectorAll(selector)];
      const rect=stages[0]?.getBoundingClientRect();
      const related=stages[0]?.closest(".fb-song-related-hit");
      const photo=stages[0]?.querySelector("img.catalog-real-image");
      const book=stages[0]?.querySelector(".notebook");
      const artBox=book?.getBoundingClientRect();
      const targets=[...document.querySelectorAll("a.fb-song-related-hit")];
      return {
        stages:stages.length,
        stageHeight:rect?Math.round(rect.height):null,
        stageWidth:rect?Math.round(rect.width):null,
        publishedCardImages:stages.filter(x=>!!x.querySelector("img.catalog-real-image")).length,
        placeholderCards:stages.filter(x=>!!x.querySelector(".catalog-empty-image")).length,
        photoFit:photo?getComputedStyle(photo).objectFit:null,
        photoPadding:photo?getComputedStyle(photo).padding:null,
        bookWidth:artBox?Math.round(artBox.width):null,
        bookHeight:artBox?Math.round(artBox.height):null,
        imageColumn:related?getComputedStyle(related).gridTemplateColumns:null,
        cardLinks:targets.length,
        firstHref:targets[0]?.getAttribute("href")||null,
        horizontalOverflow:document.documentElement.scrollWidth>innerWidth+3,
        documentWidth:document.documentElement.scrollWidth,
        viewport:innerWidth,
        realCoverBroken:[...document.images].filter(x=>x.classList.contains("catalog-real-image")&&x.complete&&!x.naturalWidth).length,
        visibleLabels:[...document.querySelectorAll(".fb-song-related-body h3")].slice(0,3).map(x=>(x.textContent||"").trim()),
      };
    },{selector:item.selector,name:item.name});
    const screenshot=item.name+"-"+width+".png";
    await page.screenshot({path:resolve(out,screenshot),fullPage:true,animations:"disabled",timeout:30000});
    const measurement={route:item.path,kind:item.name,width,status:response?.status(),screenshot,...visual,pageErrors:errors};
    observations.push(measurement);
    if(measurement.status!==200)failures.push(item.name+"/"+width+" HTTP "+measurement.status);
    if(measurement.stages<1)failures.push(item.name+"/"+width+" no product preview");
    if(measurement.horizontalOverflow)failures.push(item.name+"/"+width+" body horizontal overflow");
    if(errors.length)failures.push(item.name+"/"+width+" JavaScript "+errors.slice(0,2).join("; "));
    const limit=item.name==="home"?(width<=800?189:237):(width<=700?147:215);
    if(measurement.stageHeight===null||measurement.stageHeight<limit)
      failures.push(item.name+"/"+width+" image stage only "+measurement.stageHeight+"px (required >= "+limit+"px)");
    if(item.name==="home"){
      if(!measurement.bookWidth||measurement.bookWidth<70)
        failures.push("home/"+width+" illustrative book remains too small");
    }else{
      if(measurement.publishedCardImages===0)
        warnings.push(item.name+"/"+width+" no approved product cover images in visible result set; placeholder-only card photo assessment");
      if(measurement.photoFit&&measurement.photoFit!=="contain")
        failures.push(item.name+"/"+width+" verified cover image is "+measurement.photoFit);
      if(measurement.realCoverBroken)warnings.push(item.name+"/"+width+" broken verified image count "+measurement.realCoverBroken);
      if(item.name==="catalog"&&width===390&&measurement.firstHref){
        await page.locator(".catalog-grid .fb-song-related-hit").first().click();
        await page.waitForURL(/\/san-pham\/(?!$)/,{timeout:12000});
        measurement.cardOpenedUrl=new URL(page.url()).pathname;
        if(!measurement.cardOpenedUrl.startsWith("/san-pham/"))
          failures.push("catalog/390 card did not open detail page");
      }
    }
   }catch(e){
     failures.push(item.name+"/"+width+" browser probe: "+String(e).slice(0,240));
     observations.push({kind:item.name,path:item.path,width,error:String(e).slice(0,400)});
   }finally{await page.close();}
  }
  await context.close();
 }
}finally{await browser.close();}
const report={site,capturedAt:new Date().toISOString(),widths,commit:process.env.GITHUB_SHA||null,failures,warnings,observations,
 notes:["Source is production, not a fixture or PR preview.","Screenshots are visual evidence; human pixel comparison is a separate Owner decision.","Image size can be verified without approving any missing SKU photo."]};
await writeFile(resolve(out,"report.json"),JSON.stringify(report,null,2)+"\n");
const rows=observations.map(x=>"| "+x.kind+" | "+x.width+" | "+(x.status??"—")+" | "+(x.stageHeight??"—")+" | "+(x.publishedCardImages??"—")+" | "+(x.horizontalOverflow??"—")+" |");
const markdown=[
 "# DL2 production browser UI acceptance","","Site: "+site,"Screenshots: "+observations.filter(x=>x.screenshot).length,
 "Hard failures: "+failures.length,"Warnings: "+warnings.length,"",
 "| Page | Width | HTTP | Photo stage px | Verified photos | Horizontal overflow |",
 "|---|---:|---:|---:|---:|---|",...rows,
 "","## Failures",...(failures.length?failures.map(x=>"- "+x):["- None"]),
 "","## Warnings",...(warnings.length?warnings.map(x=>"- "+x):["- None"]),
 "","Full-page screenshots and report.json are in the uploaded workflow artifact.",
];
await writeFile(resolve(out,"report.md"),markdown.join("\n")+"\n");
console.log(markdown.join("\n"));
if(failures.length)process.exitCode=1;
