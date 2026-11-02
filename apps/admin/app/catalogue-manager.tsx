"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {positionCatalogueActions} from "@/lib/catalogue-action-position.mjs";
import ProductModal from "./product-modal";
import AdminToast from "./admin-toast";
import CatalogueImportPreview from "./catalogue-import-preview";
import CatalogueMediaManager from "./catalogue-media-manager";

type SKU={sku_cong_ty:string;ten_san_pham:string|null;ten_goc_xnt:string|null;ten_goc_bang_gia?:string|null;
  barcode:string|null;paper_size:string|null;review_status:string;revision:number;
  category_id:string|null;category_label:string|null;
  family_id:string|null;family_label:string|null;media_count?:number;
  product_spec?:Partial<Omit<SpecFields,"paper_size"|"barcode"|"category_id">>};
type Family={id:string;family_label:string;revision?:number};
type Visibility={sku_cong_ty:string;channel_code:"public_web"|"dealer_app"|"consumer_app";state:string;revision:number};
const CHANNELS=[{code:"public_web",label:"Web"},{code:"dealer_app",label:"Đại lý"},{code:"consumer_app",label:"Tiêu dùng"}] as const;
type Category={id:string;parent_id:string|null;category_label:string};
type SpecFields={barcode:string;paper_size:string;category_id:string;pages:string;ruling:string;
  gsm:string;cover_type:string;packaging:string;unit:string;units_per_pack:string};
const blankSpec=():SpecFields=>({barcode:"",paper_size:"",category_id:"",pages:"",ruling:"",
  gsm:"",cover_type:"",packaging:"",unit:"",units_per_pack:""});
const specFromSku=(row:SKU):SpecFields=>({barcode:row.barcode??"",paper_size:row.paper_size??"",
  category_id:row.category_id??"",pages:row.product_spec?.pages??"",ruling:row.product_spec?.ruling??"",
  gsm:row.product_spec?.gsm??"",cover_type:row.product_spec?.cover_type??"",
  packaging:row.product_spec?.packaging??"",unit:row.product_spec?.unit??"",
  units_per_pack:row.product_spec?.units_per_pack??""});
