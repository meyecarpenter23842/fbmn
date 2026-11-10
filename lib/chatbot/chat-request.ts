// DL10B shared bounded public request; never accepts an Agent, model or credentials.
export const CHAT_PATH="/v1/public/chat";
export const CHAT_MAX_BYTES=2048;
export const CHAT_PROOF_PREFIX="dl10b:";
export type ChatRequest={session:string;text:string};
export function parseChatRequest(value:unknown):ChatRequest|null{
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 if(Object.keys(v).length!==2||typeof v.session!=="string"||typeof v.text!=="string"||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v.session))return null;
 const text=v.text.trim();
 if(!text||text.length>300||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text))return null;
 return {session:v.session,text};
}
export async function readChatRequest(request:Request):Promise<ChatRequest|null>{
 if(request.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json"||
    Number(request.headers.get("content-length")||0)>CHAT_MAX_BYTES||!request.body)return null;
 const reader=request.body.getReader(),decoder=new TextDecoder("utf-8",{fatal:true});
 let raw="",size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;
  size+=value.byteLength;if(size>CHAT_MAX_BYTES){await reader.cancel();return null;}
  raw+=decoder.decode(value,{stream:true});}
  raw+=decoder.decode();return parseChatRequest(JSON.parse(raw));
 }catch{return null;}finally{reader.releaseLock();}
}
