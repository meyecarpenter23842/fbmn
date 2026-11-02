"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";

type RowStatus = "create" | "update" | "unchanged" | "conflict" | "error";
type ProfileColumn={index:number;header:string;suggested:string;samples:string[]};
const XLSX_INSPECT_ERRORS:Record<string,string>={
  legacy_reconciliation_sheet:"Đây là file đối chiếu 613 SKU có cột XNT / bảng giá, không phải mẫu cập nhật thông thường. Hãy chọn tab Nhập mới / đồng bộ để dùng đúng luồng nhập đối chiếu.",
  multiple_worksheets:"File có nhiều worksheet. Chế độ Cập nhật hàng loạt chỉ nhận một worksheet; dùng tab Nhập mới / đồng bộ cho file đối chiếu nhiều sheet.",
  missing_company_sku_column:"Không tìm thấy tiêu đề 'Mã công ty' hoặc 'SKU công ty' ở cột A trong 12 dòng đầu. Vui lòng giữ cột mã công ty dưới dạng văn bản để không mất số 0 đầu.",
  missing_editable_columns:"File có mã công ty nhưng chưa có cột thông tin nào để cập nhật.",
  too_many_columns:"File có hơn 40 cột tiêu đề thực tế. Hãy chia file thành các lượt cập nhật tối đa 40 cột.",
  too_many_rows:"File có quá nhiều dòng; vui lòng chia file thành các đợt nhỏ hơn.",
  invalid_column_heading:"Một tiêu đề cột chứa công thức/giá trị không được hỗ trợ. Hãy đổi tiêu đề thành văn bản.",
  invalid_xlsx_size:"Dung lượng file Excel không hợp lệ.",
  invalid_xlsx_workbook:"File không có cấu trúc .xlsx hợp lệ. Hãy lưu lại bằng Excel rồi thử.",
  xlsx_too_many_parts:"File Excel có quá nhiều thành phần không cần thiết; hãy lưu lại một bản .xlsx đơn giản hơn.",
  xlsx_xml_too_large:"File Excel chứa dữ liệu định dạng quá lớn, vui lòng lưu bản .xlsx gọn hơn.",
  xlsx_decode_failed:"Không giải mã được nội dung XLSX này. Hãy mở trong Excel và dùng Save As → Excel Workbook (.xlsx) rồi thử lại."
};

