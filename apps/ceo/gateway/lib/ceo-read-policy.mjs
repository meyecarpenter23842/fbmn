// Owner-only read receipts are distinct from 'new'/'handled' workflow status.
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parseReadMark(body){
 if(!body||typeof body!=="object"||Array.isArray(body)||
  Object.keys(body).length!==2||!Object.hasOwn(body,"kind")||!Object.hasOwn(body,"id")||
  !["contact","outsourcing"].includes(body.kind)||typeof body.id!=="string"||!UUID.test(body.id))return null;
 return {kind:body.kind,id:body.id.toLowerCase()};
}
export function readRequestIds(payload){
 const requests=payload?.data?.requests;
 if(!Array.isArray(requests)||requests.length>50||
  requests.some(item=>!item||typeof item!=="object"||
   typeof item.id!=="string"||!UUID.test(item.id)))return null;
 return requests.map(item=>item.id.toLowerCase());
}
export function attachReadReceipts(payload,rows){
 const receipts=new Map(rows.map(row=>[String(row.id).toLowerCase(),
  new Date(row.viewed_at).toISOString()]));
 return {...payload,data:{...payload.data,
  requests:payload.data.requests.map(item=>({...item,
   viewedAt:receipts.get(item.id.toLowerCase())??null}))}};
}
