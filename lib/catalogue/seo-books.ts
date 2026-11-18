import {catalogueWorkerOrigin} from "./worker-origin.ts";

export type PublishedCatalogueSeoBook={
 id:string;
 title:string;
 edition:string;
 hasPages:boolean;
 hasPdf:boolean;
};
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const object=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&
 typeof value==="object"&&!Array.isArray(value);

/** Only public, approved book metadata from the existing Public Worker. */
export function projectPublishedCatalogueSeoBooks(payload:unknown):PublishedCatalogueSeoBook[]{
 if(!object(payload)||!object(payload.data)||!Array.isArray(payload.data.books)||
   payload.data.books.length>100)return [];
 const seen=new Set<string>(),out:PublishedCatalogueSeoBook[]=[];
 for(const raw of payload.data.books){
  if(!object(raw)||typeof raw.id!=="string"||!UUID.test(raw.id)||
    typeof raw.title!=="string"||!raw.title.trim()||raw.title.length>120||
    typeof raw.edition!=="string"||raw.edition.length>80||
    (raw.hasPages!==undefined&&typeof raw.hasPages!=="boolean")||
    (raw.hasPdf!==undefined&&typeof raw.hasPdf!=="boolean")||
    seen.has(raw.id))return [];
  // The viewer never lists a book with neither pages nor an approved PDF.
  const hasPages=raw.hasPages!==false,hasPdf=raw.hasPdf===true;
  if(!hasPages&&!hasPdf)return [];
  seen.add(raw.id);
  out.push({id:raw.id,title:raw.title.trim(),edition:raw.edition.trim(),hasPages,hasPdf});
 }
 return out;
}

/** Server-only, fail closed and never block Catalogue when the Worker is down. */
export async function getPublishedCatalogueSeoBooks(
 transport:typeof fetch=fetch,origin:string|null=catalogueWorkerOrigin()
):Promise<PublishedCatalogueSeoBook[]>{
 if(!origin)return [];
 try{
  const remote=await transport(origin+"/v1/public/catalogue-books",{
   method:"GET",cache:"no-store",redirect:"manual",signal:AbortSignal.timeout(3500),
   headers:{Accept:"application/json"}
  });
  if(remote.status!==200||!remote.headers.get("content-type")?.includes("application/json")){
   await remote.body?.cancel();
   return [];
  }
  if(Number(remote.headers.get("content-length")||0)>150000){
   await remote.body?.cancel();
   return [];
  }
  const raw=await remote.text();
  if(raw.length>150000)return [];
  return projectPublishedCatalogueSeoBooks(JSON.parse(raw));
 }catch{return [];}
}