const COLUMN_FIELDS=[
  {key:"ignore",label:"— Bỏ qua cột —"},
  {key:"title",label:"Tên sản phẩm"},
  {key:"barcode",label:"Mã vạch"},
  {key:"size",label:"Khổ"},
  {key:"pages",label:"Số trang"},
  {key:"ruling",label:"Dòng kẻ"},
  {key:"category_label",label:"Danh mục cha / con"},
  {key:"gsm",label:"Định lượng GSM"},
  {key:"cover_type",label:"Loại bìa"},
  {key:"unit",label:"Đơn vị tính"},
  {key:"packaging",label:"Quy cách đóng gói"},
  {key:"units_per_pack",label:"Số đơn vị / đóng gói"}
] as const;

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
  const mappingScrollRef=useRef<HTMLDivElement|null>(null);
  const [mappingViewport,setMappingViewport]=useState({
    first:2,last:2,canPrev:false,canNext:false
  });
  const inspectionSeq=useRef(0);
  const [columns,setColumns]=useState<ProfileColumn[]>([]);
  const [mapping,setMapping]=useState<string[]>([]);
  const [inspecting,setInspecting]=useState(false);
  const [file,setFile]=useState<File|null>(null);
  const [mode,setMode]=useState<"update"|"import">("update");
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
  useEffect(()=>{onBusyChange?.(busy||approving||inspecting)},[busy,approving,inspecting,onBusyChange]);
  // Scrollbars can be hidden by OS/browser settings. Keep independent, always
  // visible navigation controls outside the horizontally scrolling grid.
  useEffect(()=>{
    const viewport=mappingScrollRef.current;
    if(!viewport||columns.length===0)return;
    const update=()=>{
      const firstHeader=viewport.querySelector<HTMLElement>(".catalogue-mapping-table th");
      const step=firstHeader?.getBoundingClientRect().width||210;
      const max=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
      const offset=Math.max(0,Math.min(viewport.scrollLeft,max));
      const first=Math.min(columns.length,Math.max(2,Math.floor((offset+1)/step)+2));
      const nonStickyWidth=Math.max(step,viewport.clientWidth-step);
      const visible=Math.max(1,Math.ceil(nonStickyWidth/step));
      setMappingViewport({
        first,last:Math.min(columns.length,first+visible-1),
        canPrev:offset>5,canNext:offset<max-5
      });
    };
    viewport.addEventListener("scroll",update,{passive:true});
    window.addEventListener("resize",update);
    const observer=typeof ResizeObserver==="undefined"?null:new ResizeObserver(update);
    observer?.observe(viewport);
    update();
    return ()=>{
      observer?.disconnect();
      viewport.removeEventListener("scroll",update);
      window.removeEventListener("resize",update);
    };
  },[columns]);
  function moveMapping(direction:-1|1){
    const viewport=mappingScrollRef.current;
    if(!viewport)return;
    const columnWidth=viewport.querySelector<HTMLElement>(".catalogue-mapping-table th")
      ?.getBoundingClientRect().width||210;
    // A whole number of columns per click; preserve the pinned SKU column.
    const count=Math.max(1,Math.floor((viewport.clientWidth-columnWidth)/columnWidth));
    viewport.scrollBy({left:direction*count*columnWidth,behavior:"smooth"});
  }
  const mappingReady=columns.length>=2&&mapping.length===columns.length&&mapping[0]==="sku"&&
    mapping.slice(1).some(key=>key!=="ignore")&&
    new Set(mapping.slice(1).filter(key=>key!=="ignore")).size===
      mapping.slice(1).filter(key=>key!=="ignore").length;
  function changeMapping(index:number,value:string){
    if(index===0||busy||approving)return;
    setMapping(old=>old.map((key,i)=>i===index?value:
      (value!=="ignore"&&key===value?"ignore":key)));
    setPreview(null);setReceipt("");setApproved(false);setExpanded(null);setError("");
  }
  async function inspectFile(item:File,sequence:number){
    setInspecting(true);
    try{
      const session=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
      if(!session.ok)throw Error("Phiên đăng nhập hết hạn.");
      const auth=await session.json() as {token?:unknown};
      const token=typeof auth.token==="string"?auth.token:"";
      if(!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))throw Error("Xác thực Admin không hợp lệ.");
      const form=new FormData();form.append("file",item,item.name);
      const response=await fetch("/api/catalogue/inspect",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{Authorization:"Bearer "+token},body:form});
      if(!response.ok){
        const issue=await response.json().catch(()=>null) as {error?:{code?:string}}|null;
        if(response.status===401||response.status===403)
          throw Error("Phiên đăng nhập không đủ quyền xem file. Hãy đăng nhập lại bằng tài khoản được cấp quyền.");
        const code=issue?.error?.code||"";
        throw Error(XLSX_INSPECT_ERRORS[code]||("Không thể phân tích Excel (HTTP "+response.status+"). Vui lòng thử lại hoặc lưu lại file dưới dạng .xlsx."));
      }
      const result=await response.json() as {data?:{columns?:ProfileColumn[];total_rows?:number}};
      const cols=result.data?.columns;
      if(!Array.isArray(cols)||cols.length<2||cols.length>40||
         cols.some((col,i)=>col.index!==i+1||typeof col.header!=="string"||
           !Array.isArray(col.samples)||typeof col.suggested!=="string"))
        throw Error("Không đọc được các cột Excel.");
      if(inspectionSeq.current!==sequence)return;
      setColumns(cols);
      setMapping(cols.map((col,i)=>i===0?"sku":
        COLUMN_FIELDS.some(f=>f.key===col.suggested)?col.suggested:"ignore"));
    }catch(err){
      if(inspectionSeq.current!==sequence)return;
      setColumns([]);setMapping([]);
      setError(err instanceof Error?err.message:"Không nhận diện được cột Excel.");
    }finally{if(inspectionSeq.current===sequence)setInspecting(false);}
  }
  function switchMode(next:"update"|"import"){
    if(busy||approving)return;
    inspectionSeq.current++;setInspecting(false);
    setColumns([]);setMapping([]);
    setMode(next);setFile(null);setPreview(null);setReceipt("");
    setError("");setPage(1);setExpanded(null);setApproved(false);
    setSearch("");setFilter("all");
    if(fileRef.current)fileRef.current.value="";
  }
  function selectFile(event:ChangeEvent<HTMLInputElement>){
    const item=event.target.files?.[0]||null;
    event.target.value="";
    inspectionSeq.current++;setColumns([]);setMapping([]);setInspecting(false);
    setPreview(null);setError("");setPage(1);setSearch("");setFilter("all");setExpanded(null);setApproved(false);setReceipt("");
    if(!item)return;
    if(!/\.xlsx$/i.test(item.name)||item.size===0||item.size>8_000_000){
      setFile(null);setError("Chỉ chọn file .xlsx tối đa 8 MB.");return;
    }
    setFile(item);
    void inspectFile(item,inspectionSeq.current);
  }
  async function execute(){
    if(!file||busy||inspecting|| ((mode==="update"||columns.length>0)&&!mappingReady))return;
    setBusy(true);setError("");setPreview(null);
    try {
      const session=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store",headers:{Accept:"application/json"}});
      if(!session.ok)throw new Error("Phiên đăng nhập hết hạn. Đăng nhập lại trước khi xem file.");
      const auth=await session.json() as {token?:unknown};
      const jwt=typeof auth.token==="string"?auth.token:"";
      if(jwt.length>12000||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jwt))
        throw new Error("Không xác minh được token Admin.");
      const form=new FormData();form.append("file",file,file.name);
      if(mappingReady)form.append("mapping",JSON.stringify(mapping));
      const response=await fetch("/api/catalogue/preview",{
        method:"POST",credentials:"same-origin",cache:"no-store",
        headers:{Authorization:"Bearer "+jwt,Accept:"application/json"},body:form,
      });
      if(!response.ok){
        if(response.status===401||response.status===403)throw new Error("Tài khoản chưa được cấp quyền xem trước import. Kiểm tra quyền Owner/Editor.");
        if(response.status===413)throw new Error("Tệp quá dung lượng cho phép.");
        if(response.status===422||response.status===400)throw new Error("Không phân tích được cấu trúc Excel hoặc cách ghép cột. Kiểm tra dòng tiêu đề và mã công ty dạng văn bản; file 1 sheet được phép đặt tên worksheet tùy ý.");
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
    const eligible=preview.database_queried===true && (columns.length===0||mappingReady) &&
      (mode!=="update"||(oneSheet&&create===0)) &&
      preview.totals.error===0&&preview.totals.conflict===0 &&
      (oneSheet?(create+update>0&&/^[0-9a-f]{64}$/.test(preview.previewFingerprint||"")):
        (approved&&create>0&&create===preview.counts.total_rows&&
         update===0&&preview.totals.unchanged===0));
    if(!eligible){
      setError(mode==="update"&&create>0?
        "Tệp có SKU mới. Chế độ Cập nhật chỉ sửa mã đã tồn tại; bỏ các dòng SKU mới hoặc chuyển sang tab Nhập mới / đồng bộ.":
        "File còn lỗi hoặc dữ liệu đã thay đổi. Hãy phân tích lại trước khi lưu.");
      return;
    }
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
      if(mappingReady)form.append("mapping",JSON.stringify(mapping));
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
  const eligibleSave=!!preview&&!busy&&!approving&&!inspecting&&
    (columns.length===0||mappingReady)&&preview.totals.error===0&&preview.totals.conflict===0&&
    (mode!=="update"||(oneSheet&&preview.totals.create===0))&&
    (oneSheet?(preview.totals.create+preview.totals.update>0&&!!preview.previewFingerprint):
      (approved&&preview.totals.create>0&&preview.totals.create===preview.counts.total_rows&&
       preview.totals.update===0&&preview.totals.unchanged===0));
  return <div className="import-preview">
    <div className="page-title"><div><h1>{mode==="update"?"Cập nhật sản phẩm hàng loạt":"Nhập mới / đồng bộ sản phẩm"}</h1>
      <p>Xuất danh mục Excel → sửa nhiều dòng → nhập lại → xem giá trị cũ và mới → xác nhận lưu một lần.</p></div>
      <span className="import-readonly">XEM TRƯỚC · CHƯA LƯU</span></div>
    <div className="catalogue-bulk-tabs" role="tablist" aria-label="Chế độ nhập sản phẩm">
      <button type="button" role="tab" aria-selected={mode==="update"}
        className={mode==="update"?"active":""} disabled={busy||approving}
        onClick={()=>switchMode("update")}>Cập nhật SKU đã có</button>
      <button type="button" role="tab" aria-selected={mode==="import"}
        className={mode==="import"?"active":""} disabled={busy||approving}
        onClick={()=>switchMode("import")}>Nhập mới / đồng bộ</button>
    </div>
    <div className="import-information"><strong>Xem trước không ghi dữ liệu.</strong> Excel được so sánh với các SKU hiện có.
      Giá NET, tồn kho và dữ liệu nội bộ không xuất ra báo cáo. Với Excel 1 sheet, mã đã có chỉ được cập nhật khi anh bấm lưu; ô trống không xóa dữ liệu cũ.
      {mode==="update"&&<b> Chế độ này chỉ cho lưu những SKU đã tồn tại; mã lạ sẽ phải xử lý ở tab Nhập mới / đồng bộ.</b>}
      <br/>Dữ liệu chỉ lưu khi anh chủ động xác nhận.</div>
    <section className="import-upload-panel" aria-label="Tải file đối chiếu">
      <div className="import-upload-text"><div className="import-file-icon">XLSX</div><div><h2>{mode==="update"?"Chọn Excel đã chỉnh sửa nhiều SKU":"Chọn Excel sản phẩm"}</h2>
        <p><b>Mẫu thông dụng: 1 sheet SAN PHAM.</b> File đối chiếu 8 sheet cũ cũng được chấp nhận, tự tìm sheet phù hợp. Gồm tên, danh mục, mã vạch, khổ, trang, dòng kẻ, GSM, bìa và đóng gói. Giữ nguyên mã 0114, 0714 · Tối đa 8 MB.</p>
        <a className="import-template-link" href="/api/catalogue/template" download>Tải mẫu Excel 1 sheet (.xlsx)</a>
        {file&&<div className="import-selected">Đã chọn: <b>{file.name}</b> ({(file.size/1024).toFixed(0)} KB)</div>}
      </div></div>
      <div className="import-upload-actions"><input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={selectFile} className="import-file-hidden" aria-label="Chọn Excel" />
        <button type="button" className="import-btn import-secondary" onClick={()=>fileRef.current?.click()} disabled={busy}>Chọn Excel</button>
        <button type="button" className="import-btn import-primary" onClick={()=>void execute()} disabled={!file||busy||inspecting||((mode==="update"||columns.length>0)&&!mappingReady)}>{busy?"Đang đối chiếu…":"Bước 3 · Xem trước thay đổi"}</button>
      </div>
    </section>
    {inspecting&&<p className="import-information" role="status">Đang đọc các cột và chuẩn bị bảng ghép trường…</p>}
    {file&&columns.length>0&&<section className="catalogue-mapping-section" aria-label="Ghép cột Excel với thông tin sản phẩm">
      <div className="catalogue-mapping-title">
        <div><h3>Bước 2 · Ghép cột Excel với thuộc tính cần cập nhật</h3>
          <p>Cột 1 cố định là mã công ty. Với các cột còn lại, chọn trường cần sửa hoặc Bỏ qua. Mỗi trường chỉ được dùng một lần.</p></div>
        <span>{mapping.slice(1).filter(v=>v!=="ignore").length} trường được chọn</span>
      </div>
      <div className="catalogue-mapping-nav" role="group" aria-label="Điều hướng ngang các cột Excel">
        <span className="catalogue-mapping-position" role="status" aria-live="polite">
          {columns.length>1?
            "Đang xem cột "+mappingViewport.first+"–"+mappingViewport.last+
              " / "+columns.length+" (mã công ty luôn cố định)":
            "Mã công ty luôn cố định"}
        </span>
        <div className="catalogue-mapping-nav-actions">
          <button type="button" aria-label="Xem các cột Excel phía trước"
            onClick={()=>moveMapping(-1)} disabled={!mappingViewport.canPrev}>
            <span aria-hidden="true">‹</span> Cột trước
          </button>
          <button type="button" aria-label="Xem các cột Excel tiếp theo"
            onClick={()=>moveMapping(1)} disabled={!mappingViewport.canNext}>
            Cột tiếp <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
      <div className="catalogue-mapping-scroll" ref={mappingScrollRef}
        role="region" aria-label="Bảng Excel có thể cuộn ngang" tabIndex={0}>
        <table className="catalogue-mapping-table"><thead><tr>
          {columns.map((col,i)=><th key={col.index}>
            <span>Cột {col.index} · {col.header||"Không có tiêu đề"}</span>
            {i===0?<strong className="catalogue-mapping-locked">Mã công ty · khóa đối chiếu</strong>:
              <select aria-label={"Thuộc tính cột "+col.index} value={mapping[i]||"ignore"}
                disabled={busy||approving} onChange={e=>changeMapping(i,e.target.value)}>
                {COLUMN_FIELDS.map(option=><option value={option.key} key={option.key}>{option.label}</option>)}
              </select>}
          </th>)}
        </tr></thead><tbody>
          {[0,1,2].map(n=><tr key={n}>{columns.map(col=>
            <td key={col.index} title={col.samples[n]||""}>{col.samples[n]||"—"}</td>)}</tr>)}
        </tbody></table>
      </div>
      {!mappingReady&&<small className="import-bad">Chọn ít nhất một thuộc tính ngoài mã công ty và không gán trùng trường.</small>}
      <small>Nhấn Cột tiếp / Cột trước để xem toàn bộ cột, hoặc kéo thanh ngang bên dưới bảng. Ghép cột chỉ dùng cho lượt nhập hiện tại. Thay đổi lựa chọn sẽ hủy bản xem trước cũ; không sửa dữ liệu trước khi xác nhận.</small>
    </section>}
    {error&&<div className="import-error" role="alert">{error}</div>}
    {receipt&&<div className="import-review-banner" role="status"><b>{receipt}</b></div>}
    {preview&&<section aria-label="Báo cáo xem trước">
      <div className="import-kpis import-kpis-simple">
        <div><small>SKU trong file</small><strong>{preview.counts.total_rows}</strong></div>
        <div><small>SKU mới</small><strong>{preview.totals.create}</strong></div>
        <div><small>SKU đã có</small><strong>{preview.totals.update+preview.totals.unchanged}</strong></div>
        <div><small>Lỗi / xung đột</small><strong>{preview.totals.error+preview.totals.conflict}</strong></div>
      </div>
      {mode==="update"&&preview.totals.create>0&&<div className="import-error" role="alert">
        Có {preview.totals.create} mã công ty chưa tồn tại. Chế độ Cập nhật sẽ không tạo SKU mới. Xóa dòng mã lạ khỏi Excel hoặc chọn tab Nhập mới / đồng bộ rồi xem trước lại.
      </div>}
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
