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
  homeLayout: "SELECT category_ids,featured_skus,category_limit,product_limit,section_order,revision FROM fbmn_public.v_web_home_layout LIMIT 2",
  cmsEntries: "SELECT e.id,kind,slug,title,summary,paragraphs,cta_url,slot,sort_order,published_at,starts_at,ends_at,popup_delay_seconds,popup_cooldown_minutes,popup_max_per_session,has_desktop,has_mobile,"+
   "(SELECT json_agg(json_build_object('slideNo',s.slide_no,'ordinal',s.ordinal,'enabled',s.enabled,'autoplay',s.autoplay,'effect',s.effect,'intervalMs',s.interval_ms,'durationMs',s.duration_ms) ORDER BY s.ordinal) FROM fbmn_public.v_cms_web_banner_slides s WHERE s.id=e.id) AS hero_slides "+
   "FROM fbmn_public.v_cms_web_entries e ORDER BY sort_order,published_at,id LIMIT 501",
  cmsImageKey: "SELECT r2_key FROM fbmn_public.v_cms_web_images WHERE id=$1 AND device=$2 LIMIT 1",
  cmsSlideImageKey: "SELECT r2_key FROM fbmn_public.v_cms_web_banner_slide_images WHERE id=$1 AND device=$2 AND slide_no=$3 LIMIT 1",
  catalogueViewerSettings: "SELECT flip_duration_ms,sound_enabled,shadow_opacity FROM fbmn_public.v_catalogue_viewer_settings LIMIT 2",
  catalogueBooks: "SELECT id,title,edition FROM fbmn_public.v_catalogue_ready_books ORDER BY updated_at DESC,id LIMIT 101",
  catalogueBook: "SELECT id,title,edition FROM fbmn_public.v_catalogue_ready_books WHERE id=$1::uuid LIMIT 1",
  catalogueAssets: "SELECT id,kind,sort_order,width,height FROM fbmn_public.v_catalogue_ready_assets WHERE book_id=$1::uuid AND kind IN ('page','cover') ORDER BY kind,sort_order,id LIMIT 202",
  catalogueAssetKey: "SELECT r2_key,byte_size FROM fbmn_public.v_catalogue_ready_assets WHERE id=$1::uuid AND kind IN ('page','cover') LIMIT 1",
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
    const categories=new Map(),groups=new Map(),familyCounts=new Map(),oldCategoryCounts=new Map();
    for(const row of skus){
      const sku=String(row.sku_cong_ty),name=normalized(row.name)||sku;
      const categoryId=row.category_id?"p5-"+String(row.category_id):"p5-uncategorized";
      const label=normalized(row.category_label)||"Chưa phân loại";
      if(!categories.has(categoryId)){
        categories.set(categoryId,{id:categoryId,slug:row.category_id?
          "cat-"+String(row.category_id).replaceAll("-",""):"chua-phan-loai",
          name:label,group:groupFor(label),sortOrder:categories.size+100});
      }
      // Admin family controls one public product across different SKU categories.
      // Standalone SKUs remain isolated even when names/categories happen to match.
      const key=row.family_id?"family:"+String(row.family_id):"sku:"+sku;
      // Old published URLs were hashed from the SKU's family + category + part.
      // Retain every old category-specific address as an alias when merging.
      const oldKey=String(row.family_id??sku)+"|"+categoryId;
      const oldCount=oldCategoryCounts.get(oldKey)??0;
      oldCategoryCounts.set(oldKey,oldCount+1);
      const oldPageKey=oldKey+"|part:"+Math.floor(oldCount/100);
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
          sourceSku:sku,slug:"",priceLabel:"Liên hệ báo giá",variants:[],media:[],legacyKeys:new Map()};
        groups.set(pageKey,group);
      }
      // The public DTO has one categoryId. Prefer an explicitly assigned
      // category over "Chưa phân loại" when family members differ.
      if(row.category_id&&group.categoryId==="p5-uncategorized")group.categoryId=categoryId;
      group.legacyKeys.set(oldPageKey,(group.legacyKeys.get(oldPageKey)??0)+1);
      group.variants.push({sku,name,specifications:values,price:null});
      const ownImages=(bySku.get(sku)??[]).sort((a,b)=>Number(b.cover)-Number(a.cover)||a.position-b.position);
      for(const media of ownImages){
        // 100 variants x Admin's max 20 photos/SKU: never silently drop
        // another published SKU's gallery after cross-category merging.
        if(group.media.length>=2000)throw Error("P5 family media limit exceeded");
        group.media.push({r2Key:media.r2Key,alt:name,position:group.media.length,sku});
      }
    }
    const products=[...groups.values()];
    // One old per-category page can overlap two new 100-SKU family pages.
    // Assign its legacy address to the page containing the most old members.
    const legacyOwners=new Map();
    for(const group of products){
      for(const [oldKey,count] of group.legacyKeys){
        const oldOwner=legacyOwners.get(oldKey);
        if(!oldOwner||count>oldOwner.count)legacyOwners.set(oldKey,{group,count});
      }
    }
    // Retain the exact old slug for unchanged, one-category products. Mixed
    // families use a category-independent canonical slug and serve old URLs.
    // Bounded concurrency avoids sequential crypto operations per product.
    for(let offset=0;offset<products.length;offset+=32){
      await Promise.all(products.slice(offset,offset+32).map(async group=>{
        const owned=[...group.legacyKeys.keys()].filter(k=>legacyOwners.get(k)?.group===group);
        const canonicalKey=group.legacyKeys.size===1&&owned.length===1?owned[0]:group.id;
        group.slug=await makeSlug(canonicalKey);
        group.id=group.slug;
        const aliases=(await Promise.all(owned.map(makeSlug))).filter(slug=>slug!==group.slug);
        if(aliases.length)group.legacySlugs=aliases;
        delete group.legacyKeys;
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
    async getPublicHomeLayout() {
      const record=await execute("homeLayout",2);
      if(record.length!==1)throw Error("Missing public home layout");
      const row=record[0];
      return {categoryIds:row.category_ids,featuredSkus:row.featured_skus,
        categoryLimit:Number(row.category_limit),productLimit:Number(row.product_limit),
        sectionOrder:row.section_order,revision:Number(row.revision)};
    },
    async getPublicCms() {
      const entries=await execute("cmsEntries",500);
      return entries.map(row=>({
       id:String(row.id),kind:String(row.kind),slug:String(row.slug),
       title:String(row.title),summary:String(row.summary),
       paragraphs:row.paragraphs,ctaUrl:row.cta_url,
       slot:String(row.slot),sortOrder:Number(row.sort_order),
       publishedAt:asDate(row.published_at),
       startsAt:row.starts_at==null?null:asDate(row.starts_at),
       endsAt:row.ends_at==null?null:asDate(row.ends_at),
       popupDelaySeconds:Number(row.popup_delay_seconds),
       popupCooldownMinutes:Number(row.popup_cooldown_minutes),
       popupMaxPerSession:Number(row.popup_max_per_session),
       hasDesktop:row.has_desktop===true,hasMobile:row.has_mobile===true,
       ...(Array.isArray(row.hero_slides)&&row.hero_slides.length?{
        slides:row.hero_slides.map(s=>Number(s.slideNo)),
        motion:{enabled:row.hero_slides[0].enabled===true,
         autoplay:row.hero_slides[0].autoplay===true,
         effect:String(row.hero_slides[0].effect),
         intervalMs:Number(row.hero_slides[0].intervalMs),
         durationMs:Number(row.hero_slides[0].durationMs)}
       }:{})
      }));
    },
    async getPublicCmsImageKey(id,device,slide=1){
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||
          !["desktop","mobile"].includes(device)||
          !Number.isInteger(slide)||slide<1||slide>5)return null;
      const entries=rows(await query(slide===1?SQL.cmsImageKey:SQL.cmsSlideImageKey,
       slide===1?[id,device]:[id,device,slide]),1);
      return entries.length===1&&/^cms\/[0-9a-f-]{36}\/public_web\/(desktop|mobile)\/[0-9a-f-]{36}\.webp$/i.test(String(entries[0].r2_key))
       ?String(entries[0].r2_key):null;
    },
    async getCatalogueViewerSettings(){
      const result=rows(await query(SQL.catalogueViewerSettings),2);
      if(result.length!==1)throw Error("Missing viewer settings");
      const r=result[0];
      const value={flipDurationMs:Number(r.flip_duration_ms),soundEnabled:r.sound_enabled===true,
       shadowOpacity:Number(r.shadow_opacity)};
      if(!Number.isSafeInteger(value.flipDurationMs)||value.flipDurationMs<750||
       value.flipDurationMs>1500||value.flipDurationMs%50!==0||
       !Number.isFinite(value.shadowOpacity)||value.shadowOpacity<0.10||
       value.shadowOpacity>0.50||typeof r.sound_enabled!=="boolean")
       throw Error("Invalid viewer settings");
      return value;
    },
    async getReadyCatalogueBooks(){
      const result=rows(await query(SQL.catalogueBooks),101);
      if(result.length>100)throw Error("Too many public books");
      return result.map(b=>({id:String(b.id),title:String(b.title),edition:String(b.edition)}));
    },
    async getReadyCatalogueBook(id){
      if(!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))return null;
      const result=rows(await query(SQL.catalogueBook,[id]),1);
      return result.length===1?{id:String(result[0].id),title:String(result[0].title),edition:String(result[0].edition)}:null;
    },
    async getReadyCatalogueAssets(id){
      if(!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))return [];
      const result=rows(await query(SQL.catalogueAssets,[id]),202);
      if(result.length>201)throw Error("Too many public pages");
      return result.map(a=>({id:String(a.id),kind:String(a.kind),sortOrder:Number(a.sort_order),
       width:Number(a.width),height:Number(a.height)}));
    },
    async getReadyCatalogueAssetKey(id){
      if(!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))return null;
      const result=rows(await query(SQL.catalogueAssetKey,[id]),1);
      return result.length===1?{key:String(result[0].r2_key),bytes:Number(result[0].byte_size)}:null;
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
