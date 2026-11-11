import { createAdminStagingWorker } from "./staging-worker.mjs";
import {WorkerEntrypoint} from "cloudflare:workers";
import {Client} from "pg";
import {createCredentialStore} from "./chatbot-credentials.mjs";
import {deliverScheduledPush} from "./ceo-push-cron.mjs";
import {saveChatTurn} from "./chat-history-service.mjs";
import {runChat} from "./chatbot-runtime.mjs";
const adminWorker=createAdminStagingWorker({});

export default {
 fetch(request,env,ctx){return adminWorker.fetch(request,env,ctx);},
 scheduled(_controller,env,ctx){ctx.waitUntil(deliverScheduledPush(env));}
};
// Named RPC entrypoint is only reachable through a Cloudflare service binding.
export class ChatbotGateway extends WorkerEntrypoint {
 async chat(request,visitor){
  const env=this.env;
  const db=async work=>{
   if(env.EXPECTED_ADMIN_DB_ROLE!=="fbmn_admin_http_staging"||!env.ADMIN_HYPERDRIVE?.connectionString)throw Error("unavailable");
   const client=new Client({connectionString:env.ADMIN_HYPERDRIVE.connectionString,connectionTimeoutMillis:3500,query_timeout:3500,statement_timeout:3500});
   try{await client.connect();
    const identity=await client.query("SELECT current_user AS role_name");
    if(identity.rows?.[0]?.role_name!==env.EXPECTED_ADMIN_DB_ROLE)throw Error("unavailable");
    return await work(client);
   }finally{await client.end();}
  };
  return runChat({request,visitor,saveTurn:turn=>db(client=>saveChatTurn(client,turn)),secret:env.DIALOGFLOW_SERVICE_ACCOUNT_JSON,loadSecret:revision=>createCredentialStore(env.CHATBOT_CREDENTIALS_R2,env.CHATBOT_CREDENTIAL_KEY)?.read(revision),db:()=>db(async client=>(await client.query("SELECT config,revision FROM fbmn_catalog_private.website_chatbot_config WHERE singleton=true")).rows[0])});
 }
}
