import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
/** Exact final Flutter loader invocation, not runtime strings in Flutter JS. */
export function safeCeoBootstrap(source){
 if(typeof source!=="string")return false;
 const last=source.lastIndexOf("_flutter.loader.load(");
 if(last<0)return false;
 const invocation=source.slice(last,last+300);
 return !invocation.includes("serviceWorkerSettings");
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const file=process.argv[2];
 if(!file||!safeCeoBootstrap(readFileSync(file,"utf8"))){
  console.error("CEO build contains competing Flutter SW registration");
  process.exit(1);
 }
}
