import { test } from "node:test";
import assert from "node:assert/strict";
import { isCmsPublished, isCmsPopupEligible } from "../backend/admin-api/cms-publication-policy.mjs";

const NOW = new Date("2026-11-04T12:00:00.000Z");
const published = () => ({
  kind: "banner",
  status: "published",
  sourceRef: "approved-owner-source",
  channelTargets: ["public_web"],
  verifiedAt: "2026-11-01T10:00:00+07:00",
  approvedAt: "2026-11-02T10:00:00+07:00",
  publishedAt: "2026-11-03T10:00:00+07:00",
  startsAt: "2026-11-04T08:00:00+07:00",
  endsAt: "2026-11-05T23:59:59+07:00",
  withdrawnAt: null,
  internalNote: "never exposed by public DTO",
});

test("CMS starts unpublished and denies untargeted channels", () => {
  assert.equal(isCmsPublished(null, { now: NOW }), false);
  assert.equal(isCmsPublished({ status: "published" }, { now: NOW }), false);
  const item = published();
  assert.equal(isCmsPublished(item, { now: NOW }), true);
  assert.equal(isCmsPublished(item, { channel: "dealer_app", now: NOW }), false);
  assert.equal(isCmsPublished(item, { channel: "consumer_app", now: NOW }), false);
  assert.equal(isCmsPublished(item, { channel: "admin_web", now: NOW }), false);
});

test("CMS requires audit source, approval and verification timestamps", () => {
  for (const [field, value] of [
    ["sourceRef", ""], ["verifiedAt", null], ["approvedAt", null],
    ["publishedAt", null], ["status", "draft"], ["status", "review"],
    ["status", "archived"], ["approvedAt", "2026-11-05T00:00:00Z"],
  ]) {
    assert.equal(isCmsPublished({ ...published(), [field]: value }, { now: NOW }), false, field);
  }
});

test("CMS rejects malformed channel lists and timestamp strings", () => {
  for (const targets of [[], ["admin_web"], ["public_web", "public_web"], "public_web", ["public_web", "private"]]) {
    assert.equal(isCmsPublished({ ...published(), channelTargets: targets }, { now: NOW }), false);
  }
  for (const datetime of ["2026-11-04", "2026-11-04T12:00:00", "not-a-date", ""]) {
    assert.equal(isCmsPublished({ ...published(), startsAt: datetime }, { now: NOW }), false);
  }
});

test("scheduled banners do not appear early or after expiry", () => {
  const item = published();
  assert.equal(isCmsPublished(item, { now: new Date("2026-11-03T23:00:00Z") }), false);
  assert.equal(isCmsPublished(item, { now: new Date("2026-11-06T00:00:00Z") }), false);
  assert.equal(isCmsPublished({ ...item, startsAt: item.endsAt, endsAt: item.startsAt }, { now: NOW }), false);
  assert.equal(isCmsPublished({ ...item, withdrawnAt: "2026-11-04T11:00:00Z" }, { now: NOW }), false);
  assert.equal(isCmsPublished({ ...item, withdrawnAt: "2026-11-04T13:00:00Z" }, { now: NOW }), true);
  assert.equal(isCmsPublished(item, { now: new Date("invalid") }), false);
});

test("CMS enforces strict channel targeting including multiple channels", () => {
  const item = { ...published(), channelTargets: ["public_web", "dealer_app"] };
  assert.equal(isCmsPublished(item, { now: NOW, channel: "dealer_app" }), true);
  assert.equal(isCmsPublished(item, { now: NOW, channel: "consumer_app" }), false);
});

test("popup max per session and cooldown guard avoid repeated display", () => {
  const popup = { ...published(), kind: "popup", maxPerSession: 2, cooldownMinutes: 30 };
  assert.equal(isCmsPopupEligible(popup, { now: NOW, sessionCount: 0 }), true);
  assert.equal(isCmsPopupEligible(popup, { now: NOW, sessionCount: 1 }), true);
  assert.equal(isCmsPopupEligible(popup, { now: NOW, sessionCount: 2 }), false);
  assert.equal(isCmsPopupEligible(popup, { now: NOW, sessionCount: 1,
    lastDismissedAt: "2026-11-04T11:45:00Z" }), false);
  assert.equal(isCmsPopupEligible(popup, { now: NOW, sessionCount: 1,
    lastDismissedAt: "2026-11-04T11:30:00Z" }), true);
  assert.equal(isCmsPopupEligible(popup, { now: NOW, lastDismissedAt: "2026-11-04T13:00:00Z" }), false);
  assert.equal(isCmsPopupEligible(published(), { now: NOW }), false);
});

test("popup must never override approval, channel or invalid policy", () => {
  const popup = { ...published(), kind: "popup" };
  assert.equal(isCmsPopupEligible(popup, { now: NOW }), true);
  assert.equal(isCmsPopupEligible({ ...popup, status: "draft" }, { now: NOW }), false);
  assert.equal(isCmsPopupEligible(popup, { now: NOW, channel: "dealer_app" }), false);
  for (const changes of [
    { maxPerSession: 0 }, { maxPerSession: 21 }, { cooldownMinutes: -1 },
    { cooldownMinutes: 43201 }, { cooldownMinutes: 0.5 },
  ]) assert.equal(isCmsPopupEligible({ ...popup, ...changes }, { now: NOW }), false);
  assert.equal(isCmsPopupEligible(popup, { now: NOW, sessionCount: -1 }), false);
  assert.equal(isCmsPopupEligible(popup, { now: NOW, lastDismissedAt: "2026-11-04" }), false);
});
