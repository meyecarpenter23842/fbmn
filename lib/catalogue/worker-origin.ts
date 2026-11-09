// DL7C public catalogue proxy uses the same trusted Worker origin as the website.
export function catalogueWorkerOrigin(){
 if(process.env.FBMN_PUBLIC_API_ENABLED!=="true")return null;
 try{
  const u=new URL(process.env.FBMN_PUBLIC_API_BASE_URL||"");
  if(u.protocol!=="https:"||u.pathname!=="/"||u.search||u.hash||
   u.username||u.password||u.port||!u.hostname||
   /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/i.test(u.hostname)||
   u.hostname.endsWith(".r2.dev")||u.hostname.endsWith(".internal")||
   u.hostname.endsWith(".invalid"))return null;
  return u.origin;
 }catch{return null;}
}
