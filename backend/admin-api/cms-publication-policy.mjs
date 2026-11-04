/**
 * ADM-03 / Issue #20 — pure, fail-closed visibility rules for forthcoming CMS
 * records. This is not a public DTO projector or a database permission check.
 * The CMS read model must still select allowlisted fields from approved views.
 *
 * All timestamps must contain a timezone. No source record is published by
 * default. No frontend-only decision can grant permission to publish content.
 */
const CHANNELS = new Set(["public_web", "dealer_app", "consumer_app"]);
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function parseCmsTimestamp(value) {
  if (typeof value !== "string" || !TIMESTAMP.test(value)) return null;
  // Date.parse normalizes some impossible ISO calendar dates (e.g. Feb 30).
  // Validate Gregorian date/time fields first, including leap years.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > monthDays[month - 1] ||
      hour > 23 || minute > 59 || second > 59) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalMillis(value) {
  return value == null ? undefined : parseCmsTimestamp(value);
}

function validChannels(value) {
  return Array.isArray(value) && value.length >= 1 && value.length <= CHANNELS.size
    && value.every(channel => CHANNELS.has(channel))
    && new Set(value).size === value.length;
}

/**
 * True only for verified, approved, published records explicitly targeted at a
 * business channel and inside their effective window. Does not return content.
 */
export function isCmsPublished(record, { channel = "public_web", now = new Date() } = {}) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return false;
  if (!CHANNELS.has(channel) || !(now instanceof Date)) return false;
  const at = now.getTime();
  if (!Number.isFinite(at) || record.status !== "published") return false;
  if (!validChannels(record.channelTargets) || !record.channelTargets.includes(channel)) return false;
  if (typeof record.sourceRef !== "string" || !record.sourceRef.trim()) return false;

  const verified = parseCmsTimestamp(record.verifiedAt);
  const approved = parseCmsTimestamp(record.approvedAt);
  const published = parseCmsTimestamp(record.publishedAt);
  if (verified === null || approved === null || published === null) return false;
  if (verified > at || approved > at || published > at) return false;

  const start = optionalMillis(record.startsAt);
  const end = optionalMillis(record.endsAt);
  const withdrawn = optionalMillis(record.withdrawnAt);
  if (start === null || end === null || withdrawn === null) return false;
  if (start !== undefined && end !== undefined && end < start) return false;
  if (start !== undefined && start > at) return false;
  if (end !== undefined && end < at) return false;
  if (withdrawn !== undefined && withdrawn <= at) return false;
  return true;
}

/**
 * Optional presentation-frequency gate for popup placements.
 * A server must first pass the publication gate; the frontend can additionally
 * apply session limits but must never use this function to approve draft data.
 */
export function isCmsPopupEligible(record, {
  channel = "public_web",
  now = new Date(),
  sessionCount = 0,
  lastDismissedAt = null,
} = {}) {
  if (!isCmsPublished(record, { channel, now }) || record.kind !== "popup") return false;
  const max = record.maxPerSession ?? 1;
  const cooldown = record.cooldownMinutes ?? 0;
  if (!Number.isSafeInteger(max) || max < 1 || max > 20 ||
      !Number.isSafeInteger(cooldown) || cooldown < 0 || cooldown > 43200 ||
      !Number.isSafeInteger(sessionCount) || sessionCount < 0 || sessionCount >= max) return false;
  if (lastDismissedAt == null) return true;
  const dismissed = parseCmsTimestamp(lastDismissedAt);
  if (dismissed === null || dismissed > now.getTime()) return false;
  return now.getTime() - dismissed >= cooldown * 60_000;
}
