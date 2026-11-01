"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";

type RowStatus = "create" | "update" | "unchanged" | "conflict" | "error";
type Item = {
  row: number;
  sku_cong_ty: string | null;
  status: RowStatus;
  reason?: string | null;
  changes: string[];
  diffs?: {field:string;from:string;to:string}[];
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
  database_queried: true;
  baseline: "actual_neon_staging_snapshot";
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
  previewFingerprint?: string;
  items: Item[];
};
const LABELS: Record<RowStatus,string> = {
  create:"SKU mới",update:"SKU đã có — có thay đổi",unchanged:"Không thay đổi",
  conflict:"Xung đột",error:"Lỗi kỹ thuật",
};
function csvCell(value: string | number | null | undefined) {
  const plain=String(value??"");
  // Prevent spreadsheet formula injection in a locally exported CSV.
  const safe=/^[\s]*[=+\-@\t\r]/.test(plain)?"'"+plain:plain;
  return '"' + safe.replaceAll('"','""') + '"';
}
function downloadCsv(items: Item[]) {
  const headers=["ma_cong_ty","ten_san_pham","kho","so_trang","dong_ke","trang_thai","loi_ky_thuat","dong_excel"];
  const lines=[headers.join(","),...items.map(item=>[
    item.sku_cong_ty,item.proposed_name||item.source_name_xnt,
    item.specifications?.paper_size,item.specifications?.pages,item.specifications?.ruling,
    LABELS[item.status],item.status==="error"||item.status==="conflict"?item.reason||"":"",item.row,
  ].map(csvCell).join(","))];
  const blob=new Blob(["\uFEFF",lines.join("\r\n")+"\r\n"],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement("a");
  anchor.href=url;anchor.download="futurebook-xem-truoc-nhap-san-pham.csv";anchor.click();
  queueMicrotask(()=>URL.revokeObjectURL(url));
}
export default function CatalogueImportPreview({onBusyChange,onSaved}:{onBusyChange?:(value:boolean)=>void;onSaved?:()=>void}={}) {
  const fileRef=useRef<HTMLInputElement>(null);
  const [file,setFile]=useState<File|null>(null);
  const [preview,setPreview]=useState<Preview|null>(null);
  const [busy,setBusy]=useState(false);
  const [approving,setApproving]=useState(false);
  const [approved,setApproved]=useState(false);
  const [receipt,setReceipt]=useState("");
  const [error,setError]=useState("");
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [page,setPage]=useState(1);
  const [expanded,setExpanded]=useState<number|null>(null);
  useEffect(()=>{onBusyChange?.(busy||approving)},[busy,approving,onBusyChange]);
  function selectFile(event:ChangeEvent<HTMLInputElement>){
    const item=event.target.files?.[0]||null;
    event.target.value="";
    setPreview(null);setError("");setPage(1);setSearch("");setFilter("all");setExpanded(null);setApproved(false);setReceipt("");
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
        if(response.status===422||response.status===400)throw new Error("File không đúng mẫu sản phẩm. Dùng mẫu Excel 1 sheet SAN PHAM hoặc file đối chiếu 613 SKU cũ. Mã công ty phải là văn bản, kể cả 0114.");
        throw new Error("Admin staging chưa xử lý được XLSX (HTTP "+response.status+").");
      }
      const data=await response.json() as Preview;
      if(data.database_queried!==true || data.applied!==false || !Array.isArray(data.items) ||
         data.counts?.total_rows!==data.items.length || data.items.length>20_000)
        throw new Error("Báo cáo không đúng hợp đồng dry-run; đã từ chối hiển thị.");
      setPreview(data);
    }catch(ex:unknown){setError(ex instanceof Error?ex.message:"Không đọc được file Excel.");}
    finally{setBusy(false);}
  }
  async function applyDrafts(){
    if(!file||!preview||busy||approving)return;
    const oneSheet=preview.source_sheet==="SAN PHAM";
    const create=preview.totals.create,update=preview.totals.update;
    const eligible=preview.database_queried===true &&
      preview.totals.error===0&&preview.totals.conflict===0 &&
      (oneSheet?(create+update>0&&/^[0-9a-f]{64}$/.test(preview.previewFingerprint||"")):
        (approved&&create>0&&create===preview.counts.total_rows&&
         update===0&&preview.totals.unchanged===0));
    if(!eligible){setError("File còn lỗi hoặc dữ liệu đã thay đổi. Hãy phân tích lại trước khi lưu.");return;}
    // P3 one-sheet: pressing the primary save button is the ONE explicit confirmation.
    // Legacy 8-sheet stays create-only and preserves its prior double-check.
    if(!oneSheet&&!window.confirm("Lưu "+create+" SKU mới? Chưa xuất bản."))return;
    setApproving(true);setError("");setReceipt("");
    try{
      const tokenResponse=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
      if(!tokenResponse.ok)throw new Error("Phiên đăng nhập hết hạn.");
      const auth=await tokenResponse.json() as {token?:unknown};
      const token=typeof auth.token==="string"?auth.token:"";
      if(!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))
        throw new Error("Không xác minh được Owner.");
      const form=new FormData();
      form.append("file",file,file.name);
      if(oneSheet){
        form.append("confirm","SYNC_SAN_PHAM");
        form.append("expectedCreate",String(create));
        form.append("expectedUpdate",String(update));
        form.append("fingerprint",preview.previewFingerprint||"");
      }else{
        form.append("confirm","NHAP_BAN_NHAP");
        form.append("expectedCreate",String(create));
      }
      const response=await fetch(oneSheet?"/api/catalogue/sync":"/api/catalogue/apply",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{Authorization:"Bearer "+token},body:form,
      });
      if(!response.ok){
        if(response.status===403)throw new Error("Chỉ Owner có quyền lưu hàng loạt.");
        if(response.status===409)throw new Error("Danh mục hoặc phiên bản SKU đã thay đổi. Phân tích lại file rồi xác nhận.");
        if(response.status===400)throw new Error("File hoặc xác nhận không hợp lệ.");
        throw new Error("Không lưu được sản phẩm (HTTP "+response.status+").");
      }
      const data=await response.json() as {data?:{drafts_saved?:number;created?:number;updated?:number;published?:number}};
      if(data.data?.published!==0)throw new Error("API trả về trạng thái xuất bản không hợp lệ.");
      if(oneSheet){
        if(data.data?.created!==create||data.data?.updated!==update)
          throw new Error("Kết quả cập nhật không khớp với bản xem trước.");
        setReceipt("Đã thêm "+create+" SKU, cập nhật "+update+" SKU. Chưa hiển thị công khai.");
      }else{
        if(data.data?.drafts_saved!==create)throw new Error("Kết quả nhập không hợp lệ.");
        setReceipt("Đã thêm "+create+" SKU. Chưa hiển thị công khai.");
      }
      onSaved?.();setPreview(null);setApproved(false);
    }catch(ex:unknown){setError(ex instanceof Error?ex.message:"Không lưu được Excel.");}
    finally{setApproving(false);}
  }
  const filtered=useMemo(()=>{
    if(!preview)return [];
    const q=search.trim().toLocaleLowerCase("vi");
    return preview.items.filter(item=>{
      if(q&&!String(item.sku_cong_ty??"").toLocaleLowerCase("vi").includes(q)&&
        !item.source_name_xnt.toLocaleLowerCase("vi").includes(q)&&
        !item.proposed_name.toLocaleLowerCase("vi").includes(q))return false;
      if(filter==="create"||filter==="update"||filter==="unchanged")return item.status===filter;
      if(filter==="error")return item.status==="error"||item.status==="conflict";
      return true;
    });
  },[preview,search,filter]);
  const paged=filtered.slice((page-1)*50,page*50);
  const pages=Math.max(1,Math.ceil(filtered.length/50));
  const oneSheet=preview?.source_sheet==="SAN PHAM";
  const eligibleSave=!!preview&&!busy&&!approving&&preview.totals.error===0&&preview.totals.conflict===0&&
    (oneSheet?(preview.totals.create+preview.totals.update>0&&!!preview.previewFingerprint):
      (approved&&preview.totals.create>0&&preview.totals.create===preview.counts.total_rows&&
       preview.totals.update===0&&preview.totals.unchanged===0));
  return <div className="import-preview">
    <div className="page-title"><div><h1>Nhập sản phẩm Excel</h1><p>Chọn file → xem SKU mới và thay đổi → xác nhận lưu.</p></div>
      <span className="import-readonly">XEM TRƯỚC · CHƯA LƯU</span></div>
    <div className="import-information"><strong>Xem trước không ghi dữ liệu.</strong> Excel được so sánh với các SKU hiện có.
      Giá NET, tồn kho và dữ liệu nội bộ không xuất ra báo cáo. Với Excel 1 sheet, mã đã có chỉ được cập nhật khi anh bấm lưu; ô trống không xóa dữ liệu cũ.
      <br/>Dữ liệu chỉ lưu khi anh chủ động xác nhận.</div>
    <section className="import-upload-panel" aria-label="Tải file đối chiếu">
      <div className="import-upload-text"><div className="import-file-icon">XLSX</div><div><h2>Chọn Excel sản phẩm</h2>
        <p><b>Mẫu thông dụng: 1 sheet SAN PHAM.</b> File đối chiếu 8 sheet cũ cũng được chấp nhận, tự tìm sheet phù hợp. Giữ nguyên mã 0114, 0714 · Tối đa 8 MB.</p>
        <a className="import-template-link" href="/api/catalogue/template" download>Tải mẫu Excel 1 sheet (.xlsx)</a>
        {file&&<div className="import-selected">Đã chọn: <b>{file.name}</b> ({(file.size/1024).toFixed(0)} KB)</div>}
      </div></div>
      <div className="import-upload-actions"><input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={selectFile} className="import-file-hidden" aria-label="Chọn Excel" />
        <button type="button" className="import-btn import-secondary" onClick={()=>fileRef.current?.click()} disabled={busy}>Chọn Excel</button>
        <button type="button" className="import-btn import-primary" onClick={()=>void execute()} disabled={!file||busy}>{busy?"Đang đối chiếu…":"Phân tích & xem trước"}</button>
      </div>
    </section>
    {error&&<div className="import-error" role="alert">{error}</div>}
    {receipt&&<div className="import-review-banner" role="status"><b>{receipt}</b></div>}
    {preview&&<section aria-label="Báo cáo xem trước">
      <div className="import-kpis import-kpis-simple">
        <div><small>SKU trong file</small><strong>{preview.counts.total_rows}</strong></div>
        <div><small>SKU mới</small><strong>{preview.totals.create}</strong></div>
        <div><small>SKU đã có</small><strong>{preview.totals.update+preview.totals.unchanged}</strong></div>
        <div><small>Lỗi / xung đột</small><strong>{preview.totals.error+preview.totals.conflict}</strong></div>
      </div>
      <div className="import-review-banner">
        <b>{preview.totals.create} SKU mới · {preview.totals.update} SKU có thay đổi · {preview.totals.unchanged} không đổi · {preview.totals.conflict} xung đột</b>
        <span>Mã đã tồn tại sẽ không bị tự động ghi đè.</span>
      </div>
      <div className="import-information" aria-label="Xác nhận lưu sản phẩm">
        {!oneSheet&&<label style={{display:"flex",gap:10,alignItems:"center"}}>
          <input type="checkbox" checked={approved} onChange={event=>setApproved(event.target.checked)} />
          <span>Tôi xác nhận lưu các SKU mới. Không tự xuất bản.</span>
        </label>}
        <div style={{marginTop:10}}>
          <button type="button" className="import-btn import-primary" onClick={()=>void applyDrafts()}
            disabled={!eligibleSave}>
            {approving?"Đang lưu sản phẩm…":oneSheet?
              "Xác nhận lưu "+(preview.totals.create+preview.totals.update)+" SKU (mới "+preview.totals.create+", sửa "+preview.totals.update+")":
              "Lưu "+preview.totals.create+" SKU mới"}
          </button>
        </div>
        <small>{oneSheet?"Bấm lưu một lần. Dữ liệu được so sánh lại với Neon; nếu có revision mới sẽ hủy toàn bộ, không ghi đè.":"File đối chiếu 8 sheet cũ chỉ hỗ trợ nhập mới."}</small>
      </div>
      <div className="import-controls">
        <label className="import-search-label"><span>Tìm SKU / tên</span><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="0114, C5921, tên sản phẩm…" /></label>
        <label className="import-filter-label"><span>Lọc theo</span><select value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}>
          <option value="all">Tất cả SKU</option><option value="create">SKU mới</option>
          <option value="update">Có thay đổi</option><option value="unchanged">Không thay đổi</option><option value="error">Lỗi / xung đột</option>
        </select></label>
        <button type="button" className="import-btn import-secondary" onClick={()=>downloadCsv(filtered)} disabled={!filtered.length}>Xuất danh sách CSV</button>
      </div>
      <div className="import-table-wrap"><table className="import-table import-preview-simple-table">
        <thead><tr><th>Mã công ty</th><th>Tên sản phẩm</th><th>Quy cách</th><th>Kết quả</th><th>Chi tiết</th></tr></thead><tbody>
        {paged.map(item=><tr key={item.row}>
          <td><b>{item.sku_cong_ty||"—"}</b></td>
          <td><b>{item.proposed_name||item.source_name_xnt||"Chưa có tên"}</b></td>
          <td>{[item.specifications?.paper_size,item.specifications?.pages,item.specifications?.ruling].filter(Boolean).join(" · ")||"—"}</td>
          <td><span className={item.status==="error"||item.status==="conflict"?"import-bad":"import-good"}>{LABELS[item.status]}</span></td>
          <td>{(item.status==="error"||item.status==="conflict"||item.changes.length>0)&&
            <button type="button" className="import-detail-btn" aria-expanded={expanded===item.row}
              onClick={()=>setExpanded(expanded===item.row?null:item.row)}>{expanded===item.row?"Thu gọn":"Chi tiết"}</button>}
            {expanded===item.row&&<div className="import-details">
              <b>Dòng Excel {item.row}</b>
              {item.reason&&<span>{item.reason}</span>}
              {item.changes.length>0&&<span>Thay đổi: {item.changes.join(", ")}</span>}
              {!!item.diffs?.length&&<table className="import-diff-table"><thead>
                <tr><th>Trường</th><th>Giá trị cũ</th><th>Giá trị mới</th></tr></thead><tbody>
                {item.diffs.map(diff=><tr key={diff.field}><td>{diff.field}</td>
                  <td>{diff.from||"—"}</td><td>{diff.to||"—"}</td></tr>)}
              </tbody></table>}
            </div>}
          </td>
        </tr>)}
        {!paged.length&&<tr><td colSpan={5} className="import-empty">Không có SKU phù hợp.</td></tr>}
      </tbody></table></div>
      <div className="import-pagination"><span>{filtered.length} SKU phù hợp · Trang {Math.min(page,pages)}/{pages}</span><div>
        <button type="button" className="import-btn import-secondary" onClick={()=>setPage(Math.max(1,page-1))} disabled={page<=1}>Trang trước</button>
        <button type="button" className="import-btn import-secondary" onClick={()=>setPage(Math.min(pages,page+1))} disabled={page>=pages}>Trang sau</button>
      </div></div>
      <p className="import-footnote">Xem trước chỉ so sánh dữ liệu kỹ thuật. Chỉ xác nhận mới lưu sản phẩm; không tự xuất bản.</p>
    </section>}
  </div>;
}
