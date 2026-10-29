/**
 * Strict SQL read-model: only approved SQL views in fbmn_public.
 * `query(text)` must execute as a verified least-privilege runtime identity,
 * never as a Neon owner, B2B role, or with user-supplied SQL.
 */
const SQL = Object.freeze({
  categories: "SELECT id,slug,name,product_group,sort_order FROM fbmn_public.v_categories ORDER BY sort_order,id LIMIT 201",
  products: "SELECT id,category_id,slug,name,description,public_price_mode FROM fbmn_public.v_products ORDER BY slug LIMIT 10001",
  variants: "SELECT product_id,sku,name,paper_size,page_count,paper_weight_gsm,binding,cover_finish,sale_unit,units_per_pack,units_per_carton,retail_price_vnd FROM fbmn_public.v_variants ORDER BY sku LIMIT 10001",
  media: "SELECT product_id,r2_key,alt,position FROM fbmn_public.v_media ORDER BY product_id,position LIMIT 10001",
  articles: "SELECT slug,title,summary,paragraphs,published_at FROM fbmn_public.v_articles ORDER BY published_at DESC LIMIT 501",
  promotions: "SELECT slug,title,summary,detail,ends_at FROM fbmn_public.v_promotions ORDER BY slug LIMIT 201",
  company: "SELECT legal_name,address,phone,email,hours FROM fbmn_public.v_company LIMIT 2",
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
export function createReadModel(query) {
  if (typeof query !== "function") throw new Error("Missing read-only SQL executor");
  const execute = async (key,max) => rows(await query(SQL[key]),max);
  return {
    async getPublicCatalog() {
      const [cs,ps,vs,ms] = await Promise.all([execute("categories",200),execute("products",10000),execute("variants",10000),execute("media",10000)]);
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
