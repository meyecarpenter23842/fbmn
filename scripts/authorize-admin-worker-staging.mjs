/** Trust gate for an explicit Owner-requested Admin Worker STAGING deploy.
 * Delegates to the production gate's exact-head/main CI/Codex verification,
 * with a distinct exact command and no production access.
 */
import {appendFileSync} from "node:fs";
import {authorizeAdminProduction} from "./authorize-admin-production.mjs";

const result=await authorizeAdminProduction(process.env,fetch,"/deploy admin worker staging");
appendFileSync(process.env.GITHUB_OUTPUT,"sha="+result.sha+"\npr_number="+result.pr_number+"\n");
console.log("Authorized Admin Worker staging release "+result.sha.slice(0,12));
