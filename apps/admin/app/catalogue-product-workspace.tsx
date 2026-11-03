"use client";

import {useMemo,useState} from "react";
import type {ReactNode} from "react";
import CatalogueMediaManager,{PrivateImage} from "./catalogue-media-manager";
import CataloguePricebookPanel from "./catalogue-pricebook-panel";

type WorkspaceItem={
  sku_cong_ty:string;
  ten_san_pham?:string|null;
  ten_goc_xnt?:string|null;
  ten_goc_bang_gia?:string|null;
  family_label?:string|null;
  cover_asset_id?:string|null;
  cover_sha256?:string|null;
  media_count?:number;
};
export default function CatalogueProductWorkspace({
  items,selectedSku,companySku,name,shortDescription,longDescription,fields,
  editingAllowed,loading,onSku,onName,onShortDescription,onLongDescription,
  onSave,onClose,onNew,onSelect,onMediaChanged,onMediaBusy
}:{
  items:WorkspaceItem[];
  selectedSku:string|null;
  companySku:string;
  name:string;
  shortDescription:string;
  longDescription:string;
  fields:ReactNode;
  editingAllowed:boolean;
  loading:boolean;
  error:string;
  notice:string;
  onSku:(value:string)=>void;
  onName:(value:string)=>void;
  onShortDescription:(value:string)=>void;
  onLongDescription:(value:string)=>void;
  onSave:()=>void;
  onClose:()=>void;
  onNew:()=>void;
  onSelect:(sku:string)=>void;
  onMediaChanged:()=>void;
  onMediaBusy:(busy:boolean)=>void;
}){
  const [find,setFind]=useState("");
  const results=useMemo(()=>{
    const q=find.trim().toLocaleLowerCase("vi");
    return items.filter(item=>!q||
      item.sku_cong_ty.toLocaleLowerCase("vi").includes(q)||
      (item.ten_san_pham||item.ten_goc_xnt||item.ten_goc_bang_gia||"").toLocaleLowerCase("vi").includes(q))
      .slice(0,35);
  },[find,items]);
  const selected=items.find(item=>item.sku_cong_ty===selectedSku);
  return <div className="catalogue-quick-workspace">
    <aside className="catalogue-workspace-index">
      <div className="catalogue-workspace-index-head">
        <strong>Sản phẩm</strong><span>{items.length}</span>
      </div>
      <label className="catalogue-workspace-search">
        <span className="sr-only">Tìm sản phẩm theo mã hoặc tên</span>
        <input type="search" value={find} onChange={event=>setFind(event.target.value)}
          placeholder="Tìm mã hoặc tên…" aria-label="Tìm sản phẩm"/>
      </label>
      <button type="button" className="catalogue-workspace-new" onClick={onNew} disabled={loading}>
        + Thêm sản phẩm
      </button>
      <div className="catalogue-workspace-results" aria-label="Chọn sản phẩm để sửa">
        {results.map(item=><button key={item.sku_cong_ty} type="button" disabled={loading}
          aria-current={selectedSku===item.sku_cong_ty?"true":undefined}
          className={"catalogue-workspace-item"+(selectedSku===item.sku_cong_ty?" current":"")}
          onClick={()=>onSelect(item.sku_cong_ty)}>
          <span className="catalogue-workspace-mini-photo">
            {item.cover_asset_id&&item.cover_sha256?
              <PrivateImage id={item.cover_asset_id} signature={item.cover_sha256}
                alt={"Ảnh "+item.sku_cong_ty}/>:
              <span className="catalogue-image-placeholder" aria-hidden="true">▧</span>}
          </span>
          <span className="catalogue-workspace-item-copy">
            <b>{item.sku_cong_ty}</b>
            <small>{item.ten_san_pham||item.ten_goc_xnt||item.ten_goc_bang_gia||"Chưa đặt tên"}</small>
          </span>
        </button>)}
        {results.length===0&&<p className="catalogue-workspace-empty">Không tìm thấy mã phù hợp.</p>}
      </div>
    </aside>
    <div className="catalogue-workspace-primary">
      <div className="catalogue-workspace-summary">
        <div>
          <small>{selectedSku?"Chỉnh sửa mã công ty":"Tạo mã công ty mới"}</small>
          <h3>{selectedSku?selectedSku:"Thêm sản phẩm"}</h3>
        </div>
        <span className="catalogue-workspace-status">{selectedSku?"Bản nháp nội bộ":"Chưa lưu"}</span>
      </div>
      <div className="catalogue-workspace-fields">
        <label>Mã công ty
          <input value={companySku} onChange={event=>onSku(event.target.value)}
            readOnly={!!selectedSku||!editingAllowed} maxLength={80}
            aria-describedby="catalogue-workspace-sku-hint"
            placeholder="Ví dụ 0114" autoComplete="off"/>
        </label>
        <label className="catalogue-workspace-full">Tên sản phẩm
          <input value={name} onChange={event=>onName(event.target.value)}
            readOnly={!editingAllowed} maxLength={1200} placeholder="Nhập tên sản phẩm"/>
        </label>
        <p id="catalogue-workspace-sku-hint" className="catalogue-workspace-helper">
          Mã công ty giữ nguyên dưới dạng văn bản, kể cả số 0 đầu. Ảnh/mẫu bìa không tạo mã mới.
        </p>
        <div className="catalogue-workspace-specs">{fields}</div>
        <div className="catalogue-workspace-descriptions">
          <h4>Mô tả sản phẩm</h4>
          <label>Mô tả ngắn <span>{shortDescription.length}/600</span>
            <textarea value={shortDescription} rows={3} maxLength={600}
              readOnly={!editingAllowed} onChange={event=>onShortDescription(event.target.value)}
              placeholder="Tóm tắt ngắn nếu đã có nội dung được xác nhận"/>
          </label>
          <label>Mô tả chi tiết <span>{longDescription.length}/6000</span>
            <textarea value={longDescription} rows={5} maxLength={6000}
              readOnly={!editingAllowed} onChange={event=>onLongDescription(event.target.value)}
              placeholder="Chỉ nhập thông tin sản phẩm có nguồn, không tự tạo nội dung"/>
          </label>
        </div>
        {selectedSku&&<CataloguePricebookPanel key={selectedSku} sku={selectedSku}/>}
        {selected?.family_label&&<p className="catalogue-workspace-family">
          Nhóm mẫu hiện tại: <strong>{selected.family_label}</strong>
        </p>}
      </div>
      <div className="catalogue-workspace-footer">
        <button className="import-btn import-secondary" type="button" disabled={loading} onClick={onClose}>Đóng</button>
        <button className="import-btn import-primary" type="button" disabled={loading||!editingAllowed||!companySku.trim()||!name.trim()}
          onClick={onSave}>{loading?"Đang lưu…":selectedSku?"Lưu thay đổi":"Lưu sản phẩm"}</button>
      </div>
    </div>
    <aside className="catalogue-workspace-media">
      <div className="catalogue-workspace-media-title">
        <h3>Hình ảnh sản phẩm</h3>
        <small>{selectedSku?selected?.media_count||0:0} ảnh</small>
      </div>
      {selectedSku?
        <CatalogueMediaManager key={selectedSku} sku={selectedSku}
          onChanged={onMediaChanged} onBusyChange={onMediaBusy}/>:
        <div className="catalogue-workspace-media-empty">
          <span className="catalogue-image-placeholder" aria-hidden="true">▧</span>
          <strong>Chưa có ảnh</strong>
          <p>Lưu sản phẩm trước, sau đó thêm ảnh ngay tại đây. Có thể bổ sung sau.</p>
        </div>}
    </aside>
  </div>;
}
