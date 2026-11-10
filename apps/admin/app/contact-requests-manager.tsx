"use client";
import {useCallback,useEffect,useState} from "react";
import {PROVINCES} from "../lib/contact-options";
import AdminToast from "./admin-toast";
import ProductModal,{useProductModalClose} from "./product-modal";
type RequestItem={id:string;name:string;email:string;phone:string;company:string;province:string;customerGroup:string;interests:string[];message:string;
 status:"new"|"handled";consentAt:string;createdAt:string;updatedAt:string};
type Reply={requests:RequestItem[];page:number;hasMore:boolean};
async function inboxRequest<T>(page:number,body?:object):Promise<T>{
 const auth=await fetch("/api/auth/token",{credentials:"same-origin",cache:"no-store"});
 if(!auth.ok)throw Error("Phiên đăng nhập đã hết hạn.");
 const jwt=await auth.json().catch(()=>({})) as {token?:unknown};
 if(typeof jwt.token!=="string"||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jwt.token))
  throw Error("Không xác minh được quyền Owner.");
 const response=await fetch("/api/website/contact-requests"+(body?"":"?page="+page),{
  method:body?"POST":"GET",credentials:"same-origin",cache:"no-store",
  headers:{Authorization:"Bearer "+jwt.token,Accept:"application/json",
   ...(body?{"Content-Type":"application/json"}:{})},
  ...(body?{body:JSON.stringify(body)}:{})});
 const value=await response.json().catch(()=>({})) as {data?:T};
 if(!response.ok){
  if(response.status===409)throw Error("Yêu cầu đã thay đổi. Hãy tải lại danh sách.");
  if(response.status===403)throw Error("Chỉ Owner được xem và xử lý yêu cầu.");
  throw Error("Hộp thư liên hệ chưa sẵn sàng. Không có dữ liệu nào được thay đổi.");
 }
 if(!value.data)throw Error("Phản hồi không hợp lệ.");
 return value.data;
}
const displayDate=(value:string)=>new Date(value).toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"});
function CloseModal(){const close=useProductModalClose();return <button type="button"
 className="fb-ui-button fb-ui-button--secondary" onClick={close}>Đóng</button>;}