function specPayload(spec:SpecFields){
  return {barcode:spec.barcode.trim()||null,paper_size:spec.paper_size.trim()||null,
    category_id:spec.category_id||null,product_spec:{
      pages:spec.pages.trim()||null,ruling:spec.ruling.trim()||null,
      gsm:spec.gsm.trim()||null,cover_type:spec.cover_type.trim()||null,
      packaging:spec.packaging.trim()||null,unit:spec.unit.trim()||null,
      units_per_pack:spec.units_per_pack.trim()||null}};
}
function CatalogueFields({spec,onChange,categories}:{spec:SpecFields;onChange:(value:SpecFields)=>void;categories:Category[]}){
  const set=(key:keyof SpecFields,value:string)=>onChange({...spec,[key]:value});
  const roots=categories.filter(c=>!c.parent_id);
  const options=roots.flatMap(root=>[root,...categories.filter(c=>c.parent_id===root.id)]);
  return <>
    <label>Danh mục<select value={spec.category_id} onChange={e=>set("category_id",e.target.value)}>
      <option value="">Chưa phân loại</option>
      {options.map(c=><option value={c.id} key={c.id}>{c.parent_id?"↳ ":""}{c.category_label}</option>)}
    </select></label>
    <label>Khổ<input value={spec.paper_size} onChange={e=>set("paper_size",e.target.value)} placeholder="A4, A5, B5…"/></label>
    <label>Mã vạch<input value={spec.barcode} onChange={e=>set("barcode",e.target.value)} placeholder="Có thể trùng giữa SKU"/></label>
    <details className="catalogue-spec-details">
      <summary>Quy cách bổ sung (nếu có nguồn)</summary>
      <div className="catalogue-spec-grid">
      <label>Số trang<input value={spec.pages} onChange={e=>set("pages",e.target.value)} /></label>
      <label>Dòng kẻ<input value={spec.ruling} onChange={e=>set("ruling",e.target.value)} /></label>
      <label>Định lượng GSM<input inputMode="decimal" value={spec.gsm} onChange={e=>set("gsm",e.target.value)} placeholder="Ví dụ 70"/></label>
      <label>Loại bìa<input value={spec.cover_type} onChange={e=>set("cover_type",e.target.value)}/></label>
      <label>Đơn vị tính<input value={spec.unit} onChange={e=>set("unit",e.target.value)} placeholder="Quyển, cuốn, hộp…"/></label>
      <label>Quy cách đóng gói<input value={spec.packaging} onChange={e=>set("packaging",e.target.value)} placeholder="Lốc, thùng…"/></label>
      <label>Số đơn vị / đóng gói<input inputMode="numeric" value={spec.units_per_pack}
        onChange={e=>set("units_per_pack",e.target.value)} placeholder="Chỉ nhập khi có quy đổi rõ"/></label>
      </div>
    </details>
  </>;
}
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
    if(res.status===409)throw new Error("SKU đã được thay đổi hoặc đã tồn tại. Hãy tải lại danh sách.");
    if(res.status===403)throw new Error("Tài khoản chưa được cấp quyền thao tác này.");
    throw new Error("Không thực hiện được thao tác. Vui lòng thử lại.");
  }
  if(!payload.data)throw new Error("Không nhận được thông tin. Vui lòng thử lại.");
  return payload.data;
}
export default function CatalogueManager({onImport}:{onImport:()=>void}){
  const [items,setItems]=useState<SKU[]>([]);
  const [families,setFamilies]=useState<Family[]>([]);
  const [visibility,setVisibility]=useState<Record<string,Visibility>>({});
  const [categories,setCategories]=useState<Category[]>([]);
  const [categoryFilter,setCategoryFilter]=useState("");
  const [showCategories,setShowCategories]=useState(false);
  const [categoryName,setCategoryName]=useState("");
  const [parentCategory,setParentCategory]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const clearToast=useCallback(()=>setMessage(""),[]);
  const pendingVisibility=useRef(new Set<string>());
  const visibilityEpoch=useRef(0);
  const [pendingKeys,setPendingKeys]=useState<string[]>([]);
  const [query,setQuery]=useState("");
  const [page,setPage]=useState(1);
  const [selected,setSelected]=useState<string[]>([]);
  const [groupId,setGroupId]=useState("");
  const [newFamily,setNewFamily]=useState("");
  const [editing,setEditing]=useState<SKU|null>(null);
  const [editName,setEditName]=useState("");
  const [create,setCreate]=useState(false);
  const [showImport,setShowImport]=useState(false);
  const [exportOpen,setExportOpen]=useState(false);
  const exportAnchor=useRef<HTMLDivElement|null>(null);
  const [importBusy,setImportBusy]=useState(false);
  const [mediaSku,setMediaSku]=useState<string|null>(null);
  const [mediaBusy,setMediaBusy]=useState(false);
  const [showGroup,setShowGroup]=useState(false);
  const [groupMode,setGroupMode]=useState(false);
  const [sku,setSku]=useState("");
  const [name,setName]=useState("");
  const [spec,setSpec]=useState<SpecFields>(blankSpec());
  // One controlled menu for the whole table. Portal escapes overflow:auto table.
  const [actionMenu,setActionMenu]=useState<{sku:string;top:number;left:number}|null>(null);
  const actionTrigger=useRef<HTMLButtonElement|null>(null);
  const actionPopover=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    if(!exportOpen)return;
    const outside=(event:PointerEvent)=>{
      if(event.target instanceof Node&&!exportAnchor.current?.contains(event.target))
        setExportOpen(false);
    };
    const keydown=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){
        event.preventDefault();setExportOpen(false);
        exportAnchor.current?.querySelector<HTMLButtonElement>(".catalogue-export-trigger")?.focus();
      }
    };
    document.addEventListener("pointerdown",outside);
    document.addEventListener("keydown",keydown);
    return ()=>{
      document.removeEventListener("pointerdown",outside);
      document.removeEventListener("keydown",keydown);
    };
  },[exportOpen]);
  useEffect(()=>{
    if(!actionMenu)return;
    const closeOutside=(event:PointerEvent)=>{
      if(!(event.target instanceof Node))return;
      if(!actionTrigger.current?.contains(event.target) &&
         !actionPopover.current?.contains(event.target))setActionMenu(null);
    };
    const keydown=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){
        event.preventDefault();
        setActionMenu(null);
        actionTrigger.current?.focus();
      }
    };
    const closeOnMove=()=>setActionMenu(null);
    document.addEventListener("pointerdown",closeOutside);
    document.addEventListener("keydown",keydown);
    // Scroll or resize moves the anchor. Close instead of leaving a detached popover.
    window.addEventListener("scroll",closeOnMove,true);
    window.addEventListener("resize",closeOnMove);
    const focusFrame=requestAnimationFrame(()=>{
      actionPopover.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    });
    return ()=>{
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown",closeOutside);
      document.removeEventListener("keydown",keydown);
      window.removeEventListener("scroll",closeOnMove,true);
      window.removeEventListener("resize",closeOnMove);
    };
  },[actionMenu]);

  const refresh=useCallback(async()=>{
    const epochAtStart=visibilityEpoch.current;
    setActionMenu(null);setLoading(true);setError("");
    try{
      const [catalogue,groups,taxonomy,showing]=await Promise.all([
        api<{items:SKU[]}>("skus"),api<{items:Family[]}>("families"),
        api<{items:Category[]}>("categories"),api<{items:Visibility[]}>("visibility")]);
      if(!Array.isArray(catalogue.items)||catalogue.items.length>20000 ||
        catalogue.items.some(x=>typeof x.sku_cong_ty!=="string"))throw new Error("Dữ liệu SKU không hợp lệ.");
      if(!Array.isArray(taxonomy.items))throw new Error("Danh mục không hợp lệ.");
      if(!Array.isArray(showing.items))throw new Error("Trạng thái hiển thị không hợp lệ.");
      // Ignore snapshots started before/during a visibility mutation.
      if(epochAtStart===visibilityEpoch.current&&pendingVisibility.current.size===0)
        setVisibility(Object.fromEntries(showing.items.map(x=>[x.sku_cong_ty+":"+x.channel_code,x])));
      setItems(catalogue.items);setFamilies(groups.items);setCategories(taxonomy.items);
    }catch(e){setError(e instanceof Error?e.message:"Không đọc được catalogue");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{const task=setTimeout(()=>{void refresh()},0);return()=>clearTimeout(task)},[refresh]);
  const filtered=useMemo(()=>{
    const q=query.toLocaleLowerCase("vi");
    const subcategories=new Set(categories.filter(x=>x.parent_id===categoryFilter).map(x=>x.id));
    return items.filter(row=>(!categoryFilter||row.category_id===categoryFilter||subcategories.has(row.category_id||"")) &&
      (!q||row.sku_cong_ty.toLocaleLowerCase("vi").includes(q)||
      (row.ten_san_pham||row.ten_goc_xnt||row.ten_goc_bang_gia||"").toLocaleLowerCase("vi").includes(q)||
      (row.family_label||"").toLocaleLowerCase("vi").includes(q)));
  },[items,query,categories,categoryFilter]);
  const importSaved=useCallback(()=>{void refresh()},[refresh]);
  const handleImportBusy=useCallback((value:boolean)=>setImportBusy(value),[]);
  const pages=Math.max(1,Math.ceil(filtered.length/50));
  const visible=filtered.slice((page-1)*50,page*50);
  const selectedActionRow=actionMenu?visible.find(row=>row.sku_cong_ty===actionMenu.sku):null;
  const run=async(work:()=>Promise<void>)=>{
    if(busy)return;setBusy(true);setError("");setMessage("");
    try{await work();await refresh();}
    catch(e){setError(e instanceof Error?e.message:"Không lưu được sản phẩm.");}
    finally{setBusy(false);}
  };
  const exportCatalogue=async(format:"xlsx"|"csv")=>{
    if(busy)return;
    setBusy(true);setError("");
    try{
      const token=await bearer();
      const response=await fetch("/api/catalogue/export?format="+format,{
        headers:{Authorization:"Bearer "+token,Accept:"application/octet-stream"},
        credentials:"same-origin",cache:"no-store"});
      if(!response.ok)throw Error("Không thể xuất danh mục ("+response.status+").");
      const blob=await response.blob();
      if(blob.size===0||blob.size>15_000_000)throw Error("File xuất không hợp lệ.");
      const url=URL.createObjectURL(blob);
      try{
        const link=document.createElement("a");
        link.href=url;link.download="Futurebook_DANH_MUC_SAN_PHAM_1_SHEET."+format;link.click();
      }finally{queueMicrotask(()=>URL.revokeObjectURL(url));}
    }catch(e){setError(e instanceof Error?e.message:"Xuất danh mục thất bại.");}
    finally{setBusy(false);}
  };
  const toggleVisibility=(row:SKU,channel:typeof CHANNELS[number])=>void (async()=>{
    const key=row.sku_cong_ty+":"+channel.code;
    if(pendingVisibility.current.has(key))return;
    const current=visibility[key];
    const show=current?.state!=="published";
    if(!window.confirm((show?"BẬT":"TẮT")+" hiển thị mã "+row.sku_cong_ty+
      " trên "+channel.label+"?"+(show?" Chỉ mã này được xuất bản.":"")))return;
    pendingVisibility.current.add(key);
    visibilityEpoch.current++;
    setPendingKeys(previous=>[...previous,key]);setError("");
    setVisibility(previous=>({...previous,[key]:{
      sku_cong_ty:row.sku_cong_ty,channel_code:channel.code,
      state:show?"published":"hidden",revision:current?.revision??0}}));
    try{
      const saved=await api<Visibility>("visibility","POST",{
        sku_cong_ty:row.sku_cong_ty,channel_code:channel.code,visible:show,
        expected_revision:current?.revision??0,confirm:"CAP_NHAT_HIEN_THI"});
      setVisibility(previous=>({...previous,[key]:saved}));
      setMessage((show?"Đã bật":"Đã ẩn")+" "+row.sku_cong_ty+" trên "+channel.label+".");
    }catch(e){
      setVisibility(previous=>{const next={...previous};
        if(current)next[key]=current;else delete next[key];return next;});
      setError(e instanceof Error?e.message:"Không đổi được trạng thái hiển thị.");
    }finally{
      pendingVisibility.current.delete(key);
      visibilityEpoch.current++;
      setPendingKeys(previous=>previous.filter(item=>item!==key));
    }
  })();
  const add=()=>void run(async()=>{
    if(!sku||sku!==sku.trim()||!name.trim())throw new Error("Cần mã công ty dạng text và tên sản phẩm.");
    const data=await api<{sku_cong_ty:string}>("skus","POST",{
      sku_cong_ty:sku,ten_san_pham:name,...specPayload(spec)});
    setMessage("Đã thêm SKU "+data.sku_cong_ty+". Chưa hiển thị công khai.");
    setCreate(false);setSku("");setName("");setSpec(blankSpec());
  });
  const save=()=>void run(async()=>{
    if(!editing)return;
    if(!editName.trim()&&!editing.ten_goc_xnt?.trim()&&!editing.ten_goc_bang_gia?.trim())
      throw new Error("Sản phẩm cần có tên hợp lệ.");
    await api("skus","PATCH",{sku_cong_ty:editing.sku_cong_ty,
      expected_revision:editing.revision,ten_san_pham:editName,
      review_status:editing.review_status,...specPayload(spec)});
    setMessage("Đã cập nhật SKU "+editing.sku_cong_ty+". Mã công ty không thay đổi.");
    setEditing(null);
  });
  const addCategory=()=>void run(async()=>{
    if(!categoryName.trim())throw new Error("Nhập tên danh mục.");
    await api<Category>("categories","POST",{category_label:categoryName,parent_id:parentCategory||null});
    setCategoryName("");setParentCategory("");setMessage("Đã tạo danh mục; có thể chọn trong popup sản phẩm.");
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
    setSelected([]);setShowGroup(false);setGroupMode(false);
  });
  return <section className="catalogue-manager">
    <div className="page-title"><div><h1>Quản lý sản phẩm</h1>
      <p>Thêm, tìm và sửa sản phẩm. Mã công ty giữ nguyên, kể cả số 0 đầu.</p></div>
      <div className="action-row">
        <button type="button" className="import-btn import-secondary" onClick={()=>setShowCategories(true)}>Danh mục</button>
        <button type="button" className="import-btn import-secondary" onClick={()=>void refresh()} disabled={busy||loading||pendingKeys.length>0}>Làm mới</button>
        <div className="catalogue-export-anchor" ref={exportAnchor}>
          <button type="button" className="import-btn import-secondary catalogue-export-trigger"
            aria-haspopup="menu" aria-expanded={exportOpen} aria-controls="catalogue-export-format"
            disabled={busy} onClick={()=>setExportOpen(value=>!value)}>
            Xuất <span aria-hidden="true">⌄</span>
          </button>
          {exportOpen&&<div id="catalogue-export-format" className="catalogue-export-dropdown"
            role="menu" aria-label="Chọn định dạng xuất">
            <button role="menuitem" type="button" onClick={()=>{setExportOpen(false);void exportCatalogue("xlsx")}}>Xuất Excel (.xlsx)</button>
            <button role="menuitem" type="button" onClick={()=>{setExportOpen(false);void exportCatalogue("csv")}}>Xuất CSV (.csv)</button>
          </div>}
        </div>
        <button type="button" className="import-btn import-secondary" onClick={()=>{setExportOpen(false);setShowImport(true)}}>Nhập / Cập nhật Excel</button>
        <button type="button" className="import-btn import-primary" onClick={()=>{setSpec(blankSpec());setCreate(true)}}>+ Thêm sản phẩm</button>
      </div>
    </div>
    <div className="catalogue-overview" aria-label="Tổng quan danh mục">
      <strong>{items.length} sản phẩm</strong><span>{families.length} nhóm mẫu</span>
    </div>
    {error&&!create&&!editing&&!showGroup&&<div className="import-error" role="alert">{error}</div>}
    <AdminToast message={message} onClose={clearToast}/>
    {create&&<ProductModal title="Thêm sản phẩm Futurebook" onClose={()=>setCreate(false)} locked={busy}>
      {error&&<div className="import-error" role="alert">{error}</div>}
      <div className="catalogue-editor">
      <h3>Thêm sản phẩm</h3>
      <label>Mã SKU công ty (không tự sửa)<input value={sku} onChange={e=>setSku(e.target.value)} placeholder="Ví dụ 0114"/></label>
      <label>Tên sản phẩm<input value={name} onChange={e=>setName(e.target.value)} /></label>
      <CatalogueFields spec={spec} onChange={setSpec} categories={categories}/>
      <div className="fb-product-modal-actions"><button type="button" className="import-btn import-secondary" onClick={()=>setCreate(false)} disabled={busy}>Hủy</button>
      <button type="button" className="import-btn import-primary" disabled={busy} onClick={add}>Lưu sản phẩm</button></div>
    </div></ProductModal>}
    {editing&&<ProductModal title={"Sửa sản phẩm · "+editing.sku_cong_ty} onClose={()=>setEditing(null)} locked={busy}>
      {error&&<div className="import-error" role="alert">{error}</div>}
      <div className="catalogue-editor">
      <h3>Sửa sản phẩm · {editing.sku_cong_ty}</h3>
      <p><strong>Mã công ty được giữ nguyên.</strong> Chỉnh sửa thông tin và quy cách không tạo SKU khác.</p>
      <label>Tên sản phẩm<input value={editName} onChange={e=>setEditName(e.target.value)}/></label>
      <CatalogueFields spec={spec} onChange={setSpec} categories={categories}/>
      <div className="fb-product-modal-actions"><button type="button" className="import-btn import-secondary" onClick={()=>setEditing(null)} disabled={busy}>Hủy</button>
      <button type="button" className="import-btn import-primary" disabled={busy} onClick={save}>Lưu thay đổi</button></div>
    </div></ProductModal>}
    {showCategories&&<ProductModal title="Danh mục sản phẩm" onClose={()=>setShowCategories(false)} locked={busy}>
      {error&&<div className="import-error" role="alert">{error}</div>}
      <div className="catalogue-editor">
        <p>Danh mục cha/con phục vụ lọc và trình bày sản phẩm, không làm thay đổi SKU công ty.</p>
        <label>Tên danh mục<input value={categoryName} onChange={e=>setCategoryName(e.target.value)}/></label>
        <label>Danh mục cha<select value={parentCategory} onChange={e=>setParentCategory(e.target.value)}>
          <option value="">Danh mục cấp 1</option>
          {categories.filter(c=>!c.parent_id).map(c=><option key={c.id} value={c.id}>{c.category_label}</option>)}
        </select></label>
        <div className="fb-product-modal-actions"><button type="button" className="import-btn import-secondary"
          disabled={busy} onClick={()=>setShowCategories(false)}>Đóng</button>
          <button type="button" className="import-btn import-primary" disabled={busy||!categoryName.trim()}
            onClick={addCategory}>Tạo danh mục</button></div>
      </div>
    </ProductModal>}
    <div className="import-controls catalogue-search-controls">
      <label className="import-search-label">Tìm mã công ty / tên / nhóm
        <input value={query} onChange={e=>{setQuery(e.target.value);setPage(1);setActionMenu(null)}} placeholder="Nhập mã, tên hoặc nhóm sản phẩm…"/></label>
      <label className="import-filter-label">Danh mục<select value={categoryFilter}
        onChange={e=>{setCategoryFilter(e.target.value);setPage(1);setActionMenu(null)}}>
        <option value="">Tất cả danh mục</option>
        {categories.map(c=><option value={c.id} key={c.id}>{c.parent_id?"↳ ":""}{c.category_label}</option>)}
      </select></label>
      <button type="button" className="import-btn import-secondary" aria-pressed={groupMode}
        onClick={()=>{setGroupMode(x=>!x);setSelected([]);setActionMenu(null)}}>{groupMode?"Thoát chọn nhóm":"Nhóm mẫu"}</button>
    </div>
    <div className="import-table-wrap"><table className="import-table catalogue-list-table"><thead><tr>
      {groupMode&&<th>Chọn</th>}<th>Ảnh</th><th>Mã công ty</th><th>Tên sản phẩm</th>
      <th>Danh mục</th><th>Quy cách</th><th>Nhóm mẫu</th><th>Hiển thị</th><th>Thao tác</th>
    </tr></thead><tbody>
      {visible.map(row=>{
        const editable=row.review_status==="draft"||row.review_status==="needs_review";
        return <tr key={row.sku_cong_ty}>
        {groupMode&&<td><input type="checkbox" aria-label={"Chọn SKU "+row.sku_cong_ty}
          disabled={!editable} checked={selected.includes(row.sku_cong_ty)}
          onChange={e=>setSelected(old=>e.target.checked?[...old,row.sku_cong_ty]:old.filter(x=>x!==row.sku_cong_ty))}/></td>}
        <td className="catalogue-media-cell">
          <button type="button" className="catalogue-media-shortcut"
            title={"Quản lý ảnh SKU "+row.sku_cong_ty}
            aria-label={"Quản lý "+(row.media_count||0)+" ảnh SKU "+row.sku_cong_ty}
            onClick={()=>{setMediaSku(row.sku_cong_ty);setActionMenu(null);}}>
            <span className="catalogue-image-placeholder" aria-hidden="true">▧</span>
            <span>{row.media_count?row.media_count+" ảnh":"Thêm ảnh"}</span>
          </button>
        </td>
        <td className="catalogue-sku-cell"><b>{row.sku_cong_ty}</b></td>
        <td className="catalogue-name-cell"><b>{row.ten_san_pham||row.ten_goc_xnt||row.ten_goc_bang_gia||"Chưa có tên"}</b></td>
        <td>{row.category_label||"Chưa phân loại"}</td>
        <td>{[row.paper_size,row.product_spec?.pages&&row.product_spec.pages+" trang",
          row.product_spec?.ruling,row.product_spec?.gsm&&row.product_spec.gsm+" GSM"].filter(Boolean).join(" · ")||"—"}</td>
        <td>{row.family_label||"Chưa nhóm"}</td>
        <td><div className="catalogue-channel-actions" style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {CHANNELS.map(channel=>{
            const on=visibility[row.sku_cong_ty+":"+channel.code]?.state==="published";
            return <button type="button" key={channel.code}
              className={"import-btn import-secondary"+(on?" catalogue-channel-on":"")+(pendingKeys.includes(row.sku_cong_ty+":"+channel.code)?" catalogue-channel-pending":"")}
              aria-label={(on?"Tắt":"Bật")+" "+channel.label+" cho SKU "+row.sku_cong_ty}
              aria-pressed={on} aria-busy={pendingKeys.includes(row.sku_cong_ty+":"+channel.code)}
              disabled={busy||loading||pendingKeys.includes(row.sku_cong_ty+":"+channel.code)}
              style={{padding:"5px 8px",fontSize:11,borderColor:on?"#128763":undefined,
                color:on?"#128763":undefined}}
              title={(on?"Đang hiển thị":"Đang ẩn")+" · "+channel.label}
              onClick={()=>toggleVisibility(row,channel)}>{channel.label} {on?"✓":"–"}</button>;
          })}
        </div></td>
        <td>
          <button type="button" className="catalogue-actions-trigger"
            aria-label={"Thao tác sản phẩm "+row.sku_cong_ty}
            aria-haspopup="menu" aria-expanded={actionMenu?.sku===row.sku_cong_ty}
            title="Thao tác"
            onClick={event=>{
              if(actionMenu?.sku===row.sku_cong_ty){setActionMenu(null);return;}
              const position=positionCatalogueActions(
                event.currentTarget.getBoundingClientRect(),window.innerWidth,window.innerHeight);
              actionTrigger.current=event.currentTarget;
              setActionMenu({sku:row.sku_cong_ty,...position});
            }}>···</button>
        </td>
      </tr>})}
      {!visible.length&&<tr><td colSpan={groupMode?9:8} className="import-empty">
        {loading?"Đang tải sản phẩm…":"Chưa có sản phẩm phù hợp."}</td></tr>}
    </tbody></table></div>
    {actionMenu&&selectedActionRow&&createPortal(
      <div ref={actionPopover} className="catalogue-actions-popover" role="menu"
        aria-label={"Thao tác sản phẩm "+selectedActionRow.sku_cong_ty}
        style={{top:actionMenu.top,left:actionMenu.left}}
        onKeyDown={event=>{
          if(event.key!=="ArrowDown"&&event.key!=="ArrowUp")return;
          event.preventDefault();
          const buttons=[...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
          if(!buttons.length)return;
          const index=buttons.findIndex(button=>button===document.activeElement);
          buttons[(index+(event.key==="ArrowDown"?1:buttons.length-1))%buttons.length].focus();
        }}>
        <button type="button" role="menuitem"
          disabled={!["draft","needs_review"].includes(selectedActionRow.review_status)}
          title="Sửa thông tin sản phẩm"
          onClick={()=>{
            setActionMenu(null);
            setError("");
            setEditing(selectedActionRow);
            setEditName(selectedActionRow.ten_san_pham||selectedActionRow.ten_goc_xnt||selectedActionRow.ten_goc_bang_gia||"");
            setSpec(specFromSku(selectedActionRow));
          }}>Sửa sản phẩm</button>
        <button type="button" role="menuitem"
          onClick={()=>{setMediaSku(selectedActionRow.sku_cong_ty);setActionMenu(null)}}>
          Quản lý hình ảnh</button>
        <button type="button" role="menuitem"
          disabled={!["draft","needs_review"].includes(selectedActionRow.review_status)}
          onClick={()=>{
            setActionMenu(null);
            setSelected(old=>old.includes(selectedActionRow.sku_cong_ty)?old:[...old,selectedActionRow.sku_cong_ty]);
            setGroupMode(true);
            setShowGroup(true);
          }}>Nhóm cùng dòng</button>
      </div>,document.body
    )}
    <div className="import-pagination"><span>{filtered.length} SKU · Trang {Math.min(page,pages)}/{pages}</span><div>
      <button className="import-btn import-secondary" disabled={page<=1} onClick={()=>{setPage(x=>Math.max(x-1,1));setActionMenu(null)}}>Trước</button>
      <button className="import-btn import-secondary" disabled={page>=pages} onClick={()=>{setPage(x=>Math.min(x+1,pages));setActionMenu(null)}}>Sau</button>
    </div></div>
    {groupMode&&<div className="catalogue-group-trigger">
      <span><b>Nhóm mẫu</b> · Đã chọn {selected.length} SKU để ghép nhiều mẫu trong một thẻ.</span>
      <button type="button" className="import-btn import-secondary" onClick={()=>setShowGroup(true)}>Quản lý nhóm mẫu</button>
    </div>}
    {showGroup&&<ProductModal title="Nhóm mẫu sản phẩm" onClose={()=>setShowGroup(false)} locked={busy}>
      {error&&<div className="import-error" role="alert">{error}</div>}
      <div className="catalogue-editor catalogue-variant-details">
      <p>Chọn ít nhất 2 SKU trong danh sách để gắn cùng một nhóm hiển thị. Mã công ty không đổi.</p>
      <label>Nhóm có sẵn<select value={groupId} onChange={e=>setGroupId(e.target.value)}>
        <option value="">Chọn nhóm</option>{families.map(g=><option key={g.id} value={g.id}>{g.family_label}</option>)}
      </select></label>
      <button className="import-btn import-primary" type="button" disabled={busy||!groupId||selected.length<2} onClick={assign}>Gắn {selected.length} SKU vào nhóm</button>
      <label>Tạo nhóm mới<input value={newFamily} onChange={e=>setNewFamily(e.target.value)} placeholder="Tên nhóm sản phẩm"/></label>
      <button className="import-btn import-secondary" type="button" disabled={busy||!newFamily.trim()} onClick={addFamily}>Tạo nhóm</button>
      </div></ProductModal>}
    {mediaSku&&<ProductModal title={"Quản lý ảnh · "+mediaSku} wide locked={mediaBusy}
      onClose={()=>{if(!mediaBusy)setMediaSku(null)}}>
      <CatalogueMediaManager sku={mediaSku} onBusyChange={setMediaBusy}
        onChanged={()=>{void refresh()}}/>
    </ProductModal>}
    {showImport&&<ProductModal title="Nhập / cập nhật sản phẩm bằng Excel" wide locked={importBusy} onClose={()=>{if(!importBusy){setShowImport(false);void refresh()}}}>
      <CatalogueImportPreview onBusyChange={handleImportBusy} onSaved={importSaved} />
    </ProductModal>}
    <p className="import-footnote">Ảnh có thể bổ sung sau. Sản phẩm chỉ xuất hiện ở kênh đã bật hiển thị.</p>
  </section>;
}
