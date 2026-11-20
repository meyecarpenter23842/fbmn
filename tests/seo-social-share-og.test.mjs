import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {socialShareMetadata,SOCIAL_IMAGE_URL,SOCIAL_IMAGE_PATH}
 from "../lib/seo/social-share.ts";
const src=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("OG share metadata uses one canonical branded 1200x630 fallback",()=>{
 const meta=socialShareMetadata({
  title:"Futurebook Miền Nam",description:"Tập vở và giấy",path:"/"
 });
 assert.equal(SOCIAL_IMAGE_PATH,"/api/social-preview");
 assert.equal(SOCIAL_IMAGE_URL,"https://www.fbmn.vn/api/social-preview");
 assert.equal(meta.openGraph.url,"https://www.fbmn.vn/");
 assert.equal(meta.openGraph.siteName,"Futurebook Miền Nam");
 assert.equal(meta.openGraph.title,"Futurebook Miền Nam");
 assert.deepEqual(meta.openGraph.images,[{
  url:SOCIAL_IMAGE_URL,width:1200,height:630,
  alt:"Futurebook Miền Nam – tập vở và văn phòng phẩm"
 }]);
 assert.equal(meta.twitter.card,"summary_large_image");
 assert.deepEqual(meta.twitter.images,[SOCIAL_IMAGE_URL]);
});
test("Product OG uses only approved real media and does not invent dimensions",()=>{
 const real="https://www.fbmn.vn/api/catalogue-image/11111111-1111-4111-a111-111111111111";
 const meta=socialShareMetadata({
  title:"SKU P003 | Futurebook",description:"Thông số đã xuất bản",
  path:"/san-pham/sku-949cacde498fb835f2a00f2b6f72567d",
  images:[real,real]
 });
 assert.equal(meta.openGraph.url,
  "https://www.fbmn.vn/san-pham/sku-949cacde498fb835f2a00f2b6f72567d");
 assert.deepEqual(meta.openGraph.images,[real]);
 assert.deepEqual(meta.twitter.images,[real]);
 const fallback=socialShareMetadata({title:"SKU thiếu ảnh",description:"Không có ảnh",
  path:"/san-pham/sku-949cacde498fb835f2a00f2b6f72567d",images:[]});
 assert.equal(fallback.openGraph.images[0].url,SOCIAL_IMAGE_URL);
});
test("Social links preserve canonical page 2 and article publishedTime",()=>{
 const list=socialShareMetadata({title:"Trang 2",description:"VPP",path:"/san-pham?trang=2"});
 assert.equal(list.openGraph.url,"https://www.fbmn.vn/san-pham?trang=2");
 const news=socialShareMetadata({title:"Bản tin",description:"Thông báo đã duyệt",
  path:"/tin-tuc/sample",publishedTime:"2026-11-18T00:00:00.000Z"});
 assert.equal(news.openGraph.type,"article");
 assert.equal(news.openGraph.publishedTime,"2026-11-18T00:00:00.000Z");
});
test("Default OG PNG uses the exact source-controlled Futurebook logo and no made-up products",()=>{
 const route=src("app/api/social-preview/route.tsx");
 assert.match(route,/import \{ImageResponse\} from "next\/og"/);
 assert.match(route,/public","brand","fbmn-mark.svg"/);
 assert.match(route,/width:1200,height:630/);
 assert.match(route,/data:image\/svg\+xml;base64/);
 assert.match(route,/Cache-Control/);
 assert.doesNotMatch(route,/productCatalogue|NET|fakeSku|random\(/);
 assert.match(src("app/robots.ts"),/allow:\["\/","\/api\/social-preview"/);
});
test("Root, pages, SKU, category, article and custom overrides all provide OG and Twitter images",()=>{
 const layout=src("app/layout.tsx");
 assert.match(layout,/socialShareMetadata/);
 const structure=src("lib/seo/structured-data.ts");
 assert.match(structure,/socialShareMetadata\(\{title,description,path:url,images\}\)/);
 assert.match(structure,/socialShareMetadata\(\{title,description,path:url\}\)/);
 assert.match(structure,/socialShareMetadata\(\{title,description,path:url,publishedTime:article.publishedAt\}\)/);
 assert.match(structure,/const images=productSeoImages\(product\)/);
 const policy=src("lib/seo/public-settings.ts");
 assert.match(policy,/verifiedImage\?\{images:\[verifiedImage\]\}/);
 assert.match(policy,/openGraph,twitter/);
 const listing=src("lib/seo/catalogue-pagination.ts");
 assert.match(listing,/socialShareMetadata\(\{title,description,path:filtered\?"\/san-pham":canonical\}\)/);
 assert.match(src("app/khuyen-mai/[slug]/page.tsx"),/socialShareMetadata/);
 assert.match(src("app/policy/page.tsx"),/socialShareMetadata/);
 for(const page of ["catalogue","tin-tuc","khuyen-mai","bang-tin","lien-he",
  "dai-ly","gia-cong","gioi-thieu"]){
  assert.match(src("app/"+page+"/page.tsx"),/socialShareMetadata\(/);
 }
});
