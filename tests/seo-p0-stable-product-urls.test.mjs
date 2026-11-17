import {test} from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {createReadModel,PUBLIC_READ_QUERIES} from "../backend/public-api/read-model.mjs";
import {createPublicApi,projectPublicCatalog} from "../backend/public-api/handler.mjs";

const hash=key=>"sku-"+createHash("sha256").update(key).digest("hex").slice(0,32);
const catA="11111111-1111-4111-8111-111111111111";
const catB="22222222-2222-4222-8222-222222222222";
const family="b3d64f37-7f3d-453f-8e2e-09db5640b616";
const base=sku=>({sku_cong_ty:sku,name:"Sản phẩm "+sku,
  paper_size:null,product_spec:{},category_id:null,category_label:null,
  family_id:null,family_label:null});
async function catalogFor(rows){
  const model=createReadModel(async sql=>sql===PUBLIC_READ_QUERIES.p5Skus?rows:[],{enableP5:true});
  return model.getPublicCatalog();
}

test("SEO P0: existing indexed unclassified SKU URL stays canonical after category changes",async()=>{
  const original=(await catalogFor([base("P003")])).products[0];
  const expected="sku-949cacde498fb835f2a00f2b6f72567d";
  assert.equal(original.slug,expected);
  assert.equal(original.slug,hash("P003|p5-uncategorized|part:0"));
  const assigned=(await catalogFor([{...base("P003"),category_id:catA,category_label:"Tập học sinh"}])).products[0];
  const moved=(await catalogFor([{...base("P003"),category_id:catB,category_label:"Sổ tay"}])).products[0];
  assert.equal(assigned.slug,original.slug);
  assert.equal(moved.slug,original.slug);
  assert.ok(assigned.legacySlugs.includes(hash("P003|p5-"+catA+"|part:0")));
  assert.ok(moved.legacySlugs.includes(hash("P003|p5-"+catB+"|part:0")));
  assert.equal(projectPublicCatalog(await catalogFor([{...base("P003"),category_id:catA,category_label:"Tập học sinh"}])).products[0].slug,expected);
});

test("SEO P0: moving a multi-SKU family across categories keeps the original canonical URL",async()=>{
  const one={...base("0100"),family_id:family,family_label:"Song Natural"};
  const two={...base("0110"),family_id:family,family_label:"Song Natural"};
  const before=(await catalogFor([one,two])).products[0];
  const after=(await catalogFor([one,{...two,category_id:catA,category_label:"Tập học sinh"}])).products[0];
  const afterAgain=(await catalogFor([{...one,category_id:catB,category_label:"Sổ ghi chép"},two])).products[0];
  const expected=hash(family+"|p5-uncategorized|part:0");
  assert.equal(before.slug,expected);
  assert.equal(after.slug,expected);
  assert.equal(afterAgain.slug,expected);
  // Historic multi-category releases used a category-independent family key.
  assert.ok(after.legacySlugs.includes(hash("family:"+family+"|part:0")));
  assert.ok(after.legacySlugs.includes(hash(family+"|p5-"+catA+"|part:0")));
});

test("SEO P0: historic category-specific URL resolves to the published canonical product",async()=>{
  const row={...base("P003"),category_id:catA,category_label:"Tập học sinh"};
  const catalog=await catalogFor([row]);
  const oldSlug=hash("P003|p5-"+catA+"|part:0");
  const api=createPublicApi({
    getPublicCatalog:async()=>catalog,
    getPublicContent:async()=>({company:null,articles:[],promotions:[],dealerInformation:null})
  });
  const r=await api.fetch(new Request("https://worker.example.invalid/v1/public/products?slug="+oldSlug));
  assert.equal(r.status,200);
  const data=await r.json();
  assert.equal(data.data[0].slug,catalog.products[0].slug);
  assert.match(readFileSync(new URL("../app/san-pham/[slug]/page.tsx",import.meta.url),"utf8"),
    /if\(slug!==product\.slug\)permanentRedirect/);
  assert.match(readFileSync(new URL("../app/sitemap.ts",import.meta.url),"utf8"),
    /paths\.push\("\/san-pham\/"\+encodeURIComponent\(product\.slug\)\)/);
});

