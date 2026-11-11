"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import AdminToast from "./admin-toast";
import ProductModal,{useProductModalClose} from "./product-modal";
type Conversation={session:string;createdAt:string;updatedAt:string;messageCount:number;latest:string|null};
type Turn={id:string;question:string;answer:string|null;createdAt:string};
type ListReply={conversations:Conversation[];page:number;hasMore:boolean};
type DetailReply={session:string;turns:Turn[];page:number;hasMore:boolean};
type Filters={q:string;from:string;to:string};
const emptyFilters={q:"",from:"",to:""};
const fmt=(v:string)=>new Date(v).toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"});
async function api<T>(params:URLSearchParams,body?:object):Promise<T>{
 const auth=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 if(!auth.ok)throw Error("Phiên đăng nhập đã hết hạn.");
 const value=await auth.json() as {token?:unknown};
 if(typeof value.token!=="string"||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value.token))throw Error("Không xác minh được quyền.");
 const response=await fetch("/api/website/chat-history"+(body?"":"?"+params.toString()),{
  method:body?"POST":"GET",credentials:"same-origin",cache:"no-store",
  headers:{Authorization:"Bearer "+value.token,Accept:"application/json",...(body?{"Content-Type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{})});
 const result=await response.json().catch(()=>({})) as {data?:T};
 if(!response.ok||!result.data)throw Error(response.status===403?"Bạn không có quyền quản lý hội thoại.":response.status===404?"Hội thoại không còn tồn tại.":response.status===400?"Bộ lọc không hợp lệ.": "Không thể tải dữ liệu hội thoại. Vui lòng thử lại.");
 return result.data;
}
function CloseModal(){const close=useProductModalClose();return <button type="button" className="fb-ui-button fb-ui-button--secondary" onClick={close}>Hủy</button>;}
export default function ChatHistoryManager({owner}:{owner:boolean}){
 const [filters,setFilters]=useState<Filters>(emptyFilters);
 const [applied,setApplied]=useState<Filters>(emptyFilters);
 const [items,setItems]=useState<Conversation[]>([]);
 const [page,setPage]=useState(1),[more,setMore]=useState(false);
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 const [selected,setSelected]=useState<Conversation|null>(null);
 const [turns,setTurns]=useState<Turn[]>([]),[detailPage,setDetailPage]=useState(1),[detailMore,setDetailMore]=useState(false);
 const [detailLoading,setDetailLoading]=useState(false),[detailError,setDetailError]=useState("");
 const [confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false);
 const [notice,setNotice]=useState(""),[noticeId,setNoticeId]=useState(0),[variant,setVariant]=useState<"success"|"error">("success");
 const listEpoch=useRef(0),detailEpoch=useRef(0);
 const load=useCallback(async(p:number,filter:Filters)=>{
  const epoch=++listEpoch.current;setLoading(true);setError("");
  const params=new URLSearchParams({page:String(p)});
  for(const [key,val] of Object.entries(filter))if(val.trim())params.set(key,val.trim());
  try{const data=await api<ListReply>(params);if(epoch!==listEpoch.current)return;
   setItems(data.conversations);setPage(data.page);setMore(data.hasMore);setApplied(filter);
  }catch(e){if(epoch===listEpoch.current){setItems([]);setMore(false);setError(e instanceof Error?e.message:"Lỗi tải dữ liệu.");}}
  finally{if(epoch===listEpoch.current)setLoading(false);}
 },[]);
 useEffect(()=>{if(!owner)return;let active=true;void Promise.resolve().then(()=>{if(active)return load(1,emptyFilters);});
  return ()=>{active=false;listEpoch.current++;detailEpoch.current++;};},[owner,load]);
 async function detail(item:Conversation,p:number){
  const epoch=++detailEpoch.current;setDetailLoading(true);setDetailError("");
  if(p===1){setSelected(item);setTurns([]);setDetailMore(false);setDetailPage(1);setConfirm(false);}
  try{const data=await api<DetailReply>(new URLSearchParams({session:item.session,page:String(p)}));
   if(epoch!==detailEpoch.current)return;
   setTurns(prev=>p===1?data.turns:[...prev,...data.turns]);setDetailPage(data.page);setDetailMore(data.hasMore);
  }catch(e){if(epoch===detailEpoch.current)setDetailError(e instanceof Error?e.message:"Lỗi tải tin nhắn.");}
  finally{if(epoch===detailEpoch.current)setDetailLoading(false);}
 }
 function close(){detailEpoch.current++;setSelected(null);setTurns([]);setConfirm(false);setDetailLoading(false);}
 async function remove(){
  if(!selected||!confirm||busy)return;
  setBusy(true);
  try{await api(new URLSearchParams(),{operation:"delete",session:selected.session});
   close();setVariant("success");setNotice("Đã xóa hội thoại và toàn bộ tin nhắn.");setNoticeId(v=>v+1);
   await load(items.length===1&&page>1?page-1:page,applied);
  }catch(e){setVariant("error");setNotice(e instanceof Error?e.message:"Không thể xóa hội thoại.");setNoticeId(v=>v+1);}
  finally{setBusy(false);}
 }
 if(!owner)return <section className="surface dl4-panel"><h1>Quản lý hội thoại</h1><p>Chỉ Owner có quyền xem và xóa hội thoại.</p></section>;
 return <div className={"dl4-layout dl10c-workspace"+(selected?" dl10c-has-selection":"")}>
  <div className="page-title"><div><h1>Quản lý hội thoại</h1><p>Lịch sử trao đổi của khách với chatbot Website Futurebook.</p></div>
   <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={loading||busy} onClick={()=>{void load(page,applied);if(selected)void detail(selected,1);}}>Tải lại</button></div>
  <section className="surface dl4-panel dl10c-inbox">
   <form className="dl10c-filters" onSubmit={e=>{e.preventDefault();close();void load(1,filters);}}>
    <label>Từ khóa hoặc mã phiên<input className="fb-ui-field" value={filters.q} maxLength={100} onChange={e=>setFilters(v=>({...v,q:e.target.value}))} placeholder="Tìm nội dung tin nhắn"/></label>
    <label>Từ ngày<input className="fb-ui-field" type="date" value={filters.from} onChange={e=>setFilters(v=>({...v,from:e.target.value}))}/></label>
    <label>Đến ngày<input className="fb-ui-field" type="date" value={filters.to} min={filters.from||undefined} onChange={e=>setFilters(v=>({...v,to:e.target.value}))}/></label>
    <div className="action-row"><button type="submit" className="fb-ui-button fb-ui-button--primary" disabled={loading}>Tìm kiếm</button>
    <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={loading} onClick={()=>{close();setFilters(emptyFilters);void load(1,emptyFilters);}}>Xóa lọc</button></div>
   </form>
   <div className="dl10c-split">
    <aside className="dl10c-sidebar" aria-label="Danh sách hội thoại">
     <div className="dl10c-pane-heading"><h2>Hội thoại</h2><small>Trang {page}</small></div>
     <div className="dl10c-list-scroll">
      {error&&<p className="dl4-error" role="alert">{error}</p>}
      {loading?<p className="dl10c-empty" role="status">Đang tải hội thoại…</p>:!error&&(!items.length?<p className="dl10c-empty">Không có hội thoại phù hợp.</p>:<ul className="dl10c-list">
       {items.map(item=><li key={item.session}><button type="button" className="dl10c-conversation" aria-current={selected?.session===item.session?"true":undefined} disabled={busy} onClick={()=>void detail(item,1)}>
        <span className="dl10c-avatar" aria-hidden="true">K</span>
        <span className="dl10c-summary"><span className="dl10c-row-title">Khách · {item.session.slice(0,8)}</span><span className="dl10c-preview">{item.latest||"Chưa có phản hồi"}</span><small>{fmt(item.updatedAt)} · {item.messageCount} tin nhắn</small></span>
       </button></li>)}
      </ul>)}
     </div>
     <div className="dl10c-pagination"><button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={loading||busy||page===1} onClick={()=>{close();void load(page-1,applied);}}>Trang trước</button>
      <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={loading||busy||!more} onClick={()=>{close();void load(page+1,applied);}}>Trang sau</button></div>
    </aside>
    <section className="dl10c-thread" aria-label="Nội dung hội thoại">
     {!selected?<div className="dl10c-thread-empty"><strong>Chọn một hội thoại</strong><p>Chọn khách ở danh sách bên trái để đọc nội dung trao đổi.</p></div>:<>
      <header className="dl10c-thread-header">
       <button type="button" className="fb-ui-button fb-ui-button--secondary dl10c-back" disabled={busy} onClick={close}>← Danh sách</button>
       <span className="dl10c-avatar" aria-hidden="true">K</span>
       <div className="dl10c-thread-title"><h2>Khách · {selected.session.slice(0,8)}</h2><small className="dl10c-session" title={selected.session}>Mã phiên: {selected.session}</small><small>{fmt(selected.updatedAt)} · {selected.messageCount} tin nhắn</small></div>
       <button type="button" className="fb-ui-button fb-ui-button--secondary" disabled={busy||detailLoading} onClick={()=>setConfirm(true)}>Xóa hội thoại</button>
      </header>
      <div className="dl10c-thread-scroll" tabIndex={0} aria-label="Tin nhắn trong hội thoại">
       {detailError&&<p role="alert" className="dl4-error">{detailError} <button type="button" className="fb-ui-button fb-ui-button--secondary" onClick={()=>void detail(selected,turns.length?detailPage+1:1)}>Thử lại</button></p>}
       <div className="dl10c-messages">{turns.map(turn=><div className="dl10c-turn" key={turn.id}>
        <small className="dl10c-time">{fmt(turn.createdAt)}</small>
        <div className="dl10c-bubble dl10c-bubble--customer"><strong>Khách</strong><p>{turn.question}</p></div>
        <div className="dl10c-bubble dl10c-bubble--bot"><strong>Chatbot</strong><p>{turn.answer??"Chatbot chưa trả lời."}</p></div>
       </div>)}</div>
       {detailLoading&&<p role="status" className="dl10c-empty">Đang tải tin nhắn…</p>}
       {!detailLoading&&!detailError&&!turns.length&&<p className="dl10c-empty">Hội thoại chưa có tin nhắn.</p>}
       {detailMore&&!detailLoading&&<div className="dl10c-load-more"><button type="button" className="fb-ui-button fb-ui-button--secondary" onClick={()=>void detail(selected,detailPage+1)}>Tải thêm tin nhắn</button></div>}
      </div>
      <footer className="dl10c-thread-footer">Lịch sử chỉ đọc · Chatbot trả lời tự động</footer>
     </>}
    </section>
   </div>
  </section>
  {selected&&confirm&&<ProductModal title="Xóa hội thoại" locked={busy} onClose={()=>setConfirm(false)}
   footer={<><CloseModal/><button type="button" className="fb-ui-button fb-ui-button--danger" disabled={busy} onClick={()=>void remove()}>Xác nhận xóa vĩnh viễn</button></>}>
    <p className="dl10c-session">Mã phiên: {selected.session}</p>
    <p role="alert">Xóa toàn bộ nội dung cuộc hội thoại này. Không thể hoàn tác.</p>
  </ProductModal>}
  <AdminToast message={notice} variant={variant} notificationId={noticeId} onClose={()=>setNotice("")}/>
 </div>;
}
