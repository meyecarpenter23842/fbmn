/** The Next.js searchParams object is untrusted input. Accept only known keys. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export function toAllowedParams(raw: RawSearchParams): URLSearchParams {
  const result = new URLSearchParams();
  for (const key of ["q", "nhom", "kho", "gsm", "sap-xep", "trang"]) {
    const value = raw[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string") result.set(key, first);
  }
  return result;
}
