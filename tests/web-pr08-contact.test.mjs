import test from "node:test";
import assert from "node:assert/strict";
import { validateContactInput } from "../lib/contact/validation.ts";
const now=Date.now();
const payload={name:"Nguyễn Văn A",email:"  DEMO@example.com ",message:"Xin thông tin phân phối Futurebook.",consent:true,website:"",startedAt:now-5000};
test("valid contact draft",()=>{const r=validateContactInput(payload,now);assert.equal(r.ok,true);if(r.ok)assert.equal(r.data.email,"demo@example.com");});
test("honeypot blocks spam",()=>assert.equal(validateContactInput({...payload,website:"bad"},now).ok,false));
test("consent mandatory",()=>assert.equal(validateContactInput({...payload,consent:false},now).ok,false));
test("reject automated instant request",()=>assert.equal(validateContactInput({...payload,startedAt:now-100},now).ok,false));
