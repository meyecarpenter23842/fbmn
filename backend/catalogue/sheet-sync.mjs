// ADM-05 P3: pure one-sheet sync plan. No DB writes, no prices/stock/media.
// One selected mapping = overwrite with Excel value, including blank -> null for optional fields.
// Unmapped fields never change. Legacy clients supplying clearFields keep their older semantics.
const FIELDS=[
  ["ten_san_pham","ten_san_pham","Tên sản phẩm"],
  ["barcode","barcode","Mã vạch"],
  ["paper_size","paper_size","Khổ"],
  ["pages","product_spec","Số trang"],
  ["ruling","product_spec","Dòng kẻ"],
  ["gsm","product_spec","Định lượng GSM"],
  ["cover_type","product_spec","Loại bìa"],
  ["unit","product_spec","Đơn vị tính"],
  ["packaging","product_spec","Quy cách đóng gói"],
  ["units_per_pack","product_spec","Số đơn vị / đóng gói"]
];
const skuKey=value=>value.toUpperCase();
const clean=(value,max=1200)=>typeof value==="string"&&value.length<=max&&
  !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value);
const CLEARABLE=new Set(["barcode","paper_size","pages","ruling","gsm",
  "cover_type","unit","packaging","units_per_pack","category_label","category_code","family_code"]);
