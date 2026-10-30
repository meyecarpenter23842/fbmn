"use client";
import {useCallback,useEffect,useMemo,useState} from "react";

type SKU={sku_cong_ty:string;ten_san_pham:string|null;ten_goc_xnt:string|null;ten_goc_bang_gia?:string|null;
  barcode:string|null;paper_size:string|null;review_status:string;revision:number;
  family_id:string|null;family_label:string|null;product_spec?:{pages?:string,ruling?:string}};
type Family={id:string;family_label:string;revision?:number};
type ApiResult<T>={data?:T;error?:{code?:string}};
async function bearer():Promise<string>{
  const r=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
  if(!r.ok)throw new Error("Phiên đăng nhập đã hết hạn.");
  const data=await r.json() as {token?:unknown};
  if(typeof data.token!=="string"||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data.token))
    throw new Error("Không lấy được xác thực Owner.");
  return data.token;
}
async function api<T>(route:string,method:"GET"|"POST"|"PATCH"="GET",body?:object):Promise<T>{
  const token=await bearer();
  const res=await fetch("/api/catalogue/"+route,{method,cache:"no-store",credentials:"same-origin",
    headers:{Authorization:"Bearer "+token,Accept:"application/json",
      ...(body?{"Content-Type":"application/json"}:{})},
    ...(body?{body:JSON.stringify(body)}:{})});
  const payload=await res.json() as ApiResult<T>;
  if(!res.ok){
    if(res.status===409)throw new Error("Bản nháp đã được thay đổi hoặc SKU đã tồn tại. Tải lại để đối chiếu.");
    if(res.status===403)throw new Error("Tài khoản chưa được cấp quyền thao tác này.");
    throw new Error("Catalogue API chưa sẵn sàng ("+(payload.error?.code||res.status)+").");
  }
  if(!payload.data)throw new Error("API không trả về dữ liệu catalogue.");
  return payload.data;
}
export default function CatalogueManager({onImport}:{onImport:()=>void}){
  const [items,setItems]=useState<SKU[]>([]);
  const [families,setFamilies]=useState<Family[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("all");
  const [page,setPage]=useState(1);
  const [selected,setSelected]=useState<string[]>([]);
  const [groupId,setGroupId]=useState("");
  const [newFamily,setNewFamily]=useState("");
  const [editing,setEditing]=useState<SKU|null>(null);
  const [editName,setEditName]=useState("");
  const [editStatus,setEditStatus]=useState<"draft"|"needs_review"|"withdrawn">("draft");
  const [create,setCreate]=useState(false);
  const [sku,setSku]=useState("");
  const [name,setName]=useState("");
  const [size,setSize]=useState("");
  const refresh=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const [catalogue,groups]=await Promise.all([
        api<{items:SKU[]}>("skus"),api<{items:Family[]}>("families")]);
      if(!Array.isArray(catalogue.items)||catalogue.items.length>20000 ||
        catalogue.items.some(x=>typeof x.sku_cong_ty!=="string"))throw new Error("Dữ liệu SKU không hợp lệ.");
      setItems(catalogue.items);setFamilies(groups.items);
    }catch(e){setError(e instanceof Error?e.message:"Không đọc được catalogue");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{const task=setTimeout(()=>{void refresh()},0);return()=>clearTimeout(task)},[refresh]);
  const filtered=useMemo(()=>{
    const q=query.toLocaleLowerCase("vi");
    return items.filter(row=>(status==="all"||row.review_status===status)&&
      (!q||row.sku_cong_ty.toLocaleLowerCase("vi").includes(q)||
      (row.ten_san_pham||row.ten_goc_xnt||"").toLocaleLowerCase("vi").includes(q)||
      (row.family_label||"").toLocaleLowerCase("vi").includes(q)));
  },[items,query,status]);
  const pages=Math.max(1,Math.ceil(filtered.length/50));
  const visible=filtered.slice((page-1)*50,page*50);
  const run=async(work:()=>Promise<void>)=>{
    if(busy)return;setBusy(true);setError("");setMessage("");
    try{await work();await refresh();}
    catch(e){setError(e instanceof Error?e.message:"Không lưu được bản nháp.");}
    finally{setBusy(false);}
  };
  const add=()=>void run(async()=>{
    if(!sku||sku!==sku.trim()||!name.trim())throw new Error("Cần mã công ty dạng text và tên sản phẩm.");
    const data=await api<{sku_cong_ty:string}>("skus","POST",{
      sku_cong_ty:sku,ten_san_pham:name,paper_size:size});
    setMessage("Đã tạo bản nháp SKU "+data.sku_cong_ty+" (chưa xuất bản).");
    setCreate(false);setSku("");setName("");setSize("");
  });
  const save=()=>void run(async()=>{
    if(!editing)return;
    if(!editName.trim()&&!editing.ten_goc_xnt?.trim()&&!editing.ten_goc_bang_gia?.trim())
      throw new Error("Bản nháp phải có tên sản phẩm hợp lệ.");
    await api("skus","PATCH",{sku_cong_ty:editing.sku_cong_ty,
      expected_revision:editing.revision,ten_san_pham:editName,review_status:editStatus});
    setMessage("Đã cập nhật SKU "+editing.sku_cong_ty+". Mã công ty không thay đổi.");
    setEditing(null);
  });
  const addFamily=()=>void run(async()=>{
    if(!newFamily.trim())throw new Error("Nhập tên nhóm sản phẩm.");
    const group=await api<Family>("families","POST",{family_label:newFamily});
    setGroupId(group.id);setNewFamily("");
    setMessage("Đã tạo nhóm. Chọn các mã SKU cùng mẫu/quy cách để gắn thủ công.");
  });
  const assign=()=>void run(async()=>{
    if(selected.length<2||!groupId)throw new Error("Chọn nhóm và ít nhất hai SKU.");
    if(!window.confirm("Gắn "+selected.length+" SKU công ty vào cùng một nhóm? Không đổi mã SKU."))return;
    await api("group","POST",{family_id:groupId,sku_cong_ty:selected});
    setMessage("Đã gắn "+selected.length+" mã vào nhóm. Mã công ty được giữ nguyên.");
    setSelected([]);
  });
  return <section className="catalogue-manager">
    <div className="page-title"><div><h1>Quản lý sản phẩm</h1>
      <p>Catalogue nháp Neon · SKU công ty là mã gốc, kể cả số 0 đầu · Chưa xuất bản</p></div>
      <div className="action-row">
        <button type="button" className="import-btn import-secondary" onClick={()=>void refresh()} disabled={busy||loading}>Làm mới</button>
        <button type="button" className="import-btn import-secondary" onClick={onImport}>Nhập Excel</button>
        <button type="button" className="import-btn import-primary" onClick={()=>setCreate(!create)}>Thêm SKU nháp</button>
      </div>
    </div>
    <div className="import-kpis"><div><small>SKU đã lưu trong Neon</small><strong>{items.length}</strong><span>Không bao gồm Excel chưa nhập</span></div>
      <div><small>Bản nháp</small><strong>{items.filter(x=>x.review_status==="draft").length}</strong></div>
      <div><small>Cần rà soát</small><strong>{items.filter(x=>x.review_status==="needs_review").length}</strong></div>
      <div><small>Nhóm mẫu</small><strong>{families.length}</strong><span>Chỉ nhóm theo lựa chọn của người quản trị</span></div>
      <div><small>Đã xuất bản từ Admin</small><strong>0</strong><span>Chưa kích hoạt xuất bản</span></div>
    </div>
    {error&&<div className="import-error" role="alert">{error}</div>}
    {message&&<div className="import-review-banner" role="status"><b>{message}</b></div>}
    {create&&<div className="catalogue-editor">
      <h3>Thêm SKU công ty — bản nháp</h3>
      <label>Mã SKU công ty (không tự sửa)<input value={sku} onChange={e=>setSku(e.target.value)} placeholder="Ví dụ 0114"/></label>
      <label>Tên sản phẩm<input value={name} onChange={e=>setName(e.target.value)} /></label>
      <label>Khổ<input value={size} onChange={e=>setSize(e.target.value)} /></label>
      <button type="button" className="import-btn import-primary" disabled={busy} onClick={add}>Lưu bản nháp</button>
    </div>}
    {editing&&<div className="catalogue-editor">
      <h3>Sửa bản nháp · {editing.sku_cong_ty}</h3>
      <p><strong>Mã công ty không được chỉnh sửa</strong>. Nếu tên/mẫu sai, sửa tên hoặc đưa vào cần rà soát.</p>
      <label>Tên sản phẩm<input value={editName} onChange={e=>setEditName(e.target.value)}/></label>
      <label>Trạng thái<select value={editStatus} onChange={e=>setEditStatus(e.target.value as typeof editStatus)}>
        <option value="draft">Bản nháp</option><option value="needs_review">Cần rà soát</option>
        <option value="withdrawn">Ngừng dùng (xóa mềm)</option></select></label>
      <button type="button" className="import-btn import-primary" disabled={busy} onClick={save}>Lưu thay đổi</button>
      <button type="button" className="import-btn import-secondary" onClick={()=>setEditing(null)}>Hủy</button>
    </div>}
    <div className="import-controls">
      <label className="import-search-label">Tìm mã công ty / tên / nhóm
        <input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="0114, C5921…"/></label>
      <label className="import-filter-label">Trạng thái
        <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}>
          <option value="all">Tất cả</option><option value="draft">Bản nháp</option>
          <option value="needs_review">Cần rà soát</option><option value="withdrawn">Ngừng dùng</option>
          <option value="approved">Đã duyệt</option></select></label>
    </div>
    <div className="import-table-wrap"><table className="import-table"><thead><tr>
      <th>Chọn nhóm</th><th>Mã công ty (nguyên gốc)</th><th>Tên sản phẩm</th>
      <th>Quy cách</th><th>Nhóm mẫu</th><th>Trạng thái</th><th>Thao tác</th>
    </tr></thead><tbody>
      {visible.map(row=><tr key={row.sku_cong_ty}>
        <td><input type="checkbox" aria-label={"Chọn "+row.sku_cong_ty}
          disabled={row.review_status==="approved"||row.review_status==="withdrawn"}
          checked={selected.includes(row.sku_cong_ty)}
          onChange={e=>setSelected(old=>e.target.checked?[...old,row.sku_cong_ty]:old.filter(x=>x!==row.sku_cong_ty))}/></td>
        <td><b>{row.sku_cong_ty}</b></td>
        <td><b>{row.ten_san_pham||row.ten_goc_xnt||"Chưa có tên"}</b></td>
        <td>{[row.paper_size,row.product_spec?.pages,row.product_spec?.ruling].filter(Boolean).join(" · ")||"—"}</td>
        <td>{row.family_label||"Chưa nhóm"}</td>
        <td>{row.review_status==="draft"?"Bản nháp":row.review_status==="needs_review"?"Cần rà soát":row.review_status==="withdrawn"?"Ngừng dùng":"Đã duyệt"}</td>
        <td><button type="button" className="import-detail-btn"
          disabled={!["draft","needs_review"].includes(row.review_status)}
          onClick={()=>{setEditing(row);setEditName(row.ten_san_pham||"");setEditStatus(row.review_status as typeof editStatus)}}>Sửa</button></td>
      </tr>)}
      {!visible.length&&<tr><td colSpan={7} className="import-empty">
        {loading?"Đang đọc dữ liệu Neon…":"Chưa có SKU phù hợp. Mã Excel chưa nhập sẽ không hiển thị ở đây."}</td></tr>}
    </tbody></table></div>
    <div className="import-pagination"><span>{filtered.length} SKU · Trang {Math.min(page,pages)}/{pages}</span><div>
      <button className="import-btn import-secondary" disabled={page<=1} onClick={()=>setPage(x=>Math.max(x-1,1))}>Trước</button>
      <button className="import-btn import-secondary" disabled={page>=pages} onClick={()=>setPage(x=>Math.min(x+1,pages))}>Sau</button>
    </div></div>
    <div className="catalogue-editor">
      <h3>Nhóm nhiều mẫu cùng quy cách (chọn thủ công)</h3>
      <p>Chọn ít nhất 2 SKU trong bảng. Ví dụ <b>0114</b> và <b>0714</b> vẫn là hai mã riêng, chỉ được chung thẻ khi đúng nhóm do anh xác nhận.</p>
      <label>Nhóm có sẵn<select value={groupId} onChange={e=>setGroupId(e.target.value)}>
        <option value="">Chọn nhóm</option>{families.map(g=><option key={g.id} value={g.id}>{g.family_label}</option>)}
      </select></label>
      <button className="import-btn import-primary" type="button" disabled={busy||!groupId||selected.length<2} onClick={assign}>Gắn {selected.length} SKU vào nhóm</button>
      <label>Tạo nhóm mới<input value={newFamily} onChange={e=>setNewFamily(e.target.value)} placeholder="Tên nhóm / quy cách đã xác minh"/></label>
      <button className="import-btn import-secondary" type="button" disabled={busy||!newFamily.trim()} onClick={addFamily}>Tạo nhóm</button>
    </div>
    <p className="import-footnote">Không có chức năng xuất bản từ màn hình này. Dữ liệu NET, tồn kho và hình gốc không trả về từ API quản lý sản phẩm.</p>
  </section>;
}
