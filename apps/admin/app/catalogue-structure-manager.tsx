"use client";
import {useMemo,useState} from "react";

export type StructureCategory={id:string;parent_id:string|null;category_code:string;category_label:string};
export type StructureFamily={id:string;family_code:string;family_label:string;revision?:number};
export type StructureSku={sku_cong_ty:string;revision:number;category_id:string|null;
  family_id:string|null;review_status:string;ten_san_pham:string|null;
  ten_goc_xnt:string|null;ten_goc_bang_gia?:string|null};

type Pane="categories"|"families";
export default function CatalogueStructureManager({
  initialPane,categories,families,items,busy,error,
  selectedBulk,onCreateCategory,onRenameCategory,onCreateFamily,onRenameFamily,
  onChangeMember,onBulkAssign,onOpenSku
}:{
  initialPane:Pane;categories:StructureCategory[];families:StructureFamily[];items:StructureSku[];
  busy:boolean;error:string;selectedBulk:string[];
  onCreateCategory:(name:string,parentId:string|null)=>void;
  onRenameCategory:(category:StructureCategory,name:string)=>void;
  onCreateFamily:(name:string)=>void;
  onRenameFamily:(family:StructureFamily,name:string)=>void;
  onChangeMember:(sku:StructureSku,familyId:string|null)=>void;
  onBulkAssign:(familyId:string)=>void;
  onOpenSku:(sku:StructureSku)=>void;
}){
  const [pane,setPane]=useState<Pane>(initialPane);
  const [search,setSearch]=useState("");
  const [selectedId,setSelectedId]=useState("");
  const [newName,setNewName]=useState("");
  const [parentId,setParentId]=useState("");
  const [rename,setRename]=useState("");
  const [memberSearch,setMemberSearch]=useState("");
  const [addSku,setAddSku]=useState("");
  const roots=categories.filter(c=>!c.parent_id);
  const selectedCategory=categories.find(c=>c.id===selectedId);
  const selectedFamily=families.find(f=>f.id===selectedId);
  const directCategoryCounts=useMemo(()=>Object.fromEntries(categories.map(c=>
    [c.id,items.filter(s=>s.category_id===c.id).length])),[categories,items]);
  const familyCounts=useMemo(()=>Object.fromEntries(families.map(f=>
    [f.id,items.filter(s=>s.family_id===f.id).length])),[families,items]);
  const subIds=selectedCategory?categories.filter(c=>c.parent_id===selectedCategory.id).map(c=>c.id):[];
  const members=items.filter(s=>pane==="families"
    ? s.family_id===selectedFamily?.id
    : s.category_id===selectedCategory?.id||subIds.includes(s.category_id||""));
  const memberMatches=members.filter(s=>{
    const q=memberSearch.trim().toLocaleLowerCase("vi");
    return !q||s.sku_cong_ty.toLocaleLowerCase("vi").includes(q)||
      (s.ten_san_pham||s.ten_goc_xnt||s.ten_goc_bang_gia||"").toLocaleLowerCase("vi").includes(q);
  });
  const available=items.filter(s=>["draft","needs_review"].includes(s.review_status)
    &&s.family_id!==selectedFamily?.id&&(s.sku_cong_ty.toLocaleLowerCase("vi").includes(addSku.toLocaleLowerCase("vi"))||
      (s.ten_san_pham||s.ten_goc_xnt||"").toLocaleLowerCase("vi").includes(addSku.toLocaleLowerCase("vi")))).slice(0,30);
  const select=(id:string)=>{setSelectedId(id);setRename("");setMemberSearch("");setAddSku("");};
  const choosePane=(next:Pane)=>{setPane(next);select("");setSearch("");setNewName("");setParentId("");};
  const matches=(label:string,code:string)=>`${code} ${label}`.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi"));
  const exportCodes=()=>{
    const records=[
      ...categories.map(c=>["Danh mục",c.category_code,c.category_label,
        categories.find(p=>p.id===c.parent_id)?.category_code||"",String(directCategoryCounts[c.id]||0)]),
      ...families.map(f=>["Nhóm mẫu",f.family_code,f.family_label,"",String(familyCounts[f.id]||0)])
    ];
    const safe=(value:string)=>{
      const text=/^[\s]*[=+@\-\t\r]/.test(value)?"'"+value:value;
      return '"'+text.replaceAll('"','""')+'"';
    };
    const csv="\uFEFF"+[["Loại","Mã cố định","Tên","Mã danh mục cha","Số SKU"],...records]
      .map(row=>row.map(safe).join(",")).join("\r\n")+"\r\n";
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;
    a.download="Futurebook_MA_DANH_MUC_NHOM_MAU.csv";
    document.body.appendChild(a);a.click();a.remove();
    URL.revokeObjectURL(url);
  };
  const requestMove=(sku:StructureSku,familyId:string|null)=>{
    if(!window.confirm((familyId?"Gắn":"Gỡ")+" mã "+sku.sku_cong_ty+
      (familyId?" vào nhóm "+(selectedFamily?.family_label||"đã chọn"):" khỏi nhóm hiện tại")+
      "? Mã công ty và ảnh không thay đổi."))return;
    onChangeMember(sku,familyId);
  };
  return <div className="catalogue-structure">
    <div className="catalogue-structure-tabs" role="tablist" aria-label="Quản lý cấu trúc sản phẩm">
      <button type="button" role="tab" aria-selected={pane==="categories"}
        className={pane==="categories"?"active":""} onClick={()=>choosePane("categories")}>Danh mục ({categories.length})</button>
      <button type="button" role="tab" aria-selected={pane==="families"}
        className={pane==="families"?"active":""} onClick={()=>choosePane("families")}>Nhóm mẫu ({families.length})</button>
    </div>
    <div className="catalogue-structure-helper-row">
      <p className="catalogue-structure-help">Mã DM/NM được cấp tự động và không đổi khi sửa tên. SKU dùng mã này để cập nhật chính xác qua Excel.</p>
      <button type="button" className="import-btn import-secondary" disabled={!categories.length&&!families.length}
        onClick={exportCodes}>Xuất bảng mã CSV</button>
    </div>
    {error&&<p className="import-error" role="alert">{error}</p>}
    <div className="catalogue-structure-grid">
      <section className="catalogue-structure-sidebar" aria-label={pane==="categories"?"Cây danh mục":"Danh sách nhóm mẫu"}>
        <label className="catalogue-structure-field">Tìm {pane==="categories"?"danh mục":"nhóm mẫu"}
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nhập mã hoặc tên…" type="search"/>
        </label>
        <div className="catalogue-structure-tree">
          {pane==="categories"?roots.filter(root=>matches(root.category_label,root.category_code)||
            categories.some(c=>c.parent_id===root.id&&matches(c.category_label,c.category_code)))
            .map(root=>{
              const children=categories.filter(c=>c.parent_id===root.id);
              const total=(directCategoryCounts[root.id]||0)+children.reduce((n,c)=>n+(directCategoryCounts[c.id]||0),0);
              return <div className="catalogue-structure-tree-group" key={root.id}>
                <button className={selectedId===root.id?"active":""} type="button" onClick={()=>select(root.id)}>
                  <span><b className="catalogue-structure-code">{root.category_code}</b> ▸ {root.category_label}</span><small>{total} SKU</small>
                </button>
                {children.filter(c=>!search||matches(root.category_label,root.category_code)||matches(c.category_label,c.category_code)).map(c=>
                  <button className={"child "+(selectedId===c.id?"active":"")} type="button" key={c.id} onClick={()=>select(c.id)}>
                    <span><b className="catalogue-structure-code">{c.category_code}</b> ↳ {c.category_label}</span><small>{directCategoryCounts[c.id]||0} SKU</small>
                  </button>)}
              </div>;
            }):families.filter(f=>matches(f.family_label,f.family_code)).map(f=>
              <button className={selectedId===f.id?"active":""} type="button" key={f.id} onClick={()=>select(f.id)}>
                <span><b className="catalogue-structure-code">{f.family_code}</b> {f.family_label}</span><small>{familyCounts[f.id]||0} SKU</small>
              </button>)}
          {!(pane==="categories"?categories.length:families.length)&&
            <p className="catalogue-structure-empty">Chưa có {pane==="categories"?"danh mục":"nhóm mẫu"} nào.</p>}
        </div>
      </section>
      <section className="catalogue-structure-detail">
        <div className="catalogue-structure-create">
          <strong>Tạo {pane==="categories"?"danh mục":"nhóm mẫu"} mới <small>(mã được cấp tự động)</small></strong>
          <div className="catalogue-structure-inputs">
            <label className="catalogue-structure-field">Tên
              <input value={newName} maxLength={160} onChange={e=>setNewName(e.target.value)}
                placeholder={pane==="categories"?"Tên danh mục":"Tên nhóm mẫu"}/>
            </label>
            {pane==="categories"&&<label className="catalogue-structure-field">Danh mục cha
              <select value={parentId} onChange={e=>setParentId(e.target.value)}>
                <option value="">Cấp 1</option>
                {roots.map(c=><option value={c.id} key={c.id}>{c.category_label}</option>)}
              </select>
            </label>}
            <button type="button" className="import-btn import-primary"
              disabled={busy||!newName.trim()||
                (pane==="categories"
                  ?categories.some(c=>c.parent_id===(parentId||null)&&c.category_label.trim().toLocaleLowerCase("vi")===newName.trim().toLocaleLowerCase("vi"))
                  :families.some(f=>f.family_label.trim().toLocaleLowerCase("vi")===newName.trim().toLocaleLowerCase("vi")))}
              onClick={()=>{
                if(pane==="categories")onCreateCategory(newName,parentId||null);
                else onCreateFamily(newName);
                setNewName("");
              }}>Tạo mới</button>
          </div>
        </div>
        {(pane==="categories"?selectedCategory:selectedFamily)?<>
          <div className="catalogue-structure-selected">
            <div><small>Đang xem {pane==="categories"?"danh mục":"nhóm mẫu"}</small>
              <p className="catalogue-structure-code-line">Mã cố định: <strong>{pane==="categories"?selectedCategory?.category_code:selectedFamily?.family_code}</strong></p>
              <h3>{pane==="categories"?selectedCategory?.category_label:selectedFamily?.family_label}</h3>
              <span>{members.length} SKU {pane==="categories"&&subIds.length?"(gồm danh mục con)":""}</span>
            </div>
          </div>
          <div className="catalogue-structure-rename">
            <label className="catalogue-structure-field">Đổi tên (không đổi liên kết)
              <input value={rename} maxLength={160} onChange={e=>setRename(e.target.value)}
                placeholder={pane==="categories"?selectedCategory?.category_label:selectedFamily?.family_label}/>
            </label>
            <button type="button" className="import-btn import-secondary" disabled={busy||!rename.trim()||
              rename.trim()===(pane==="categories"?selectedCategory?.category_label:selectedFamily?.family_label)}
              onClick={()=>{
                if(!window.confirm("Đổi tên? Các sản phẩm đang liên kết sẽ được giữ nguyên."))return;
                if(pane==="categories"&&selectedCategory)onRenameCategory(selectedCategory,rename);
                if(pane==="families"&&selectedFamily)onRenameFamily(selectedFamily,rename);
                setRename("");
              }}>Lưu tên</button>
          </div>
          {pane==="categories"&&selectedCategory&&!selectedCategory.parent_id&&
            <button type="button" className="import-btn import-secondary" onClick={()=>setParentId(selectedCategory.id)}>
              + Tạo danh mục con bên dưới
            </button>}
          {pane==="families"&&selectedFamily&&<>
            <div className="catalogue-structure-assign">
              <strong>Gắn sản phẩm vào nhóm</strong>
              <label className="catalogue-structure-field">Tìm SKU chưa thuộc nhóm này
                <input type="search" value={addSku} onChange={e=>setAddSku(e.target.value)}
                  placeholder="Nhập mã hoặc tên sản phẩm…"/>
              </label>
              <div className="catalogue-structure-pick" aria-label="Mã sản phẩm có thể gắn">
                {available.map(s=><button type="button" key={s.sku_cong_ty} disabled={busy}
                  onClick={()=>requestMove(s,selectedFamily.id)}>
                  <b>{s.sku_cong_ty}</b><span>{s.ten_san_pham||s.ten_goc_xnt||"Chưa có tên"}</span>
                  <small>{s.family_id?"Chuyển nhóm":"Gắn"}</small></button>)}
                {!available.length&&<p className="catalogue-structure-empty">Không có SKU phù hợp.</p>}
              </div>
            </div>
            {selectedBulk.length>=2&&<div className="catalogue-structure-bulk">
              <span>Đã chọn {selectedBulk.length} SKU trong bảng sản phẩm.</span>
              <button className="import-btn import-primary" type="button" disabled={busy}
                onClick={()=>{if(window.confirm("Gắn "+selectedBulk.length+" SKU vào nhóm "+selectedFamily.family_label+"?"))onBulkAssign(selectedFamily.id)}}>
                Gắn các SKU đã chọn
              </button>
            </div>}
          </>}
          <div className="catalogue-structure-members">
            <div className="catalogue-structure-members-top">
              <strong>Danh sách sản phẩm ({members.length})</strong>
              <input type="search" value={memberSearch} onChange={e=>setMemberSearch(e.target.value)}
                placeholder="Lọc mã / tên…" aria-label="Lọc thành viên nhóm"/>
            </div>
            <div className="catalogue-structure-member-list">
              {memberMatches.slice(0,200).map(s=><div className="catalogue-structure-member" key={s.sku_cong_ty}>
                <div><b>{s.sku_cong_ty}</b>
                  <span>{s.ten_san_pham||s.ten_goc_xnt||s.ten_goc_bang_gia||"Chưa có tên"}</span>
                </div>
                <button type="button" className="import-btn import-secondary" onClick={()=>onOpenSku(s)}>Xem / sửa</button>
                {pane==="families"&&<button type="button" className="import-btn import-secondary"
                  disabled={busy||!["draft","needs_review"].includes(s.review_status)}
                  onClick={()=>requestMove(s,null)}>Gỡ nhóm</button>}
              </div>)}
              {!memberMatches.length&&<p className="catalogue-structure-empty">Chưa có sản phẩm phù hợp.</p>}
            </div>
          </div>
        </>:<div className="catalogue-structure-empty catalogue-structure-unselected">
          Chọn một {pane==="categories"?"danh mục trong cây bên trái":"nhóm mẫu trong danh sách"} để xem thành viên và quản lý thiết lập.
        </div>}
      </section>
    </div>
  </div>;
}
