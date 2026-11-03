"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import AdminToast from "./admin-toast";
import CataloguePricebookPanel from "./catalogue-pricebook-panel";
import CatalogueManagedPriceImport from "./catalogue-managed-price-import";
import CatalogueManagedPriceLists from "./catalogue-managed-prices";
import CatalogueMediaManager,{PrivateImage} from "./catalogue-media-manager";

type CatalogSku={
  sku_cong_ty:string;
  ten_san_pham:string|null;
  ten_goc_xnt:string|null;
  ten_goc_bang_gia?:string|null;
  category_label?:string|null;
  family_label?:string|null;
  media_count?:number;
  cover_asset_id?:string|null;
  cover_sha256?:string|null;
};
type Envelope<T>={data?:T;error?:{code?:string}};
type WorkspaceMode="pricing"|"media";
type ManagedListOption={id:string;list_code:string;list_name:string;approval_state:string};

export default function CatalogueSideWorkspace({mode,onBusyChange}:{mode:WorkspaceMode;onBusyChange?:(busy:boolean)=>void}){
  const [skus,setSkus]=useState<CatalogSku[]>([]);
  const [selectedSku,setSelectedSku]=useState("");
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [revision,setRevision]=useState(0);
  const [mediaBusy,setMediaBusy]=useState(false);
  const [priceBusy,setPriceBusy]=useState(false);
  const [pricingOwner,setPricingOwner]=useState<boolean|null>(null);
  const [pricingView,setPricingView]=useState<"lists"|"products"|"excel">("lists");
  const [chosenManagedListId,setChosenManagedListId]=useState("");
  const [managedLists,setManagedLists]=useState<ManagedListOption[]>([]);
  const [managedEpoch,setManagedEpoch]=useState(0);
  const onManagedMutation=useCallback((preferred?:string)=>{
    if(preferred)setChosenManagedListId(preferred);
    setManagedEpoch(v=>v+1);
  },[]);
  const [bulkBusy,setBulkBusy]=useState(false);
  const refresh=useCallback(()=>setRevision(v=>v+1),[]);
  const handlePriceBusy=useCallback((value:boolean)=>{
    setPriceBusy(value);onBusyChange?.(value);
  },[onBusyChange]);
  const handleBulkBusy=useCallback((value:boolean)=>{
    setBulkBusy(value);onBusyChange?.(value);
  },[onBusyChange]);
  const handleMediaBusy=useCallback((value:boolean)=>{
    setMediaBusy(value);onBusyChange?.(value);
  },[onBusyChange]);
  useEffect(()=>{
    const controller=new AbortController();
    // Resolve after effect, matching the Admin data-loading convention.
    void Promise.resolve().then(async()=>{
      const auth=await fetch("/api/auth/token",{
        credentials:"same-origin",cache:"no-store",signal:controller.signal
      });
      if(!auth.ok)throw new Error("Phiên đăng nhập đã hết hạn.");
      const credentials=await auth.json() as {token?:string};
      if(!credentials.token)throw new Error("Không xác thực được tài khoản.");
      if(mode==="pricing"){
        const actor=await fetch("/api/admin/session",{
          cache:"no-store",credentials:"same-origin",signal:controller.signal,
          headers:{Authorization:"Bearer "+credentials.token,Accept:"application/json"}
        });
        if(!actor.ok)throw new Error("Không kiểm tra được quyền xem giá.");
        const identity=await actor.json() as Envelope<{role?:string}>;
        if(!controller.signal.aborted)setPricingOwner(identity.data?.role==="owner");
      }
      const response=await fetch("/api/catalogue/skus",{
        cache:"no-store",credentials:"same-origin",signal:controller.signal,
        headers:{Authorization:"Bearer "+credentials.token,Accept:"application/json"}
      });
      if(!response.ok)throw new Error(response.status===403?
        "Tài khoản chưa được cấp quyền xem sản phẩm.":"Không tải được danh sách sản phẩm.");
      const payload=await response.json() as Envelope<{items:CatalogSku[]}>;
      if(!Array.isArray(payload.data?.items)||
        payload.data.items.length>20000||
        payload.data.items.some(item=>typeof item.sku_cong_ty!=="string"))
        throw new Error("Danh sách sản phẩm không hợp lệ.");
      if(controller.signal.aborted)return;
      setSkus(payload.data.items);
      setSelectedSku(current=>payload.data!.items.some(item=>item.sku_cong_ty===current)?
        current:payload.data!.items[0]?.sku_cong_ty||"");
      setError("");
    }).catch(cause=>{
      if(!controller.signal.aborted)
        setError(cause instanceof Error?cause.message:"Không tải được danh sách sản phẩm.");
    }).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[revision,mode]);

  // The selected price-list ID lives in this workspace, not each tab.
  // All three tabs use this same ID; do not fall back to fixed price kinds.
  useEffect(()=>{
    if(mode!=="pricing"||!pricingOwner)return;
    const controller=new AbortController();
    void Promise.resolve().then(async()=>{
      const tokenResponse=await fetch("/api/auth/token",{
        cache:"no-store",credentials:"same-origin",signal:controller.signal
      });
      if(!tokenResponse.ok)throw Error("Hết phiên đăng nhập Owner.");
      const authResult=await tokenResponse.json() as {token?:string};
      if(!authResult.token)throw Error("Không có quyền truy cập bảng giá.");
      const response=await fetch("/api/pricing/managed",{
        cache:"no-store",credentials:"same-origin",signal:controller.signal,
        headers:{Authorization:"Bearer "+authResult.token,Accept:"application/json"}
      });
      if(!response.ok)throw Error("Không tải được danh sách bảng giá.");
      const payload=await response.json() as Envelope<{items:ManagedListOption[]}>;
      if(!Array.isArray(payload.data?.items))throw Error("Danh sách bảng giá không hợp lệ.");
      if(controller.signal.aborted)return;
      setManagedLists(payload.data.items);
      setChosenManagedListId(current=>payload.data!.items.some(x=>x.id===current)?
        current:payload.data!.items[0]?.id||"");
    }).catch(e=>{if(!controller.signal.aborted)
      setError(e instanceof Error?e.message:"Không tải được bảng giá.");});
    return()=>controller.abort();
  },[mode,pricingOwner,managedEpoch]);

  const skuNames=useMemo(()=>Object.fromEntries(skus.map(item=>[
    item.sku_cong_ty,item.ten_san_pham||item.ten_goc_xnt||item.ten_goc_bang_gia||"Chưa có tên"
  ])),[skus]);

  const visible=useMemo(()=>{
    const q=search.trim().toLocaleLowerCase("vi");
    return skus.filter(item=>
      !q||[item.sku_cong_ty,item.ten_san_pham,item.ten_goc_xnt,
        item.ten_goc_bang_gia,item.category_label,item.family_label].some(
          value=>value?.toLocaleLowerCase("vi").includes(q))).slice(0,100);
  },[skus,search]);
  const selected=skus.find(item=>item.sku_cong_ty===selectedSku);
  const pricing=mode==="pricing";

  return <section className="catalogue-side-page" aria-label={pricing?"Giá và bảng giá":"Thư viện hình ảnh"}>
    <AdminToast message={error} variant="error" onClose={()=>setError("")}/>
    <div className="page-title">
      <div>
        <h1>{pricing?"Giá & bảng giá":"Thư viện hình ảnh"}</h1>
        <p>{pricing?
          "Tạo bảng giá, chọn nơi áp dụng và quản lý giá theo mã sản phẩm.":
          "Chọn mã công ty để quản lý ảnh thật và ảnh đại diện."}</p>
      </div>
      <div className="action-row">
        <button type="button" className="import-btn import-secondary"
          disabled={loading||mediaBusy} onClick={()=>{setLoading(true);refresh();}}>Làm mới</button>
      </div>
    </div>
    {pricing&&<p className="catalogue-side-privacy">
      Bảng giá được quản lý riêng trong Admin. Chỉ Owner được tạo và sửa giá.
      Việc chọn Website hoặc App không tự công khai giá cho khách hàng.
    </p>}
    {pricing&&pricingOwner&&<>
      <div className="fb-pricing-context">
        <label htmlFor="fb-pricing-selected-list">Bảng giá đang làm việc</label>
        <select id="fb-pricing-selected-list" value={chosenManagedListId}
         disabled={bulkBusy||priceBusy||managedLists.length===0}
         onChange={e=>setChosenManagedListId(e.target.value)}>
         {managedLists.length===0&&<option value="">Chưa có bảng giá</option>}
         {managedLists.map(item=><option key={item.id} value={item.id}>
          {item.list_code} — {item.list_name}
          {item.approval_state==="draft"?" (Nháp)":item.approval_state==="approved"?" (Đã duyệt)":" (Ngừng)"}
         </option>)}
        </select>
        <span className="fb-pricing-context-help">Bảng giá này dùng chung cho cả ba khu vực.</span>
      </div>
      <nav className="fb-pricing-tabs" aria-label="Các khu vực quản lý giá">
        <button type="button" className={pricingView==="lists"?"active":""}
         aria-current={pricingView==="lists"?"page":undefined} disabled={bulkBusy||priceBusy}
         onClick={()=>setPricingView("lists")}>Bảng giá</button>
        <button type="button" className={pricingView==="products"?"active":""}
         aria-current={pricingView==="products"?"page":undefined} disabled={bulkBusy||priceBusy}
         onClick={()=>setPricingView("products")}>Giá sản phẩm</button>
        <button type="button" className={pricingView==="excel"?"active":""}
         aria-current={pricingView==="excel"?"page":undefined} disabled={bulkBusy||priceBusy}
         onClick={()=>setPricingView("excel")}>Nhập / xuất Excel</button>
      </nav>
      <div className="fb-pricing-tab-content">
       {pricingView==="excel"?
        <CatalogueManagedPriceImport key={chosenManagedListId} selectedListId={chosenManagedListId}
         onBusyChange={handleBulkBusy} onGoLists={()=>setPricingView("lists")}
         onMutated={()=>onManagedMutation()}/>:
        <CatalogueManagedPriceLists key={pricingView} view={pricingView}
         skuNames={skuNames} selectedListId={chosenManagedListId} onSelectedListIdChange={setChosenManagedListId}
         onListsChanged={onManagedMutation} onBusyChange={handleBulkBusy}
         onOpenPrices={id=>{setChosenManagedListId(id);setPricingView("products");}}
         onOpenImport={id=>{setChosenManagedListId(id);setPricingView("excel");}}/>}
      </div>
    </>}
    {pricing&&pricingOwner===null&&<p className="catalogue-side-placeholder">
      Đang xác minh quyền quản lý bảng giá…
    </p>}
    {(!pricing||pricingOwner===false)&&
    <div className="catalogue-side-layout">
      <aside className="catalogue-side-index" aria-label="Chọn mã công ty">
        <label htmlFor="catalogue-side-find">Tìm sản phẩm
          <input id="catalogue-side-find" type="search"
            value={search} onChange={event=>setSearch(event.target.value)}
            placeholder="Mã SKU hoặc tên sản phẩm"/>
        </label>
        <small className="catalogue-side-count">
          {loading?"Đang tải…":search.trim()?
            `Hiển thị ${visible.length} / ${skus.length} sản phẩm`:
            `${skus.length} sản phẩm`}
        </small>
        <div className="catalogue-side-items" role="list">
          {visible.map(item=><button type="button" role="listitem" key={item.sku_cong_ty}
            aria-current={selectedSku===item.sku_cong_ty?"true":undefined}
            disabled={mediaBusy||priceBusy}
            className={"catalogue-side-item"+(selectedSku===item.sku_cong_ty?" active":"")}
            onClick={()=>setSelectedSku(item.sku_cong_ty)}>
            {!pricing&&<span className="catalogue-side-thumb">
              {item.cover_asset_id&&item.cover_sha256?
                <PrivateImage id={item.cover_asset_id} signature={item.cover_sha256}
                  alt={"Ảnh "+item.sku_cong_ty}/>:<span aria-hidden="true">▧</span>}
            </span>}
            <span><strong>{item.sku_cong_ty}</strong>
              <small>{item.ten_san_pham||item.ten_goc_xnt||item.ten_goc_bang_gia||"Chưa đặt tên"}</small>
              {!pricing&&<em>{item.media_count||0} ảnh</em>}
            </span>
          </button>)}
          {!loading&&visible.length===0&&<p className="catalogue-side-empty">
            {skus.length?"Không tìm thấy sản phẩm.":"Chưa có sản phẩm để quản lý."}
          </p>}
        </div>
      </aside>
      <div className="catalogue-side-detail">
        {selectedSku&&selected?
          <>
            <div className="catalogue-side-selected">
              <div>
                <span>Mã công ty · <strong>{selected.sku_cong_ty}</strong></span>
                <h2>{selected.ten_san_pham||selected.ten_goc_xnt||selected.ten_goc_bang_gia||"Chưa đặt tên"}</h2>
                <small>{[selected.category_label,selected.family_label].filter(Boolean).join(" · ")||"Chưa phân loại"}</small>
              </div>
            </div>
            {pricing?
              <CataloguePricebookPanel key={selectedSku} sku={selectedSku} onBusyChange={handlePriceBusy}/>:
              <CatalogueMediaManager key={selectedSku} sku={selectedSku}
                onChanged={refresh} onBusyChange={handleMediaBusy}/>}
          </>:
          <div className="catalogue-side-placeholder">
            {loading?"Đang tải danh mục…":"Chọn một sản phẩm ở danh sách bên trái."}
          </div>}
      </div>
    </div>}
  </section>;
}
