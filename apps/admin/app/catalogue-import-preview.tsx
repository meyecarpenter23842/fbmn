"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";

type RowStatus = "create" | "update" | "unchanged" | "conflict" | "error";
type Item = {
  row: number;
  sku_cong_ty: string | null;
  status: RowStatus;
  reason?: string | null;
  changes: string[];
  source_name_xnt: string;
  proposed_name: string;
  specifications: { paper_size: string | null; pages: string | null; ruling: string | null };
  provenance: { source_sheet: string; excel_row: number; inventory_source: boolean; price_document_source: boolean };
  media_missing: boolean;
  media_candidate_count: number;
  price_source_present: boolean;
  warnings: string[];
  requires_review: boolean;
};
type Preview = {
  applied: false;
  database_queried: false;
  baseline: "empty_snapshot_hypothetical";
  totals: Record<RowStatus, number>;
  counts: {
    total_rows: number; unique_company_skus: number;
    valid_unique_company_skus: number; both: number; xnt_only: number; price_only: number;
    missing_images: number; image_candidates: number; negative_stock: number;
    stock_snapshot_missing: number; packaging_promotion_review: number;
    similar_sku_review: number; suspected_company_code: number;
    source_spec_conflict: number; shared_media_review: number;
    regional_channel_review: number; merged_pdf_price_cells: number;
  };
  source_sheet: string;
  items: Item[];
};
const LABELS: Record<string,string> = {
  create:"Ứng viên tạo mới", update:"Dự kiến cập nhật", unchanged:"Không thay đổi",
  conflict:"Xung đột", error:"Lỗi dữ liệu", price_unverified:"Chưa xác minh giá nguồn",
  missing_xnt:"Không có trong XNT", image_missing:"Thiếu ảnh – được phép",
  image_mapping_unapproved:"Ảnh chưa duyệt", negative_stock:"Tồn âm – cần xác minh",
  stock_snapshot_missing:"Tồn trống – chưa xác định", packaging_promotion_review:"Lốc / hàng khuyến mãi",
  similar_sku_review:"Mã gần giống – không gộp", suspected_company_code:"Nghi sai mã công ty",
  source_spec_conflict:"Lệch quy cách / dòng kẻ", shared_media_review:"Ảnh dùng chung cần duyệt",
  regional_channel_review:"Kiểm tra kênh Miền Bắc",
  merged_pdf_price_cell_verify:"Giá ô PDF gộp cần kiểm tra", unknown_source:"Nguồn chưa rõ",
};
const TARGETED = new Set([
  "negative_stock","stock_snapshot_missing","packaging_promotion_review","similar_sku_review",
  "suspected_company_code","source_spec_conflict","shared_media_review",
  "regional_channel_review","merged_pdf_price_cell_verify",
]);
function csvCell(value: string | number | null | undefined) {
  const plain=String(value??"");
  // Prevent spreadsheet formula injection in a locally exported CSV.
  const safe=/^[\s]*[=+\-@\t\r]/.test(plain)?"'"+plain:plain;
  return '"' + safe.replaceAll('"','""') + '"';
}
function downloadCsv(items: Item[]) {
  const headers=["sku_cong_ty","ten_goc_xnt","ten_de_xuat","kho","so_trang","dong_ke",
    "nguon_xnt","nguon_bang_gia","anh_thieu","tinh_trang","canh_bao","dong_excel"];
  const lines=[headers.join(","),...items.map(item=>[
    item.sku_cong_ty,item.source_name_xnt,item.proposed_name,
    item.specifications?.paper_size,item.specifications?.pages,item.specifications?.ruling,
    item.provenance.inventory_source?"co":"khong",item.provenance.price_document_source?"co":"khong",
    item.media_missing?"co":"khong",item.status,item.warnings.join(" | "),item.row,
  ].map(csvCell).join(","))];
  const blob=new Blob(["\uFEFF",lines.join("\r\n")+"\r\n"],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download="fbmn-adm02-import-review-safe.csv";anchor.click();
  queueMicrotask(()=>URL.revokeObjectURL(url));
}
export default function CatalogueImportPreview() {
  const fileRef=useRef<HTMLInputElement>(null);
  const [file,setFile]=useState<File|null>(null);
  const [preview,setPreview]=useState<Preview|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [page,setPage]=useState(1);
  const [expanded,setExpanded]=useState<number|null>(null);
  function selectFile(event:ChangeEvent<HTMLInputElement>){
    const item=event.target.files?.[0]||null;
    event.target.value="";
    setPreview(null);setError("");setPage(1);setSearch("");setFilter("all");setExpanded(null);
    if(!item)return;
    if(!/\.xlsx$/i.test(item.name)||item.size===0||item.size>8_000_000){
      setFile(null);setError("Chỉ chọn file .xlsx tối đa 8 MB.");return;
    }
    setFile(item);
  }
  async function execute(){
    if(!file||busy)return;
    setBusy(true);setError("");setPreview(null);
    try {
      const session=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store",headers:{Accept:"application/json"}});
      if(!session.ok)throw new Error("Phiên đăng nhập hết hạn. Đăng nhập lại trước khi xem file.");
      const auth=await session.json() as {token?:unknown};
      const jwt=typeof auth.token==="string"?auth.token:"";
      if(jwt.length>12000||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jwt))
        throw new Error("Không xác minh được token Admin.");
      const form=new FormData();form.append("file",file,file.name);
      const response=await fetch("/api/catalogue/preview",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{Authorization:"Bearer "+jwt,Accept:"application/json"},body:form,
      });
      if(!response.ok){
        if(response.status===401||response.status===403)throw new Error("Tài khoản chưa được cấp quyền xem trước import. Kiểm tra quyền Owner/Editor.");
        if(response.status===413)throw new Error("Tệp quá dung lượng cho phép.");
        if(response.status===422||response.status===400)throw new Error("Excel chưa đúng cấu trúc đối chiếu 613 SKU (sheet/cột hoặc mã sai định dạng).");
        throw new Error("Admin staging chưa xử lý được XLSX (HTTP "+response.status+").");
      }
      const data=await response.json() as Preview;
      if(data.database_queried!==false || data.applied!==false || !Array.isArray(data.items) ||
         data.counts?.total_rows!==data.items.length || data.items.length>20_000)
        throw new Error("Báo cáo không đúng hợp đồng dry-run; đã từ chối hiển thị.");
      setPreview(data);
    }catch(ex:unknown){setError(ex instanceof Error?ex.message:"Không đọc được file Excel.");}
    finally{setBusy(false);}
  }
  const filtered=useMemo(()=>{
    if(!preview)return [];
    const q=search.trim().toLocaleLowerCase("vi");
    return preview.items.filter(item=>{
      if(q&&!String(item.sku_cong_ty??"").toLocaleLowerCase("vi").includes(q)&&
        !item.source_name_xnt.toLocaleLowerCase("vi").includes(q)&&
        !item.proposed_name.toLocaleLowerCase("vi").includes(q))return false;
      if(filter==="targeted")return item.warnings.some(w=>TARGETED.has(w))||item.status==="conflict"||item.status==="error";
      if(filter==="image_missing")return item.media_missing;
      if(filter==="xnt_only")return item.provenance.inventory_source&&!item.provenance.price_document_source;
      if(filter==="price_only")return !item.provenance.inventory_source&&item.provenance.price_document_source;
      if(filter==="error")return item.status==="error"||item.status==="conflict";
      return true;
    });
  },[preview,search,filter]);
  const paged=filtered.slice((page-1)*50,page*50);
  const pages=Math.max(1,Math.ceil(filtered.length/50));
  const targeted=preview?.items.filter(item=>item.warnings.some(w=>TARGETED.has(w))||item.status==="conflict"||item.status==="error").length??0;
  return <div className="import-preview">
    <div className="page-title"><div><h1>Nhập Excel · Xem trước</h1><p>ADM-02 · Kiểm tra mã SKU công ty và ngoại lệ trước khi duyệt nhập liệu</p></div>
      <span className="import-readonly">CHỈ XEM TRƯỚC · STAGING</span></div>
    <div className="import-information"><strong>Không ghi dữ liệu.</strong> Excel được gửi đến API Admin staging có kiểm tra quyền, chỉ xử lý trong bộ nhớ.
      Không đưa giá NET, tồn kho hoặc tên file ảnh vào báo cáo; không upload R2 và không công bố SKU.
      <br/>Kết quả “ứng viên tạo mới” được tính với giả định database trống, <b>không phải trạng thái thực tế Neon</b>.</div>
    <section className="import-upload-panel" aria-label="Tải file đối chiếu">
      <div className="import-upload-text"><div className="import-file-icon">XLSX</div><div><h2>Chọn file đối chiếu 613 SKU</h2>
        <p>Sheet bắt buộc: <code>DOI CHIEU 613 SKU</code> · Giữ nguyên mã có số 0 đầu như 0114 và 0714 · Dung lượng tối đa 8 MB</p>
        {file&&<div className="import-selected">Đã chọn: <b>{file.name}</b> ({(file.size/1024).toFixed(0)} KB)</div>}
      </div></div>
      <div className="import-upload-actions"><input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={selectFile} className="import-file-hidden" aria-label="Chọn Excel" />
        <button type="button" className="import-btn import-secondary" onClick={()=>fileRef.current?.click()} disabled={busy}>Chọn Excel</button>
        <button type="button" className="import-btn import-primary" onClick={()=>void execute()} disabled={!file||busy}>{busy?"Đang đối chiếu…":"Phân tích & xem trước"}</button>
      </div>
    </section>
    {error&&<div className="import-error" role="alert">{error}</div>}
    {preview&&<section aria-label="Báo cáo xem trước">
      <div className="import-kpis">
        <div><small>SKU trong file</small><strong>{preview.counts.total_rows}</strong><span>{preview.counts.unique_company_skus} mã phân biệt</span></div>
        <div><small>Chỉ nguồn XNT</small><strong>{preview.counts.xnt_only}</strong><span>Chưa xác minh giá nguồn</span></div>
        <div><small>Thiếu ảnh</small><strong>{preview.counts.missing_images}</strong><span>Được giữ lại, không chặn</span></div>
        <div><small>Cần kiểm tra ngoại lệ</small><strong>{targeted}</strong><span>Mã/nguồn/quy cách</span></div>
        <div><small>Lỗi dữ liệu</small><strong>{preview.totals.error}</strong><span>Không được tự bỏ qua</span></div>
      </div>
      <div className="import-review-banner">
        <b>{preview.totals.create} ứng viên tạo mới (giả định DB trống)</b>
        <span>Chỉ bảng giá: {preview.counts.price_only} · Tồn âm: {preview.counts.negative_stock} · Tồn trống: {preview.counts.stock_snapshot_missing} · Ảnh ứng viên chưa duyệt: {preview.counts.image_candidates}</span>
      </div>
      <div className="import-controls">
        <label className="import-search-label"><span>Tìm SKU / tên</span><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="0114, C5921, tên sản phẩm…" /></label>
        <label className="import-filter-label"><span>Lọc theo</span><select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}>
          <option value="all">Tất cả SKU</option><option value="targeted">Ngoại lệ cần duyệt</option>
          <option value="image_missing">Thiếu ảnh</option><option value="xnt_only">Chỉ XNT</option>
          <option value="price_only">Chỉ bảng giá</option><option value="error">Lỗi / xung đột</option>
        </select></label>
        <button type="button" className="import-btn import-secondary" onClick={()=>downloadCsv(filtered)} disabled={!filtered.length}>Xuất báo cáo CSV (đang lọc)</button>
      </div>
      <div className="import-table-wrap"><table className="import-table"><thead><tr><th>SKU công ty</th><th>Tên sản phẩm / XNT</th><th>Quy cách</th><th>Nguồn</th><th>Ảnh</th><th>Đối chiếu</th><th>Chi tiết</th></tr></thead><tbody>
        {paged.map((item,index)=><tr key={item.row} className={item.warnings.some(w=>TARGETED.has(w))?"import-flagged":""}>
          <td><b>{item.sku_cong_ty||"—"}</b></td>
          <td><b>{item.proposed_name||item.source_name_xnt||"Chưa có tên"}</b>{item.proposed_name&&item.source_name_xnt&&<small>{item.source_name_xnt}</small>}</td>
          <td>{[item.specifications?.paper_size,item.specifications?.pages,item.specifications?.ruling].filter(Boolean).join(" · ")||"—"}</td>
          <td>{item.provenance.inventory_source?"XNT":""}{item.provenance.inventory_source&&item.provenance.price_document_source?" + ":""}{item.provenance.price_document_source?"Bảng giá":""}</td>
          <td><span className={item.media_missing?"import-muted":"import-soft"}>{item.media_missing?"Chưa có ảnh":item.media_candidate_count+" ảnh ứng viên"}</span></td>
          <td><span className={item.status==="error"||item.status==="conflict"?"import-bad":"import-good"}>{LABELS[item.status]||item.status}</span></td>
          <td><button type="button" className="import-detail-btn" aria-expanded={expanded===item.row} onClick={()=>setExpanded(expanded===item.row?null:item.row)}>{expanded===item.row?"Thu gọn":"Xem cảnh báo"}</button>
            {expanded===item.row&&<div className="import-details"><b>Excel dòng {item.row}</b>{item.reason&&<span>Lỗi: {item.reason}</span>}
              {item.warnings.map((w,i)=><span key={i}>• {LABELS[w]||w}</span>)}<span>Ảnh chưa được phê duyệt hoặc xuất bản.</span></div>}</td>
        </tr>)}
        {!paged.length&&<tr><td colSpan={7} className="import-empty">Không tìm thấy SKU phù hợp bộ lọc.</td></tr>}
      </tbody></table></div>
      <div className="import-pagination"><span>{filtered.length} SKU phù hợp · Trang {Math.min(page,pages)}/{pages}</span><div>
        <button type="button" className="import-btn import-secondary" onClick={()=>setPage(Math.max(1,page-1))} disabled={page<=1}>Trang trước</button>
        <button type="button" className="import-btn import-secondary" onClick={()=>setPage(Math.min(pages,page+1))} disabled={page>=pages}>Trang sau</button>
      </div></div>
      <p className="import-footnote">Không lưu bản nháp, không cập nhật database. Duyệt nhập vào Neon staging sẽ thuộc bước riêng sau khi đối chiếu dữ liệu và phân quyền.</p>
    </section>}
  </div>;
}
