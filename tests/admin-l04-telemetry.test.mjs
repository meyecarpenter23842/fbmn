import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseAdminTelemetry, posthogAggregatePayload } from "../apps/admin/lib/admin-telemetry-policy.ts";

test("L04 only accepts two fixed business-safe event fields", () => {
  assert.deepEqual(parseAdminTelemetry({event:"admin_section_view",section:"pricing"}),
    {event:"admin_section_view",section:"pricing"});
  assert.deepEqual(parseAdminTelemetry({event:"admin_client_exception",section:"products"}),
    {event:"admin_client_exception",section:"products"});
  assert.deepEqual(parseAdminTelemetry({event:"admin_operation_error",section:"pricing"}),
    {event:"admin_operation_error",section:"pricing"});
  for (const value of [
    {event:"admin_section_view",section:"pricing",sku:"0114"},
    {event:"admin_section_view",section:"pricing",amount:100},
    {event:"admin_section_view",section:"pricing",email:"x@example.test"},
    {event:"admin_section_view",section:"pricing",error:"private error"},
    {event:"admin_section_view",section:"pricing",url:"/admin?token=abc"},
    {event:"admin_ui_click",section:"pricing"},
    {event:"admin_section_view",section:"unexpected"},
    {event:"admin_section_view"}, null, [], "pricing"
  ]) assert.equal(parseAdminTelemetry(value),null);
});

test("L04 payload contains no identity, URL, raw errors, price or session ID", () => {
  const p = posthogAggregatePayload("project-test-key", {
    event:"admin_client_exception",section:"media"
  });
  assert.deepEqual(p,{
    api_key:"project-test-key",event:"admin_client_exception",
    distinct_id:"futurebook-admin-aggregate",
    properties: {section:"media",$ip:null,$geoip_disable:true,$process_person_profile:false}
  });
  const encoded = JSON.stringify(p);
  assert.doesNotMatch(encoded,/(email|phone|user_id|token|password|sku|price|filename|stack|session_id|url|href|referrer)/i);
});

test("L04 is fail-closed and cannot use PostHog autocapture or session replay", () => {
  const client = readFileSync(new URL("../apps/admin/app/admin-telemetry.tsx",import.meta.url),"utf8");
  const endpoint = readFileSync(new URL("../apps/admin/app/api/telemetry/route.ts",import.meta.url),"utf8");
  const page = readFileSync(new URL("../apps/admin/app/page.tsx",import.meta.url),"utf8");
  const toast = readFileSync(new URL("../apps/admin/app/admin-toast.tsx",import.meta.url),"utf8");
  assert.match(toast,/fbmn-admin-operation-error/);
  assert.doesNotMatch(toast,/CustomEvent.*message/);
  assert.match(client,/NEXT_PUBLIC_FBMN_ADMIN_TELEMETRY === "1"/);
  assert.match(endpoint,/FBMN_ADMIN_POSTHOG_ENABLED !== "1"/);
  assert.match(endpoint,/v1\/admin\/session/);
  assert.match(endpoint,/request\.headers\.get\("origin"\)/);
  assert.match(page,/authState==="authorised" && <><AdminTelemetry section={section}\/>/);
  assert.doesNotMatch(client+endpoint,/posthog-js|autocapture:\s*true|session_recording:\s*true/);
  assert.doesNotMatch(endpoint,/request\.headers\.get\("user-agent"\)/);
});
