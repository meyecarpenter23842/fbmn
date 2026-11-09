import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateCatalogueImage} from "../backend/admin-api/catalogue-books-service.mjs";
const source=readFileSync(new URL("../apps/admin/app/catalogue-book-manager.tsx",import.meta.url),"utf8");
const webp=Uint8Array.from(Buffer.from("UklGRsYAAABXRUJQVlA4ILoAAADQBgCdASpgAEAAPwmEtFerqCQjoWshcCEJZ21tYVAAs3yMd+BxAt8f4mBbeWZ6/OSGAmU4BSpLUTyBhygRQAAA/uuJvtG/yOwhuyZPPgM2rJ8DOjv2JDOpFCg65bdx5+9MTOEjNQLke0jVqaX0SEM6STsX20Je5sX20FAAul7i/ZWG+J2LZKMp1ahFaTaHycKpavyIgs0CHl8GylHYZiF8U2aXBNGDOjfeYAbCeDmYriAIGLMOP3pAAAA=","base64"));
test("WebP VP8 parser accepts real valid 96x64 fixture",()=>{
 assert.deepEqual(validateCatalogueImage(webp),{width:96,height:64});
 assert.equal(validateCatalogueImage(webp.subarray(0,webp.length-8)),null);
});
test("WebP header checked independently of browser File.type, errors differentiated",()=>{
 assert.match(source,/async function isWebpFile\(file:File\)/);
 assert.match(source,/data\.getUint32\(4,true\)\+8!==file\.size/);
 assert.match(source,/code==="invalid_image"/);
 assert.match(source,/code==="invalid_upload"/);
 assert.match(source,/code==="too_large"/);
 assert.doesNotMatch(source,/file\.type!==MIME/);
 assert.doesNotMatch(source,/status===400\|\|status===413\|\|status===415/);
});
test("READY state requires hide before image edits",()=>{
 assert.match(source,/if\(book\.state==="ready"\)/);
 assert.match(source,/Ẩn bộ để sửa ảnh/);
 assert.match(source,/đánh dấu Sẵn sàng lại/);
});
