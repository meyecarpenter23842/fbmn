"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {positionCatalogueActions} from "@/lib/catalogue-action-position.mjs";
import ProductModal from "./product-modal";
import AdminToast from "./admin-toast";
import CatalogueImportPreview from "./catalogue-import-preview";
import {PrivateImage} from "./catalogue-media-manager";
import CatalogueProductWorkspace from "./catalogue-product-workspace";
import CatalogueStructureManager from "./catalogue-structure-manager";

type SKU={sku_cong_ty:string;ten_san_pham:string|null;ten_goc_xnt:string|null;ten_goc_bang_gia?:string|null;
  barcode:string|null;paper_size:string|null;review_status:string;revision:number;
  category_id:string|null;category_label:string|null;
  family_id:string|null;family_label:string|null;media_count?:number;
  cover_asset_id?:string|null;cover_sha256?:string|null;
  product_spec?:Partial<Omit<SpecFields,"paper_size"|"barcode"|"category_id">>};
type Family={id:string;family_code:string;family_label:string;revision?:number};
type Visibility={sku_cong_ty:string;channel_code:"public_web"|"dealer_app"|"consumer_app";state:string;revision:number};
const CHANNELS=[{code:"public_web",label:"Web"},{code:"dealer_app",label:"Đại lý"},{code:"consumer_app",label:"Tiêu dùng"}] as const;
type Category={id:string;parent_id:string|null;category_code:string;category_label:string};
type SpecFields={barcode:string;paper_size:string;category_id:string;pages:string;ruling:string;
  gsm:string;cover_type:string;packaging:string;unit:string;units_per_pack:string;
  short_description:string;long_description:string};
const blankSpec=():SpecFields=>({barcode:"",paper_size:"",category_id:"",pages:"",ruling:"",
  gsm:"",cover_type:"",packaging:"",unit:"",units_per_pack:"",short_description:"",long_description:""});
const specFromSku=(row:SKU):SpecFields=>({barcode:row.barcode??"",paper_size:row.paper_size??"",
  category_id:row.category_id??"",pages:row.product_spec?.pages??"",ruling:row.product_spec?.ruling??"",
  gsm:row.product_spec?.gsm??"",cover_type:row.product_spec?.cover_type??"",
  packaging:row.product_spec?.packaging??"",unit:row.product_spec?.unit??"",
  units_per_pack:row.product_spec?.units_per_pack??"",short_description:row.product_spec?.short_description??"",
  long_description:row.product_spec?.long_description??""});