export default function ContactRequestsManager({owner}:{owner:boolean}){
 const [requests,setRequests]=useState<RequestItem[]>([]);
 const [page,setPage]=useState(1),[hasMore,setHasMore]=useState(false);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [selected,setSelected]=useState<RequestItem|null>(null);
 const [confirmDelete,setConfirmDelete]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [noticeId,setNoticeId]=useState(0);
 const [noticeVariant,setNoticeVariant]=useState<"success"|"error">("success");
 const load=useCallback(async(p:number)=>{
  setLoading(true);setError("");
  try{const data=await inboxRequest<Reply>(p);setRequests(data.requests);setPage(p);
   setHasMore(data.hasMore);setSelected(null);setConfirmDelete(false);}
  catch(e){setError(e instanceof Error?e.message:"Không tải được yêu cầu.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{if(!owner)return;let active=true;void Promise.resolve().then(()=>{if(active)return load(1);});
  return ()=>{active=false;};},[owner,load]);
 async function act(operation:"set_status"|"delete",status?:"new"|"handled"){
  if(!selected||busy)return;
  setBusy(true);
  try{
   await inboxRequest(page,{operation,id:selected.id,expectedStatus:selected.status,...(status?{status}:{})});
   setNoticeVariant("success");setNotice(operation==="delete"?"Đã xóa thông tin liên hệ.":"Đã cập nhật trạng thái xử lý.");
   setNoticeId(v=>v+1);
   await load(page);
  }catch(e){setNoticeVariant("error");setNotice(e instanceof Error?e.message:"Thao tác thất bại.");
   setNoticeId(v=>v+1);}
  finally{setBusy(false);}
 }
 if(!owner)return <section className="surface dl4-panel"><h1>Liên hệ & đăng ký đại lý</h1>
  <p>Chỉ Owner có quyền xem thông tin khách hàng.</p></section>;
 return <div className="dl4-layout">
  <div className="page-title"><div><h1>Liên hệ & đăng ký đại lý</h1>
   <p>Hộp thư tiếp nhận từ Website. Chỉ Owner được xem; không phải đơn hàng hay báo giá đã chấp thuận.</p></div>
   <div className="action-row"><button type="button" className="fb-ui-button fb-ui-button--secondary"
    disabled={loading||busy} onClick={()=>void load(page)}>Tải lại</button></div></div>
  {error&&<p className="dl4-error" role="alert">{error}</p>}
  {loading?<section className="surface dl4-panel" role="status">Đang tải yêu cầu…</section>:
   <section className="surface dl4-panel">
    <h2>Yêu cầu nhận được</h2>
    {!requests.length&&<p>Chưa có yêu cầu trong trang này.</p>}
    <ul className="dl4-list">{requests.map(r=><li className="dl4-item" key={r.id}>
     <div><strong>{r.name} — {r.customerGroup}</strong>
      <small>{displayDate(r.createdAt)} · {r.status==="new"?"Mới":"Đã xử lý"}</small></div>
     <button type="button" className="fb-ui-button fb-ui-button--secondary"
      onClick={()=>{setSelected(r);setConfirmDelete(false);}}>Xem chi tiết</button>
    </li>)}</ul>
    <div className="action-row">
     <button type="button" className="fb-ui-button fb-ui-button--secondary"
      disabled={page===1||loading} onClick={()=>void load(page-1)}>Trang trước</button>
     <span>Trang {page}</span>
     <button type="button" className="fb-ui-button fb-ui-button--secondary"
      disabled={!hasMore||loading} onClick={()=>void load(page+1)}>Trang sau</button>
    </div>
    <p className="content-small-note">Dữ liệu yêu cầu chỉ sử dụng để phản hồi. Các yêu cầu quá 90 ngày được xóa khi Owner mở hộp thư. Có thể xóa từng yêu cầu ngay.</p>
   </section>}
  {selected&&<ProductModal title={"Liên hệ & đăng ký đại lý — "+selected.customerGroup} locked={busy}
   onClose={()=>{setSelected(null);setConfirmDelete(false);}}
   footer={<><CloseModal/>
    {!confirmDelete?<button type="button" className="fb-ui-button fb-ui-button--secondary"
      disabled={busy} onClick={()=>setConfirmDelete(true)}>Xóa thông tin</button>:
     <button type="button" className="fb-ui-button fb-ui-button--danger"
      disabled={busy} onClick={()=>void act("delete")}>Xác nhận xóa vĩnh viễn</button>}
    <button type="button" className="fb-ui-button fb-ui-button--primary"
      disabled={busy||confirmDelete}
      onClick={()=>void act("set_status",selected.status==="new"?"handled":"new")}>
      {selected.status==="new"?"Đánh dấu đã xử lý":"Mở lại yêu cầu"}</button></>}>
   <dl className="dl6-request-details">
    <dt>Người liên hệ</dt><dd>{selected.name}</dd>
    <dt>Đơn vị</dt><dd>{selected.company||"Không cung cấp"}</dd>
    <dt>Email</dt><dd>{selected.email?<a href={"mailto:"+selected.email}>{selected.email}</a>:"Không cung cấp"}</dd>
    <dt>Số điện thoại</dt><dd>{selected.phone||"Không cung cấp"}</dd>
    <dt>Tỉnh/thành</dt><dd>{PROVINCES.find(p=>p[0]===selected.province)?.[1]||selected.province}</dd>
    <dt>Nhóm khách hàng</dt><dd>{selected.customerGroup}</dd>
    <dt>Sản phẩm quan tâm</dt><dd>{selected.interests.join(", ")}</dd>
    <dt>Nhu cầu</dt><dd className="dl6-request-message">{selected.message||"Chưa nêu"}</dd>
    <dt>Đã đồng ý liên hệ</dt><dd>{displayDate(selected.consentAt)}</dd>
   </dl>
   {confirmDelete&&<p role="alert">Thao tác xóa không thể hoàn tác. Bấm “Xác nhận xóa vĩnh viễn” để tiếp tục.</p>}
  </ProductModal>}
  <AdminToast message={notice} variant={noticeVariant} notificationId={noticeId} onClose={()=>setNotice("")}/>
 </div>;
}