export function planSheetSync(parsed,existing=[],categories=[],options={}){
  if(parsed?.source_sheet!=="SAN PHAM"||!Array.isArray(parsed.rows)||
     !Array.isArray(parsed.evidence)||parsed.evidence.length!==parsed.rows.length||
     !Array.isArray(existing)||!Array.isArray(categories))throw Error("invalid_sync_input");
  const mappedFields=options?.mappedFields??null;
  const explicitClear=options?.clearFields;
  if(mappedFields!==null&&(!Array.isArray(mappedFields)||
     mappedFields.some(key=>typeof key!=="string")||
     new Set(mappedFields).size!==mappedFields.length))
    throw Error("invalid_mapping_fields");
  // Old cached Admin clients still send clearFields (even []). Honor that
  // explicit legacy policy until those clients refresh; the new one-dropdown
  // UI omits the flag and derives clear intent entirely from mapped columns.
  if(explicitClear!==undefined&&(!Array.isArray(explicitClear)||explicitClear.length>13||
     explicitClear.some(key=>typeof key!=="string"||!CLEARABLE.has(key))||
     new Set(explicitClear).size!==explicitClear.length||
     (mappedFields!==null&&explicitClear.some(key=>!mappedFields.includes(key)))))
    throw Error("invalid_clear_fields");
  const mappedSet=mappedFields===null?null:new Set(mappedFields);
  const clearSet=new Set(explicitClear===undefined?
    (mappedFields||[]).filter(key=>CLEARABLE.has(key)):explicitClear);
  const categoryById=new Map(categories.map(c=>[c.id,c]));
  const families=options.families||[];
  if(!Array.isArray(families))throw Error("invalid_families");
  const categoryByCode=new Map();
  const familyByCode=new Map();
  for(const c of categories){
    if(typeof c.category_code==="string"){
      if(categoryByCode.has(c.category_code))throw Error("duplicate_category_code");
      categoryByCode.set(c.category_code,c.id);
    }
  }
  for(const f of families){
    if(typeof f?.id!=="string"||typeof f.family_code!=="string"||
      familyByCode.has(f.family_code))throw Error("invalid_family_codes");
    familyByCode.set(f.family_code,f.id);
  }
  const categoryPaths=new Map();
  const pathOf=(c)=>{
    const parent=c.parent_id?categoryById.get(c.parent_id):null;
    return (parent?parent.category_label+" / ":"")+c.category_label;
  };
  for(const c of categories){
    if(typeof c?.id!=="string"||typeof c?.category_label!=="string")throw Error("invalid_categories");
    const keys=[pathOf(c).trim().toLocaleLowerCase("vi")];
    if(!c.parent_id)keys.push(c.category_label.trim().toLocaleLowerCase("vi"));
    for(const key of new Set(keys)){
      const list=categoryPaths.get(key)||[];
      if(!list.includes(c.id))list.push(c.id);
      categoryPaths.set(key,list);
    }
  }
  const resolveCategory=label=>label.trim()?categoryPaths.get(label.trim().toLocaleLowerCase("vi"))||[]:[];
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
      status:"error",reason:null,expected_revision:null,field_states:[]};
    const fail=(status,reason)=>{item.status=status;item.reason=reason;};
    if(row?.__error||!valid)fail("error",row?.__error||"invalid_sku");
    else if(seen.has(skuKey(sku)))fail("error","duplicate_company_sku");
    else {
      seen.add(skuKey(sku));
      const old=oldMap.get(skuKey(sku));
      const requested={ten_san_pham:row.ten_san_pham,barcode:row.barcode,
        paper_size:row.paper_size,pages:evidence?.specifications?.pages||"",
        ruling:evidence?.specifications?.ruling||"",
        category_label:evidence?.specifications?.category_label||"",
        category_code:evidence?.specifications?.category_code||"",
        family_code:evidence?.specifications?.family_code||"",
        gsm:evidence?.specifications?.gsm||"",cover_type:evidence?.specifications?.cover_type||"",
        unit:evidence?.specifications?.unit||"",packaging:evidence?.specifications?.packaging||"",
        units_per_pack:evidence?.specifications?.units_per_pack||""};
      if(Object.entries(requested).some(([name,value])=>!clean(value??"",
          name==="category_label"?323:["gsm","cover_type","unit","packaging","units_per_pack"].includes(name)?160:1200)) ||
         (requested.gsm&&!/^\d{1,4}(?:\.\d{1,2})?$/.test(requested.gsm)) ||
         (requested.units_per_pack&&!/^[1-9]\d{0,4}$/.test(requested.units_per_pack)))
        fail("error","invalid_field_length");
      else if((mappedSet===null?
        Object.hasOwn(evidence?.specifications||{},"category_code")&&
        Object.hasOwn(evidence?.specifications||{},"category_label"):
        mappedSet.has("category_code")&&mappedSet.has("category_label"))&&
        (!!requested.category_label!==!!requested.category_code ||
          (requested.category_label&&
            (resolveCategory(requested.category_label).length!==1 ||
             resolveCategory(requested.category_label)[0]!==categoryByCode.get(requested.category_code)))))
        fail("conflict","category_code_name_mismatch");
      else if(!old){
        if(!requested.ten_san_pham?.trim())fail("error","missing_product_name");
        else if(requested.category_code&&!categoryByCode.has(requested.category_code))
          fail("conflict","category_code_not_found");
        else if(requested.family_code&&!familyByCode.has(requested.family_code))
          fail("conflict","family_code_not_found");
        else if(requested.category_label&&resolveCategory(requested.category_label).length!==1)
          fail("conflict","category_not_found_or_ambiguous");
        else {
          item.status="create";
          operations.push({kind:"create",sku_cong_ty:sku,ten_san_pham:requested.ten_san_pham,
            category_id:requested.category_code?categoryByCode.get(requested.category_code):
              requested.category_label?resolveCategory(requested.category_label)[0]:null,
            family_id:requested.family_code?familyByCode.get(requested.family_code):null,
            barcode:requested.barcode||null,paper_size:requested.paper_size||null,
            product_spec:{pages:requested.pages||null,ruling:requested.ruling||null,
              gsm:requested.gsm||null,cover_type:requested.cover_type||null,
              unit:requested.unit||null,packaging:requested.packaging||null,
              units_per_pack:requested.units_per_pack||null}});
        }
      }else if(explicitClear===undefined&&mappedSet?.has("ten_san_pham")&&
        !requested.ten_san_pham.trim()){
        // Product name is mandatory in the DB. Never turn blank into an
        // accidental keep or a null title; flag the exact row before saving.
        fail("error","missing_product_name");
      }else if(old.sku_cong_ty!==sku){
        fail("conflict","sku_case_mismatch");
      }else{
        item.expected_revision=old.revision;
        const changes={},spec={};
        for(const [field,source,label] of FIELDS){
          const next=requested[field]||"";
          if(!next.trim()&&!clearSet.has(field))continue;
          const previous=source==="product_spec"?old.product_spec?.[field]:
            (field==="ten_san_pham"?(old.ten_san_pham||old.ten_goc_xnt||old.ten_goc_bang_gia):old[field]);
          const before=typeof previous==="string"?previous:"";
          const cleared=!next.trim()&&clearSet.has(field);
          if((cleared&&before!=="")||(!cleared&&next!==before)){
            item.diffs.push({field:label,from:before,to:cleared?"":next,action:cleared?"clear":"update"});
            item.changes.push(label);
            if(source==="product_spec")spec[field]=cleared?null:next;
            else changes[field]=cleared?null:next;
          }
        }
        if(Object.keys(spec).length)changes.product_spec=spec;
        if(requested.category_code||clearSet.has("category_code")){
          const clear=!requested.category_code&&clearSet.has("category_code");
          const selected=categoryByCode.get(requested.category_code);
          if(!clear&&!selected)fail("conflict","category_code_not_found");
          else if((clear?null:selected)!==(old.category_id||null)){
            const previous=categoryById.get(old.category_id)?.category_code||"";
            item.diffs.push({field:"Mã danh mục",from:previous,
              to:clear?"":requested.category_code,action:clear?"clear":"update"});
            item.changes.push("Mã danh mục");
            const hasMappedName=mappedSet===null?
              Object.hasOwn(evidence?.specifications||{},"category_label"):
              mappedSet.has("category_label");
            if(hasMappedName){
              const oldPath=categoryById.has(old.category_id)?
                pathOf(categoryById.get(old.category_id)):"";
              const nextPath=clear?"":pathOf(categoryById.get(selected));
              item.diffs.push({field:"Danh mục",from:oldPath,
                to:nextPath,action:clear?"clear":"update"});
              item.changes.push("Danh mục");
            }
            changes.category_id=clear?null:selected;
          }
        }else if(requested.category_label||clearSet.has("category_label")){
          const clearCategory=!requested.category_label&&clearSet.has("category_label");
          const matches=clearCategory?[]:resolveCategory(requested.category_label);
          if(!clearCategory&&matches.length!==1)fail("conflict","category_not_found_or_ambiguous");
          else if((clearCategory?null:matches[0])!==(old.category_id||null)){
            item.diffs.push({field:"Danh mục",
              from:categoryById.has(old.category_id)?pathOf(categoryById.get(old.category_id)):"",
              to:clearCategory?"":pathOf(categoryById.get(matches[0])),action:clearCategory?"clear":"update"});
            item.changes.push("Danh mục");
            changes.category_id=clearCategory?null:matches[0];
          }
        }
        if(requested.family_code||clearSet.has("family_code")){
          const clear=!requested.family_code&&clearSet.has("family_code");
          const selected=familyByCode.get(requested.family_code);
          if(!clear&&!selected)fail("conflict","family_code_not_found");
          else if((clear?null:selected)!==(old.family_id||null)){
            item.diffs.push({field:"Mã nhóm mẫu",
              from:families.find(f=>f.id===old.family_id)?.family_code||"",
              to:clear?"":requested.family_code,action:clear?"clear":"update"});
            item.changes.push("Mã nhóm mẫu");
            changes.family_id=clear?null:selected;
          }
        }
        if(item.status==="conflict"){} // Invalid code or name blocks the whole workbook.
        else if(!item.changes.length)item.status="unchanged";
        else if(!Number.isSafeInteger(old.revision)||old.revision<1||
           !["draft","needs_review"].includes(old.review_status))fail("conflict","sku_locked_or_revision_invalid");
        else {
          item.status="update";
          operations.push({kind:"update",sku_cong_ty:sku,expected_revision:old.revision,changes});
        }
      }
    }
    // Full-field preview is inspectable for unchanged, blank/keep, changed, clear
    // and deliberately unmapped columns; it is never a write instruction.
    const oldRecord=valid?oldMap.get(skuKey(sku)):null;
    const inputs={
      ten_san_pham:row?.ten_san_pham||"",barcode:row?.barcode||"",
      paper_size:row?.paper_size||"",
      pages:evidence?.specifications?.pages||"",ruling:evidence?.specifications?.ruling||"",
      gsm:evidence?.specifications?.gsm||"",cover_type:evidence?.specifications?.cover_type||"",
      unit:evidence?.specifications?.unit||"",packaging:evidence?.specifications?.packaging||"",
      units_per_pack:evidence?.specifications?.units_per_pack||"",
      category_label:evidence?.specifications?.category_label||"",
      category_code:evidence?.specifications?.category_code||"",
      family_code:evidence?.specifications?.family_code||""
    };
    const resolvedCode=categoryByCode.get(inputs.category_code);
    if(resolvedCode&&categoryById.has(resolvedCode)&&
       (mappedSet===null?
         Object.hasOwn(evidence?.specifications||{},"category_label"):
         mappedSet.has("category_label")))
      inputs.category_label=pathOf(categoryById.get(resolvedCode));
    for(const [field,source,label] of [...FIELDS,["category_label","category","Danh mục"],
      ["category_code","category_code","Mã danh mục"],["family_code","family_code","Mã nhóm mẫu"]]){
      const next=inputs[field]||"";
      const oldValue=oldRecord?(source==="product_spec"?oldRecord.product_spec?.[field]:
        source==="category_code"?(categoryById.get(oldRecord.category_id)?.category_code||""):
        source==="family_code"?(families.find(f=>f.id===oldRecord.family_id)?.family_code||""):
        source==="category"?(categoryById.has(oldRecord.category_id)?
          pathOf(categoryById.get(oldRecord.category_id)):""):
        field==="ten_san_pham"?(oldRecord.ten_san_pham||oldRecord.ten_goc_xnt||oldRecord.ten_goc_bang_gia):
        oldRecord[field]):"";
      const before=oldValue==null?"":String(oldValue);
      const ignored=mappedSet!==null&&!mappedSet.has(field);
      const clearing=clearSet.has(field)&&!next.trim();
      const changed=item.diffs.some(diff=>diff.field===label);
      item.field_states.push({key:field,field:label,from:before,to:
        ignored||(!next.trim()&&!clearing)?before:clearing?"":next,
        action:ignored?"ignore":
          field==="ten_san_pham"&&explicitClear===undefined&&oldRecord&&
          mappedSet?.has(field)&&!next.trim()?
          "required":!oldRecord&&item.status==="create"?
          (next.trim()?"create":"empty"):
          clearing?(changed?"clear":"same"):
          !next.trim()?"keep":changed?"update":"same"});
    }
    totals[item.status]++;
    items.push(item);
  }
  return {source_sheet:"SAN PHAM",totals,items,operations,applied:false};
}
