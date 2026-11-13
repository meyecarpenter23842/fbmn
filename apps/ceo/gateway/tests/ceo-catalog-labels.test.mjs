import test from 'node:test';
import assert from 'node:assert/strict';
import {attachCatalogNames} from '../lib/ceo-catalog-labels.mjs';
const base = {products:[{label:'sku-a1',count:4},{label:'sku-legacy',count:2}],categories:[{label:'tap-hoc-sinh',count:3},{label:'chua-phan-loai',count:1}],metrics:{productViews:6}};
const page = {data:{categories:[{id:'id-cat-1',slug:'tap-hoc-sinh',name:'Tập học sinh'}],products:[{id:'p1',slug:'sku-a1',legacySlugs:['sku-legacy'],name:'Tập Học Sinh Futurebook'}]},pagination:{page:1,limit:1000,totalPages:1}};
const transport = async (url,options) => {
 assert.match(url,/\/v1\/public\/catalog\?page=1&limit=1000$/);
 assert.equal(options.method,'GET');
 return new Response(JSON.stringify(page),{status:200,headers:{'content-type':'application/json'}});
};
test('historical slug, legacy slug and categories resolve to live public names',async()=>{
 const resolved = await attachCatalogNames(base,'https://example.com',transport);
 assert.deepEqual(resolved.products.map(x=>x.label),['Tập Học Sinh Futurebook','Tập Học Sinh Futurebook']);
 assert.deepEqual(resolved.categories.map(x=>x.label),['Tập học sinh','Chưa phân loại']);
 assert.deepEqual(resolved.products.map(x=>x.count),[4,2]);
 assert.deepEqual(resolved.metrics,base.metrics);
 assert.equal(resolved.labelsUnavailable,false);
});
test('unknown or unpublished SKU is not given an invented title',async()=>{
 const resolved=await attachCatalogNames({...base,products:[{label:'sku-deleted',count:2}]},'https://example.com',transport);
 assert.match(resolved.products[0].label,/Không tìm thấy tên sản phẩm \(sku-deleted\)/);
});
test('requires HTTPS fixed API origin and rejects invalid read models',async()=>{
 await assert.rejects(attachCatalogNames(base,'http://evil.com',transport),/origin_invalid/);
 const bad=async()=>new Response(JSON.stringify({data:{products:[],categories:[]},pagination:{page:1,limit:1000,totalPages:1000}}),{status:200,headers:{'content-type':'application/json'}});
 await assert.rejects(attachCatalogNames(base,'https://example.com',bad),/public_catalog_invalid/);
});
test('zero rankings do not request a remote catalogue',async()=>{
 const s={...base,products:[],categories:[]};
 assert.deepEqual(await attachCatalogNames(s,'',()=>{throw Error('must not run')}),{...s,labelsUnavailable:false});
});

test('chunked oversized catalogue is rejected during streaming, before buffering it all',async()=>{
 let produced=0;let cancelled=false;
 const stream=new ReadableStream({
  pull(controller){
   controller.enqueue(new Uint8Array(1024*1024));
   produced++;
   if(produced>40)controller.close();
  },
  cancel(){cancelled=true;}
 });
 const transport=async()=>new Response(stream,{status:200,headers:{'content-type':'application/json'}});
 await assert.rejects(attachCatalogNames(base,'https://example.com',transport),/public_catalog_oversized/);
 assert.ok(produced<=10, 'reader must stop near the 8MiB boundary');
 assert.equal(cancelled,true);
});
