/**
 * Public G04R decorative background configuration, explicitly approved for
 * the Song Natural visual pilot on 08/11/2026.
 *
 * The only URL exposed to Website markup is our same-origin read proxy.
 * R2 object keys, credentials, bucket names and arbitrary external URLs must
 * never be accepted here. Disable by setting songNatural to null; the Glass
 * primitive then renders only the existing lavender gradient.
 *
 * The corresponding public Worker has a separate exact-key allowlist.
 */
export const publicDecorativeBackground: Readonly<{
  songNatural: "/api/decorative-background" | null;
}> = {
  songNatural: "/api/decorative-background",
};