test("SEO P0: 100 distinct legacy category pages plus old family URL remain transport-safe",async()=>{
  const rows=Array.from({length:100},(_,i)=>{
    const id="00000000-0000-4000-8000-"+String(i+1).padStart(12,"0");
    return {...base("F"+String(i).padStart(3,"0")),
      category_id:id,category_label:"Tập học sinh",family_id:family,family_label:"Bộ tập"};
  });
  const catalog=await catalogFor(rows);
  assert.equal(catalog.products.length,1);
  assert.equal(catalog.products[0].legacySlugs.length,101);
  const safe=projectPublicCatalog(catalog);
  assert.equal(safe.products[0].legacySlugs.length,101);
  assert.equal(safe.products[0].slug,hash(family+"|p5-uncategorized|part:0"));
});

test("SEO P0: a family above 100 SKUs keeps a stable slug for every split page",async()=>{
  const rows=Array.from({length:101},(_,i)=>({...base("F"+String(i).padStart(3,"0")),
    family_id:family,family_label:"Bộ tập"}));
  const before=await catalogFor(rows);
  const after=await catalogFor(rows.map((row,i)=>i%2?{...row,category_id:catA,category_label:"Tập học sinh"}:row));
  assert.equal(before.products.length,2);
  assert.deepEqual(before.products.map(p=>p.slug),after.products.map(p=>p.slug));
  assert.equal(after.products[1].slug,hash("family:"+family+"|part:1"));
  assert.ok(after.products[1].legacySlugs.includes(hash(family+"|p5-uncategorized|part:1")));
});

test("SEO P0: 200-SKU family never steals a historic URL from another split page",async()=>{
  const rows=Array.from({length:200},(_,i)=>({...base("F"+String(i).padStart(3,"0")),
    family_id:family,family_label:"Bộ tập",
    ...(i<100?{category_id:catA,category_label:"Tập học sinh"}:{})}));
  const catalog=await catalogFor(rows);
  assert.equal(catalog.products.length,2);
  const [first,second]=catalog.products;
  const historicSecond=hash(family+"|p5-uncategorized|part:0");
  assert.notEqual(first.slug,historicSecond);
  assert.ok(!first.legacySlugs.includes(historicSecond));
  assert.ok(second.legacySlugs.includes(historicSecond));
  assert.equal(first.slug,hash("family:"+family+"|part:0"));
  assert.equal(second.slug,hash("family:"+family+"|part:1"));
  const matches=catalog.products.filter(p=>p.slug===historicSecond||p.legacySlugs?.includes(historicSecond));
  assert.deepEqual(matches,[second],"historic unclassified URL still selects the correct SKU page");
  const api=createPublicApi({
    getPublicCatalog:async()=>catalog,
    getPublicContent:async()=>({company:null,articles:[],promotions:[],dealerInformation:null})
  });
  const result=await api.fetch(new Request("https://worker.example.invalid/v1/public/products?slug="+historicSecond));
  assert.equal(result.status,200);
  const data=await result.json();
  assert.equal(data.pagination.total,1);
  assert.deepEqual(data.data[0].variants.map(v=>v.sku),rows.slice(100).map(r=>r.sku_cong_ty));
});

test("SEO P0: split family can safely transmit 102 distinct historic aliases",async()=>{
  const rows=Array.from({length:101},(_,i)=>{
    const id="00000000-0000-4000-8000-"+String(i+1).padStart(12,"0");
    return {...base("F"+String(i).padStart(3,"0")),
      category_id:id,category_label:"Tập học sinh",family_id:family,family_label:"Bộ tập"};
  });
  const catalog=await catalogFor(rows);
  assert.equal(catalog.products.length,2);
  assert.equal(catalog.products[0].legacySlugs.length,102);
  const safe=projectPublicCatalog(catalog);
  assert.equal(safe.products[0].legacySlugs.length,102);
  assert.equal(safe.products[0].slug,hash("family:"+family+"|part:0"));
  assert.ok(safe.products[0].legacySlugs.includes(hash(family+"|p5-uncategorized|part:0")));
});
