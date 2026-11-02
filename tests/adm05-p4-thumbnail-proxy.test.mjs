import test from "node:test";
import assert from "node:assert/strict";
import {GET} from "../apps/admin/app/api/media/[action]/route.ts";

const asset="a99f7e12-c1ab-4bc8-91c0-1fa667b31ad0";
test("Admin image GET forwards exact image only, rejects variant to avoid extra files",async()=>{
  const oldFetch=globalThis.fetch,oldBase=process.env.FBMN_ADMIN_API_BASE_URL;
  const sent=[];
  process.env.FBMN_ADMIN_API_BASE_URL="https://worker.example.test/";
  globalThis.fetch=async url=>{
    sent.push(new URL(String(url)));
    return new Response(new Uint8Array([1,2,3]),{
      status:200,headers:{"Content-Type":"image/webp"}});
  };
  try{
    const context={params:Promise.resolve({action:"file"})};
    const headers={Authorization:"Bearer example-token"};
    const req=new Request("https://admin.example.test/api/media/file?id="+asset,{headers});
    const response=await GET(req,context);
    assert.equal(response.status,200);
    assert.equal(response.headers.get("content-type"),"image/webp");
    assert.equal(sent.length,1);
    assert.equal(sent[0].pathname,"/v1/admin/catalogue/media/file");
    assert.equal(sent[0].searchParams.get("id"),asset);
    assert.equal(sent[0].searchParams.has("variant"),false);
    const ambiguous=await GET(new Request(
      "https://admin.example.test/api/media/file?id="+asset+"&id="+asset,{headers}),context);
    assert.equal(ambiguous.status,400);
    assert.equal(sent.length,1);
    const variant=await GET(new Request(
      "https://admin.example.test/api/media/file?id="+asset+"&variant=thumb",{headers}),context);
    assert.equal(variant.status,400);
    assert.equal(sent.length,1);
  }finally{
    globalThis.fetch=oldFetch;
    if(oldBase===undefined)delete process.env.FBMN_ADMIN_API_BASE_URL;
    else process.env.FBMN_ADMIN_API_BASE_URL=oldBase;
  }
});