function specPayload(spec:SpecFields){
  return {barcode:spec.barcode.trim()||null,paper_size:spec.paper_size.trim()||null,
    category_id:spec.category_id||null,product_spec:{
      pages:spec.pages.trim()||null,ruling:spec.ruling.trim()||null,
      gsm:spec.gsm.trim()||null,cover_type:spec.cover_type.trim()||null,
      packaging:spec.packaging.trim()||null,unit:spec.unit.trim()||null,
      units_per_pack:spec.units_per_pack.trim()||null,
      short_description:spec.short_description.trim()||null,
      long_description:spec.long_description.trim()||null}};
}
function CatalogueFields({spec,onChange,categories}:{spec:SpecFields;onChange:(value:SpecFields)=>void;categories:Category[]}){
  const set=(key:keyof SpecFields,value:string)=>onChange({...spec,[key]:value});
  const roots=categories.filter(c=>!c.parent_id);
  const options=roots.flatMap(root=>[root,...categories.filter(c=>c.parent_id===root.id)]);
  return <>
    <label>Danh mục<select value={spec.category_id} onChange={e=>set("category_id",e.target.value)}>
      <option value="">Chưa phân loại</option>
      {options.map(c=><option value={c.id} key={c.id}>{c.category_code} · {c.category_code} · {c.parent_id?"↳ ":""}{c.category_label}</option>)}
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
  const [structurePane,setStructurePane]=useState<"categories"|"families"|null>(null);
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
  const [editing,setEditing]=useState<SKU|null>(null);
  const [editorNotice,setEditorNotice]=useState("");
  const [editName,setEditName]=useState("");
  const [create,setCreate]=useState(false);
  const [showImport,setShowImport]=useState(false);
  const [exportOpen,setExportOpen]=useState(false);
  const exportAnchor=useRef<HTMLDivElement|null>(null);
  const [importBusy,setImportBusy]=useState(false);
  const [mediaBusy,setMediaBusy]=useState(false);
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
  const startEditor=(row:SKU|null)=>{
    if(busy||mediaBusy)return;
    // Selecting the current SKU must not discard any unsaved name/spec/description.
    if(row&&editing?.sku_cong_ty===row.sku_cong_ty)return;
    const originalName=editing?(editing.ten_san_pham||editing.ten_goc_xnt||editing.ten_goc_bang_gia||""):"";
    const dirty=editing?
      editName!==originalName||JSON.stringify(spec)!==JSON.stringify(specFromSku(editing)):
      create&&(sku.trim()!==""||name.trim()!==""||JSON.stringify(spec)!==JSON.stringify(blankSpec()));
    if(dirty&&(!row||row.sku_cong_ty!==editing?.sku_cong_ty)&&
      !window.confirm("Thông tin chưa lưu sẽ bị bỏ qua. Tiếp tục?"))return;
    setError("");setEditorNotice("");
    if(row){
      setEditing(row);setCreate(false);
      setEditName(row.ten_san_pham||row.ten_goc_xnt||row.ten_goc_bang_gia||"");
      setSpec(specFromSku(row));
    }else{
      setEditing(null);setCreate(true);setSku("");setName("");setSpec(blankSpec());
    }
  };
  const closeEditor=()=>{
    if(busy||mediaBusy)return;
    const originalName=editing?(editing.ten_san_pham||editing.ten_goc_xnt||editing.ten_goc_bang_gia||""):"";
    const dirty=editing?
      editName!==originalName||JSON.stringify(spec)!==JSON.stringify(specFromSku(editing)):
      sku.trim()!==""||name.trim()!==""||JSON.stringify(spec)!==JSON.stringify(blankSpec());
    if(dirty&&!window.confirm("Đóng và bỏ những thay đổi chưa lưu?"))return;
    setEditing(null);setCreate(false);setEditorNotice("");setError("");
  };
  const add=()=>void run(async()=>{
    if(!sku||sku!==sku.trim()||!name.trim())throw new Error("Cần mã công ty dạng văn bản và tên sản phẩm.");
    const data=await api<{sku_cong_ty:string}>("skus","POST",{
      sku_cong_ty:sku,ten_san_pham:name.trim(),...specPayload(spec)});
    const latest=await api<{items:SKU[]}>("skus");
    const saved=latest.items.find(row=>row.sku_cong_ty===data.sku_cong_ty);
    if(!saved)throw new Error("Đã lưu sản phẩm nhưng chưa tải được thông tin mới. Hãy làm mới danh sách.");
    setEditing(saved);setCreate(false);setEditName(name.trim());
    setSpec(specFromSku(saved));
    setEditorNotice("Đã lưu sản phẩm. Bây giờ có thể thêm ảnh ngay ở cột bên phải.");
    setMessage("Đã thêm mã "+data.sku_cong_ty+". Chưa hiển thị công khai.");
    setSku("");
  });
  const save=()=>void run(async()=>{
    if(!editing)return;
    if(!editName.trim()&&!editing.ten_goc_xnt?.trim()&&!editing.ten_goc_bang_gia?.trim())
      throw new Error("Sản phẩm cần có tên hợp lệ.");
    const saved=await api<{revision:number}>("skus","PATCH",{
      sku_cong_ty:editing.sku_cong_ty,expected_revision:editing.revision,
      ten_san_pham:editName.trim(),review_status:editing.review_status,...specPayload(spec)});
    setEditing(previous=>previous?{...previous,revision:saved.revision,
      ten_san_pham:editName.trim(),barcode:spec.barcode||null,
      paper_size:spec.paper_size||null,category_id:spec.category_id||null,
      product_spec:{...spec}}:previous);
    setEditorNotice("Đã lưu thay đổi, mô tả và quy cách. Có thể tiếp tục chỉnh sửa ảnh.");
    setMessage("Đã cập nhật mã "+editing.sku_cong_ty+".");
  });
  const createCategory=(label:string,parentId:string|null,code:string)=>void run(async()=>{
    await api<Category>("categories","POST",{category_label:label.trim(),parent_id:parentId,category_code:code});
    setMessage("Đã tạo danh mục "+code+".");
  });
  const changeCategoryCode=(category:Category,code:string)=>void run(async()=>{
    await api<Category>("categories","PATCH",{id:category.id,expected_code:category.category_code,category_code:code});
    setMessage("Đã đổi mã danh mục sang "+code+". Hãy cập nhật các file Excel dùng mã cũ.");
  });
  const renameCategory=(category:Category,label:string)=>void run(async()=>{
    await api<Category>("categories","PATCH",{id:category.id,expected_label:category.category_label,category_label:label.trim()});
    setMessage("Đã đổi tên danh mục.");
  });
  const createFamily=(label:string,code:string)=>void run(async()=>{
    await api<Family>("families","POST",{family_label:label.trim(),family_code:code});
    setMessage("Đã tạo nhóm mẫu "+code+".");
  });
  const changeFamilyCode=(family:Family,code:string)=>void run(async()=>{
    await api<Family>("families","PATCH",{id:family.id,expected_code:family.family_code,
      expected_revision:family.revision||1,family_code:code});
    setMessage("Đã đổi mã nhóm mẫu sang "+code+". Hãy cập nhật các file Excel dùng mã cũ.");
  });
  const renameFamily=(family:Family,label:string)=>void run(async()=>{
    await api<Family>("families","PATCH",{id:family.id,expected_revision:family.revision||1,family_label:label.trim()});
    setMessage("Đã đổi tên nhóm mẫu.");
  });
  const changeMembership=(row:SKU,familyId:string|null)=>void run(async()=>{
    await api("membership","POST",{sku_cong_ty:row.sku_cong_ty,
      expected_revision:row.revision,family_id:familyId,confirm:"CAP_NHAT_NHOM_MAU"});
    setMessage((familyId?"Đã gắn":"Đã gỡ")+" SKU "+row.sku_cong_ty+" "+(familyId?"vào":"khỏi")+" nhóm mẫu.");
  });
  const bulkAssign=(familyId:string)=>void run(async()=>{
    if(selected.length<2||selected.length>200)throw new Error("Chọn từ 2 đến 200 SKU.");
    await api("group","POST",{family_id:familyId,sku_cong_ty:selected});
    setSelected([]);setGroupMode(false);
    setMessage("Đã gắn "+selected.length+" mã vào nhóm mẫu.");
  });
  return <section className="catalogue-manager">
    <div className="page-title"><div><h1>Quản lý sản phẩm</h1>
      <p>Thêm, tìm và sửa sản phẩm. Mã công ty giữ nguyên, kể cả số 0 đầu.</p></div>
      <div className="action-row">
        <button type="button" className="import-btn import-secondary" onClick={()=>setStructurePane("categories")}>Danh mục</button>
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
        <button type="button" className="import-btn import-primary" onClick={()=>startEditor(null)}>+ Thêm sản phẩm</button>
      </div>
    </div>
    <div className="catalogue-overview" aria-label="Tổng quan danh mục">
      <strong>{items.length} sản phẩm</strong><span>{families.length} nhóm mẫu</span>
    </div>
    {error&&!create&&!editing&&!structurePane&&<div className="import-error" role="alert">{error}</div>}
    <AdminToast message={message} onClose={clearToast}/>
    {(create||editing)&&<ProductModal title={editing?"Sửa sản phẩm · "+editing.sku_cong_ty:"Thêm sản phẩm"}
      wide onClose={closeEditor} locked={busy||mediaBusy}>
      <CatalogueProductWorkspace items={items} selectedSku={editing?.sku_cong_ty||null}
        companySku={editing?.sku_cong_ty||sku} name={editing?editName:name}
        shortDescription={spec.short_description} longDescription={spec.long_description}
        fields={<fieldset className="catalogue-workspace-fieldset"
          disabled={!!editing&&!["draft","needs_review"].includes(editing.review_status)}>
          <CatalogueFields spec={spec} onChange={setSpec} categories={categories}/>
        </fieldset>}
        editingAllowed={!editing||["draft","needs_review"].includes(editing.review_status)}
        loading={busy||mediaBusy} error={error} notice={editorNotice}
        onSku={setSku} onName={editing?setEditName:setName}
        onShortDescription={value=>setSpec(previous=>({...previous,short_description:value}))}
        onLongDescription={value=>setSpec(previous=>({...previous,long_description:value}))}
        onSave={editing?save:add} onClose={closeEditor} onNew={()=>startEditor(null)}
        onSelect={code=>{const row=items.find(item=>item.sku_cong_ty===code);if(row)startEditor(row);}}
        onMediaChanged={()=>void refresh()} onMediaBusy={setMediaBusy}/>
    </ProductModal>}
    {structurePane&&<ProductModal title="Danh mục & nhóm mẫu sản phẩm" wide
      onClose={()=>setStructurePane(null)} locked={busy}>
      <CatalogueStructureManager initialPane={structurePane} categories={categories}
        families={families} items={items} busy={busy} error={error} selectedBulk={selected}
        onCreateCategory={createCategory} onRenameCategory={renameCategory}
        onChangeCategoryCode={changeCategoryCode}
        onCreateFamily={createFamily} onRenameFamily={renameFamily}
        onChangeFamilyCode={changeFamilyCode}
        onChangeMember={(row,familyId)=>{
          const current=items.find(item=>item.sku_cong_ty===row.sku_cong_ty);
          if(current)changeMembership(current,familyId);
        }} onBulkAssign={bulkAssign}
        onOpenSku={row=>{
          const current=items.find(item=>item.sku_cong_ty===row.sku_cong_ty);
          if(current){setStructurePane(null);startEditor(current);}
        }}/>
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
        onClick={()=>{setActionMenu(null);setStructurePane("families")}}>Quản lý nhóm mẫu</button>
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
            onClick={()=>{startEditor(row);setActionMenu(null);}}>
            {row.cover_asset_id&&row.cover_sha256?<PrivateImage id={row.cover_asset_id} signature={row.cover_sha256} alt={"Ảnh sản phẩm "+row.sku_cong_ty}/>:<span className="catalogue-image-placeholder" aria-hidden="true">▧</span>}
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
          onClick={()=>{startEditor(selectedActionRow);setActionMenu(null)}}>
          Quản lý hình ảnh</button>
        <button type="button" role="menuitem"
          disabled={!["draft","needs_review"].includes(selectedActionRow.review_status)}
          onClick={()=>{
            setActionMenu(null);
            setSelected(old=>old.includes(selectedActionRow.sku_cong_ty)?old:[...old,selectedActionRow.sku_cong_ty]);
            setGroupMode(true);
            setStructurePane("families");
          }}>Nhóm cùng dòng</button>
      </div>,document.body
    )}
    <div className="import-pagination"><span>{filtered.length} SKU · Trang {Math.min(page,pages)}/{pages}</span><div>
      <button className="import-btn import-secondary" disabled={page<=1} onClick={()=>{setPage(x=>Math.max(x-1,1));setActionMenu(null)}}>Trước</button>
      <button className="import-btn import-secondary" disabled={page>=pages} onClick={()=>{setPage(x=>Math.min(x+1,pages));setActionMenu(null)}}>Sau</button>
    </div></div>
    {groupMode&&<div className="catalogue-group-trigger">
      <span><b>Nhóm mẫu</b> · Đã chọn {selected.length} SKU để ghép nhiều mẫu trong một thẻ.</span>
      <div className="catalogue-group-trigger-actions">
        <button type="button" className="import-btn import-secondary"
          onClick={()=>{setGroupMode(false);setSelected([]);setActionMenu(null);}}>Thoát chọn nhóm</button>
        <button type="button" className="import-btn import-secondary"
          onClick={()=>setStructurePane("families")}>Quản lý nhóm mẫu</button>
      </div>
    </div>}
    {showImport&&<ProductModal title="Nhập / cập nhật sản phẩm bằng Excel" wide locked={importBusy} onClose={()=>{if(!importBusy){setShowImport(false);void refresh()}}}>
      <CatalogueImportPreview onBusyChange={handleImportBusy} onSaved={importSaved} />
    </ProductModal>}
    <p className="import-footnote">Ảnh có thể bổ sung sau. Sản phẩm chỉ xuất hiện ở kênh đã bật hiển thị.</p>
  </section>;
}
