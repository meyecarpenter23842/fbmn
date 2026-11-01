// ADM-05 P3: pure one-sheet sync plan. No DB writes, no prices/stock/media.
// Empty optional input cells mean "retain existing"; blank values never erase current data.
const FIELDS=[
  ["ten_san_pham","ten_san_pham","Tên sản phẩm"],
  ["barcode","barcode","Mã vạch"],
  ["paper_size","paper_size","Khổ"],
  ["pages","product_spec","Số trang"],
  ["ruling","product_spec","Dòng kẻ"]
];
const skuKey=value=>value.toUpperCase();
const clean=(value,max=1200)=>typeof value==="string"&&value.length<=max&&
  !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value);
export function planSheetSync(parsed,existing=[]){
  if(parsed?.source_sheet!=="SAN PHAM"||!Array.isArray(parsed.rows)||
     !Array.isArray(parsed.evidence)||parsed.evidence.length!==parsed.rows.length||
     !Array.isArray(existing))throw Error("invalid_sync_input");
  const oldMap=new Map();
  for(const old of existing){
    if(typeof old?.sku_cong_ty!=="string"||oldMap.has(skuKey(old.sku_cong_ty)))
      throw Error("invalid_existing");
    oldMap.set(skuKey(old.sku_cong_ty),old);
  }
  const seen=new Set(),totals={create:0,update:0,unchanged:0,conflict:0,error:0};
  const items=[],operations=[];
  for(let i=0;i<parsed.rows.length;i++){
    const row=parsed.rows[i],evidence=parsed.evidence[i];
    const sku=row?.sku_cong_ty;
    const valid=typeof sku==="string"&&sku.length>0&&sku.length<=80&&
      sku===sku.trim()&&!/[\x00-\x1f\x7f]/.test(sku);
    const item={row:row?.__row||i+2,sku_cong_ty:valid?sku:null,
      proposed_name:row?.ten_san_pham||"",source_name_xnt:"",
      specifications:evidence?.specifications||{},changes:[],diffs:[],
      status:"error",reason:null,expected_revision:null};
    const fail=(status,reason)=>{item.status=status;item.reason=reason;};
    if(row?.__error||!valid)fail("error",row?.__error||"invalid_sku");
    else if(seen.has(skuKey(sku)))fail("error","duplicate_company_sku");
    else {
      seen.add(skuKey(sku));
      const old=oldMap.get(skuKey(sku));
      const requested={ten_san_pham:row.ten_san_pham,barcode:row.barcode,
        paper_size:row.paper_size,pages:evidence?.specifications?.pages||"",
        ruling:evidence?.specifications?.ruling||""};
      if(Object.entries(requested).some(([name,value])=>!clean(value??"",name==="ten_san_pham"?1200:1200)))
        fail("error","invalid_field_length");
      else if(!old){
        if(!requested.ten_san_pham?.trim())fail("error","missing_product_name");
        else {
          item.status="create";
          operations.push({kind:"create",sku_cong_ty:sku,ten_san_pham:requested.ten_san_pham,
            barcode:requested.barcode||null,paper_size:requested.paper_size||null,
            product_spec:{pages:requested.pages||null,ruling:requested.ruling||null}});
        }
      }else if(old.sku_cong_ty!==sku){
        fail("conflict","sku_case_mismatch");
      }else{
        item.expected_revision=old.revision;
        const changes={},spec={};
        for(const [field,source,label] of FIELDS){
          const next=requested[field]||"";
          if(!next.trim())continue;
          const previous=source==="product_spec"?old.product_spec?.[field]:
            (field==="ten_san_pham"?(old.ten_san_pham||old.ten_goc_xnt||old.ten_goc_bang_gia):old[field]);
          const before=typeof previous==="string"?previous:"";
          if(next!==before){
            item.diffs.push({field:label,from:before,to:next});
            item.changes.push(label);
            if(source==="product_spec")spec[field]=next;
            else changes[field]=next;
          }
        }
        if(Object.keys(spec).length)changes.product_spec=spec;
        if(!item.changes.length)item.status="unchanged";
        else if(!Number.isSafeInteger(old.revision)||old.revision<1||
           !["draft","needs_review"].includes(old.review_status))fail("conflict","sku_locked_or_revision_invalid");
        else {
          item.status="update";
          operations.push({kind:"update",sku_cong_ty:sku,expected_revision:old.revision,changes});
        }
      }
    }
    totals[item.status]++;
    items.push(item);
  }
  return {source_sheet:"SAN PHAM",totals,items,operations,applied:false};
}
