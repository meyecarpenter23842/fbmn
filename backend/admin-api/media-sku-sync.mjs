// P4 extension: exact company-SKU inference for Owner-reviewed R2 inbox scans.
// Do not infer arbitrary prefixes. Keep full R2 object keys private to Owner.
const IMG=/\.(png|jpe?g|webp)$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const INBOX_PREFIX="private/catalogue/";
export const MAX_SCAN=1000;
export function detectSkuFromName(key,companySkus){
  if(typeof key!=="string"||!key.startsWith(INBOX_PREFIX)||key.length>500)
    return {status:"invalid"};
  const filename=key.slice(key.lastIndexOf("/")+1);
  if(!filename||!IMG.test(filename)||filename.includes("%")||filename.includes("\\"))
    return {status:"invalid"};
  const stem=filename.replace(IMG,"");
  if(UUID.test(stem))return {status:"generated"};
  const options=[];
  if(companySkus.has(stem))options.push(stem);
  const numbered=/^(.*)-([0-9]{2})$/.exec(stem);
  if(numbered&&Number(numbered[2])>=1&&companySkus.has(numbered[1]))
    options.push(numbered[1]);
  if(options.length>1)return {status:"ambiguous"};
  if(options.length===0)return {status:"unmatched"};
  return {status:"matched",sku:options[0],filename};
}
export async function findR2SkuCandidates({db,r2}){
  if(typeof r2.list!=="function")throw Error("r2_list_unavailable");
  const [listed,skus]=await Promise.all([
    r2.list({prefix:INBOX_PREFIX,limit:MAX_SCAN}),
    db(c=>c.query("SELECT sku_cong_ty FROM fbmn_catalog.skus ORDER BY sku_cong_ty LIMIT 20000"))
  ]);
  const objects=listed?.objects??[];
  if(!Array.isArray(objects)||objects.length>MAX_SCAN)throw Error("invalid_r2_list");
  const known=new Set(skus.rows.map(row=>row.sku_cong_ty));
  const eligible=objects.filter(item=>typeof item?.key==="string"&&
    !item.key.includes("/renditions/")&&IMG.test(item.key));
  const keys=eligible.map(item=>item.key);
  const registered=keys.length?await db(c=>c.query(
    "SELECT r2_key FROM fbmn_catalog.media_assets WHERE r2_key=ANY($1::text[])",[keys]
  )):{rows:[]};
  const used=new Set(registered.rows.map(row=>row.r2_key));
  const items=eligible.filter(item=>!used.has(item.key)).map(item=>({
    key:item.key,bytes:item.size??null,
    ...detectSkuFromName(item.key,known)
  }));
  return {items,truncated:Boolean(listed?.truncated),scanned:objects.length};
}
