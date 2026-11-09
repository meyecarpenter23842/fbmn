/**
 * Data-minimal event contract for Futurebook internal Admin.
 * Intentionally NO free-form properties, user ids, URL, SKU or pricing values.
 */
export const ADMIN_TELEMETRY_SECTIONS = [
  "dashboard", "products", "structure", "pricing", "import-products",
  "new-product", "media", "categories", "banners", "content", "home-layout",
  "customers", "accounts", "settings"
] as const;
export type AdminTelemetrySection = typeof ADMIN_TELEMETRY_SECTIONS[number];

export const ADMIN_TELEMETRY_EVENTS = [
  "admin_section_view", "admin_client_exception", "admin_operation_error"
] as const;
export type AdminTelemetryEvent = typeof ADMIN_TELEMETRY_EVENTS[number];
export type AdminTelemetryRecord = {
  event: AdminTelemetryEvent;
  section: AdminTelemetrySection;
};

/** Reject rather than strip unexpected keys: no risk of an accidental PII pass-through. */
export function parseAdminTelemetry(value: unknown): AdminTelemetryRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate);
  if (keys.length !== 2 || !keys.includes("event") || !keys.includes("section")) return null;
  const { event, section } = candidate;
  if (typeof event !== "string" || typeof section !== "string") return null;
  if (!(ADMIN_TELEMETRY_EVENTS as readonly string[]).includes(event)) return null;
  if (!(ADMIN_TELEMETRY_SECTIONS as readonly string[]).includes(section)) return null;
  return { event: event as AdminTelemetryEvent, section: section as AdminTelemetrySection };
}

/** Constant aggregate identity: cannot distinguish employees or sessions in PostHog. */
export function posthogAggregatePayload(key: string, record: AdminTelemetryRecord) {
  return {
    api_key: key,
    event: record.event,
    distinct_id: "futurebook-admin-aggregate",
    properties: {
      section: record.section,
      $ip: null,
      $geoip_disable: true,
      $process_person_profile: false
    }
  };
}
