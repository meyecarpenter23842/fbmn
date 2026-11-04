/**
 * Strict SQL read-model: only approved SQL views in fbmn_public.
 * `query(text)` must execute as a verified least-privilege runtime identity,
 * never as a Neon owner, B2B role, or with user-supplied SQL.
 */
const SQL = Object.freeze({
  categories: "SELECT id,slug,name,product_group,sort_order FROM fbmn_public.v_categories ORDER BY sort_order,id LIMIT 2001",
  products: "SELECT id,category_id,slug,name,description,public_price_mode FROM fbmn_public.v_products ORDER BY slug LIMIT 10001",
  variants: "SELECT product_id,sku,name,paper_size,page_count,paper_weight_gsm,binding,cover_finish,sale_unit,units_per_pack,units_per_carton,retail_price_vnd FROM fbmn_public.v_variants ORDER BY sku LIMIT 10001",
  media: "SELECT product_id,r2_key,alt,position FROM fbmn_public.v_media ORDER BY product_id,position LIMIT 10001",
  articles: "SELECT slug,title,summary,paragraphs,published_at FROM fbmn_public.v_articles ORDER BY published_at DESC LIMIT 501",
  promotions: "SELECT slug,title,summary,detail,ends_at FROM fbmn_public.v_promotions ORDER BY slug LIMIT 201",
  company: "SELECT legal_name,address,phone,email,hours FROM fbmn_public.v_company LIMIT 2",
  p5Skus: "SELECT sku_cong_ty,name,paper_size,product_spec,category_id,category_label,family_id,family_label FROM fbmn_public.v_p5_visible_skus ORDER BY sku_cong_ty LIMIT 10001",
  p5Media: "SELECT sku_cong_ty,asset_id,media_role,sort_order FROM fbmn_public.v_p5_visible_media WHERE (sku_cong_ty,sort_order,asset_id)>($1::text,$2::integer,$3::text) ORDER BY sku_cong_ty,sort_order,asset_id LIMIT 1000",
  p5ImageKey: "SELECT r2_key FROM fbmn_public.v_p5_image_assets WHERE asset_id=$1 LIMIT 1",
  dealer: "SELECT title,paragraphs,contact_instructions FROM fbmn_public.v_dealer_information LIMIT 2",
});
function rows(value, max) {
  if (!Array.isArray(value) || value.length > max) throw new Error("Invalid SQL read result");
  return value;
}
const asString = x => x == null ? null : String(x);
const asNumeric = x => {
  if (x == null) return null;
  const n = Number(x);
  if (!Number.isSafeInteger(n) || n < 0) throw new Error("Invalid retail value");
  return n;
};
const asDate = x => x instanceof Date ? x.toISOString() : String(x);
function specifications(row) {
  const s = {};
  for (const [column,field] of [["paper_size","paperSize"],["page_count","pageCount"],["paper_weight_gsm","paperWeightGsm"],["binding","binding"],["cover_finish","coverFinish"]]) {
    if (row[column] != null) {
      const value = column === "page_count" || column === "paper_weight_gsm" ? Number(row[column]) : String(row[column]);
      s[field] = value;
    }
  }
  if (row.sale_unit != null) {
    s.packaging = { saleUnit:String(row.sale_unit) };
    if (row.units_per_pack != null) s.packaging.unitsPerPack = Number(row.units_per_pack);
    if (row.units_per_carton != null) s.packaging.unitsPerCarton = Number(row.units_per_carton);
  }
  return s;
}
export function createReadModel(query,{enableP5=false}={}) {
  if (typeof query !== "function") throw new Error("Missing read-only SQL executor");
  const execute = async (key,max) => rows(await query(SQL[key]),max);
  const normalized=(value,max=160)=>String(value??"").trim().slice(0,max);
  const positive=(value)=>{
    const n=Number(String(value??"").match(/^\s*(\d{1,4})/)?.[1]??NaN);
    return Number.isSafeInteger(n)&&n>0?n:null;
  };
  const strictCount=(value)=>{
    if(!/^[1-9]\d{0,4}$/.test(String(value??"")))return null;
    const n=Number(value);return Number.isSafeInteger(n)&&n>0?n:null;
  };
  const strictGsm=(value)=>{
    if(!/^\d{1,4}(?:\.\d{1,2})?$/.test(String(value??"")))return null;
    const n=Number(value);return Number.isFinite(n)&&n>0?n:null;
  };
  const groupFor=(name)=>{
    const n=normalized(name).toLocaleLowerCase("vi-VN");
    return /học sinh|hoc sinh|vở hs|tập hs/.test(n)?"school_notebook":
      /sinh viên|sinh vien|sv/.test(n)?"student_notebook":
      /sổ|so tay|ghi chép/.test(n)?"memo_book":"stationery";
  };
  const makeSlug=async id=>{
    const bytes=new TextEncoder().encode(id);
    const hash=new Uint8Array(await crypto.subtle.digest("SHA-256",bytes));
    return "sku-"+Array.from(hash.slice(0,16),x=>x.toString(16).padStart(2,"0")).join("");
  };
  const p5MediaPages=async()=>{
    // Keyset pagination over exact (SKU, order, asset ID). A valid catalogue
    // can contain 10,000 SKUs x 20 images; don't reject a full catalogue
    // merely because aggregate media crosses the old 10k-row sentinel.
    const images=[];
    let cursor=["",-1,""];
    for(let page=0;page<201;page++){
      const batch=rows(await query(SQL.p5Media,cursor),1000);
      if(!batch.length)return images;
      for(const item of batch)images.push(item);
      if(images.length>200000)throw Error("P5 media volume exceeded");
      const last=batch[batch.length-1];
      const next=[String(last.sku_cong_ty),Number(last.sort_order),String(last.asset_id)];
      // SQL uses the database's text collation, which may differ from JS
      // UTF-16 ordering. Require the cursor to change; SQL itself guarantees
      // a strictly ordered page by its tuple comparison and ORDER BY.
      if(next[0]===cursor[0]&&next[1]===cursor[1]&&next[2]===cursor[2])
        throw Error("Non-advancing P5 media cursor");
      cursor=next;
      if(batch.length<1000)return images;
    }
    throw Error("P5 media page limit exceeded");
  };
  const p5Catalog=async()=>{
    const [skus,images]=await Promise.all([execute("p5Skus",10000),p5MediaPages()]);
    const bySku=new Map();
    for(const m of images){
      const id=String(m.asset_id);
      if(!/^[0-9a-f-]{36}$/i.test(id))continue;
      const arr=bySku.get(String(m.sku_cong_ty))??[];
      arr.push({r2Key:"products/catalogue/"+id+"-v1.webp",position:Number(m.sort_order),
        cover:m.media_role==="cover"});
      bySku.set(String(m.sku_cong_ty),arr);
    }
    const categories=new Map(),groups=new Map(),familyCounts=new Map();
    for(const row of skus){
      const sku=String(row.sku_cong_ty),name=normalized(row.name)||sku;
      const categoryId=row.category_id?"p5-"+String(row.category_id):"p5-uncategorized";
      const label=normalized(row.category_label)||"Chưa phân loại";
      if(!categories.has(categoryId)){
        categories.set(categoryId,{id:categoryId,slug:row.category_id?
          "cat-"+String(row.category_id).replaceAll("-",""):"chua-phan-loai",
          name:label,group:groupFor(label),sortOrder:categories.size+100});
      }
      const key=String(row.family_id??sku)+"|"+categoryId;
      const spec=row.product_spec&&typeof row.product_spec==="object"?row.product_spec:{};
      const values={};
      const paperSize=normalized(row.paper_size,120);
      if(paperSize)values.paperSize=paperSize;
      const pages=positive(spec.pages);if(pages)values.pageCount=pages;
      const gsm=strictGsm(spec.gsm);if(gsm)values.paperWeightGsm=gsm;
      const coverFinish=normalized(spec.cover_type,120);
      if(coverFinish)values.coverFinish=coverFinish;
      const ruling=normalized(spec.ruling,120);
      if(ruling)values.ruling=ruling;
      const unit=normalized(spec.unit,80);
      if(unit)values.packaging={saleUnit:unit};
      if(values.packaging&&strictCount(spec.units_per_pack))
        values.packaging.unitsPerPack=strictCount(spec.units_per_pack);
      // One public product supports at most 100 variants. An Admin family can
      // contain more; split rather than silently dropping published company SKUs.
      const count=familyCounts.get(key)??0;
      const part=Math.floor(count/100);
      familyCounts.set(key,count+1);
      const pageKey=key+"|part:"+part;
      let group=groups.get(pageKey);
      if(!group){
        group={id:pageKey,categoryId,name:((normalized(row.family_label)||name).slice(0,160-(part?(" · Phần "+(part+1)).length:0))+(part?" · Phần "+(part+1):"")),
          sourceSku:sku,slug:"",priceLabel:"Liên hệ báo giá",variants:[],media:[]};
        groups.set(pageKey,group);
      }
      group.variants.push({sku,name,specifications:values,price:null});
      const ownImages=(bySku.get(sku)??[]).sort((a,b)=>Number(b.cover)-Number(a.cover)||a.position-b.position);
      for(const media of ownImages){
        if(group.media.length>=50)break;
        group.media.push({r2Key:media.r2Key,alt:name,position:group.media.length,sku});
      }
    }
    const products=[...groups.values()];
    // Bounded concurrency avoids hundreds of sequential crypto awaits per request.
    // Hash input and result are unchanged: stable URLs and leading-zero SKUs remain.
    for(let offset=0;offset<products.length;offset+=32){
      await Promise.all(products.slice(offset,offset+32).map(async group=>{
        group.slug=await makeSlug(group.id);
        group.id=group.slug;
        delete group.sourceSku;
      }));
    }
    return {categories:[...categories.values()],products};
  };
  return {
    async getPublicImageKey(assetId){
      if(!enableP5||!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(assetId))return null;
      const results=await query(SQL.p5ImageKey,[assetId]);
      return Array.isArray(results)&&results.length===1?String(results[0].r2_key):null;
    },
    async getPublicCatalog() {
      const [cs,ps,vs,ms] = await Promise.all([execute("categories",2000),execute("products",10000),execute("variants",10000),execute("media",10000)]);
      const categories = cs.map(c => ({ id:String(c.id),slug:String(c.slug),name:String(c.name),group:String(c.product_group),sortOrder:Number(c.sort_order) }));
      const products = ps.flatMap(p => {
        const variants = vs.filter(v => v.product_id === p.id).map(v => ({
          sku:String(v.sku),name:String(v.name), specifications:specifications(v),
          price: v.retail_price_vnd != null && p.public_price_mode === "retail" ?
            {kind:"retail",amountVnd:asNumeric(v.retail_price_vnd),currency:"VND"} : null,
        }));
        if (!variants.length) return [];
        return [{
          id:String(p.id),categoryId:String(p.category_id),slug:String(p.slug),name:String(p.name),
          ...(p.description == null ? {} : {description:String(p.description)}),
          priceLabel:variants.every(v=>v.price===null) ? "Liên hệ báo giá":null,
          variants, media:ms.filter(m=>m.product_id===p.id).map(m=>({r2Key:String(m.r2_key),alt:String(m.alt),position:Number(m.position)})),
        }];
      });
      if(enableP5){
        const fresh=await p5Catalog();
        // In staging, legacy views are empty. Keep contract compatibility while
        // only freshly published P5 SKUs are added; no draft or NET is exposed.
        const mapped=new Set(categories.map(c=>c.id));
        for(const c of fresh.categories)if(!mapped.has(c.id))categories.push(c);
        products.push(...fresh.products);
      }
      return {categories,products};
    },
    async getPublicContent() {
      const [articles,promotions,companies,dealers] = await Promise.all([
        execute("articles",500),execute("promotions",200),execute("company",1),execute("dealer",1),
      ]);
      const company = companies.length ? Object.fromEntries(
        ["legal_name","address","phone","email","hours"].filter(k=>companies[0][k]!=null)
          .map(k=>[{"legal_name":"legalName"}[k]??k,asString(companies[0][k])])
      ) : null;
      return {
        company,
        articles:articles.map(a=>({slug:String(a.slug),title:String(a.title),summary:String(a.summary),paragraphs:a.paragraphs.map(String),publishedAt:asDate(a.published_at)})),
        promotions:promotions.map(p=>({slug:String(p.slug),title:String(p.title),summary:String(p.summary),detail:String(p.detail),endsAt:asDate(p.ends_at)})),
        dealerInformation:dealers.length ? {title:String(dealers[0].title),paragraphs:dealers[0].paragraphs.map(String),contactInstructions:String(dealers[0].contact_instructions)} : null,
      };
    },
  };
}
export { SQL as PUBLIC_READ_QUERIES };
