import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
const pathUrl=path=>new URL("../"+path,import.meta.url);
const read=path=>readFileSync(pathUrl(path),"utf8");
const bytes=path=>readFileSync(pathUrl(path));
const pngSig=Buffer.from([137,80,78,71,13,10,26,10]);

test("SEO08 uses approved red/purple FBMN icon and Google-compatible bitmap",()=>{
 const mark=read("public/brand/fbmn-mark.svg");
 assert.equal(read("apps/admin/public/brand/fbmn-mark.svg"),mark);
 assert.equal(read("public/favicon.svg"),mark);
 assert.match(mark,/viewBox="0 0 726 715"/);
 assert.match(mark,/#623f9b/);
 assert.match(mark,/#c8222c/);
 const layout=read("app/layout.tsx");
 assert.match(layout,/favicon-96\.png/);
 assert.match(layout,/image\/png/);
 assert.match(layout,/favicon\.ico/);
 assert.match(layout,/apple-touch-icon\.png/);
 assert.doesNotMatch(layout,/icons:.*fbmn-mark\.svg/);
 assert.equal(existsSync(pathUrl("app/favicon.ico/route.ts")),false,
   "do not redirect /favicon.ico to unsupported SVG");
 const png=bytes("public/favicon-96.png");
 assert.deepEqual(png.subarray(0,8),pngSig);
 assert.equal(png.readUInt32BE(16),96);
 assert.equal(png.readUInt32BE(20),96);
 assert.equal(png[24],8); // bit depth
 assert.equal(png[25],2); // truecolour RGB
 const apple=bytes("public/apple-touch-icon.png");
 assert.deepEqual(apple.subarray(0,8),pngSig);
 assert.equal(apple.readUInt32BE(16),180);
 assert.equal(apple.readUInt32BE(20),180);
 const ico=bytes("public/favicon.ico");
 assert.equal(ico.readUInt16LE(0),0);
 assert.equal(ico.readUInt16LE(2),1);
 assert.equal(ico.readUInt16LE(4),4);
 const sizes=new Set();
 for(let i=0;i<ico.readUInt16LE(4);i++){
   const at=6+i*16,width=ico[at]||256,height=ico[at+1]||256;
   assert.equal(width,height);sizes.add(width);
   const len=ico.readUInt32LE(at+8),offset=ico.readUInt32LE(at+12);
   assert.ok(offset>=70 && offset+len<=ico.length);
   assert.deepEqual(ico.subarray(offset,offset+8),pngSig);
 }
 assert.deepEqual([...sizes].sort((a,b)=>a-b),[16,32,48,96]);
});

test("SEO08 preserves primary domain and puts WebSite name on homepage only",()=>{
 const home=read("app/page.tsx");
 const jsonld=read("lib/seo/structured-data.ts");
 const config=read("next.config.ts");
 const sitemap=read("app/sitemap.ts");
 assert.match(home,/SeoJsonLd data=\{websiteSchema\(\)\}/);
 assert.match(jsonld,/alternateName:\["FBMN","fbmn.vn"\]/);
 assert.match(jsonld,/name:BRAND,alternateName/);
 assert.match(jsonld,/SEO_ORIGIN="https:\/\/www\.fbmn\.vn"/);
 assert.match(config,/https:\/\/www\.fbmn\.vn\/:path\*/);
 assert.match(sitemap,/const ORIGIN="https:\/\/www\.fbmn\.vn"/);
});

test("Admin favicon configuration remains untouched in SEO08",()=>{
 const admin=read("apps/admin/app/layout.tsx");
 assert.match(admin,/fbmn-mark\.svg\?v=20261104/);
});
