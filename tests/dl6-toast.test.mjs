import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("DL6 toast renders outside the filtered glass ancestor via portal to document.body",()=>{
 const src=readFileSync("components/content-toast.tsx","utf8");
 const css=readFileSync("components/content-toast.module.css","utf8");
 const layout=readFileSync("app/content.css","utf8");
 assert.match(src,/createPortal\(<div/);
 assert.match(src,/setHost\(document\.body\)/);
 assert.match(css,/position:fixed/);
 assert.doesNotMatch(layout,/position:\s*fixed|bottom-nav/);
});
