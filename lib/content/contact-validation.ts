/**
 * Validation contract for a FUTURE server-side contact endpoint (PR08+).
 * No endpoint is exposed in PR07. Real backend MUST also implement rate
 * limiting, CSRF/origin protection, consent logging and data retention policy.
 * Never log personal messages, email addresses or names to analytics.
 */
export interface ContactDraft {
  name: string;
  email: string;
  message: string;
  consent: boolean;
  website?: string; // honeypot - should stay empty
  startedAt: number; // client form start time, never trusted as sole anti-bot signal
}
export type ContactError = "name" | "email" | "message" | "consent" | "bot" | "timing" | "invalid";
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
export function validateContactDraft(value: unknown, now: number): ContactError[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["invalid"];
  const v = value as Record<string, unknown>;
  const errors: ContactError[] = [];
  if (typeof v.name !== "string" || v.name.trim().length < 2 || v.name.length > 100) errors.push("name");
  if (typeof v.email !== "string" || v.email.length > 254 || !EMAIL.test(v.email)) errors.push("email");
  if (typeof v.message !== "string" || v.message.trim().length < 10 || v.message.length > 3000) errors.push("message");
  if (v.consent !== true) errors.push("consent");
  if (typeof v.website !== "undefined" && (typeof v.website !== "string" || v.website.trim())) errors.push("bot");
  if (typeof v.startedAt !== "number" || !Number.isFinite(v.startedAt) ||
      !Number.isFinite(now) || v.startedAt > now || now - v.startedAt < 3000 ||
      now - v.startedAt > 86400000) errors.push("timing");
  return errors;
}
