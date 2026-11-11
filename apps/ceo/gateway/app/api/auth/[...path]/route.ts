import type {NextRequest} from "next/server";
import {ceoAuth} from "@/lib/auth-server";
export const dynamic="force-dynamic";
const fail=()=>Response.json({error:{code:"auth_unavailable"}},{status:503,headers:{"Cache-Control":"no-store"}});
export async function GET(request:NextRequest,context:{params:Promise<{path:string[]}>}){
 const auth=ceoAuth();return auth?auth.handler().GET(request,context):fail();
}
export async function POST(request:NextRequest,context:{params:Promise<{path:string[]}>}){
 const auth=ceoAuth();return auth?auth.handler().POST(request,context):fail();
}
