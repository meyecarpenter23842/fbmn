import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import nextConfig from "../next.config.ts";
import {projectPublishedCatalogueSeoBooks,getPublishedCatalogueSeoBooks} from "../lib/catalogue/seo-books.ts";
const one="b321bf38-e6cd-4131-b456-4e638e126535";
const two="3a7c4e90-676b-430b-a893-1f6b94f91a8a";
const fixture={data:{books:[
 {id:one,title:"Futurebook Miền Nam",edition:"2027",hasPages:true,hasPdf:false},
 {id:two,title:"Catalogue Học tập",edition:"2026",hasPages:false,hasPdf:true}
],viewerSettings:{flipDurationMs:950,soundEnabled:false,soundVolume:35,shadowOpacity:.26}}};
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("SEO P2 uses only published catalogue metadata from the existing public Worker",()=>{
 const result=projectPublishedCatalogueSeoBooks(fixture);
 assert.deepEqual(result,[
  {id:one,title:"Futurebook Miền Nam",edition:"2027",hasPages:true,hasPdf:false},
  {id:two,title:"Catalogue Học tập",edition:"2026",hasPages:false,hasPdf:true}
 ]);
 assert.deepEqual(projectPublishedCatalogueSeoBooks({data:{books:[]}}),[]);
 assert.deepEqual(projectPublishedCatalogueSeoBooks({data:{books:[{id:one,title:"",edition:"2027"}]}}),[]);
 assert.deepEqual(projectPublishedCatalogueSeoBooks({data:{books:[{id:one,title:"Draft",edition:"x",hasPages:false,hasPdf:false}]}}),[]);
 assert.deepEqual(projectPublishedCatalogueSeoBooks({data:{books:[fixture.data.books[0],fixture.data.books[0]]}}),[]);
 assert.deepEqual(projectPublishedCatalogueSeoBooks({data:{books:Array(101).fill(fixture.data.books[0])}}),[]);
});

test("SEO P2 worker catalogue list is no-store and fail closed on upstream failures",async()=>{
 let seen="";
 const transport=async (url,options)=>{
  seen=String(url);
  assert.equal(options.method,"GET");
  assert.equal(options.cache,"no-store");
  assert.equal(options.redirect,"manual");
  assert.equal(options.headers.Accept,"application/json");
  return Response.json(fixture);
 };
 const books=await getPublishedCatalogueSeoBooks(transport,"https://api.example.com");
 assert.equal(seen,"https://api.example.com/v1/public/catalogue-books");
 assert.equal(books.length,2);
 assert.deepEqual(await getPublishedCatalogueSeoBooks(transport,null),[]);
 const gone=async()=>new Response("not found",{status:404});
 assert.deepEqual(await getPublishedCatalogueSeoBooks(gone,"https://api.example.com"),[]);
 const redirect=async()=>Response.redirect("https://malicious.invalid",302);
 assert.deepEqual(await getPublishedCatalogueSeoBooks(redirect,"https://api.example.com"),[]);
 const bad=async()=>new Response("<html>Forbidden</html>",{status:200,headers:{"content-type":"text/html"}});
 assert.deepEqual(await getPublishedCatalogueSeoBooks(bad,"https://api.example.com"),[]);
 const broken=async()=>{throw new Error("network down")};
 assert.deepEqual(await getPublishedCatalogueSeoBooks(broken,"https://api.example.com"),[]);
});

test("SEO P2 catalogue first HTML includes server-rendered book titles and crawlable links",()=>{
 const page=read("app/catalogue/page.tsx");
 assert.match(page,/export const dynamic="force-dynamic"/);
 assert.match(page,/await getPublishedCatalogueSeoBooks\(\)/);
 assert.match(page,/published\.map\(book=><li/);
 assert.match(page,/<a href=\{"\/catalogue\?book="\+encodeURIComponent\(book\.id\)\}>/);
 assert.match(page,/SeoJsonLd data=\{\{/);
 assert.match(page,/CollectionPage/);
 assert.match(page,/canonical: "\/catalogue"/);
 const viewer=read("app/catalogue/catalogue-flipbook.tsx");
 assert.match(viewer,/new URLSearchParams\(location\.search\)\.get\("book"\)/);
 assert.match(viewer,/await loadBook\(selected\.id,currentRequestedPage\(\)\)/);
});

test("SEO P2 canonical origin and permanent secondary-host redirects remain aligned",async()=>{
 const urls=await nextConfig.redirects();
 for(const host of ["fbmn.com.vn","www.fbmn.com.vn"]){
  const redirect=urls.find(x=>x.has?.some(q=>q.type==="host"&&q.value===host));
  assert.equal(redirect?.destination,"https://www.fbmn.vn/:path*");
  assert.equal(redirect?.permanent,true);
 }
 const sitemap=read("app/sitemap.ts");
 const robots=read("app/robots.ts");
 const layout=read("app/layout.tsx");
 assert.match(sitemap,/const ORIGIN="https:\/\/www\.fbmn\.vn"/);
 assert.match(sitemap,/\"\/catalogue\"/);
 assert.match(sitemap,/!isNoindex\(seo,"product",product\.slug\)/);
 assert.match(robots,/sitemap:"https:\/\/www\.fbmn\.vn\/sitemap\.xml"/);
 assert.match(robots,/allow:\["\/","\/api\/catalogue-image\/"/);
 assert.match(layout,/metadataBase: new URL\("https:\/\/www\.fbmn\.vn"\)/);
});
